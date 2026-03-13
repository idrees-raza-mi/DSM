import React from 'react';
import './DriverListPage.css';

const DriverListPage = () => {
  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">A searchable list of all drivers will appear here.</p>
        </div>
      </div>
      <div className="placeholder-card">
        <p>In a later phase, this page will show filters, search, and driver status/score columns.</p>
      </div>
    </div>
  );
};

export default DriverListPage;

