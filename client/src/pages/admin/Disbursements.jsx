import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';
import './AdminPages.css';

export default function Disbursements() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchApproved = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await adminService.getApprovedRequests();
      setApplications(res.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load approved requests');
      console.error('Error fetching approved requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const handleDisburse = async (id) => {
    if (!window.confirm('Are you sure you want to disburse funds for this application?')) {
      return;
    }
    try {
      await adminService.disburseRequest(id);
      setMessage('Funds disbursed successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchApproved();
    } catch (err) {
      setError(err.message || 'Disbursement failed');
      setTimeout(() => setError(''), 5000);
    }
  };

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
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status, decision) => {
    const statusValue = decision || status;
    const statusMap = {
      approved: { label: 'Approved', class: 'status-approved' },
      funded: { label: 'Funded', class: 'status-approved' },
      disbursed: { label: 'Disbursed', class: 'status-approved' },
      pending: { label: 'Pending', class: 'status-pending' },
    };
    const statusInfo = statusMap[statusValue] || { label: statusValue, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading && applications.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Disbursements</h2>
          <p className="admin-page-subtitle">Manage approved requests and disburse funds</p>
        </div>
        <button className="btn-refresh" onClick={fetchApproved} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {applications.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <h3>No Approved Requests</h3>
          <p>There are no approved requests ready for disbursement.</p>
        </div>
      ) : (
        <div className="admin-cards-grid">
          {applications.map((app) => (
            <div key={app._id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">
                    {app.studentname || app.studentName || 'Unknown Student'}
                  </h3>
                  <p className="admin-card-subtitle">
                    {app.institutionname || app.institutionName || 'Unknown Institution'}
                  </p>
                </div>
                {getStatusBadge(app.status, app.AdminDonorDecision)}
              </div>

              <div className="admin-card-body">
                <div className="admin-info-row">
                  <span className="admin-info-label">Application ID:</span>
                  <span className="admin-info-value">{app._id?.slice(-8) || 'N/A'}</span>
                </div>

                {app.approvedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Approved Amount:</span>
                    <span className="admin-info-value amount">{formatAmount(app.approvedAmount)}</span>
                  </div>
                )}

                {app.requestedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Requested Amount:</span>
                    <span className="admin-info-value">{formatAmount(app.requestedAmount)}</span>
                  </div>
                )}

                {app.disbursedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Disbursed Amount:</span>
                    <span className="admin-info-value amount">{formatAmount(app.disbursedAmount)}</span>
                  </div>
                )}

                {app.fundedraised && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Funds Raised:</span>
                    <span className="admin-info-value amount">{formatAmount(app.fundedraised)}</span>
                  </div>
                )}

                {app.scholarshipId && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Scholarship:</span>
                    <span className="admin-info-value">
                      {typeof app.scholarshipId === 'object' 
                        ? (app.scholarshipId.scholarshipName || app.scholarshipId.title || 'N/A')
                        : 'N/A'}
                    </span>
                  </div>
                )}

                <div className="admin-info-row">
                  <span className="admin-info-label">Approved Date:</span>
                  <span className="admin-info-value">{formatDate(app.AdminDonorActionAt || app.createdAt)}</span>
                </div>

                {app.fundsDisbursedat && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Disbursed Date:</span>
                    <span className="admin-info-value">{formatDate(app.fundsDisbursedat)}</span>
                  </div>
                )}
              </div>

              <div className="admin-card-footer">
                {app.AdminDonorDecision !== 'disbursed' && app.status !== 'disbursed' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDisburse(app._id)}
                    disabled={loading}
                  >
                    💰 Make Disbursement
                  </button>
                ) : (
                  <div className="admin-info-value" style={{ color: '#059669', fontWeight: 600 }}>
                    ✓ Already Disbursed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && applications.length > 0 && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}
    </div>
  );
}
