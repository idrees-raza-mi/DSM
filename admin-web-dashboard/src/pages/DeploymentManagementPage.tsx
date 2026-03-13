import React from 'react';
import './DeploymentManagementPage.css';

const DeploymentManagementPage = () => {
  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deployments</h1>
          <p className="page-subtitle">
            Create and manage assignments, including overbooking and driver capacity per slot.
          </p>
        </div>
        <button type="button" className="btn-primary">
          New deployment
        </button>
      </div>
      <div className="placeholder-card">
        <p>
          This skeleton will evolve into a full deployment calendar/table with capacity, confirmations, and risk
          indicators.
        </p>
      </div>
    </div>
  );
};

export default DeploymentManagementPage;

