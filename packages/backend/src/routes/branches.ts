import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, requireRole('admin'), async (_req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(branches);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, region } = req.body as { name?: string; region?: string };
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const branch = await prisma.branch.create({
      data: {
        name,
        region: region ?? ''
      }
    });
    res.json(branch);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, region, active } = req.body as { name?: string; region?: string; active?: boolean };
    const data: Prisma.BranchUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (region !== undefined) data.region = region;
    if (active !== undefined) data.active = active;
    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data
    });
    res.json(branch);
  } catch (error) {
    next(error);
  }
});

export default router;
