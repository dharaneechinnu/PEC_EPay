import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import Loader from '../../components/Loader';
import './AdminPages.css';

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
    totalAmount: 0,
  });

  const user = authService.getUser();

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (searchQuery) params.q = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.searchTransactions(params);
      setTransactions(res.transactions || []);

      // Calculate stats
      const totalAmount = (res.transactions || []).reduce((sum, txn) => {
        return sum + (txn.amount || 0);
      }, 0);
      
      const paid = (res.transactions || []).filter(t => t.status === 'paid').length;
      const failed = (res.transactions || []).filter(t => t.status === 'failed').length;
      const processing = (res.transactions || []).filter(t => 
        ['order_created', 'processing', 'queued'].includes(t.status)
      ).length;

      setStats({
        total: res.total || 0,
        paid,
        failed,
        processing,
        totalAmount: totalAmount / 100, // Convert from paise to rupees
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
    const statusMap = {
      paid: { label: 'Paid', class: 'status-approved' },
      failed: { label: 'Failed', class: 'status-rejected' },
      processing: { label: 'Processing', class: 'status-pending' },
      queued: { label: 'Queued', class: 'status-pending' },
      order_created: { label: 'Order Created', class: 'status-submitted' },
    };
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
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
          <div className="admin-stat-label">Total Transactions</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <div className="admin-stat-label">Successful</div>
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
        <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
          <div className="admin-stat-label">Total Amount</div>
          <div className="admin-stat-value" style={{ color: '#1e40af' }}>
            ₹{Number(stats.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                <th>Application</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment ID</th>
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
                  </td>
                  <td>
                    {txn.applicationId ? (
                      typeof txn.applicationId === 'object' ? (
                        <div>
                          <div>{txn.applicationId.studentname || txn.applicationId.studentName || 'N/A'}</div>
                          {txn.applicationId.ApplicationNo && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              #{txn.applicationId.ApplicationNo}
                            </div>
                          )}
                        </div>
                      ) : (
                        txn.applicationId
                      )
                    ) : 'N/A'}
                  </td>
                  <td>
                    <strong style={{ color: '#059669' }}>{formatAmount(txn.amount)}</strong>
                  </td>
                  <td>{getStatusBadge(txn.status)}</td>
                  <td>
                    {txn.paymentId ? (
                      <code style={{ fontSize: '12px' }}>{txn.paymentId.slice(-8)}</code>
                    ) : txn.transferId ? (
                      <code style={{ fontSize: '12px' }}>{txn.transferId.slice(-8)}</code>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{formatDate(txn.createdAt || txn.initiatedAt)}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => {
                        // TODO: Implement view details
                        alert('Transaction details: ' + JSON.stringify(txn, null, 2));
                      }}
                    >
                      View
                    </button>
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
