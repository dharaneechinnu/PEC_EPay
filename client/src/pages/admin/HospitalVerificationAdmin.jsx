import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';
import './AdminPages.css';

export default function HospitalVerificationAdmin() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedHospitalDetails, setSelectedHospitalDetails] = useState(null);
  const [verificationAction, setVerificationAction] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingHospitalVerifications();
      setHospitals(res.hospitals || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (hospitalId, action) => {
    // action should be 'approve' (verify) or 'reject' — backend expects { status: 'verified'|'rejected' }
    if (!hospitalId) return;
    if (action === 'reject' && !remarks.trim()) {
      setError('Please provide remarks for rejection');
      return;
    }

    const payload = {
      status: action === 'approve' ? 'verified' : 'rejected',
      remarks: remarks.trim() || undefined,
    };

    try {
      await adminService.updateHospitalVerification(hospitalId, payload);
      setMessage(`Hospital ${payload.status} successfully!`);
      setTimeout(() => {
        setMessage('');
        setSelectedHospital(null);
        setRemarks('');
        fetchPendingVerifications();
      }, 2000);
    } catch (err) {
      setError(err.message || `Failed to ${action} hospital`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchHospitalDetails = async (hospitalId) => {
    setLoading(true);
    try {
      const res = await adminService.getHospitalVerificationDetails(hospitalId);
      setSelectedHospitalDetails(res.hospital || res);
    } catch (err) {
      setError(err.message || 'Failed to fetch hospital details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="status-badge status-verified">✅ Verified</span>;
      case 'pending':
        return <span className="status-badge status-pending">⏳ Pending</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">❌ Rejected</span>;
      default:
        return <span className="status-badge status-unverified">⚠️ Unverified</span>;
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

  if (loading) return <Loader />;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Hospital Verification</h2>
          <p className="admin-page-subtitle">Review and verify hospital registration requests</p>
        </div>
        <button className="btn-refresh" onClick={fetchPendingVerifications}>
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

      {hospitals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏥</div>
          <h3>No Pending Verifications</h3>
          <p>All hospital verification requests have been processed.</p>
        </div>
      ) : (
        <div className="admin-cards-grid">
          {hospitals.map((hospital) => (
            <div key={hospital._id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">{hospital.institutionName}</h3>
                  <p className="admin-card-subtitle">{hospital.contactPerson}</p>
                </div>
                {getStatusBadge(hospital.verificationStatus)}
              </div>

              <div className="admin-card-body">
                <div className="admin-info-row">
                  <span className="admin-info-label">Contact Email:</span>
                  <span className="admin-info-value">{hospital.contactEmail}</span>
                </div>

                <div className="admin-info-row">
                  <span className="admin-info-label">License Number:</span>
                  <span className="admin-info-value">{hospital.hospitalLicenseNumber || 'N/A'}</span>
                </div>

                {hospital.hospitalAddress && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Address:</span>
                    <span className="admin-info-value">
                      {hospital.hospitalAddress.street && (
                        <>
                          {hospital.hospitalAddress.street}<br/>
                          {hospital.hospitalAddress.city}, {hospital.hospitalAddress.state} - {hospital.hospitalAddress.pincode}
                        </>
                      )}
                    </span>
                  </div>
                )}

                {hospital.emergencyServices && hospital.emergencyServices.length > 0 && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Emergency Services:</span>
                    <span className="admin-info-value">
                      {hospital.emergencyServices.map(service => (
                        <span key={service} className="service-tag">
                          {service.charAt(0).toUpperCase() + service.slice(1)}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                <div className="admin-info-row">
                  <span className="admin-info-label">Submitted:</span>
                  <span className="admin-info-value">{formatDate(hospital.verificationSubmittedAt)}</span>
                </div>

                {hospital.website && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Website:</span>
                    <span className="admin-info-value">
                      <a href={hospital.website} target="_blank" rel="noopener noreferrer">
                        🌐 {hospital.website}
                      </a>
                    </span>
                  </div>
                )}

                {hospital.verificationDocuments && hospital.verificationDocuments.length > 0 && (
                  <div className="admin-info-section">
                    <div className="admin-info-label">Documents Uploaded:</div>
                    <div className="document-preview-row">
                      <button className="btn btn-link" onClick={() => fetchHospitalDetails(hospital._id)}>View Documents</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-card-footer">
                {hospital.verificationStatus === 'pending' ? (
                  <div className="verification-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setSelectedHospital(hospital._id);
                        setVerificationAction('approve');
                        handleVerificationAction(hospital._id, 'approve');
                      }}
                    >
                      ✅ Verify
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setSelectedHospital(hospital._id);
                        setVerificationAction('reject');
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                ) : (
                  <div className="admin-info-value">
                    Status: {hospital.verificationStatus}
                    {hospital.verificationRemarks && (
                      <div className="verification-remarks">
                        Remarks: {hospital.verificationRemarks}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedHospital && verificationAction === 'reject' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reject Hospital Verification</h3>
            <p>Please provide a reason for rejecting this hospital's verification:</p>
            
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="form-textarea"
              placeholder="Reason for rejection..."
              rows="4"
              required
            />
            
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => handleVerificationAction(selectedHospital, 'reject')}
                disabled={!remarks.trim()}
              >
                Confirm Rejection
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedHospital(null);
                  setVerificationAction('');
                  setRemarks('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {selectedHospitalDetails && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h3>Uploaded Documents — {selectedHospitalDetails.institutionName}</h3>
            <div className="documents-grid">
              {(selectedHospitalDetails.verificationDocuments || []).map((doc, idx) => (
                <div key={idx} className="doc-card">
                  {doc.url ? (
                    doc.originalname && (doc.originalname.match(/\.jpg$|\.png$|\.jpeg$|\.gif$/i)) ? (
                      <a href={doc.url} target="_blank" rel="noreferrer">
                        <img src={doc.url} alt={doc.originalname} className="doc-thumb" />
                      </a>
                    ) : (
                      <a href={doc.url} target="_blank" rel="noreferrer" className="doc-link">📄 {doc.originalname || doc.filename}</a>
                    )
                  ) : (
                    <div className="doc-link">📄 {doc.originalname || doc.filename}</div>
                  )}
                  <div className="doc-meta">Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedHospitalDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}