import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';
import PaymentModal from './PaymentModal';
import api from '../../services/api';
import './AdminPages.css';

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAllRequests();
      setRequests(res.requests || []);
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

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this request?')) {
      return;
    }
    try {
      await adminService.approveRequest(id);
      setSuccess('Request approved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleVerifyAndPay = async (request) => {
    setSelectedRequest(request);
    setShowPaymentModal(true);
  };

  const handleReject = async (id) => {
    const remarks = window.prompt('Please provide a reason for rejection (optional):');
    if (remarks === null) return; // User cancelled
    
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }
    try {
      await adminService.rejectRequest(id, remarks || '');
      setSuccess('Request rejected');
      setTimeout(() => setSuccess(''), 3000);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
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

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', class: 'status-pending' },
      submitted: { label: 'Submitted', class: 'status-submitted' },
      approved: { label: 'Approved', class: 'status-approved' },
      rejected: { label: 'Rejected', class: 'status-rejected' },
    };
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading && requests.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Pending Requests</h2>
          <p className="admin-page-subtitle">Review and approve scholarship applications</p>
        </div>
        <button className="btn-refresh" onClick={fetchRequests} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {requests.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Pending Requests</h3>
          <p>All requests have been processed or there are no new requests.</p>
        </div>
      ) : (
        <div className="admin-cards-grid">
          {requests.map((request) => (
            <div key={request._id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">
                    {request.studentname || request.studentName || 'Unknown Student'}
                  </h3>
                  <p className="admin-card-subtitle">
                    {request.institutionname || request.institutionName || 'Unknown Institution'}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="admin-card-body">
                <div className="admin-info-row">
                  <span className="admin-info-label">Application ID:</span>
                  <span className="admin-info-value">{request._id?.slice(-8) || 'N/A'}</span>
                </div>
            

                {request.requestedAmount && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Requested Amount:</span>
                    <span className="admin-info-value amount">{formatAmount(request.requestedAmount)}</span>
                  </div>
                )}

                {request.estimatedTreatmentCost && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Estimated Cost:</span>
                    <span className="admin-info-value amount">{formatAmount(request.estimatedTreatmentCost)}</span>
                  </div>
                )}

                <div className="admin-info-row">
                  <span className="admin-info-label">Submitted:</span>
                  <span className="admin-info-value">{formatDate(request.createdAt)}</span>
                </div>

                {request.studentemail && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Email:</span>
                    <span className="admin-info-value">{request.studentemail}</span>
                  </div>
                )}
              </div>

              <div className="admin-card-footer">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {request.documents && request.documents.length > 0 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDocuments(true);
                      }}
                    >
                      📄 View Documents ({request.documents.length})
                    </button>
                  )}
                  {request.status !== 'approved' && request.status !== 'rejected' && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApprove(request._id)}
                        disabled={loading}
                      >
                        ✓ Approve Request
                      </button>
                      {request.documents && request.documents.length > 0 && request.payoutDetails && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleVerifyAndPay(request)}
                          disabled={loading}
                          style={{ background: '#059669' }}
                        >
                          ✓ Verify & Pay Now
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(request._id)}
                        disabled={loading}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {request.status === 'approved' && request.payoutDetails && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowPaymentModal(true);
                      }}
                    >
                      💰 Make Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents Modal */}
      {showDocuments && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDocuments(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Documents - {selectedRequest.studentname}</h3>
              <button className="modal-close" onClick={() => setShowDocuments(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="document-preview">
                {selectedRequest.documents.map((doc, index) => {
                  const BASE_URL = api.BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3500';
                  const fileUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${BASE_URL}${doc.fileUrl}`;
                  return (
                    <div key={index} className="document-card">
                      <div className="document-icon">
                        {doc.fileUrl.match(/\.(pdf)$/i) ? '📕' : '🖼️'}
                      </div>
                      <div className="document-name">{doc.docType || 'Document'}</div>
                      <div className="document-type">
                        {doc.verified ? '✓ Verified' : 'Pending Verification'}
                      </div>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-view-btn"
                      >
                        View Document
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRequest && (
        <PaymentModal
          request={selectedRequest}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSuccess('Payment initiated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            fetchRequests();
          }}
        />
      )}

      {loading && requests.length > 0 && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}
    </div>
  );
}
