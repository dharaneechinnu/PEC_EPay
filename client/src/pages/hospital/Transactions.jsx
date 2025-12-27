import React, { useEffect, useState } from 'react';
import hospitalService from '../../services/hospitalService';
import Loader from '../../components/Loader';
import './HospitalPages.css';
import '../admin/AdminPages.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For now, we'll show a placeholder as transactions are managed by admin
  // In the future, you can add a hospital-specific transaction endpoint

  useEffect(() => {
    // Transactions are typically viewed from admin side
    // Hospital can see payment status through request status
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '₹0';
    // Amount might be in paise, convert if > 10000
    const rupees = amount > 10000 ? amount / 100 : amount;
    return `₹${Number(rupees).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="hospital-page-container admin-page-container">
      <div className="hospital-page-header admin-page-header">
        <div>
          <h2 className="hospital-page-heading admin-page-heading">Transactions</h2>
          <p className="hospital-page-subtitle admin-page-subtitle">View payment transactions and disbursements</p>
        </div>
        <button className="btn-refresh" onClick={() => {}} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="empty-state">
        <div className="empty-state-icon">💰</div>
        <h3>Transaction History</h3>
        <p>Transaction details are available in the Request Status section. Payments are processed by administrators after request approval.</p>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
          When your requests are approved and funded, payment transactions will be visible here.
        </p>
      </div>
    </div>
  );
}
