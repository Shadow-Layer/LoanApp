import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Button
} from '@mui/material';
import api from '../../api/client';

type AuditEvent = {
  id: string;
  createdAt: string;
  userId: string;
  applicationId: string | null;
  action: string;
  previousState: string | null;
  newState: string | null;
  user?: { email: string };
  application?: { id: string };
};

export function AuditLog(): JSX.Element {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ userId: '', applicationId: '', action: '', from: '', to: '' });
  const [draftFilters, setDraftFilters] = useState(filters);

  const load = async (): Promise<void> => {
    const query = new URLSearchParams({
      page: String(page + 1),
      limit: String(rowsPerPage),
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
    });
    const { data } = await api.get<{ data: AuditEvent[]; total: number }>(`/audit?${query.toString()}`);
    setEvents(data.data);
    setTotal(data.total);
  };

  useEffect(() => {
    void load();
  }, [page, rowsPerPage, filters]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Audit Log
      </Typography>
      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="User ID" value={draftFilters.userId} onChange={(event) => setDraftFilters({ ...draftFilters, userId: event.target.value })} />
            <TextField label="Application ID" value={draftFilters.applicationId} onChange={(event) => setDraftFilters({ ...draftFilters, applicationId: event.target.value })} />
            <TextField label="Action" value={draftFilters.action} onChange={(event) => setDraftFilters({ ...draftFilters, action: event.target.value })} />
            <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={draftFilters.from} onChange={(event) => setDraftFilters({ ...draftFilters, from: event.target.value })} />
            <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={draftFilters.to} onChange={(event) => setDraftFilters({ ...draftFilters, to: event.target.value })} />
            <Button
              variant="contained"
              onClick={() => {
                setPage(0);
                setFilters(draftFilters);
              }}
              sx={{ background: 'var(--color-primary)' }}
            >
              Apply
            </Button>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Previous State</TableCell>
                <TableCell>New State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{event.user?.email || event.userId}</TableCell>
                  <TableCell>{event.application?.id || event.applicationId || '-'}</TableCell>
                  <TableCell>{event.action}</TableCell>
                  <TableCell>{event.previousState || '-'}</TableCell>
                  <TableCell>{event.newState || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
