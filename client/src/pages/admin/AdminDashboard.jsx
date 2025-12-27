import React, { useState } from 'react';
import PendingRequests from './PendingRequests';
import CreateFundingProgram from './CreateFundingProgram';
import Disbursements from './Disbursements';

export default function AdminDashboard(){
  const [active, setActive] = useState('pending');

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
        {renderContent()}
      </main>
    </div>
  );
}
