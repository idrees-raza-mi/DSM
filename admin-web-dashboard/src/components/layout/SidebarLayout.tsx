import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarLayout.css';
import { useAuth } from '../../context/AuthContext';

type Props = {
  children: ReactNode;
};

const SidebarLayout = ({ children }: Props) => {
  const location = useLocation();
  const { admin, logout } = useAuth();

  const navItems = [
    { path: '/analytics', label: 'Dashboard' },
    { path: '/drivers/pending', label: 'Driver Approvals' },
    { path: '/drivers', label: 'All Drivers' },
    { path: '/deployments', label: 'Deployments' },
    { path: '/billing', label: 'Billing' },
    { path: '/admins', label: 'Admin Accounts' },
  ];

  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        <div className="layout-logo">FleetX Admin</div>
        <nav className="layout-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                location.pathname.startsWith(item.path)
                  ? 'layout-nav-item layout-nav-item-active'
                  : 'layout-nav-item'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="layout-footer">
          <div className="layout-admin">
            <div className="layout-admin-name">{admin?.name ?? 'Admin'}</div>
            <div className="layout-admin-email">{admin?.email}</div>
          </div>
          <button type="button" className="layout-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="layout-main">{children}</main>
    </div>
  );
};

export default SidebarLayout;

