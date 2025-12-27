import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Container = styled.div`padding:20px; min-height:100vh; background:#f9fbff;`;
const Title = styled.h2`color:#00a2ff;`;
const Card = styled.div`background:#fff;border:1px solid #e0eefc;border-radius:10px;padding:14px;margin-bottom:12px;`;
const Button = styled.button`background:linear-gradient(90deg,#00a2ff,#4db8ff);color:white;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;`;

export default function Disbursements(){
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchApproved = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await axios.get('http://localhost:3500/admin/getApprovedRequests');
      setApps(res.data.requests || []);
    } catch (err){ setMessage('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApproved(); }, []);

  const makeDisbursement = async (id) => {
    try {
      const res = await axios.post(`http://localhost:3500/admin/requests/${id}/disburse`);
      if (res.status === 200) { setMessage('Disbursed'); fetchApproved(); }
    } catch (err){ setMessage('Disbursement failed'); }
  };

  return (
    <Container>
      <Title>Approved Requests - Disbursements</Title>
      {loading && <div>Loading...</div>}
      {message && <div style={{marginBottom:12}}>{message}</div>}
      {apps.map(a => (
        <Card key={a._id}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:700}}>{a.patientName}</div>
              <div style={{fontSize:13,color:'#666'}}>{a.hospitalName}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div>Amount: <strong>{a.amount}</strong></div>
              <div>Requested: {new Date(a.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <Button onClick={() => makeDisbursement(a._id)}>Make Disbursement</Button>
          </div>
        </Card>
      ))}
    </Container>
  );
}
