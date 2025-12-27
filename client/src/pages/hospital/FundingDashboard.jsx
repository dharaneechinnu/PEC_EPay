import React, { useState, useEffect } from 'react';
import hospitalService from '../../services/hospitalService';
import Loader from '../../components/Loader';
import './HospitalPages.css';

export default function FundingDashboard() {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [requestPage, setRequestPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary();
    } else if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, requestPage, transactionPage]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await hospitalService.getFundingSummary();
      setSummary(res);
    } catch (err) {
      setError(err.message || 'Failed to load funding summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await hospitalService.getFundingRequests({ page: requestPage, limit: 10 });
      setRequests(res.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load funding requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await hospitalService.getTransactions({ page: transactionPage, limit: 10 });
      setTransactions(res.transactions || []);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
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

  const getStatusBadge = (status, decision) => {
    const statusToShow = decision || status;
    switch (statusToShow) {
      case 'approved':
        return <span className="status-badge status-approved">✅ Approved</span>;
      case 'funded':
      case 'disbursed':
        return <span className="status-badge status-funded">💰 Funded</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">❌ Rejected</span>;
      case 'paid':
        return <span className="status-badge status-paid">💳 Paid</span>;
      case 'processing':
        return <span className="status-badge status-processing">⏳ Processing</span>;
      default:
        return <span className="status-badge status-pending">⏳ {statusToShow || 'Pending'}</span>;
    }
  };

  if (loading && !summary && !requests.length && !transactions.length) {
    return <Loader />;
  }

  return (
    <div className="hospital-page-container">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Summary
        </button>
        <button 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 Funding Requests
        </button>
        <button 
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💰 Transactions
        </button>
      </div>

      {activeTab === 'summary' && summary && (
        <div className="funding-summary">
          <div className="summary-header">
            <h3>📊 Funding Summary</h3>
            <div className="hospital-info">
              <h4>{summary.hospital?.name}</h4>
              <p>{summary.hospital?.email}</p>
              {getStatusBadge(summary.hospital?.verificationStatus)}
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">📋</div>
              <div className="summary-details">
                <div className="summary-number">{summary.summary?.totalRequests || 0}</div>
                <div className="summary-label">Total Requests</div>
              </div>
            </div>

            <div className="summary-card approved">
              <div className="summary-icon">✅</div>
              <div className="summary-details">
                <div className="summary-number">{summary.summary?.approvedRequests || 0}</div>
                <div className="summary-label">Approved</div>
              </div>
            </div>

            <div className="summary-card funded">
              <div className="summary-icon">💰</div>
              <div className="summary-details">
                <div className="summary-number">{summary.summary?.fundedRequests || 0}</div>
                <div className="summary-label">Funded</div>
              </div>
            </div>

            <div className="summary-card rejected">
              <div className="summary-icon">❌</div>
              <div className="summary-details">
                <div className="summary-number">{summary.summary?.rejectedRequests || 0}</div>
                <div className="summary-label">Rejected</div>
              </div>
            </div>

            <div className="summary-card amount">
              <div className="summary-icon">💳</div>
              <div className="summary-details">
                <div className="summary-number">{formatCurrency(summary.summary?.totalFundedAmount)}</div>
                <div className="summary-label">Total Funded Amount</div>
              </div>
            </div>

            <div className="summary-card transactions">
              <div className="summary-icon">🔄</div>
              <div className="summary-details">
                <div className="summary-number">{summary.summary?.paidTransactions || 0}</div>
                <div className="summary-label">Paid Transactions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-list">
          <div className="section-header">
            <h3>📋 Funding Requests</h3>
            <button onClick={() => setRequestPage(1)} className="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Funding Requests</h3>
              <p>You haven't submitted any funding requests yet.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div>
                      <h4>{request.ApplicationNo}</h4>
                      <p>{request.studentname || request.patientname}</p>
                    </div>
                    {getStatusBadge(request.status, request.AdminDonorDecision)}
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <span className="label">Patient Email:</span>
                      <span className="value">{request.studentemail || request.patientemail}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Emergency Type:</span>
                      <span className="value">{request.emergencyType || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Requested Amount:</span>
                      <span className="value">{formatCurrency(request.requestedAmount)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Funded Amount:</span>
                      <span className="value">{formatCurrency(request.fundedraised)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Created:</span>
                      <span className="value">{formatDate(request.createdAt)}</span>
                    </div>
                  </div>

                  {request.AdminDonorRemarks && (
                    <div className="request-remarks">
                      <strong>Admin Remarks:</strong> {request.AdminDonorRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="transactions-list">
          <div className="section-header">
            <h3>💰 Transactions</h3>
            <button onClick={() => setTransactionPage(1)} className="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <h3>No Transactions</h3>
              <p>No payment transactions found for your funding requests.</p>
            </div>
          ) : (
            <div className="transactions-grid">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="transaction-card">
                  <div className="transaction-header">
                    <div>
                      <h4>{transaction.applicationId?.ApplicationNo || 'N/A'}</h4>
                      <p>{transaction.applicationId?.studentname || transaction.applicationId?.patientname}</p>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>

                  <div className="transaction-details">
                    <div className="detail-row">
                      <span className="label">Amount:</span>
                      <span className="value">{formatCurrency((transaction.amount || 0) / 100)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Payment ID:</span>
                      <span className="value">{transaction.paymentId || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Order ID:</span>
                      <span className="value">{transaction.orderId || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Transfer ID:</span>
                      <span className="value">{transaction.transferId || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(transaction.paidAt || transaction.createdAt)}</span>
                    </div>
                  </div>

                  {transaction.failureReason && (
                    <div className="transaction-error">
                      <strong>Failure Reason:</strong> {transaction.failureReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}