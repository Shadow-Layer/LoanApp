import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';
import { NotFoundError } from '../middleware/errorHandler';
import { OdkService } from '../services/OdkService';
import { WorkflowService } from '../services/WorkflowService';
import { canAccessApplication, canPerformTransition } from '../utils/applicationAuthorization';
import { Prisma } from '@prisma/client';

const router = Router();
function resolveAssetsDir(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'assets'),
    path.join(process.cwd(), 'packages', 'backend', 'public', 'assets')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

const uploadDir = path.join(resolveAssetsDir(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      cb(null, safeName);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, true);
  }
});

async function loadApplicationAccessTarget(id: string): Promise<{
  id: string;
  branchId: string;
  assignedLoanOfficerId: string | null;
  assignedVerifierId: string | null;
  assignedCreditOfficerId: string | null;
} | null> {
  return prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      branchId: true,
      assignedLoanOfficerId: true,
      assignedVerifierId: true,
      assignedCreditOfficerId: true
    }
  });
}

router.post('/', authMiddleware, requireRole('loan_officer'), async (req, res, next) => {
  try {
    const { formId, fields, gpsLat, gpsLng } = req.body as {
      formId?: string;
      fields?: Record<string, string>;
      gpsLat?: number;
      gpsLng?: number;
    };
    if (!req.user || !formId || !fields) {
      res.status(400).json({ error: 'formId and fields are required' });
      return;
    }

    const odkSubmissionId = await OdkService.submitForm(formId, fields);
    const application = await prisma.application.create({
      data: {
        odkSubmissionId,
        odkFormId: formId,
        status: 'Submitted',
        branchId: req.user.branchId,
        assignedLoanOfficerId: req.user.userId,
        draftData: {
          ...fields,
          gpsLat: gpsLat ?? null,
          gpsLng: gpsLng ?? null
        }
      }
    });

    await WorkflowService.transition(application.id, 'submit', req.user, {
      gpsLat,
      gpsLng
    });

    const updated = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        workflowStates: { orderBy: { enteredAt: 'asc' } },
        assignments: { orderBy: { assignedAt: 'asc' } },
        auditEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
        documents: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/draft', authMiddleware, requireRole('loan_officer'), async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { draftData } = req.body as { draftData?: Record<string, unknown> };
    const application = await prisma.application.upsert({
      where: { id },
      update: {
      draftData: (draftData ?? {}) as Prisma.InputJsonValue,
        status: 'Submitted',
        branchId: req.user.branchId,
        assignedLoanOfficerId: req.user.userId
      },
      create: {
        id,
        draftData: (draftData ?? {}) as Prisma.InputJsonValue,
        status: 'Submitted',
        branchId: req.user.branchId,
        assignedLoanOfficerId: req.user.userId
      },
      include: {
        workflowStates: { orderBy: { enteredAt: 'asc' } },
        assignments: { orderBy: { assignedAt: 'asc' } },
        auditEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
        documents: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { status, assignedTo, search } = req.query as {
      status?: string;
      assignedTo?: string;
      search?: string;
    };

    const baseApplications = await prisma.application.findMany({
      where:
        req.user.role === 'loan_officer'
          ? { assignedLoanOfficerId: req.user.userId }
          : req.user.role === 'verifier'
            ? { assignedVerifierId: req.user.userId }
            : req.user.role === 'credit_officer'
              ? { assignedCreditOfficerId: req.user.userId }
              : { branchId: req.user.branchId },
      orderBy: { createdAt: 'desc' },
      include: {
        workflowStates: { orderBy: { enteredAt: 'asc' } },
        assignments: { orderBy: { assignedAt: 'asc' } },
        auditEvents: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    const filtered = baseApplications.filter((application) => {
      if (status && application.status !== status) {
        return false;
      }
      if (assignedTo === 'me') {
        const assigned =
          application.assignedLoanOfficerId === req.user?.userId ||
          application.assignedVerifierId === req.user?.userId ||
          application.assignedCreditOfficerId === req.user?.userId;
        if (!assigned) {
          return false;
        }
      }
      if (search) {
        const applicantName = typeof application.draftData === 'object' && application.draftData !== null
          ? (application.draftData as Record<string, unknown>).applicantName
          : undefined;
        const fields = [application.odkSubmissionId, applicantName].filter(Boolean).map(String).join(' ').toLowerCase();
        if (!fields.includes(search.toLowerCase())) {
          return false;
        }
      }
      return true;
    });

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        workflowStates: { orderBy: { enteredAt: 'asc' } },
        assignments: { orderBy: { assignedAt: 'asc' } },
        auditEvents: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (!canAccessApplication(req.user.role, req.user.userId, req.user.branchId, application)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const odkData = application.odkSubmissionId && application.odkFormId
      ? await OdkService.getSubmission(application.odkFormId, application.odkSubmissionId)
      : null;

    res.json({ ...application, odkData });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/transition', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { action, metadata } = req.body as { action?: string; metadata?: Record<string, unknown> };
    if (!action) {
      res.status(400).json({ error: 'Action is required' });
      return;
    }
    const application = await loadApplicationAccessTarget(req.params.id);
    if (!application) {
      throw new NotFoundError('Application not found');
    }
    if (!canAccessApplication(req.user.role, req.user.userId, req.user.branchId, application)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!canPerformTransition(req.user.role, action)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await WorkflowService.transition(req.params.id, action, req.user, metadata);
    const updated = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        workflowStates: { orderBy: { enteredAt: 'asc' } },
        assignments: { orderBy: { assignedAt: 'asc' } },
        auditEvents: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/documents', authMiddleware, (req, res, next) => {
  void (async (): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const application = await loadApplicationAccessTarget(req.params.id);
      if (!application) {
        throw new NotFoundError('Application not found');
      }
      if (!canAccessApplication(req.user.role, req.user.userId, req.user.branchId, application)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      upload.single('file')(req, res, async (error) => {
        try {
          if (error) {
            res.status(400).json({ error: error.message });
            return;
          }
          const file = req.file;
          if (!file) {
            res.status(400).json({ error: 'File is required' });
            return;
          }
          const document = await prisma.document.create({
            data: {
              applicationId: req.params.id,
              filename: file.filename,
              url: `/assets/uploads/${file.filename}`,
              mimeType: file.mimetype
            }
          });
          res.json(document);
        } catch (innerError) {
          next(innerError);
        }
      });
    } catch (error) {
      next(error);
    }
  })();
});

export default router;
