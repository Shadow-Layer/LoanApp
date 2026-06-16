import { UserRole } from '@prisma/client';

export type TransitionAction =
  | 'submit'
  | 'pass'
  | 'clarify'
  | 'fail'
  | 'route_credit'
  | 'approve'
  | 'reject'
  | 'escalate'
  | 'disburse';

export interface ApplicationAccessTarget {
  branchId: string;
  assignedLoanOfficerId: string | null;
  assignedVerifierId: string | null;
  assignedCreditOfficerId: string | null;
}

const transitionRoles: Partial<Record<TransitionAction, UserRole[]>> = {
  submit: ['loan_officer'],
  pass: ['verifier'],
  clarify: ['verifier'],
  fail: ['verifier'],
  approve: ['credit_officer'],
  reject: ['credit_officer'],
  escalate: ['credit_officer'],
  disburse: ['branch_manager']
};

export function canAccessApplication(
  role: string,
  userId: string,
  branchId: string,
  application: ApplicationAccessTarget
): boolean {
  if (role === 'admin' || role === 'branch_manager') {
    return application.branchId === branchId;
  }
  if (role === 'loan_officer') {
    return application.assignedLoanOfficerId === userId;
  }
  if (role === 'verifier') {
    return application.assignedVerifierId === userId;
  }
  if (role === 'credit_officer') {
    return application.assignedCreditOfficerId === userId;
  }
  return false;
}

export function canPerformTransition(role: UserRole, action: string): action is TransitionAction {
  const typedAction = action as TransitionAction;
  return Boolean(transitionRoles[typedAction]?.includes(role));
}

