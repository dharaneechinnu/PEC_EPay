import api from './api';

async function getPendingRequests(){
  return api.request('/admin/getAllRequests');
}

async function getApprovedRequests(){
  return api.request('/admin/getApprovedRequests');
}

async function approveRequest(id){
  return api.request(`/admin/requests/${id}/approve`, { method: 'PATCH' });
}

async function disburseRequest(id){
  return api.request(`/admin/requests/${id}/disburse`, { method: 'POST' });
}

async function createFund(payload){
  return api.request('/admin/funds', { method: 'POST', body: JSON.stringify(payload) });
}

export default { getPendingRequests, getApprovedRequests, approveRequest, disburseRequest, createFund };
