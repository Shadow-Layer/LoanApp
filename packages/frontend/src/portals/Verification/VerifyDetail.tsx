import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';

type AuditEvent = { id: string; createdAt: string; action: string; previousState: string | null; newState: string | null };
type Application = {
  id: string;
  draftData: Record<string, unknown> | null;
  auditEvents: AuditEvent[];
};

const checklistItems = [
  'National ID verified',
  'Physical address confirmed',
  'Business premises visited',
  'Supporting documents reviewed',
  'Site photo captured'
];

export function VerifyDetail(): JSX.Element {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [checklist, setChecklist] = useState<boolean[]>(Array(checklistItems.length).fill(false));
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void api.get<Application>(`/applications/${id}`).then(({ data }) => setApplication(data));
  }, [id]);

  const uploadEvidence = async (file: File | null): Promise<void> => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  const submit = async (action: 'pass' | 'clarify' | 'fail'): Promise<void> => {
    await api.post(`/applications/${id}/transition`, {
      action,
      metadata: {
        notes,
        checklist
      }
    });
    navigate('/verification');
  };

  if (!application) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Verification Detail
      </Typography>
      {message ? <Alert severity="success">{message}</Alert> : null}

      <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
        <Tab label="Verification" />
        <Tab label="Audit History" />
      </Tabs>

      {activeTab === 0 ? (
        <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
          <CardContent>
            <Stack spacing={2}>
              {checklistItems.map((item, index) => (
                <FormControlLabel
                  key={item}
                  control={<Checkbox checked={checklist[index]} onChange={(event) => setChecklist((current) => current.map((value, i) => (i === index ? event.target.checked : value)))} />}
                  label={item}
                />
              ))}
              <TextField label="Site visit notes" multiline minRows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
              <Button variant="outlined" component="label">
                Upload Evidence
                <input
                  hidden
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => void uploadEvidence(event.target.files?.[0] ?? null)}
                />
              </Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" sx={{ background: 'green' }} onClick={() => void submit('pass')}>
                  Passed
                </Button>
                <Button variant="contained" sx={{ background: 'orange' }} onClick={() => void submit('clarify')}>
                  Requires Clarification
                </Button>
                <Button variant="contained" color="error" onClick={() => void submit('fail')}>
                  Failed
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
          <CardContent>
            <Stack spacing={1}>
              {application.auditEvents.map((event) => (
                <Box key={event.id} sx={{ p: 1.5, borderRadius: 2, background: 'rgba(0,0,0,0.03)' }}>
                  <Typography sx={{ fontWeight: 700 }}>{event.action}</Typography>
                  <Typography variant="body2">{new Date(event.createdAt).toLocaleString()}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage(null)} message={message || ''} />
    </Stack>
  );
}
