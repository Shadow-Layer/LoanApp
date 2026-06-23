import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { isDemoMode } from '../../api/client';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

type Metrics = {
  totalApplications: number;
  pendingVerification: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  avgProcessingHours: number;
  pipelineCounts: Record<string, number>;
  bottlenecks: Array<{
    applicationId: string;
    stage: string;
    waitingHours: number;
    slaHours: number | null;
    overdueHours: number;
    assignedTo: string | null;
    assignedToName: string | null;
  }>;
};

const DEMO_METRICS: Metrics = {
  totalApplications: 42,
  pendingVerification: 8,
  pendingApproval: 5,
  approved: 24,
  rejected: 5,
  approvalRate: 83,
  avgProcessingHours: 18,
  pipelineCounts: { Submitted: 8, VerificationPending: 8, CreditReview: 5, Approved: 24, Rejected: 5, Disbursed: 12 },
  bottlenecks: []
};

export function Dashboard(): JSX.Element {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const load = async (): Promise<void> => {
    if (isDemoMode()) { setMetrics(DEMO_METRICS); return; }
    const { data } = await api.get<Metrics>('/metrics/branch');
    setMetrics(data);
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const pipelineEntries = useMemo(() => Object.entries(metrics?.pipelineCounts || {}), [metrics]);
  const maxCount = useMemo(() => Math.max(1, ...pipelineEntries.map(([, value]) => value)), [pipelineEntries]);

  if (!metrics) {
    return <Typography>Loading...</Typography>;
  }

  const cards = [
    { label: 'Applications This Month', value: metrics.totalApplications },
    { label: 'Pending Verification', value: metrics.pendingVerification },
    { label: 'Pending Approval', value: metrics.pendingApproval },
    { label: 'Approved', value: metrics.approved },
    { label: 'Rejected', value: metrics.rejected },
    { label: 'Approval Rate', value: `${metrics.approvalRate}%` },
    { label: 'Avg Processing Hours', value: `${metrics.avgProcessingHours}h` }
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Branch Dashboard
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Pipeline
          </Typography>
          <Stack spacing={1.5}>
            {pipelineEntries.map(([status, count]) => {
              const width = `${(count / maxCount) * 100}%`;
              return (
                <Box key={status}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {status}
                    </Typography>
                    <Typography variant="body2">{count}</Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 14,
                      borderRadius: 999,
                      background: status === 'Approved' ? 'var(--color-accent)' : 'var(--color-primary)',
                      width
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Bottleneck Alerts
          </Typography>
          <Table>
              <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Waiting / SLA</TableCell>
                <TableCell>Assigned To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.bottlenecks.map((item) => (
                <TableRow key={item.applicationId}>
                  <TableCell>{item.applicationId}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.stage} />
                  </TableCell>
                  <TableCell sx={item.overdueHours > 0 ? { color: 'var(--color-status-rejected-fg)', fontWeight: 600 } : undefined}>
                    {item.waitingHours}h{item.slaHours !== null ? ` / ${item.slaHours}h` : ''}
                  </TableCell>
                  <TableCell>{item.assignedToName || item.assignedTo || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
