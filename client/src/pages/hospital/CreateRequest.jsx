import React, { useState } from 'react';
import hospitalService from '../../services/hospitalService';

export default function CreateRequest(){
  const [data, setData] = useState({ patientName: '', amount: '' });
  const submit = async (e) => {
    e.preventDefault();
    await hospitalService.createRequest(data);
    alert('Request submitted');
  };
  return (
    <form onSubmit={submit}>
      <h2>Create Emergency Request</h2>
      <input placeholder="Patient name" value={data.patientName} onChange={e => setData({...data, patientName: e.target.value})} />
      <input placeholder="Amount" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} />
      <button type="submit">Submit</button>
    </form>
  )
}
