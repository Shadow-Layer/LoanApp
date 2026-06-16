import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import api from '../../api/client';

type Branch = { id: string; name: string; region: string; active: boolean };

const emptyForm = { name: '', region: '' };

export function Branches(): JSX.Element {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async (): Promise<void> => {
    const { data } = await api.get<Branch[]>('/branches');
    setBranches(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = (): void => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (branch: Branch): void => {
    setEditing(branch);
    setForm({ name: branch.name, region: branch.region });
    setOpen(true);
  };

  const submit = async (): Promise<void> => {
    if (editing) {
      await api.patch(`/branches/${editing.id}`, form);
    } else {
      await api.post('/branches', form);
    }
    setOpen(false);
    await load();
  };

  const deactivate = async (branch: Branch): Promise<void> => {
    await api.patch(`/branches/${branch.id}`, { active: false });
    await load();
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Branches
        </Typography>
        <Button variant="contained" onClick={openCreate} sx={{ background: 'var(--color-primary)' }}>
          + Add Branch
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.region}</TableCell>
                  <TableCell>{branch.active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => openEdit(branch)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => void deactivate(branch)}>
                        Deactivate
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth />
            <TextField label="Region" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void submit()} sx={{ background: 'var(--color-primary)' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
