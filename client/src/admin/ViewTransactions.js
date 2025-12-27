import React, { useEffect, useState } from 'react';

const apiBase = 'http://localhost:3500';

const formatRupees = (paise) => {
  if (typeof paise !== 'number') return '-';
  return '₹' + (paise / 100).toFixed(2);
};

const ViewTransactions = () => {
  const [q, setQ] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

  // eslint-disable-next-line no-unused-vars
  const getAdminIdFromStorage = () => {
    try {
      const raw = localStorage.getItem('adminAuth');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.admin?._id || parsed?.admin?.id || parsed?.id || parsed?._id || null;
    } catch (e) {
      return null;
    }
  };

  const fetchTransactions = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const adminId = getAdminIdFromStorage();
      if (!adminId) {
        setError('Admin not signed in or admin id missing in localStorage');
        setTransactions([]);
        setLoading(false);
        return;
      }
  const params = new URLSearchParams();
  // always filter to paid transactions per requirement
  params.set('status', 'paid');
  if (q) params.set('q', q);
  params.set('page', p);
  params.set('limit', limit);

  // Use the flexible search endpoint which accepts status and adminId as query params
  const res = await fetch(`${apiBase}/admin/transactions/search?adminId=${adminId}&${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch (err) {
      setError(err.message || 'Error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{color:'#e6f7ff'}}>
      <div style={{display:'flex', gap:12, marginBottom:14}}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by transferId, paymentId, orderId, hashedTransactionId, beneficiaryId" style={{flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'#fff'}} />
        <button onClick={() => fetchTransactions(1)} style={{padding:'8px 12px', borderRadius:8, border:'none', background:'#00cfff', color:'#001'}}>Search</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{color:'#ffd6d6'}}>{error}</div>
      ) : (
        <div>
          <div style={{marginBottom:8, color:'#9feffc'}}>Total: {total}</div>
          <div style={{display:'grid', gap:12}}>
            {transactions.map((t) => (
              <div key={t._id} style={{background:'rgba(255,255,255,0.03)', padding:12, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, color:'#9feffc'}}>{t.hashedTransactionId || t.transferId || t.paymentId || t.orderId || t._id}</div>
                  <div style={{color:'#cfeefc', fontSize:13}}>{t.applicationId?.ApplicationNo ? `Application: ${t.applicationId.ApplicationNo}` : (t.applicationId?._id || '')}</div>
                  <div style={{color:'#bff6ff', fontSize:12}}>{t.beneficiaryId ? `Beneficiary: ${t.beneficiaryId}` : ''}</div>
                </div>
                <div style={{textAlign:'right', minWidth:220}}>
                  <div style={{fontWeight:700, color: t.status === 'paid' || t.status === 'funded' ? '#b6f4c7' : '#ffd6d6'}}>{t.status}</div>
                  <div style={{marginTop:6}}>{formatRupees(t.amount)}</div>
                  <div style={{fontSize:12, color:'#9fb0c8', marginTop:6}}>{new Date(t.createdAt || t.initiatedAt || t.paidAt || t.initiatedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:'flex', justifyContent:'space-between', marginTop:14}}>
            <button onClick={() => fetchTransactions(Math.max(1, page - 1))} disabled={page <= 1} style={{padding:'8px 12px', borderRadius:8}}>Prev</button>
            <div style={{alignSelf:'center'}}>Page {page}</div>
            <button onClick={() => fetchTransactions(page + 1)} disabled={transactions.length < limit} style={{padding:'8px 12px', borderRadius:8}}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTransactions;
