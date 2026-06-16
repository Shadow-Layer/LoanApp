import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

type AuditEvent = { action: string; createdAt: string };
type WorkflowState = { enteredAt: string };
type Application = {
  id: string;
  status: string;
  createdAt: string;
  draftData: Record<string, unknown> | null;
  workflowStates: WorkflowState[];
  auditEvents: AuditEvent[];
};

export function ReviewQueue(): JSX.Element {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    void api.get<Application[]>('/applications').then(({ data }) => setApplications(data));
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      pending: applications.filter((application) => application.status === 'CreditReview').length,
      approvedToday: applications.filter((application) => application.status === 'Approved' && new Date(application.createdAt).toDateString() === today).length,
      rejectedToday: applications.filter((application) => application.status === 'Rejected' && new Date(application.createdAt).toDateString() === today).length
    };
  }, [applications]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Credit Review Queue
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: 'Pending Review', value: stats.pending },
          { label: 'Approved Today', value: stats.approvedToday },
          { label: 'Rejected Today', value: stats.rejectedToday }
        ].map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Loan Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Verification</TableCell>
                <TableCell>In Review</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => {
                const amount = typeof application.draftData?.loanAmount === 'string' ? application.draftData.loanAmount : 'N/A';
                const verificationEvent = [...application.auditEvents].reverse().find((event) => event.action.includes('pass') || event.action.includes('fail'));
                const latestState = application.workflowStates[application.workflowStates.length - 1];
                const inReview = Math.round((Date.now() - new Date(latestState?.enteredAt || application.createdAt).getTime()) / 3600000);
                return (
                  <TableRow key={application.id}>
                    <TableCell>{String(application.draftData?.applicantName || application.id)}</TableCell>
                    <TableCell>{application.draftData?.formId ? String(application.draftData.formId) : 'N/A'}</TableCell>
                    <TableCell>{amount}</TableCell>
                    <TableCell>{verificationEvent ? verificationEvent.action : 'Pending'}</TableCell>
                    <TableCell>{inReview}h</TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button component={Link} to={`/credit-officer/review/${application.id}`} size="small">
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
