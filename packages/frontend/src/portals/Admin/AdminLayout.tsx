import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import RuleIcon from '@mui/icons-material/Rule';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import { Sidebar } from '../../components/Layout/Sidebar';
import { NotificationBell } from '../../components/NotificationBell';

const navItems = [
  { label: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { label: 'Branches', icon: <ApartmentIcon />, path: '/admin/branches' },
  { label: 'Workflow Config', icon: <RuleIcon />, path: '/admin/workflow' },
  { label: 'Audit Log', icon: <AssignmentIcon />, path: '/admin/audit' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/admin/notifications' },
  { label: 'Branding', icon: <PaletteIcon />, path: '/admin/branding' }
];

export function AdminLayout(): JSX.Element {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--color-canvas)' }}>
      <Sidebar navItems={navItems} />
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <NotificationBell />
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
}
