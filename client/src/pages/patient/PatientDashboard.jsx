import React from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  return (
    <div style={{minHeight:'100vh',padding:40,background:'#f4faff'}}>
      <div style={{maxWidth:1000,margin:'0 auto',background:'#fff',border:'1px solid #dceeff',borderRadius:12,padding:30}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,borderBottom:'1px solid #e8f4ff',paddingBottom:12}}>
          <h1 style={{margin:0,color:'#00a2ff'}}>Patient Dashboard</h1>
          <button style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>{token ? 'Logout' : 'Login'}</button>
        </header>

        <section>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
            <div style={{border:'1px solid #bde0ff',padding:16,borderRadius:10}}>
              <h3 style={{color:'#00a2ff'}}>View Requests</h3>
              <p>See status of emergency funding requests, donor decisions and payouts.</p>
              <button style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} onClick={()=>navigate('/patient')}>View Requests</button>
            </div>

            <div style={{border:'1px solid #bde0ff',padding:16,borderRadius:10}}>
              <h3 style={{color:'#00a2ff'}}>Check Request Status</h3>
              <p>Provide your request ID to check approval and payout status quickly.</p>
              <RequestStatusChecker />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const RequestStatusChecker = () => {
  const [id, setId] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const check = async () => {
    if (!id) return setResult({ error: 'Please provide a request ID' });
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`http://localhost:3500/patient/requeststatus/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) return setResult({ error: data.message || 'Unable to fetch' });
      setResult({ success: data });
    } catch (err) { setResult({ error: err.message }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <input value={id} onChange={(e)=>setId(e.target.value)} placeholder="Request ID (e.g. REQ-123)" style={{width:'100%',padding:10,border:'1px solid #bde0ff',borderRadius:8,marginBottom:8}} />
      <button onClick={check} disabled={loading} style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8}}> {loading ? 'Checking...' : 'Check'}</button>

      {result && (
        <div style={{marginTop:12,padding:10,background:'#f4faff',border:'1px solid #bde0ff',borderRadius:8}}>
          {result.error ? (
            <div style={{color:'#ff4d4f'}}>{result.error}</div>
          ) : (
            <div>
              <div><strong>Request ID:</strong> {result.success.requestId}</div>
              <div><strong>Status:</strong> {result.success.status}</div>
              <div><strong>Payout Status:</strong> {result.success.payoutStatus}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
