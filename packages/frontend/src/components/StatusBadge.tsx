import React from 'react';
import Chip from '@mui/material/Chip';

type Props = { status: string };

const badgeStyles: Record<string, { bg: string; fg: string }> = {
  Submitted: { bg: 'var(--color-status-submitted-bg)', fg: 'var(--color-status-submitted-fg)' },
  VerificationPending: { bg: 'var(--color-status-verification-bg)', fg: 'var(--color-status-verification-fg)' },
  VerificationComplete: { bg: 'var(--color-status-complete-bg)', fg: 'var(--color-status-complete-fg)' },
  CreditReview: { bg: 'var(--color-status-credit-bg)', fg: 'var(--color-status-credit-fg)' },
  Approved: { bg: 'var(--color-status-approved-bg)', fg: 'var(--color-status-approved-fg)' },
  Rejected: { bg: 'var(--color-status-rejected-bg)', fg: 'var(--color-status-rejected-fg)' },
  Disbursed: { bg: 'var(--color-status-disbursed-bg)', fg: 'var(--color-status-disbursed-fg)' }
};

export function StatusBadge({ status }: Props): JSX.Element {
  const styles = badgeStyles[status] ?? badgeStyles.Submitted;
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: styles.bg,
        color: styles.fg,
        fontWeight: 700,
        borderRadius: 999,
        border: '1px solid transparent'
      }}
    />
  );
}
