import { ApplicationStatus, Prisma, PrismaClient, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';

function roleForStatus(status: ApplicationStatus): UserRole | null {
  if (status === 'VerificationPending') {
    return 'verifier';
  }
  if (status === 'CreditReview') {
    return 'credit_officer';
  }
  return null;
}

export class AssignmentService {
  static async route(params: {
    applicationId: string;
    newStatus: ApplicationStatus;
    branchId: string;
    assignedBy: string;
    client?: Prisma.TransactionClient | PrismaClient;
  }): Promise<string | null> {
    const client = params.client ?? prisma;
    const role = roleForStatus(params.newStatus);
    if (!role) {
      return null;
    }

    const users = await client.user.findMany({
      where: {
        branchId: params.branchId,
        role,
        active: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (users.length === 0) {
      return null;
    }

    const scored = await Promise.all(
      users.map(async (user) => {
        const openAssignments =
          role === 'verifier'
            ? await client.application.count({
                where: {
                  branchId: params.branchId,
                  status: 'VerificationPending',
                  assignedVerifierId: user.id
                }
              })
            : await client.application.count({
                where: {
                  branchId: params.branchId,
                  status: 'CreditReview',
                  assignedCreditOfficerId: user.id
                }
              });
        return { user, openAssignments };
      })
    );

    scored.sort((a, b) => a.openAssignments - b.openAssignments || a.user.createdAt.getTime() - b.user.createdAt.getTime());
    const assigned = scored[0]?.user;
    if (!assigned) {
      return null;
    }

    const data =
      role === 'verifier'
        ? { assignedVerifierId: assigned.id }
        : { assignedCreditOfficerId: assigned.id };

    await client.application.update({
      where: { id: params.applicationId },
      data
    });

    await client.assignment.create({
      data: {
        applicationId: params.applicationId,
        userId: assigned.id,
        role,
        assignedBy: params.assignedBy
      }
    });

    return assigned.id;
  }
}
