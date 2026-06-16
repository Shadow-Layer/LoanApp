import { ApplicationStatus, Notification, NotificationType, Prisma, PrismaClient, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { ForbiddenError } from '../middleware/auth';
import { WorkflowError, NotFoundError } from '../middleware/errorHandler';
import { AuditService } from './AuditService';
import { AssignmentService } from './AssignmentService';
import { NotificationService } from './NotificationService';
import { canAccessApplication, canPerformTransition, TransitionAction } from '../utils/applicationAuthorization';

type WorkflowActor = {
  userId: string;
  role: UserRole;
  branchId: string;
};

const transitions: Record<ApplicationStatus, Partial<Record<TransitionAction, ApplicationStatus>>> = {
  Submitted: { submit: 'VerificationPending' },
  VerificationPending: { pass: 'VerificationComplete', clarify: 'Submitted', fail: 'Rejected' },
  VerificationComplete: { route_credit: 'CreditReview' },
  CreditReview: { approve: 'Approved', reject: 'Rejected', escalate: 'CreditReview' },
  Approved: { disburse: 'Disbursed' },
  Rejected: {},
  Disbursed: {}
};

function notificationTypeForAction(action: TransitionAction): NotificationType | null {
  switch (action) {
    case 'submit':
      return 'APPLICATION_SUBMITTED';
    case 'pass':
      return 'VERIFICATION_COMPLETED';
    case 'route_credit':
      return 'CREDIT_REVIEW_ASSIGNED';
    case 'approve':
      return 'APPLICATION_APPROVED';
    case 'reject':
      return 'APPLICATION_REJECTED';
    case 'fail':
      return 'APPLICATION_REJECTED';
    case 'clarify':
      return 'VERIFICATION_ASSIGNED';
    default:
      return null;
  }
}

export class WorkflowService {
  static async transition(
    applicationId: string,
    action: string,
    actor: WorkflowActor,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const notifications = await prisma.$transaction((tx) =>
      this.transitionInTransaction(tx, applicationId, action, actor, metadata)
    );

    for (const notification of notifications) {
      NotificationService.pushToUser(notification.userId, notification);
    }
  }

  private static async transitionInTransaction(
    client: Prisma.TransactionClient | PrismaClient,
    applicationId: string,
    action: string,
    actor: WorkflowActor,
    metadata?: Record<string, unknown>,
    skipAuthorization = false
  ): Promise<Notification[]> {
    const typedAction = action as TransitionAction;
    const application = await client.application.findUnique({
      where: { id: applicationId },
      include: {
        workflowStates: {
          orderBy: { enteredAt: 'desc' },
          take: 1
        }
      }
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (!skipAuthorization) {
      if (!canAccessApplication(actor.role, actor.userId, actor.branchId, application)) {
        throw new ForbiddenError('Forbidden');
      }
      if (!canPerformTransition(actor.role, action)) {
        throw new ForbiddenError('Forbidden');
      }
    }

    const currentState = application.workflowStates[0] ?? null;
    const currentStatus = (currentState?.stage ?? application.status) as ApplicationStatus;
    const newStatus = transitions[currentStatus]?.[typedAction];

    if (!newStatus) {
      throw new WorkflowError(`Action "${action}" is not allowed from status "${currentStatus}"`);
    }

    const now = new Date();
    const enteredAt = currentState?.enteredAt ?? application.createdAt;
    const durationSeconds = Math.floor((now.getTime() - enteredAt.getTime()) / 1000);
    const notifications: Notification[] = [];

    if (currentState) {
      await client.workflowState.update({
        where: { id: currentState.id },
        data: {
          exitedAt: now,
          durationSeconds
        }
      });
    }

    await client.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus
      }
    });

    await client.workflowState.create({
      data: {
        applicationId,
        stage: newStatus,
        enteredAt: now
      }
    });

    await AuditService.record({
      applicationId,
      userId: actor.userId,
      action,
      previousState: currentStatus,
      newState: newStatus,
      metadata,
      client
    });

    const assignedUserId = await AssignmentService.route({
      applicationId,
      newStatus,
      branchId: application.branchId,
      assignedBy: actor.userId,
      client
    });

    const branchUsers = await client.user.findMany({
      where: {
        branchId: application.branchId,
        active: true,
        role: {
          in: ['branch_manager', 'credit_officer'] as const
        }
      },
      select: { id: true, role: true }
    });

    const branchManagers = branchUsers.filter((user) => user.role === 'branch_manager').map((user) => user.id);
    const creditOfficers = branchUsers.filter((user) => user.role === 'credit_officer').map((user) => user.id);

    const recipientsByAction: Record<TransitionAction, string[]> = {
      submit: [...branchManagers, ...(assignedUserId ? [assignedUserId] : [])],
      pass: [...creditOfficers, ...branchManagers],
      route_credit: assignedUserId ? [assignedUserId] : [],
      approve: [...branchManagers, ...(application.assignedLoanOfficerId ? [application.assignedLoanOfficerId] : [])],
      reject: [...branchManagers, ...(application.assignedLoanOfficerId ? [application.assignedLoanOfficerId] : [])],
      clarify: application.assignedVerifierId ? [application.assignedVerifierId] : [],
      escalate: [],
      fail: [...branchManagers, ...(application.assignedLoanOfficerId ? [application.assignedLoanOfficerId] : [])],
      disburse: [...branchManagers, ...(application.assignedLoanOfficerId ? [application.assignedLoanOfficerId] : [])]
    };

    const notificationType = notificationTypeForAction(typedAction);
    const recipients = recipientsByAction[typedAction] ?? [];
    if (notificationType && recipients.length > 0) {
      const emitted = await NotificationService.emit({
        type: notificationType,
        applicationId,
        recipientIds: recipients,
        message: `Application ${applicationId} moved to ${newStatus}`,
        client
      });
      notifications.push(...emitted);
    }

    if (typedAction === 'pass') {
      const autoAdvanced = await this.transitionInTransaction(client, applicationId, 'route_credit', actor, metadata, true);
      notifications.push(...autoAdvanced);
    }

    return notifications;
  }
}
