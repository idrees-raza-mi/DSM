import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DriverApprovalPage from './pages/DriverApprovalPage';
import DriverListPage from './pages/DriverListPage';
import DeploymentManagementPage from './pages/DeploymentManagementPage';
import BillingPage from './pages/BillingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminManagementPage from './pages/AdminManagementPage';
import SidebarLayout from './components/layout/SidebarLayout';

const ProtectedRoutes = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarLayout>
      <Routes>
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/drivers/pending" element={<DriverApprovalPage />} />
        <Route path="/drivers" element={<DriverListPage />} />
        <Route path="/deployments" element={<DeploymentManagementPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/admins" element={<AdminManagementPage />} />
        <Route path="*" element={<Navigate to="/analytics" replace />} />
      </Routes>
    </SidebarLayout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;

