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

export default {
  login,
  register,
  listGrantingPayments,
  createEmergencyRequest,
  getRequestById,
  getRequestStatus,
  uploadPatientDocuments,
  uploadMedicalDocs,
};
