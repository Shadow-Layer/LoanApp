import React from 'react';
import { Box, Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/ThemeContext';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

export function Sidebar({ navItems }: { navItems: NavItem[] }): JSX.Element {
  const location = useLocation();
  const branding = useBranding();
  const { user, logout } = useAuth();

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--color-primary)',
        color: 'var(--color-surface)',
        px: 2,
        py: 3,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, letterSpacing: 0.3 }}>
        {branding.appName}
      </Typography>
      <Box sx={{ flex: 1 }}>
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
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user?.email ?? ''}
      </Typography>
      <Button fullWidth variant="outlined" size="small" onClick={() => { void logout(); }} sx={{ color: 'var(--color-surface)', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'rgba(255,80,80,0.6)', background: 'rgba(255,80,80,0.15)' } }}>
        Logout
      </Button>
    </Box>
  );
}
