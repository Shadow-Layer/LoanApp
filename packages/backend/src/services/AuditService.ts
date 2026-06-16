import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

export class AuditService {
  static async record(params: {
    applicationId: string | null;
    userId: string;
    action: string;
    previousState?: string;
    newState?: string;
    metadata?: object;
    client?: Prisma.TransactionClient | PrismaClient;
  }): Promise<void> {
    const client = params.client ?? prisma;
    await client.auditEvent.create({
      data: {
        applicationId: params.applicationId,
        userId: params.userId,
        action: params.action,
        previousState: params.previousState,
        newState: params.newState,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined
      }
    });
  }
}
