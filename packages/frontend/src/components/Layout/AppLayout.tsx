import React from 'react';
import { Box, Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../NotificationBell';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

export function AppLayout({ navItems }: { navItems: NavItem[] }): JSX.Element {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--color-canvas)' }}>
      <Sidebar navItems={navItems} />
      <Box component="main" sx={{ flex: 1, background: 'var(--color-canvas)', p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <NotificationBell />
        </Stack>
        <Outlet />
      </Box>
    </Box>
  );
}
