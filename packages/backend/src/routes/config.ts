import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { BrandingConfig } from '@loanap/shared';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';

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

const assetsDir = resolveAssetsDir();
fs.mkdirSync(assetsDir, { recursive: true });

function brandingAssetUrl(filename: string): string {
  return `/assets/${filename}`;
}

function resolveStoredAssetPath(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/assets/')) {
    return null;
  }
  const relativePath = url.slice('/assets/'.length);
  if (!relativePath) {
    return null;
  }
  const resolved = path.resolve(assetsDir, relativePath);
  const root = path.resolve(assetsDir);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    return null;
  }
  return resolved;
}

function deleteStoredAsset(url: string | null | undefined): void {
  const filePath = resolveStoredAssetPath(url);
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }
  fs.unlinkSync(filePath);
}

const defaults: BrandingConfig = {
  id: 1,
  appName: 'LoanAP',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#1A1A1A',
  accentColor: '#E8C547',
  canvasColor: '#F7F5F0',
  surfaceColor: '#FFFFFF'
};

function validateHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, assetsDir),
    filename: (_req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      cb(null, safeName);
    }
  }),
  fileFilter: (req, file, cb) => {
    const pathName = req.originalUrl || req.path || '';
    const isLogo = pathName.endsWith('/logo');
    const isFavicon = pathName.endsWith('/favicon');
    const allowedMimes = isLogo ? ['image/svg+xml', 'image/png'] : ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png'];
    const allowedExt = isLogo ? /\.(svg|png)$/i : /\.(ico|png)$/i;
    if (!allowedMimes.includes(file.mimetype) || !allowedExt.test(file.originalname)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, true);
  }
});

router.get('/branding', async (_req, res, next) => {
  try {
    const branding = await prisma.brandingConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    res.json({
      id: branding.id,
      appName: branding.appName,
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      canvasColor: branding.canvasColor,
      surfaceColor: branding.surfaceColor
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/branding', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { appName, logoUrl, faviconUrl, primaryColor, accentColor, canvasColor, surfaceColor } = req.body as Partial<BrandingConfig>;
    const colors = [primaryColor, accentColor, canvasColor, surfaceColor].filter(Boolean) as string[];
    if (colors.some((color) => !validateHex(color))) {
      res.status(400).json({ error: 'Invalid hex color value' });
      return;
    }

    const branding = await prisma.brandingConfig.upsert({
      where: { id: 1 },
      update: {
        ...(appName !== undefined ? { appName } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(faviconUrl !== undefined ? { faviconUrl } : {}),
        ...(primaryColor !== undefined ? { primaryColor } : {}),
        ...(accentColor !== undefined ? { accentColor } : {}),
        ...(canvasColor !== undefined ? { canvasColor } : {}),
        ...(surfaceColor !== undefined ? { surfaceColor } : {}),
        updatedBy: req.user?.userId
      },
      create: {
        id: 1,
        appName: appName ?? defaults.appName,
        logoUrl: logoUrl ?? null,
        faviconUrl: faviconUrl ?? null,
        primaryColor: primaryColor ?? defaults.primaryColor,
        accentColor: accentColor ?? defaults.accentColor,
        canvasColor: canvasColor ?? defaults.canvasColor,
        surfaceColor: surfaceColor ?? defaults.surfaceColor,
        updatedBy: req.user?.userId
      }
    });
    res.json(branding);
  } catch (error) {
    next(error);
  }
});

router.delete('/branding', authMiddleware, requireRole('admin'), async (_req, res, next) => {
  try {
    const current = await prisma.brandingConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    const branding = await prisma.brandingConfig.upsert({
      where: { id: 1 },
      update: {
        appName: defaults.appName,
        logoUrl: defaults.logoUrl,
        faviconUrl: defaults.faviconUrl,
        primaryColor: defaults.primaryColor,
        accentColor: defaults.accentColor,
        canvasColor: defaults.canvasColor,
        surfaceColor: defaults.surfaceColor,
        updatedBy: null
      },
      create: defaults
    });
    deleteStoredAsset(current.logoUrl);
    deleteStoredAsset(current.faviconUrl);
    res.json(branding);
  } catch (error) {
    next(error);
  }
});

router.post('/branding/logo', authMiddleware, requireRole('admin'), (req, res, next) => {
  diskUpload.single('file')(req, res, async (error) => {
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
      const current = await prisma.brandingConfig.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 }
      });
      const logoUrl = brandingAssetUrl(file.filename);
      const branding = await prisma.brandingConfig.upsert({
        where: { id: 1 },
        update: { logoUrl, updatedBy: req.user?.userId },
        create: { ...defaults, logoUrl, updatedBy: req.user?.userId }
      });
      deleteStoredAsset(current.logoUrl);
      res.json(branding);
    } catch (innerError) {
      next(innerError);
    }
  });
});

router.post('/branding/favicon', authMiddleware, requireRole('admin'), (req, res, next) => {
  diskUpload.single('file')(req, res, async (error) => {
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
      const current = await prisma.brandingConfig.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 }
      });
      const faviconUrl = brandingAssetUrl(file.filename);
      const branding = await prisma.brandingConfig.upsert({
        where: { id: 1 },
        update: { faviconUrl, updatedBy: req.user?.userId },
        create: { ...defaults, faviconUrl, updatedBy: req.user?.userId }
      });
      deleteStoredAsset(current.faviconUrl);
      res.json(branding);
    } catch (innerError) {
      next(innerError);
    }
  });
});

router.get('/workflow', authMiddleware, requireRole('admin'), async (_req, res, next) => {
  try {
    const workflow = await prisma.workflowConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    res.json(workflow);
  } catch (error) {
    next(error);
  }
});

router.patch('/workflow', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { slaVerificationHours, slaCreditReviewHours, slaSubmittedHours } = req.body as {
      slaVerificationHours?: number;
      slaCreditReviewHours?: number;
      slaSubmittedHours?: number;
    };
    const workflow = await prisma.workflowConfig.upsert({
      where: { id: 1 },
      update: {
        ...(slaVerificationHours !== undefined ? { slaVerificationHours } : {}),
        ...(slaCreditReviewHours !== undefined ? { slaCreditReviewHours } : {}),
        ...(slaSubmittedHours !== undefined ? { slaSubmittedHours } : {})
      },
      create: {
        id: 1,
        slaVerificationHours: slaVerificationHours ?? 48,
        slaCreditReviewHours: slaCreditReviewHours ?? 24,
        slaSubmittedHours: slaSubmittedHours ?? 4
      }
    });
    res.json(workflow);
  } catch (error) {
    next(error);
  }
});

export default router;
