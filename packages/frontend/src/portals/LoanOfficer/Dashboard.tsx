import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

type Application = {
  id: string;
  status: string;
  createdAt: string;
  odkFormId: string | null;
  odkSubmissionId: string | null;
  draftData: Record<string, unknown> | null;
};

function getApplicantName(application: Application): string {
  const value = application.draftData?.applicantName;
  return typeof value === 'string' && value ? value : application.odkSubmissionId || application.id;
}

export function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    void api.get<Application[]>('/applications?assignedTo=me').then(({ data }) => setApplications(data));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = applications.filter((application) => new Date(application.createdAt).getMonth() === now.getMonth());
    return {
      total: applications.length,
      verification: applications.filter((application) => application.status === 'VerificationPending').length,
      credit: applications.filter((application) => application.status === 'CreditReview').length,
      approved: thisMonth.filter((application) => application.status === 'Approved').length
    };
  }, [applications]);

  const cards = [
    { label: 'Total Applications', value: stats.total },
    { label: 'Pending Verification', value: stats.verification },
    { label: 'In Credit Review', value: stats.credit },
    { label: 'Approved This Month', value: stats.approved }
  ];

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Loan Officer Dashboard
        </Typography>
        <Button variant="contained" onClick={() => navigate('/loan-officer/new')} sx={{ background: 'var(--color-primary)' }}>
          + New Application
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ background: 'var(--color-surface)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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

      <Card sx={{ background: 'var(--color-surface)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Recent Applications
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Form Type</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id} hover>
                  <TableCell>{getApplicantName(application)}</TableCell>
                  <TableCell>{application.odkFormId || 'Draft'}</TableCell>
                  <TableCell>{new Date(application.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/loan-officer/applications/${application.id}`} size="small">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
