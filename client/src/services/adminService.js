import api from './api';

// Authentication
async function login(email, password, googleToken) {
  return api.request('/admin/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password, googleToken }) 
  });
}

async function register(payload) {
  return api.request('/admin/register', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

// Applications
async function getAllRequests() {
  return api.request('/admin/getAllRequests');
}

async function getApprovedRequests() {
  return api.request('/admin/getApprovedRequests');
}

async function getAllApplications(adminId) {
  return api.request(`/admin/getAllApplications/${adminId}`);
}

async function getApplicationsByAdminId(adminId, { page = 1, limit = 25, status, scholarshipId } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  if (scholarshipId) params.append('scholarshipId', scholarshipId);
  return api.request(`/admin/applications/by-admin/${adminId}?${params}`);
}

async function getApplicationDetails(applicationId) {
  return api.request(`/admin/applications/${applicationId}`);
}

async function getApplicationByAdminAndId(adminId, applicationId) {
  return api.request(`/admin/applications/by-admin/${adminId}/${applicationId}`);
}

async function viewAllApplications({ scholarshipId, status, page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (scholarshipId) params.append('scholarshipId', scholarshipId);
  if (status) params.append('status', status);
  return api.request(`/admin/applications?${params}`);
}

// Application Actions
async function approveRequest(id) {
  return api.request(`/admin/requests/${id}/approve`, { method: 'PATCH' });
}

async function rejectRequest(id, remarks) {
  return api.request(`/admin/requests/${id}/reject`, { 
    method: 'PATCH',
    body: JSON.stringify({ remarks }) 
  });
}

async function updateApplicationDocument(applicationId, documentId, status) {
  return api.request(`/admin/applications/${applicationId}/documents/${documentId}`, { 
    method: 'PATCH',
    body: JSON.stringify({ status }) 
  });
}

async function disburseRequest(id) {
  return api.request(`/admin/requests/${id}/disburse`, { method: 'POST' });
}

// Funding/Scholarship
async function createScholarship(payload) {
  return api.request('/admin/createscholarship', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

async function createFund(payload) {
  return api.request('/admin/funds', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

// Payments & Transactions
async function makePayout(applicationId) {
  return api.request(`/admin/applications/${applicationId}/makepayout`, { method: 'PATCH' });
}

async function createOrder(applicationId) {
  return api.request(`/admin/applications/${applicationId}/create-order`, { method: 'POST' });
}

async function verifyPayment(applicationId, paymentData) {
  return api.request(`/admin/applications/${applicationId}/verify-payment`, { 
    method: 'POST',
    body: JSON.stringify(paymentData) 
  });
}

async function createBeneficiary(applicationId, beneficiaryData) {
  return api.request(`/admin/applications/${applicationId}/create-beneficiary`, { 
    method: 'POST',
    body: JSON.stringify(beneficiaryData) 
  });
}

async function resendReceipt(applicationId) {
  return api.request(`/admin/applications/${applicationId}/send-receipts`, { method: 'POST' });
}

// Transactions
async function searchTransactions({ q, adminId, applicationId, status, page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (q) params.append('q', q);
  if (adminId) params.append('adminId', adminId);
  if (applicationId) params.append('applicationId', applicationId);
  if (status) params.append('status', status);
  return api.request(`/admin/transactions/search?${params}`);
}

async function getTransactionsByAdminId(adminId, { q, page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (q) params.append('q', q);
  return api.request(`/admin/transactions/admin/${adminId}?${params}`);
}

// Hospital Verification
async function getPendingHospitalVerifications() {
  return api.request('/admin/hospital-verifications/pending');
}

async function updateHospitalVerification(hospitalId, data) {
  return api.request(`/admin/hospital-verifications/${hospitalId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

async function getHospitalVerificationDetails(hospitalId) {
  return api.request(`/admin/hospital-verifications/${hospitalId}`);
}

export default {
  login,
  register,
  getAllRequests,
  getApprovedRequests,
  getAllApplications,
  getApplicationsByAdminId,
  getApplicationDetails,
  getApplicationByAdminAndId,
  viewAllApplications,
  approveRequest,
  rejectRequest,
  updateApplicationDocument,
  disburseRequest,
  createScholarship,
  createFund,
  makePayout,
  createOrder,
  verifyPayment,
  createBeneficiary,
  resendReceipt,
  searchTransactions,
  getTransactionsByAdminId,
  getPendingHospitalVerifications,
  updateHospitalVerification,
  getHospitalVerificationDetails,
};
