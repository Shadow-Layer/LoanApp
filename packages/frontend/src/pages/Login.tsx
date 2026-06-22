import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/ThemeContext';

const roleHome: Record<string, string> = {
  loan_officer: '/loan-officer',
  verifier: '/verification',
  credit_officer: '/credit-officer',
  branch_manager: '/branch-manager',
  admin: '/admin'
};

export function Login(): JSX.Element {
  const { login } = useAuth();
  const branding = useBranding();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(roleHome[user.role], { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-canvas)',
        px: 2
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 460, background: 'var(--color-surface)', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              {branding.logoUrl ? (
                <Box component="img" src={branding.logoUrl} alt={branding.appName} sx={{ height: 48, width: 'auto', objectFit: 'contain' }} />
              ) : null}
              <Typography variant="overline" sx={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                {branding.appName}
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access the loan origination workspace.
            </Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={loading} sx={{ background: 'var(--color-primary)' }}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Demo mode: use any role email below with password <strong>demo</strong>
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label="Loan Officer" size="small" clickable onClick={() => setEmail('demo@loanap.local')} />
                  <Chip label="Verifier" size="small" clickable onClick={() => setEmail('verifier@loanap.local')} />
                  <Chip label="Credit Officer" size="small" clickable onClick={() => setEmail('credit@loanap.local')} />
                  <Chip label="Branch Manager" size="small" clickable onClick={() => setEmail('manager@loanap.local')} />
                  <Chip label="Admin" size="small" clickable onClick={() => setEmail('admin@loanap.local')} />
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
