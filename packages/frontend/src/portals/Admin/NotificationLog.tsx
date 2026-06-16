import React, { useEffect, useState } from 'react';
import { Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import api from '../../api/client';

type Notification = {
  id: string;
  type: string;
  message: string;
  applicationId: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationLog(): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
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
