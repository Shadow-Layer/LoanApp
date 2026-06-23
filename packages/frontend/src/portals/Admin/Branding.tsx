import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { isDemoMode } from '../../api/client';
import api from '../../api/client';
import { useBranding } from '../../context/ThemeContext';

type Branding = {
  id: number;
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
};

const hexPattern = /^#[0-9A-Fa-f]{6}$/;

function Preview({ branding }: { branding: Branding }): JSX.Element {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: branding.primaryColor, color: branding.surfaceColor }}>
      <Typography sx={{ fontWeight: 800, mb: 2 }}>{branding.appName}</Typography>
      <Stack spacing={1}>
        {['Dashboard', 'Applications', 'Reports'].map((item, index) => (
          <Box
            key={item}
            sx={{
              p: 1,
              borderRadius: 2,
              background: index === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: index === 0 ? `4px solid ${branding.accentColor}` : '4px solid transparent'
            }}
          >
            {item}
          </Box>
        ))}
      </Stack>
      <Box sx={{ mt: 2, p: 2, borderRadius: 3, background: branding.surfaceColor, color: branding.primaryColor }}>
        <Typography sx={{ fontWeight: 700 }}>Sample card</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Box sx={{ px: 2, py: 1, borderRadius: 999, background: branding.primaryColor, color: branding.surfaceColor }}>
            Primary
          </Box>
          <Box sx={{ px: 2, py: 1, borderRadius: 999, background: branding.accentColor, color: branding.primaryColor }}>
            Accent
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export function Branding(): JSX.Element {
  const branding = useBranding();
  const [form, setForm] = useState<Branding>(branding);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const logoInput = useRef<HTMLInputElement | null>(null);
  const faviconInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(branding);
  }, [branding]);

  const updateField = (field: keyof Branding, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const uploadAsset = async (kind: 'logo' | 'favicon', file: File | null): Promise<void> => {
    if (isDemoMode()) { return; }
    if (!file) {
      return;
    }
    const data = new FormData();
    data.append('file', file);
    const { data: response } = await api.post<Branding>(`/config/branding/${kind}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setForm(response);
    window.dispatchEvent(new Event('branding-updated'));
  };

  const save = async (): Promise<void> => {
    if (isDemoMode()) { return; }
    const nextErrors: Record<string, string> = {};
    (['primaryColor', 'accentColor', 'canvasColor', 'surfaceColor'] as const).forEach((field) => {
      if (!hexPattern.test(form[field])) {
        nextErrors[field] = 'Invalid hex color';
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const { data } = await api.patch<Branding>('/config/branding', form);
    setForm(data);
    window.dispatchEvent(new Event('branding-updated'));
  };

  const reset = async (): Promise<void> => {
    if (isDemoMode()) { return; }
    const { data } = await api.delete<Branding>('/config/branding');
    setForm(data);
    window.dispatchEvent(new Event('branding-updated'));
  };

  const preview = form;

  return (
    <Stack spacing={3}>
      <Alert severity="warning">This section is intended for developers and trained deployment staff.</Alert>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Branding
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Identity
                  </Typography>
                  <TextField fullWidth label="App Name" value={form.appName} onChange={(event) => updateField('appName', event.target.value)} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" onClick={() => logoInput.current?.click()}>
                      Upload Logo
                    </Button>
                    <Typography variant="body2">{form.logoUrl || 'No logo uploaded'}</Typography>
                    <input
                      ref={logoInput}
                      hidden
                      type="file"
                      accept=".svg,.png"
                      onChange={(event) => void uploadAsset('logo', event.target.files?.[0] ?? null)}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" onClick={() => faviconInput.current?.click()}>
                      Upload Favicon
                    </Button>
                    <Typography variant="body2">{form.faviconUrl || 'No favicon uploaded'}</Typography>
                    <input
                      ref={faviconInput}
                      hidden
                      type="file"
                      accept=".ico,.png"
                      onChange={(event) => void uploadAsset('favicon', event.target.files?.[0] ?? null)}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Colour Palette
                </Typography>
                <Stack spacing={2}>
                  {[
                    ['Primary', 'primaryColor'],
                    ['Accent', 'accentColor'],
                    ['Canvas', 'canvasColor'],
                    ['Surface', 'surfaceColor']
                  ].map(([label, field]) => (
                    <Stack key={field} direction="row" spacing={2} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: 1, background: form[field as keyof Branding] as string, border: '1px solid rgba(0,0,0,0.1)' }} />
                      <TextField
                        fullWidth
                        label={label}
                        value={form[field as keyof Branding]}
                        error={Boolean(errors[field])}
                        helperText={errors[field] || ' '}
                        onChange={(event) => updateField(field as keyof Branding, event.target.value)}
                      />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Live Preview
                </Typography>
                <Preview branding={preview} />
              </CardContent>
            </Card>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={() => void save()} sx={{ background: 'var(--color-primary)' }}>
                Save Branding
              </Button>
              <Button variant="outlined" onClick={() => void reset()}>
                Reset to Default
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
