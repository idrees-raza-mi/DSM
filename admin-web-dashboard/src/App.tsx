import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DriverApprovalPage from './pages/DriverApprovalPage';
import DriverListPage from './pages/DriverListPage';
import DeploymentManagementPage from './pages/DeploymentManagementPage';
import SidebarLayout from './components/layout/SidebarLayout';

const ProtectedRoutes = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarLayout>
      <Routes>
        <Route path="/drivers/pending" element={<DriverApprovalPage />} />
        <Route path="/drivers" element={<DriverListPage />} />
        <Route path="/deployments" element={<DeploymentManagementPage />} />
        <Route path="*" element={<Navigate to="/drivers/pending" replace />} />
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

