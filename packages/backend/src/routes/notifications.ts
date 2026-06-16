import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { config } from '../config/env';
import { NotificationService } from '../services/NotificationService';

const router = Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user.userId) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/stream', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    res.status(401).end();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    NotificationService.addClient(payload.userId, res);
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const interval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(interval);
      NotificationService.removeClient(payload.userId, res);
    });
  } catch {
    res.status(401).end();
  }
});

export default router;
