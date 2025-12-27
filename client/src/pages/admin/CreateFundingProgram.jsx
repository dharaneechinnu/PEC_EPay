import React, { useState } from 'react';
import axios from 'axios';

export default function CreateFundingProgram(){
  const [form, setForm] = useState({ name: '', description: '', amount: '' });
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3500/admin/funds', form);
      setMessage('Funding program created');
      setForm({ name:'', description:'', amount:'' });
    } catch (err) { setMessage('Failed to create'); }
  };

  return (
    <div style={{padding:20}}>
      <h2>Create Funding Program</h2>
      {message && <div>{message}</div>}
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:8,maxWidth:520}}>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Program name" />
        <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description" />
        <input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="Default amount" type="number" />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
