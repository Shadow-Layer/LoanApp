import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

type WorkflowState = { enteredAt: string };
type Application = {
  id: string;
  status: string;
  createdAt: string;
  odkFormId: string | null;
  draftData: Record<string, unknown> | null;
  workflowStates: WorkflowState[];
};

function applicantName(application: Application): string {
  const name = application.draftData?.applicantName;
  return typeof name === 'string' ? name : application.id;
}

export function Queue(): JSX.Element {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    void api.get<Application[]>('/applications').then(({ data }) => setApplications(data));
  }, []);

  const stats = useMemo(() => {
    const completedToday = applications.filter((application) => {
      return application.status === 'VerificationComplete' && new Date(application.createdAt).toDateString() === new Date().toDateString();
    }).length;
    const overdue = applications.filter((application) => {
      const latestState = application.workflowStates[application.workflowStates.length - 1];
      const ageHours = Math.round((Date.now() - new Date(latestState?.enteredAt || application.createdAt).getTime()) / 3600000);
      return ageHours > 48;
    }).length;
    return {
      assigned: applications.length,
      completedToday,
      overdue
    };
  }, [applications]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Verification Queue
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: 'Assigned to Me', value: stats.assigned },
          { label: 'Completed Today', value: stats.completedToday },
          { label: 'Overdue', value: stats.overdue }
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
                <TableCell>Assigned Date</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => {
                const latestState = application.workflowStates[application.workflowStates.length - 1];
                const ageHours = Math.round((Date.now() - new Date(latestState?.enteredAt || application.createdAt).getTime()) / 3600000);
                return (
                  <TableRow key={application.id}>
                    <TableCell>{applicantName(application)}</TableCell>
                    <TableCell>{application.odkFormId || 'N/A'}</TableCell>
                    <TableCell>{new Date(application.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={ageHours > 48 ? { color: 'var(--color-status-rejected-fg)', fontWeight: 600 } : undefined}>{ageHours}h</TableCell>
                    <TableCell>
                      <Chip label={ageHours > 48 ? 'HIGH' : 'Normal'} color={ageHours > 48 ? 'error' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button component={Link} to={`/verification/verify/${application.id}`} size="small">
                        Verify
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
