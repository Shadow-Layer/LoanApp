import React from 'react';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBoxIcon from '@mui/icons-material/AddBox';
import SearchIcon from '@mui/icons-material/Search';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { AdminLayout } from './portals/Admin/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard as LoanOfficerDashboard } from './portals/LoanOfficer/Dashboard';
import { NewApplication } from './portals/LoanOfficer/NewApplication';
import { ApplicationDetail } from './portals/LoanOfficer/ApplicationDetail';
import { SearchApplicants } from './portals/LoanOfficer/SearchApplicants';
import { Queue as VerificationQueue } from './portals/Verification/Queue';
import { VerifyDetail } from './portals/Verification/VerifyDetail';
import { ReviewQueue } from './portals/CreditOfficer/ReviewQueue';
import { ReviewDetail } from './portals/CreditOfficer/ReviewDetail';
import { Dashboard as BranchManagerDashboard } from './portals/BranchManager/Dashboard';
import { Users } from './portals/Admin/Users';
import { Branches } from './portals/Admin/Branches';
import { WorkflowConfig } from './portals/Admin/WorkflowConfig';
import { AuditLog } from './portals/Admin/AuditLog';
import { NotificationLog } from './portals/Admin/NotificationLog';
import { Branding } from './portals/Admin/Branding';

const roleHome: Record<string, string> = {
  loan_officer: '/loan-officer',
  verifier: '/verification',
  credit_officer: '/credit-officer',
  branch_manager: '/branch-manager',
  admin: '/admin'
};

const loanOfficerNav = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/loan-officer' },
  { label: 'New Application', icon: <AddBoxIcon />, path: '/loan-officer/new' },
  { label: 'Search', icon: <SearchIcon />, path: '/loan-officer/search' }
];

const verificationNav = [{ label: 'Queue', icon: <FactCheckIcon />, path: '/verification' }];
const creditNav = [{ label: 'Review Queue', icon: <LocalAtmIcon />, path: '/credit-officer' }];
const branchNav = [{ label: 'Dashboard', icon: <AccountTreeIcon />, path: '/branch-manager' }];

function HomeRedirect(): JSX.Element {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={roleHome[user.role]} replace />;
}

export function App(): JSX.Element {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CssBaseline />
        <GlobalStyles
          styles={{
            'html, body, #root': { height: '100%' },
            body: {
              margin: 0,
              background: 'var(--color-canvas)',
              color: 'var(--color-primary)',
              fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif'
            },
            '*': {
              boxSizing: 'border-box'
            }
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<ProtectedRoute role="loan_officer" />}>
              <Route element={<AppLayout navItems={loanOfficerNav} />}>
                <Route path="/loan-officer" element={<LoanOfficerDashboard />} />
                <Route path="/loan-officer/new" element={<NewApplication />} />
                <Route path="/loan-officer/applications/:id" element={<ApplicationDetail />} />
                <Route path="/loan-officer/search" element={<SearchApplicants />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="verifier" />}>
              <Route element={<AppLayout navItems={verificationNav} />}>
                <Route path="/verification" element={<VerificationQueue />} />
                <Route path="/verification/verify/:id" element={<VerifyDetail />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="credit_officer" />}>
              <Route element={<AppLayout navItems={creditNav} />}>
                <Route path="/credit-officer" element={<ReviewQueue />} />
                <Route path="/credit-officer/review/:id" element={<ReviewDetail />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="branch_manager" />}>
              <Route element={<AppLayout navItems={branchNav} />}>
                <Route path="/branch-manager" element={<BranchManagerDashboard />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="admin" />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/branches" element={<Branches />} />
                <Route path="/admin/workflow" element={<WorkflowConfig />} />
                <Route path="/admin/audit" element={<AuditLog />} />
                <Route path="/admin/notifications" element={<NotificationLog />} />
                <Route path="/admin/branding" element={<Branding />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
