import api from './api';

// Authentication
async function login(email, password, googleToken, hospitalName) {
  return api.request('/hospital/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password, googleToken, hospitalName }) 
  });
}

async function register(payload) {
  return api.request('/hospital/register', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

// Funding Programs
async function listGrantingPayments() {
  return api.request('/hospital/emergency-credit-options');
}

// Requests
async function createEmergencyRequest(data) {
  return api.request('/hospital/emergency-credit-request', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
}

async function getRequestById(requestId) {
  return api.request(`/hospital/credit-request/${requestId}`);
}

async function getRequestStatus({ applicationId, verifierId, page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams();
  if (applicationId) params.append('applicationId', applicationId);
  if (verifierId) params.append('verifierId', verifierId);
  params.append('page', page);
  params.append('limit', limit);
  return api.request(`/hospital/credit-requests?${params}`);
}

// Document Upload
async function uploadPatientDocuments(requestId, formData) {
  // Use FormData for file uploads
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const BASE_URL = api.BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3500';
  const response = await fetch(`${BASE_URL}/hospital/upload-patient-docs/${requestId}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(errorData.message || errorText || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

async function uploadMedicalDocs(requestId, formData) {
  // Use FormData for file uploads
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const BASE_URL = api.BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3500';
  const response = await fetch(`${BASE_URL}/hospital/upload-medical-docs/${requestId}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(errorData.message || errorText || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

// Hospital Verification
async function getVerificationStatus() {
  // Get user email from auth service - you might need to adapt this
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email || 'test@hospital.com';
  return api.request(`/hospital/verification-status?email=${encodeURIComponent(email)}`);
}

async function submitVerification(formData) {
  // Get user email from auth service
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email || 'test@hospital.com';
  
  // Add email to form data
  formData.append('email', email);
  
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const BASE_URL = api.BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3500';
  const response = await fetch(`${BASE_URL}/hospital/submit-verification`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(errorData.message || errorText || `Verification submission failed with status ${response.status}`);
  }

  return response.json();
}

async function getVerifiedHospitals(q = '', { limit } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit) params.append('limit', limit);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return api.request(`/hospital/verified-list${suffix}`);
}

// Hospital Dashboard
async function getFundingRequests({ page = 1, limit = 25, status } = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email || 'test@hospital.com';
  const params = new URLSearchParams({ email, page, limit });
  if (status) params.append('status', status);
  return api.request(`/hospital/funding-requests?${params}`);
}

async function getTransactions({ page = 1, limit = 25, status } = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email || 'test@hospital.com';
  const params = new URLSearchParams({ email, page, limit });
  if (status) params.append('status', status);
  return api.request(`/hospital/transactions?${params}`);
}

async function getFundingSummary() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email || 'test@hospital.com';
  return api.request(`/hospital/funding-summary?email=${encodeURIComponent(email)}`);
}

export default {
  login,
  register,
  listGrantingPayments,
  createEmergencyRequest,
  getRequestById,
  getRequestStatus,
  uploadPatientDocuments,
  uploadMedicalDocs,
  getVerificationStatus,
  submitVerification,
  getVerifiedHospitals,
  getFundingRequests,
  getTransactions,
  getFundingSummary,
};
