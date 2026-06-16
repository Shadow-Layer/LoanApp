import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
type User = { id: string; email: string; role: string; branchId: string; active: boolean; branch: Branch };

const emptyForm = { email: '', password: '', role: 'loan_officer', branchId: '' };

export function Users(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async (): Promise<void> => {
    const [usersResponse, branchesResponse] = await Promise.all([api.get<User[]>('/users'), api.get<Branch[]>('/branches')]);
    setUsers(usersResponse.data);
    setBranches(branchesResponse.data);
    if (!form.branchId && branchesResponse.data[0]) {
      setForm((current) => ({ ...current, branchId: branchesResponse.data[0].id }));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const needle = query.toLowerCase();
    return users.filter((user) => user.email.toLowerCase().includes(needle));
  }, [users, query]);

  const openCreate = (): void => {
    setEditing(null);
    setForm({
      ...emptyForm,
      branchId: branches[0]?.id || ''
    });
    setOpen(true);
  };

  const openEdit = (user: User): void => {
    setEditing(user);
    setForm({
      email: user.email,
      password: '',
      role: user.role,
      branchId: user.branchId
    });
    setOpen(true);
  };

  const submit = async (): Promise<void> => {
    if (editing) {
      await api.patch(`/users/${editing.id}`, {
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
        role: form.role,
        branchId: form.branchId
      });
    } else {
      await api.post('/users', form);
    }
    setOpen(false);
    await load();
  };

  const deactivate = async (user: User): Promise<void> => {
    await api.patch(`/users/${user.id}`, { active: false });
    await load();
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Users
        </Typography>
        <Button variant="contained" onClick={openCreate} sx={{ background: 'var(--color-primary)' }}>
          + Add User
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <TextField fullWidth label="Search" value={query} onChange={(event) => setQuery(event.target.value)} sx={{ mb: 2 }} />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.branch?.name || user.branchId}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: user.active ? 'var(--color-status-approved-fg)' : 'var(--color-status-rejected-fg)'
                        }}
                      />
                      <Typography variant="body2">{user.active ? 'Active' : 'Inactive'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => openEdit(user)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => void deactivate(user)}>
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
        <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              fullWidth
            />
            <TextField select label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} fullWidth>
              {['loan_officer', 'verifier', 'credit_officer', 'branch_manager', 'admin'].map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Branch" value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })} fullWidth>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </TextField>
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
