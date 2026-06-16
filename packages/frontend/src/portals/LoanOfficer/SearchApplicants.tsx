import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
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

export function SearchApplicants(): JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Application[]>([]);

  const search = async (): Promise<void> => {
    const { data } = await api.get<Application[]>(`/applications?search=${encodeURIComponent(query)}`);
    setResults(data);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Search Applicants
      </Typography>
      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth label="Search by applicant name or submission ID" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button variant="contained" onClick={() => void search()} sx={{ background: 'var(--color-primary)' }}>
              Search
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
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
              {results.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{String(application.draftData?.applicantName || application.odkSubmissionId || application.id)}</TableCell>
                  <TableCell>{application.odkFormId || 'Draft'}</TableCell>
                  <TableCell>{new Date(application.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/loan-officer/applications/${application.id}`}>
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
