import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useBranding } from '../../context/ThemeContext';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

export function Sidebar({ navItems }: { navItems: NavItem[] }): JSX.Element {
  const location = useLocation();
  const branding = useBranding();

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--color-primary)',
        color: 'var(--color-surface)',
        px: 2,
        py: 3
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, letterSpacing: 0.3 }}>
        {branding.appName}
      </Typography>
      <List disablePadding>
        {navItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                mb: 1,
                borderRadius: 2,
                borderLeft: `4px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: 'var(--color-surface)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.16)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
