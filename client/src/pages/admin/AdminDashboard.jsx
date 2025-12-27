import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import PendingRequests from './PendingRequests';
import CreateFundingProgram from './CreateFundingProgram';
import Disbursements from './Disbursements';
import HospitalVerificationAdmin from './HospitalVerificationAdmin';
import CreditMonitor from './CreditMonitor';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [active, setActive] = useState('pending');
  const navigate = useNavigate();
  const user = authService.getUser();

  const menuItems = [
    { id: 'pending', label: 'Pending Requests', icon: '📋' },
    { id: 'disburse', label: 'Disbursements', icon: '💰' },
    
    { id: 'verify', label: 'Hospital Verification', icon: '🏥' },
    { id: 'credit', label: 'Credit Monitor', icon: '📊' },
  ];

  const renderContent = () => {
    switch(active) {
      case 'pending': return <PendingRequests />;
      case 'create': return <CreateFundingProgram />;
      case 'disburse': return <Disbursements />;
      case 'verify': return <HospitalVerificationAdmin />;
      case 'credit': return <CreditMonitor />;
      default: return <PendingRequests />;
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-logo">Admin Panel</h2>
          <div className="admin-user-info">
            {user?.email && (
              <span className="admin-user-email">{user.email}</span>
            )}
          </div>
        </div>
        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-page-title">
            {menuItems.find(item => item.id === active)?.label || 'Dashboard'}
          </h1>
        </header>
        <div className="admin-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
