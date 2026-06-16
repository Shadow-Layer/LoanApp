import { Notification, NotificationType, Prisma, PrismaClient } from '@prisma/client';
import { Response } from 'express';
import prisma from '../lib/prisma';

type SseResponse = Response;

const clients = new Map<string, Set<SseResponse>>();

export class NotificationService {
  static async emit(params: {
    type: NotificationType;
    applicationId: string;
    recipientIds: string[];
    message: string;
    client?: Prisma.TransactionClient | PrismaClient;
  }): Promise<Notification[]> {
    const client = params.client ?? prisma;
    const uniqueRecipientIds = [...new Set(params.recipientIds.filter(Boolean))];
    const notifications: Notification[] = [];
    for (const recipientId of uniqueRecipientIds) {
      const notification = await client.notification.create({
        data: {
          type: params.type,
          applicationId: params.applicationId,
          userId: recipientId,
          message: params.message
        }
      });
      notifications.push(notification);
    }
    return notifications;
  }

  static addClient(userId: string, res: SseResponse): void {
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(res);
    res.write('retry: 10000\n\n');
  }

  static removeClient(userId: string, res: SseResponse): void {
    const set = clients.get(userId);
    if (!set) {
      return;
    }
    set.delete(res);
    if (set.size === 0) {
      clients.delete(userId);
    }
  }

  static pushToUser(userId: string, notification: Notification): void {
    const set = clients.get(userId);
    if (!set || set.size === 0) {
      return;
    }
    const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
    for (const res of [...set]) {
      try {
        res.write(payload);
      } catch {
        this.removeClient(userId, res);
      }
    }
  }
}
