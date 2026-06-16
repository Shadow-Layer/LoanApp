import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  branchId: true,
  active: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      name: true,
      region: true,
      active: true
    }
  }
} as const;

router.get('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { search } = req.query as { search?: string };
    const users = await prisma.user.findMany({
      where: search
        ? { email: { contains: search, mode: 'insensitive' } }
        : undefined,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { email, password, role, branchId } = req.body as {
      email?: string;
      password?: string;
      role?: string;
      branchId?: string;
    };
    if (!email || !password || !role || !branchId) {
      res.status(400).json({ error: 'email, password, role, and branchId are required' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role as never,
        branchId
      },
      select: safeUserSelect
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { email, password, role, branchId, active } = req.body as {
      email?: string;
      password?: string;
      role?: string;
      branchId?: string;
      active?: boolean;
    };
    const data: Prisma.UserUpdateInput = {};
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role as never;
    if (branchId !== undefined) data.branchId = branchId;
    if (active !== undefined) data.active = active;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: safeUserSelect
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
