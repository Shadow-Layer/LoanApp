import React, { useEffect, useState } from 'react';
import { Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { isDemoMode } from '../../api/client';
import api from '../../api/client';

type Notification = {
  id: string;
  type: string;
  message: string;
  applicationId: string | null;
  read: boolean;
  createdAt: string;
};

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTIF-001',
    type: 'APPLICATION_SUBMITTED',
    message: 'New application LOAN-101 submitted by James Mwangi',
    applicationId: 'LOAN-101',
    read: false,
    createdAt: '2025-06-20T09:30:00Z'
  },
  {
    id: 'NOTIF-002',
    type: 'VERIFICATION_COMPLETE',
    message: 'Verification completed for LOAN-098',
    applicationId: 'LOAN-098',
    read: false,
    createdAt: '2025-06-20T08:15:00Z'
  },
  {
    id: 'NOTIF-003',
    type: 'CREDIT_REVIEW',
    message: 'Credit review required for LOAN-095',
    applicationId: 'LOAN-095',
    read: false,
    createdAt: '2025-06-19T16:45:00Z'
  }
];

export function NotificationLog(): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isDemoMode()) { setNotifications(DEMO_NOTIFICATIONS); return; }
    void api.get<Notification[]>('/notifications').then(({ data }) => setNotifications(data));
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Notification Log
      </Typography>
      <Card sx={{ borderRadius: 3, background: 'var(--color-surface)' }}>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Read</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>{notification.type}</TableCell>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>{notification.applicationId || '-'}</TableCell>
                  <TableCell>{notification.read ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(notification.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
