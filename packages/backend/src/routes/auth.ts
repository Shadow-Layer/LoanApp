import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload = {
      userId: user.id,
      role: user.role,
      branchId: user.branchId
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash }
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
      userId: string;
      role: string;
      branchId: string;
    };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.refreshTokenHash) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, branchId: user.branchId },
      config.jwtSecret,
      { expiresIn: '15m' }
    );
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshTokenHash: null }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
