import api from './api';

// Authentication
async function login(email, password, googleToken) {
  return api.request('/Patient/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password, googleToken }) 
  });
}

async function register(payload) {
  return api.request('/Patient/register', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

// Scholarships
async function getScholarships() {
  return api.request('/Patient/scholarships');
}

// Requests
async function createFundingRequest(data) {
  return api.request('/Patient/create-funding-request', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
}

async function uploadDocuments(requestId, formData) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const BASE_URL = api.BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3500';
  const response = await fetch(`${BASE_URL}/Patient/upload-documents/${requestId}`, {
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

async function getMyRequests(studentemail) {
  return api.request(`/Patient/my-requests?studentemail=${encodeURIComponent(studentemail)}`);
}

async function getApplicationStatus(applicationNo) {
  return api.request(`/Patient/applicationstatus/${applicationNo}`);
}

export default {
  login,
  register,
  getScholarships,
  createFundingRequest,
  uploadDocuments,
  getMyRequests,
  getApplicationStatus,
};
