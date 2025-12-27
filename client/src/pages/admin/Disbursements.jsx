import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';
import './AdminPages.css';

export default function Disbursements() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingApps, setProcessingApps] = useState(new Set());
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

  const handleDisburse = async (app) => {
    const amount = app.approvedAmount || app.requestedAmount || app.fundedraised;
    const hospitalName = app.payoutDetails?.accountHolderName || app.institutionname || 'Hospital';
    
    if (!amount || amount <= 0) {
      setError('Invalid disbursement amount');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!window.confirm(`Are you sure you want to disburse ₹${Number(amount).toLocaleString('en-IN')} to ${hospitalName}?`)) {
      return;
    }

    setProcessingApps(prev => new Set(prev).add(app._id));
    setError('');

    try {
      // Ensure beneficiary exists
      if (!app.payoutDetails?.beneficiaryId) {
        setMessage('🔄 Setting up bank account details...');
        try {
          await adminService.createBeneficiary(app._id, {
            name: app.payoutDetails?.accountHolderName || hospitalName,
            email: app.payoutDetails?.email || app.studentemail,
            contact: app.payoutDetails?.phone || '9999999999',
            account_number: app.payoutDetails?.accountNumber || '',
            ifsc: app.payoutDetails?.ifsc || '',
          });
          // Refresh the application data after beneficiary creation
          await fetchApproved();
        } catch (beneficiaryErr) {
          console.warn('Beneficiary creation failed, proceeding:', beneficiaryErr);
        }
      }

      setMessage('🔄 Creating payment order...');
      // Create Razorpay order for disbursement
      const orderResponse = await adminService.createOrder(app._id);
      
      setMessage('💳 Opening Razorpay payment gateway...');
      // Open Razorpay checkout
      const options = {
        key: orderResponse.key, // Razorpay key from server
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'E-Pay Medical Emergency',
        description: `Disbursement to ${hospitalName}`,
        order_id: orderResponse.order.id,
        handler: async function (response) {
          setMessage('🔄 Processing payment verification...');
          try {
            // Verify payment on server
            await adminService.verifyPayment(app._id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            setMessage('✅ Payment verified! Processing disbursement...');
            
            // After verification, make direct payout to hospital
            try {
              await adminService.makePayout(app._id);
              setMessage('🎉 Disbursement completed successfully! Professional receipts have been sent to patient and hospital.');
            } catch (payoutErr) {
              setMessage('⚠️ Payment verified but payout failed. Manual intervention may be required.');
              console.error('Payout error:', payoutErr);
            }
            
            setTimeout(() => {
              setMessage('');
              fetchApproved(); // Refresh the list
            }, 6000);
            
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed');
            setTimeout(() => setError(''), 5000);
          } finally {
            setProcessingApps(prev => {
              const newSet = new Set(prev);
              newSet.delete(app._id);
              return newSet;
            });
          }
        },
        prefill: {
          name: 'E-Pay Admin',
          email: 'admin@epaymedical.com',
        },
        notes: {
          application_id: app._id,
          patient_name: app.patientname || app.studentname,
          hospital_name: hospitalName,
          emergency_type: app.emergencyType || 'medical'
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function() {
            setProcessingApps(prev => {
              const newSet = new Set(prev);
              newSet.delete(app._id);
              return newSet;
            });
            setMessage('');
            setError('Payment was cancelled');
            setTimeout(() => setError(''), 3000);
          }
        }
      };

      // Check if Razorpay is loaded
      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

    } catch (err) {
      setError(err.message || 'Disbursement failed');
      setTimeout(() => setError(''), 5000);
      setProcessingApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(app._id);
        return newSet;
      });
      setMessage('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span>
            <span>{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
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

                {app.payoutDetails && (
                  <div className="admin-info-section">
                    <div className="admin-info-row">
                      <span className="admin-info-label">Account Holder:</span>
                      <span className="admin-info-value">{app.payoutDetails.accountHolderName || 'N/A'}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="admin-info-label">Account Number:</span>
                      <span className="admin-info-value">
                        {app.payoutDetails.accountNumber ? 
                          `****${app.payoutDetails.accountNumber.slice(-4)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="admin-info-row">
                      <span className="admin-info-label">IFSC Code:</span>
                      <span className="admin-info-value">{app.payoutDetails.ifsc || 'N/A'}</span>
                    </div>
                    {app.payoutDetails.beneficiaryId && (
                      <div className="admin-info-row">
                        <span className="admin-info-label">Beneficiary ID:</span>
                        <span className="admin-info-value">
                          <code style={{ fontSize: '12px' }}>{app.payoutDetails.beneficiaryId.slice(-8)}</code>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {app.emergencyType && (
                  <div className="admin-info-row">
                    <span className="admin-info-label">Emergency Type:</span>
                    <span className="admin-info-value">
                      <span style={{ 
                        background: '#fef3c7', 
                        color: '#d97706', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        🚨 {app.emergencyType}
                      </span>
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
                    onClick={() => handleDisburse(app)}
                    disabled={processingApps.has(app._id)}
                  >
                    {processingApps.has(app._id) ? (
                      <>⏳ Processing...</>
                    ) : (
                      <>💳 Pay via Razorpay</>
                    )}
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
