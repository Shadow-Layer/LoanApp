import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/branch', authMiddleware, requireRole('branch_manager', 'admin'), async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [applications, workflowConfig, users] = await Promise.all([
      prisma.application.findMany({
        where: {
          branchId: req.user.branchId,
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart
          }
        },
        include: {
          workflowStates: { orderBy: { enteredAt: 'desc' }, take: 1 }
        }
      }),
      prisma.workflowConfig.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 }
      }),
      prisma.user.findMany({
        where: { branchId: req.user.branchId, active: true },
        select: { id: true, email: true }
      })
    ]);

    const userMap = new Map(users.map((user) => [user.id, user.email]));

    const totalApplications = applications.length;
    const pendingVerification = applications.filter((app) => app.status === 'VerificationPending').length;
    const pendingApproval = applications.filter((app) => app.status === 'CreditReview').length;
    const approved = applications.filter((app) => app.status === 'Approved').length;
    const rejected = applications.filter((app) => app.status === 'Rejected').length;
    const approvalDenominator = approved + rejected;
    const approvalRate = approvalDenominator > 0 ? Math.round((approved / approvalDenominator) * 100) : 0;

    const disbursed = applications.filter((app) => app.status === 'Disbursed');
    const avgProcessingHours =
      disbursed.length > 0
        ? Math.round(
            disbursed.reduce((sum, app) => sum + (app.updatedAt.getTime() - app.createdAt.getTime()), 0) /
              disbursed.length /
              3600000
          )
        : 0;

    const pipelineCounts = applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const slaByStage: Partial<Record<string, number>> = {
      Submitted: workflowConfig.slaSubmittedHours,
      VerificationPending: workflowConfig.slaVerificationHours,
      CreditReview: workflowConfig.slaCreditReviewHours
    };

    const bottlenecks = applications
      .map((app) => {
        const latestState = app.workflowStates[0];
        const waitingHours = Math.max(
          0,
          Math.round((Date.now() - (latestState?.enteredAt ?? app.createdAt).getTime()) / 3600000)
        );
        const slaHours = slaByStage[app.status];
        const assignedTo =
          app.assignedVerifierId ??
          app.assignedCreditOfficerId ??
          app.assignedLoanOfficerId ??
          null;
        return {
          applicationId: app.id,
          stage: app.status,
          waitingHours,
          slaHours: slaHours ?? null,
          overdueHours: slaHours !== undefined ? Math.max(0, waitingHours - slaHours) : waitingHours,
          assignedTo,
          assignedToName: assignedTo ? userMap.get(assignedTo) ?? assignedTo : null
        };
      })
      .filter((item) => item.slaHours !== null && item.waitingHours >= (item.slaHours ?? 0))
      .sort((a, b) => b.overdueHours - a.overdueHours || b.waitingHours - a.waitingHours)
      .slice(0, 10);

    res.json({
      totalApplications,
      pendingVerification,
      pendingApproval,
      approved,
      rejected,
      approvalRate,
      avgProcessingHours,
      pipelineCounts,
      bottlenecks
    });
  } catch (error) {
    next(error);
  }
});

export default router;
