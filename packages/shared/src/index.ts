export type UserRole = 'loan_officer' | 'verifier' | 'credit_officer' | 'branch_manager' | 'admin';

export type ApplicationStatus =
  | 'Submitted'
  | 'VerificationPending'
  | 'VerificationComplete'
  | 'CreditReview'
  | 'Approved'
  | 'Rejected'
  | 'Disbursed';

export type NotificationType =
  | 'APPLICATION_SUBMITTED'
  | 'VERIFICATION_ASSIGNED'
  | 'VERIFICATION_COMPLETED'
  | 'CREDIT_REVIEW_ASSIGNED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  branchId: string;
}

export interface BrandingConfig {
  id: number;
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
}
