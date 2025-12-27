import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';
import './AdminPages.css';

export default function HospitalVerification() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch applications that might be from hospitals/verifiers
  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.viewAllApplications({ status: 'submitted', limit: 100 });
      setApplications(res.applications || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (loading && applications.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Hospital Verification</h2>
          <p className="admin-page-subtitle">Review and verify hospital applications and institutions</p>
        </div>
        <button className="btn-refresh" onClick={fetchApplications} disabled={loading}>
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
          <div className="empty-state-icon">🏥</div>
          <h3>No Applications Found</h3>
          <p>There are no hospital verification applications at this time.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Application Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const verifier = app.verifierId || {};
                return (
                  <tr key={app._id}>
                    <td>
                      <div>
                        <strong>{verifier.institutionName || app.institutionname || 'Unknown'}</strong>
                        {verifier.institutionType && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {verifier.institutionType}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{verifier.contactPerson || verifier.contactperson || 'N/A'}</td>
                    <td>{verifier.contactEmail || app.contactEmail || 'N/A'}</td>
                    <td>{formatDate(app.createdAt)}</td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => {
                            // TODO: Implement approval action
                            setMessage('Verification feature coming soon');
                            setTimeout(() => setMessage(''), 3000);
                          }}
                        >
                          Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
