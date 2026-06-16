import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { page = '1', limit = '25', userId, applicationId, action, from, to } = req.query as Record<string, string>;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const where: Prisma.AuditEventWhereInput = {};
    if (userId) where.userId = userId;
    if (applicationId) where.applicationId = applicationId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {})
      };
    }

    const [total, data] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          user: true,
          application: true
        }
      })
    ]);

    res.json({
      data,
      total,
      page: pageNumber,
      limit: pageSize
    });
  } catch (error) {
    next(error);
  }
});

export default router;
