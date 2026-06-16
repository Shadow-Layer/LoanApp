import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

type WorkflowState = { stage: string; enteredAt: string; exitedAt: string | null; durationSeconds: number | null };
type AuditEvent = { id: string; createdAt: string; action: string; previousState: string | null; newState: string | null; metadata: unknown };
type DocumentItem = { id: string; filename: string; url: string; mimeType: string; createdAt: string };
type Application = {
  id: string;
  status: string;
  createdAt: string;
  draftData: Record<string, unknown> | null;
  odkData: unknown;
  workflowStates: WorkflowState[];
  auditEvents: AuditEvent[];
  documents: DocumentItem[];
};

export function ApplicationDetail(): JSX.Element {
  const { id = '' } = useParams();
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    void api.get<Application>(`/applications/${id}`).then(({ data }) => setApplication(data));
  }, [id]);

  const applicantSummary = useMemo(() => {
    const draft = application?.draftData ?? {};
    return {
      applicantName: typeof draft.applicantName === 'string' ? draft.applicantName : 'Unknown applicant',
      nationalId: typeof draft.nationalId === 'string' ? draft.nationalId : 'N/A',
      phone: typeof draft.phone === 'string' ? draft.phone : 'N/A',
      loanAmount: typeof draft.loanAmount === 'string' ? draft.loanAmount : 'N/A'
    };
  }, [application]);

  if (!application) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Application {application.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted {new Date(application.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <StatusBadge status={application.status} />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Applicant Summary
              </Typography>
              <Stack spacing={1}>
                <Typography>Name: {applicantSummary.applicantName}</Typography>
                <Typography>National ID: {applicantSummary.nationalId}</Typography>
                <Typography>Phone: {applicantSummary.phone}</Typography>
                <Typography>Loan Amount: {applicantSummary.loanAmount}</Typography>
                <Typography>Form: {application.draftData?.formId ? String(application.draftData.formId) : 'N/A'}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Timeline
              </Typography>
              <Stack spacing={1}>
                {application.workflowStates.map((state) => (
                  <Box key={`${state.stage}-${state.enteredAt}`} sx={{ p: 1.5, borderRadius: 2, background: 'rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontWeight: 700 }}>{state.stage}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entered {new Date(state.enteredAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {state.durationSeconds ?? 0}s
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Documents
          </Typography>
          <Stack spacing={1}>
            {application.documents.map((document) => (
              <Link key={document.id} href={document.url} target="_blank" rel="noreferrer">
                {document.filename}
              </Link>
            ))}
            {application.documents.length === 0 ? <Typography color="text.secondary">No documents uploaded</Typography> : null}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Audit Events
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Previous</TableCell>
                <TableCell>New</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {application.auditEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{event.action}</TableCell>
                  <TableCell>{event.previousState || '-'}</TableCell>
                  <TableCell>{event.newState || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            ODK Data
          </Typography>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(application.odkData, null, 2)}</pre>
        </CardContent>
      </Card>
    </Stack>
  );
}
