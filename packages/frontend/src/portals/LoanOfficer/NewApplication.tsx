import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

type OdkForm = { id: string; name?: string; formId?: string };

export function NewApplication(): JSX.Element {
  const navigate = useNavigate();
  const [forms, setForms] = useState<OdkForm[]>([]);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [formId, setFormId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const documentInput = useRef<HTMLInputElement | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void api.get<OdkForm[]>('/forms').then(({ data }) => setForms(data));
  }, []);

  const saveDraft = async (): Promise<void> => {
    const { data } = await api.patch(`/applications/${draftId}/draft`, {
      draftData: {
        applicantName,
        nationalId,
        phone,
        loanAmount,
        formId,
        gpsLat,
        gpsLng
      }
    });
    setDraftId(data.id);
    setAlert('Draft saved');
  };

  const captureGps = (): void => {
    if (!navigator.geolocation) {
      setAlert('GPS not available on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(position.coords.latitude);
        setGpsLng(position.coords.longitude);
        setAlert(null);
      },
      () => setAlert('GPS not available on this device')
    );
  };

  const submitApplication = async (): Promise<void> => {
    const { data } = await api.post('/applications', {
      formId,
      fields: {
        applicantName,
        nationalId,
        phone,
        loanAmount
      },
      gpsLat,
      gpsLng
    });

    const applicationId = data.id as string;
    const uploadFile = async (file: File | null): Promise<void> => {
      if (!file) {
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/applications/${applicationId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    };

    await uploadFile(documentFile);
    await uploadFile(photoFile);
    navigate(`/loan-officer/applications/${applicationId}`);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        New Application
      </Typography>
      {alert ? <Alert severity="info">{alert}</Alert> : null}
      <Card sx={{ background: 'var(--color-surface)', borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Form Type" value={formId} onChange={(event) => setFormId(event.target.value)}>
                {forms.map((form) => (
                  <MenuItem key={form.id} value={form.id}>
                    {form.name || form.formId || form.id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Applicant Name" value={applicantName} onChange={(event) => setApplicantName(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="National ID" value={nationalId} onChange={(event) => setNationalId(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Loan Amount" value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" onClick={() => documentInput.current?.click()}>
                  Attach Document
                </Button>
                <Typography variant="body2">{documentFile?.name || 'No document selected'}</Typography>
                <input
                  ref={documentInput}
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" onClick={() => photoInput.current?.click()}>
                  Attach Photo
                </Button>
                <Typography variant="body2">{photoFile?.name || 'No photo selected'}</Typography>
                <input
                  ref={photoInput}
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={captureGps}>
                Capture GPS
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Latitude" value={gpsLat ?? ''} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Longitude" value={gpsLng ?? ''} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => void saveDraft()}>
              Save Draft
            </Button>
            <Button variant="contained" onClick={() => void submitApplication()} sx={{ background: 'var(--color-primary)' }}>
              Submit Application
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Typography variant="caption" color="text.secondary">
        Draft ID: {draftId}
      </Typography>
    </Stack>
  );
}
