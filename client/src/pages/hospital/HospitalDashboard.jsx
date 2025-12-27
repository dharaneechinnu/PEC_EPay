import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function HospitalDashboard(){
  const navigate = useNavigate();
  return (
    <div style={{minHeight:'100vh',padding:24,background:'#fbfeff'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0,color:'#059669'}}>Hospital Dashboard</h2>
        <button style={{padding:'8px 12px',background:'#059669',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} onClick={async () => { await authService.logout(); navigate('/login'); }}>Logout</button>
      </header>
      <p>View and create emergency funding requests here.</p>
    </div>
  );
}
