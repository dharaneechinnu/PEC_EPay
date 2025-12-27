import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import PendingRequests from './PendingRequests';
import CreateFundingProgram from './CreateFundingProgram';
import Disbursements from './Disbursements';

export default function AdminDashboard(){
  const [active, setActive] = useState('pending');
  const navigate = useNavigate();

  const renderContent = () => {
    switch(active){
      case 'pending': return <PendingRequests />;
      case 'create': return <CreateFundingProgram />;
      case 'disburse': return <Disbursements />;
      default: return <PendingRequests />;
    }
  };

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <aside style={{width:240,padding:18,background:'#fff',borderRight:'1px solid #e6f2ff'}}>
        <div style={{fontSize:18,fontWeight:700,color:'#007bff',marginBottom:12}}>Admin Panel</div>
        <button style={{display:'block',marginBottom:8}} onClick={()=>setActive('pending')}>Pending Requests</button>
        <button style={{display:'block',marginBottom:8}} onClick={()=>setActive('disburse')}>Disbursements</button>
        <button style={{display:'block'}} onClick={()=>setActive('create')}>Create Funding Program</button>
      </aside>
      <main style={{flex:1}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:16,borderBottom:'1px solid #eef6ff'}}>
          <div />
          <div>
            <button style={{padding:'8px 12px',background:'#007bff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} onClick={async () => { await authService.logout(); navigate('/login'); }}>Logout</button>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}
