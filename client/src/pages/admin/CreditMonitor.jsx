import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import Loader from '../../components/Loader';
import './AdminPages.css';
import './CreditMonitor.css';

export default function CreditMonitor() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    failed: 0,
    processing: 0,
    successfulAmount: 0,
  });

  const user = authService.getUser();

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (searchQuery) params.q = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (user?.id) params.adminId = user.id; // Filter by current admin

      console.log('Fetching transactions with params:', params);
      const res = await adminService.searchTransactions(params);
      
      if (res.warning) {
        console.warn('API Warning:', res.warning);
        setError(`Warning: ${res.warning}`);
      }
      
      let transactions = res.transactions || [];
      console.log('Received transactions:', transactions.length);

      // Group transactions by applicationId to show only the latest status per application
      const groupedTransactions = {};
      transactions.forEach(txn => {
        const appId = txn.applicationId?._id || txn.applicationId;
        if (!appId) return;
        
        const key = String(appId);
        if (!groupedTransactions[key]) {
          groupedTransactions[key] = [];
        }
        groupedTransactions[key].push(txn);
      });

      // For each application, keep only the transaction with the latest status
      const statusPriority = {
        'disbursed': 5,
        'funded': 4, 
        'processed': 4,
        'paid': 3,
        'processing': 2,
        'order_created': 1,
        'queued': 1,
        'failed': 0
      };

      const latestTransactions = [];
      Object.values(groupedTransactions).forEach(txnGroup => {
        // Sort by priority and then by date, take the latest
        const sortedGroup = txnGroup.sort((a, b) => {
          const priorityDiff = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
        });
        latestTransactions.push(sortedGroup[0]);
      });

      // Use deduplicated transactions
      transactions = latestTransactions;
      setTransactions(transactions);

      // Calculate stats from deduplicated transactions only
      const paid = transactions.filter(t => ['paid', 'processed', 'funded', 'disbursed'].includes(t.status)).length;
      const failed = transactions.filter(t => t.status === 'failed').length;
      const processing = transactions.filter(t => 
        ['order_created', 'processing', 'queued'].includes(t.status)
      ).length;

      // Calculate actual payment amounts (only for successful transactions)
      const successfulAmount = transactions
        .filter(t => ['paid', 'processed', 'funded', 'disbursed'].includes(t.status))
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);

      setStats({
        total: transactions.length,
        paid,
        failed,
        processing,
        successfulAmount: successfulAmount / 100, // Convert from paise to rupees
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions();
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
    // Amount is in paise, convert to rupees
    const rupees = amount / 100;
    return `₹${Number(rupees).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    let className = 'credit-status-badge ';
    let emoji = '';
    
    switch (status) {
      case 'paid':
      case 'processed':
      case 'funded':
      case 'disbursed':
        className += 'credit-status-paid';
        emoji = '✅';
        break;
      case 'failed':
      case 'error':
        className += 'credit-status-failed';
        emoji = '❌';
        break;
      case 'processing':
        className += 'credit-status-processing';
        emoji = '⏳';
        break;
      case 'queued':
        className += 'credit-status-queued';
        emoji = '📋';
        break;
      case 'order_created':
        className += 'credit-status-order_created';
        emoji = '🆕';
        break;
      default:
        className += 'credit-status-queued';
        emoji = '❓';
    }
    
    return <span className={className}>{emoji} {status || 'unknown'}</span>;
  };

  if (loading && transactions.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Credit Monitor</h2>
          <p className="admin-page-subtitle">Monitor transactions, payments, and credit behavior</p>
        </div>
        <button className="btn-refresh" onClick={fetchTransactions} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Applications</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <div className="admin-stat-label">Successful Payments</div>
          <div className="admin-stat-value" style={{ color: '#065f46' }}>{stats.paid}</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
          <div className="admin-stat-label">Failed</div>
          <div className="admin-stat-value" style={{ color: '#991b1b' }}>{stats.failed}</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
          <div className="admin-stat-label">Processing</div>
          <div className="admin-stat-value" style={{ color: '#92400e' }}>{stats.processing}</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)' }}>
          <div className="admin-stat-label">Total Amount Paid</div>
          <div className="admin-stat-value" style={{ color: '#047857' }}>
            ₹{Number(stats.successfulAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters" style={{ marginBottom: '24px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by transaction ID, payment ID, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="queued">Queued</option>
              <option value="order_created">Order Created</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            🔍 Search
          </button>
          {searchQuery || statusFilter ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                fetchTransactions();
              }}
            >
              Clear
            </button>
          ) : null}
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {transactions.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No Transactions Found</h3>
          <p>There are no transactions matching your criteria.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Patient & Hospital</th>
                <th>Amount</th>
                <th>Current Status</th>
                <th>Bank Details</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn._id}>
                  <td>
                    <code style={{ fontSize: '12px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
                      {txn._id?.slice(-12) || 'N/A'}
                    </code>
                    {txn.paymentId && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Payment: {txn.paymentId.slice(-8)}
                      </div>
                    )}
                    {txn.transferId && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Transfer: {txn.transferId.slice(-8)}
                      </div>
                    )}
                  </td>
                  <td>
                    {txn.applicationId ? (
                      typeof txn.applicationId === 'object' && txn.applicationId !== null ? (
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {txn.applicationId.patientname || 
                             txn.applicationId.studentname || 
                             txn.applicationId.studentName || 
                             'Patient Name N/A'}
                          </div>
                          {txn.applicationId.ApplicationNo && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              #{txn.applicationId.ApplicationNo}
                            </div>
                          )}
                          {txn.applicationId.institutionname && (
                            <div style={{ fontSize: '11px', color: '#059669' }}>
                              🏥 {txn.applicationId.institutionname}
                            </div>
                          )}
                          {txn.applicationId.emergencyType && (
                            <div style={{ fontSize: '10px', color: '#8b5cf6' }}>
                              🚨 {txn.applicationId.emergencyType}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          <div>Application ID</div>
                          <code style={{ fontSize: '10px' }}>{String(txn.applicationId).slice(-8)}</code>
                        </div>
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>No application data</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontSize: '14px' }}>{formatAmount(txn.amount)}</strong>
                    {txn.currency && (
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{txn.currency}</div>
                    )}
                  </td>
                  <td>{getStatusBadge(txn.status)}</td>
                  <td>
                    {txn.payoutDetails ? (
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {txn.payoutDetails.accountHolderName || 'N/A'}
                        </div>
                        {txn.payoutDetails.accountNumber && (
                          <div style={{ color: '#6b7280', fontFamily: 'monospace' }}>
                            ****{txn.payoutDetails.accountNumber.slice(-4)}
                          </div>
                        )}
                        {txn.payoutDetails.maskedAccountNumber && (
                          <div style={{ color: '#6b7280', fontFamily: 'monospace' }}>
                            {txn.payoutDetails.maskedAccountNumber}
                          </div>
                        )}
                        {txn.payoutDetails.ifsc && (
                          <div style={{ color: '#6b7280', fontWeight: '500' }}>{txn.payoutDetails.ifsc}</div>
                        )}
                        {txn.payoutDetails.bankName && (
                          <div style={{ color: '#059669', fontSize: '10px' }}>{txn.payoutDetails.bankName}</div>
                        )}
                        {['paid', 'processed', 'funded', 'disbursed'].includes(txn.status) && (
                          <div style={{ color: '#16a34a', fontSize: '10px', fontWeight: '500', marginTop: '2px' }}>
                            ✅ Funds Transferred
                          </div>
                        )}
                      </div>
                    ) : (
                      txn.applicationId && typeof txn.applicationId === 'object' && txn.applicationId.institutionname ? (
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          <div>Bank details not available</div>
                          <div style={{ color: '#f59e0b' }}>⚠️ Setup required</div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>No bank details</span>
                      )
                    )}
                  </td>
                  <td>
                    <div>{formatDate(txn.createdAt || txn.initiatedAt)}</div>
                    {txn.completedAt && (
                      <div style={{ fontSize: '11px', color: '#059669' }}>
                        ✅ {formatDate(txn.completedAt)}
                      </div>
                    )}
                    {txn.paidAt && (
                      <div style={{ fontSize: '11px', color: '#0891b2' }}>
                        💳 {formatDate(txn.paidAt)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => {
                          const details = {
                            transactionId: txn._id,
                            amount: formatAmount(txn.amount),
                            status: txn.status,
                            paymentId: txn.paymentId,
                            transferId: txn.transferId,
                            bankDetails: txn.payoutDetails,
                            dates: {
                              initiated: txn.initiatedAt,
                              completed: txn.completedAt,
                              paid: txn.paidAt
                            },
                            failureReason: txn.failureReason
                          };
                          alert('Transaction Details:\n' + JSON.stringify(details, null, 2));
                        }}
                      >
                        📊 Details
                      </button>
                      {txn.status === 'failed' && txn.failureReason && (
                        <button
                          className="btn" 
                          style={{ padding: '2px 6px', fontSize: '10px', background: '#fee2e2', color: '#991b1b' }}
                          onClick={() => alert('Failure Reason: ' + txn.failureReason)}
                        >
                          ❌ Error
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && transactions.length > 0 && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}
    </div>
  );
}
