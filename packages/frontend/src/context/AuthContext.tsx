import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

type User = {
  id: string;
  email: string;
  role: 'loan_officer' | 'verifier' | 'credit_officer' | 'branch_manager' | 'admin';
  branchId: string;
};

const DEMO_USERS: Record<string, User> = {
  'demo@loanap.local': { id: '00000000-0000-0000-0000-000000000001', email: 'demo@loanap.local', role: 'loan_officer', branchId: 'branch-1' },
  'verifier@loanap.local': { id: '00000000-0000-0000-0000-000000000002', email: 'verifier@loanap.local', role: 'verifier', branchId: 'branch-1' },
  'credit@loanap.local': { id: '00000000-0000-0000-0000-000000000003', email: 'credit@loanap.local', role: 'credit_officer', branchId: 'branch-1' },
  'manager@loanap.local': { id: '00000000-0000-0000-0000-000000000004', email: 'manager@loanap.local', role: 'branch_manager', branchId: 'branch-1' },
  'admin@loanap.local': { id: '00000000-0000-0000-0000-000000000005', email: 'admin@loanap.local', role: 'admin', branchId: 'branch-1' }
};

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async (email, password) => {
        if (password === 'demo' && email in DEMO_USERS) {
          const mockUser = DEMO_USERS[email];
          localStorage.setItem('accessToken', 'demo-access-token');
          localStorage.setItem('refreshToken', 'demo-refresh-token');
          setUser(mockUser);
          return mockUser;
        }
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user as User);
        return data.user as User;
      },
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          localStorage.clear();
          setUser(null);
        }
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
