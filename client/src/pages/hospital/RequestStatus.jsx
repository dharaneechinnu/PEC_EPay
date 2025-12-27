import React, { useEffect, useState } from 'react';
import hospitalService from '../../services/hospitalService';
import authService from '../../services/authService';
import Loader from '../../components/Loader';
import './HospitalPages.css';
import '../admin/AdminPages.css';

export default function RequestStatus() {
  const user = authService.getUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // Get verifierId from user - you may need to adjust this
      const verifierId = user?.id || user?.verifierId || 'temp-verifier-id';
      const res = await hospitalService.getRequestStatus({ verifierId, limit: 100 });
      setRequests(res.applications || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status, decision) => {
    const statusValue = decision || status;
    const statusMap = {
      pending: { label: 'Pending', class: 'status-pending' },
      submitted: { label: 'Submitted', class: 'status-submitted' },
      approved: { label: 'Approved', class: 'status-approved' },
      funded: { label: 'Funded', class: 'status-approved' },
      disbursed: { label: 'Disbursed', class: 'status-approved' },
      rejected: { label: 'Rejected', class: 'status-rejected' },
    };
    const statusInfo = statusMap[statusValue] || { label: statusValue, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading && requests.length === 0) {
    return <Loader />;
  }

  return (
    <div className="hospital-page-container admin-page-container">
      <div className="hospital-page-header admin-page-header">
        <div>
          <h2 className="hospital-page-heading admin-page-heading">Request Status</h2>
          <p className="hospital-page-subtitle admin-page-subtitle">Track your emergency funding requests</p>
        </div>
        <button className="btn-refresh" onClick={fetchRequests} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {requests.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Requests Found</h3>
          <p>You haven't created any funding requests yet.</p>
        </div>
      ) : (
        <div className="admin-cards-grid">
          {requests.map((request) => (
            <div key={request._id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">
                    {request.studentname || request.studentName || 'Unknown Patient'}
                  </h3>
                  <p className="admin-card-subtitle">
                    {request.ApplicationNo || request._id?.slice(-8) || 'N/A'}
                  </p>
                </div>
                {getStatusBadge(request.status, request.AdminDonorDecision)}
              </div>

              <div className="admin-card-body">
                <div className="admin-info-row">
                  <span className="admin-info-label">Application ID:</span>
                  <span className="admin-info-value">{request._id?.slice(-8) || 'N/A'}</span>
                </div>
                
                {request.scholarshipId && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Funding Program:</span>
                    <span className="admin-info-value">
                      {typeof request.scholarshipId === 'object' 
                        ? (request.scholarshipId.scholarshipName || request.scholarshipId.title || 'N/A')
                        : 'N/A'}
                    </span>
                  </div>
                )}

                {request.requestedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Requested Amount:</span>
                    <span className="admin-info-value amount">{formatAmount(request.requestedAmount)}</span>
                  </div>
                )}

                {request.fundedraised && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Funds Raised:</span>
                    <span className="admin-info-value amount">{formatAmount(request.fundedraised)}</span>
                  </div>
                )}

                {request.approvedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Approved Amount:</span>
                    <span className="admin-info-value amount">{formatAmount(request.approvedAmount)}</span>
                  </div>
                )}

                {request.disbursedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Disbursed Amount:</span>
                    <span className="admin-info-value amount">{formatAmount(request.disbursedAmount)}</span>
                  </div>
                )}

                <div className="admin-info-row">
                  <span className="admin-info-label">Created:</span>
                  <span className="admin-info-value">{formatDate(request.createdAt)}</span>
                </div>

                {request.studentemail && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Patient Email:</span>
                    <span className="admin-info-value">{request.studentemail}</span>
                  </div>
                )}

                {request.documents && request.documents.length > 0 && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Documents:</span>
                    <span className="admin-info-value">{request.documents.length} file(s)</span>
                  </div>
                )}
              </div>

              <div className="admin-card-footer">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      // View details - can be expanded
                      alert('Application Details:\n' + JSON.stringify(request, null, 2));
                    }}
                  >
                    View Details
                  </button>
                  {request.documents && request.documents.length === 0 && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        // Navigate to upload documents
                        alert('Document upload feature - navigate to upload page with application ID: ' + request._id);
                      }}
                    >
                      Upload Documents
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && requests.length > 0 && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}
    </div>
  );
}
