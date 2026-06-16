import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import api from '../../api/client';

type WorkflowConfig = {
  slaVerificationHours: number;
  slaCreditReviewHours: number;
  slaSubmittedHours: number;
};

export function WorkflowConfig(): JSX.Element {
  const [config, setConfig] = useState<WorkflowConfig>({
    slaVerificationHours: 48,
    slaCreditReviewHours: 24,
    slaSubmittedHours: 4
  });

  useEffect(() => {
    void api.get<WorkflowConfig>('/config/workflow').then(({ data }) => setConfig(data));
  }, []);

  const save = async (): Promise<void> => {
    const { data } = await api.patch<WorkflowConfig>('/config/workflow', config);
    setConfig(data);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Workflow Config
      </Typography>
      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)', maxWidth: 600 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              type="number"
              label="SLA Verification Hours"
              value={config.slaVerificationHours}
              onChange={(event) => setConfig({ ...config, slaVerificationHours: Number(event.target.value) })}
            />
            <TextField
              type="number"
              label="SLA Credit Review Hours"
              value={config.slaCreditReviewHours}
              onChange={(event) => setConfig({ ...config, slaCreditReviewHours: Number(event.target.value) })}
            />
            <TextField
              type="number"
              label="SLA Submitted Hours"
              value={config.slaSubmittedHours}
              onChange={(event) => setConfig({ ...config, slaSubmittedHours: Number(event.target.value) })}
            />
            <Button variant="contained" onClick={() => void save()} sx={{ background: 'var(--color-primary)', alignSelf: 'flex-start' }}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
