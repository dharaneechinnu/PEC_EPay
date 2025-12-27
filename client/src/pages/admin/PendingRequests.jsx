import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Container = styled.div`padding: 20px; background: #f9fbff; min-height: 100vh;`;
const Card = styled.div`background:#fff;border:1px solid #e0eefc;border-radius:10px;padding:14px;margin-bottom:12px;`;
const Title = styled.h2`color:#007bff;margin-bottom:10px;`;
const Row = styled.div`display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:8px;`;
const Button = styled.button`background:#007bff;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;`;

export default function PendingRequests(){
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get('http://localhost:3500/admin/getAllRequests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const approve = async (id) => {
    try { await axios.patch(`http://localhost:3500/admin/requests/${id}/approve`); fetchRequests(); } catch (err) { alert('Failed to approve'); }
  };

  return (
    <Container>
      <Title>Pending Emergency Requests</Title>
      {loading && <div>Loading...</div>}
      {error && <div style={{color:'salmon'}}>{error}</div>}
      {requests.length===0 && !loading && <div>No pending requests</div>}
      {requests.map(r => (
        <Card key={r._id}>
          <Row>
            <div>
              <div style={{fontWeight:700}}>{r.patientName || 'Unknown'}</div>
              <div style={{fontSize:13,color:'#666'}}>{r.hospitalName || r.hospital}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div>Amount: <strong>{r.amount}</strong></div>
              <div>Status: <strong>{r.status}</strong></div>
            </div>
          </Row>
          <div style={{marginTop:8}}>
            <Button onClick={() => approve(r._id)}>Approve</Button>
          </div>
        </Card>
      ))}
    </Container>
  );
}
