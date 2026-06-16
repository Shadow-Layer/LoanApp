import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Grid, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';

type AuditEvent = { action: string; createdAt: string; metadata: unknown; previousState: string | null; newState: string | null };
type Application = {
  id: string;
  draftData: Record<string, unknown> | null;
  auditEvents: AuditEvent[];
  odkData: unknown;
};

export function ReviewDetail(): JSX.Element {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    void api.get<Application>(`/applications/${id}`).then(({ data }) => setApplication(data));
  }, [id]);

  const verificationResult = useMemo(() => {
    const event = application?.auditEvents.slice().reverse().find((item) => item.action.includes('pass') || item.action.includes('fail'));
    return event || null;
  }, [application]);

  const submit = async (action: 'approve' | 'reject' | 'escalate'): Promise<void> => {
    await api.post(`/applications/${id}/transition`, {
      action,
      metadata: { notes }
    });
    if (action === 'escalate') {
      setSnackbar('Application escalated for re-assignment');
      return;
    }
    navigate('/credit-officer');
  };

  if (!application) {
    return <Typography>Loading...</Typography>;
  }

  const applicant = application.draftData ?? {};

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Credit Review Detail
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Applicant Summary
              </Typography>
              <Stack spacing={1}>
                <Typography>Name: {String(applicant.applicantName || 'N/A')}</Typography>
                <Typography>National ID: {String(applicant.nationalId || 'N/A')}</Typography>
                <Typography>Phone: {String(applicant.phone || 'N/A')}</Typography>
                <Typography>Amount: {String(applicant.loanAmount || 'N/A')}</Typography>
                <Typography>Type: {String(applicant.formId || 'N/A')}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Verification Results
              </Typography>
              <Stack spacing={1}>
                <Typography>Outcome: {verificationResult ? verificationResult.action : 'Pending'}</Typography>
                <Typography>Verifier Notes: {String((verificationResult?.metadata as { notes?: string } | undefined)?.notes || 'N/A')}</Typography>
                <Typography>Verified At: {verificationResult ? new Date(verificationResult.createdAt).toLocaleString() : 'N/A'}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              multiline
              minRows={4}
              label="Assessment Notes"
              required
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" disabled={!notes.trim()} onClick={() => void submit('approve')} sx={{ background: 'green' }}>
                Approve
              </Button>
              <Button variant="contained" disabled={!notes.trim()} onClick={() => void submit('reject')} color="error">
                Reject
              </Button>
              <Button variant="outlined" disabled={!notes.trim()} onClick={() => void submit('escalate')}>
                Escalate
              </Button>
            </Stack>
          </Stack>
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

      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar || ''} />
    </Stack>
  );
}
