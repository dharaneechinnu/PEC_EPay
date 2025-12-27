import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import CreateRequest from './CreateRequest';
import RequestStatus from './RequestStatus';
import Transactions from './Transactions';
import './HospitalDashboard.css';

export default function HospitalDashboard() {
  const [active, setActive] = useState('create');
  const navigate = useNavigate();
  const user = authService.getUser();

  const menuItems = [
    { id: 'create', label: 'Create Request', icon: '➕' },
    { id: 'status', label: 'Request Status', icon: '📋' },
    { id: 'transactions', label: 'Transactions', icon: '💰' },
  ];

  const renderContent = () => {
    switch(active) {
      case 'create': return <CreateRequest />;
      case 'status': return <RequestStatus />;
      case 'transactions': return <Transactions />;
      default: return <CreateRequest />;
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="hospital-dashboard">
      <aside className="hospital-sidebar">
        <div className="hospital-sidebar-header">
          <h2 className="hospital-logo">Hospital Panel</h2>
          <div className="hospital-user-info">
            {user?.email && (
              <span className="hospital-user-email">{user.email}</span>
            )}
            {user?.hospitalName && (
              <span className="hospital-user-name">{user.hospitalName}</span>
            )}
          </div>
        </div>
        <nav className="hospital-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`hospital-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              <span className="hospital-nav-icon">{item.icon}</span>
              <span className="hospital-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="hospital-sidebar-footer">
          <button className="hospital-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
      <main className="hospital-main">
        <header className="hospital-header">
          <h1 className="hospital-page-title">
            {menuItems.find(item => item.id === active)?.label || 'Dashboard'}
          </h1>
        </header>
        <div className="hospital-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
