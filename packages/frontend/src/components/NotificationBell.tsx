import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Box, IconButton, List, ListItemButton, ListItemText, Popover, Snackbar, Alert, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type Notification = {
  id: string;
  applicationId: string | null;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function routeForRole(role: string, applicationId: string | null): string {
  if (!applicationId) {
    return role === 'admin' ? '/admin/notifications' : '/';
  }
  switch (role) {
    case 'loan_officer':
      return `/loan-officer/applications/${applicationId}`;
    case 'verifier':
      return `/verification/verify/${applicationId}`;
    case 'credit_officer':
      return `/credit-officer/review/${applicationId}`;
    case 'branch_manager':
      return '/branch-manager';
    case 'admin':
      return '/admin/audit';
    default:
      return '/';
  }
}

export function NotificationBell(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const loadNotifications = async (): Promise<void> => {
    const { data } = await api.get<Notification[]>('/notifications');
    setNotifications(data);
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    void loadNotifications().catch(() => undefined);
    const poll = window.setInterval(() => {
      void loadNotifications().catch(() => undefined);
    }, 30000);

    const token = localStorage.getItem('accessToken');
    const source = token ? new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`) : null;
    if (source) {
      const handleNotification = (): void => {
        void loadNotifications().catch(() => undefined);
        setToast('New notification received');
      };
      source.addEventListener('notification', handleNotification);
      source.onerror = () => {
        source.close();
      };
      source.addEventListener('message', handleNotification);
    }

    return () => {
      window.clearInterval(poll);
      source?.close();
    };
  }, [user]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification): Promise<void> => {
    await api.patch(`/notifications/${notification.id}/read`);
    setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    navigate(routeForRole(user?.role || 'loan_officer', notification.applicationId));
    handleClose();
  };

  return (
    <Box>
      <IconButton onClick={handleOpen} sx={{ color: 'var(--color-primary)' }}>
        <Badge color="warning" badgeContent={unreadCount}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 360, maxHeight: 480, overflow: 'auto', p: 1.5, background: 'var(--color-surface)' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Notifications
          </Typography>
          <List dense disablePadding>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => void handleNotificationClick(notification)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  backgroundColor: notification.read ? 'transparent' : 'rgba(232, 197, 71, 0.12)'
                }}
              >
                <ListItemText
                  primary={notification.message}
                  secondary={new Date(notification.createdAt).toLocaleString()}
                />
              </ListItemButton>
            ))}
            {notifications.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 1 }}>
                No notifications
              </Typography>
            ) : null}
          </List>
        </Box>
      </Popover>
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast(null)} message={toast || ''} />
    </Box>
  );
}
