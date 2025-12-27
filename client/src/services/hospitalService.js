import api from './api';

async function createRequest(data){
  // placeholder: POST to /hospital/requests
  return api.request('/hospital/requests', { method: 'POST', body: JSON.stringify(data) });
}

const hospital = { createRequest };
export default hospital; 
