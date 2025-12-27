import React, { useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';

export default function PaymentModal({ request, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMakePayment = async () => {
    if (!window.confirm(`Are you sure you want to make payment of ₹${Number(request.approvedAmount || request.requestedAmount).toLocaleString('en-IN')} to ${request.payoutDetails?.accountHolderName || 'hospital'}?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First approve the request if not already approved
      if (request.status !== 'approved') {
        try {
          await adminService.approveRequest(request._id);
        } catch (approveErr) {
          console.warn('Approval failed, proceeding with payment:', approveErr);
        }
      }

      // First create beneficiary if needed
      if (!request.payoutDetails?.beneficiaryId) {
        try {
          await adminService.createBeneficiary(request._id, {
            name: request.payoutDetails.accountHolderName,
            email: request.payoutDetails.email,
            contact: request.payoutDetails.phone,
            account_number: request.payoutDetails.accountNumber,
            ifsc: request.payoutDetails.ifsc,
          });
        } catch (beneficiaryErr) {
          console.warn('Beneficiary creation failed, proceeding with payment:', beneficiaryErr);
        }
      }

      // Create Razorpay order
      const orderResponse = await adminService.createOrder(request._id);
      
      // Open Razorpay checkout
      const options = {
        key: orderResponse.key, // Razorpay key from server
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'EPay Medical Funding',
        description: `Payment to ${request.payoutDetails?.accountHolderName || 'Hospital'}`,
        order_id: orderResponse.order.id,
        handler: async function (response) {
          try {
            // Verify payment on server
            await adminService.verifyPayment(request._id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            // After verification, make payout to hospital
            await adminService.makePayout(request._id);
            onSuccess();
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed');
            setTimeout(() => setError(''), 5000);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'EPay Admin',
          email: 'admin@epay.com',
        },
        theme: {
          color: '#00a2ff',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
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
        throw new Error('Razorpay SDK not loaded');
      }

    } catch (err) {
      setError(err.message || 'Payment failed');
      setTimeout(() => setError(''), 5000);
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Make Payment to Hospital</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
              Payment Details
            </h4>
            
            <div className="admin-info-row">
              <span className="admin-info-label">Patient Name:</span>
              <span className="admin-info-value">{request.studentname || request.studentName}</span>
            </div>
            
            <div className="admin-info-row">
              <span className="admin-info-label">Application ID:</span>
              <span className="admin-info-value">{request._id?.slice(-8)}</span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-label">Amount to Pay:</span>
              <span className="admin-info-value amount" style={{ fontSize: '20px', fontWeight: 700 }}>
                {formatAmount(request.approvedAmount || request.requestedAmount)}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
              Hospital Bank Details
            </h4>
            
            <div className="admin-info-row">
              <span className="admin-info-label">Account Holder:</span>
              <span className="admin-info-value">{request.payoutDetails?.accountHolderName || 'N/A'}</span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-label">Account Number:</span>
              <span className="admin-info-value">
                {request.payoutDetails?.accountNumber ? 
                  request.payoutDetails.accountNumber.slice(-4).padStart(request.payoutDetails.accountNumber.length, '*') : 
                  'N/A'}
              </span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-label">IFSC Code:</span>
              <span className="admin-info-value">{request.payoutDetails?.ifsc || 'N/A'}</span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-label">Bank Name:</span>
              <span className="admin-info-value">{request.payoutDetails?.bankName || 'N/A'}</span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-label">Email:</span>
              <span className="admin-info-value">{request.payoutDetails?.email || 'N/A'}</span>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleMakePayment}
              disabled={loading || !request.payoutDetails}
            >
              {loading ? <Loader /> : '💰 Make Payment'}
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          {!request.payoutDetails && (
            <div className="alert alert-error" style={{ marginTop: '16px' }}>
              Bank details not provided. Please ensure the request includes payout details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

