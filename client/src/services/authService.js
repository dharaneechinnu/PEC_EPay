import api from './api';

// Prefer environment-configured API URL. Falls back to api.BASE_URL (api.js)
const API_BASE = process.env.REACT_APP_API_URL || api.BASE_URL || 'http://localhost:5000';
let _user = null;
let _token = null;

async function login(role, { email, password, googleToken, hospitalName }){
  try {
    const endpoint = `${API_BASE}/auth/${role}/login`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, googleToken, hospitalName }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Login failed (${res.status})`);
    }
    const data = await res.json();

    if (data.success && data.user) {
      _user = data.user;
      _token = data.token;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    throw new Error('Invalid response from auth server');
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

function logout(){
  _user = null;
  _token = null;
  // remove app session
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // if Google credential stored, try to revoke it
  const googleCred = localStorage.getItem('google_credential');
  if (googleCred) {
    try {
      // revoke token at Google's endpoint
      fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(googleCred), {
        method: 'POST',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      }).catch(err => console.warn('Google revoke failed', err));
    } catch (e) {
      console.warn('Error revoking google token', e);
    }
    localStorage.removeItem('google_credential');
  }

  // disable auto sign-in on Google One Tap if available
  try {
    if (window.google && window.google.accounts && window.google.accounts.id && typeof window.google.accounts.id.disableAutoSelect === 'function') {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch (e) {
    console.warn('Error disabling google auto select', e);
  }
}

function getUser(){
  if (_user) return _user;
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      _user = JSON.parse(stored);
      _token = localStorage.getItem('token');
      return _user;
    }
  } catch (e) {
    console.warn('Could not parse stored user', e);
  }
  return null;
}

function getToken(){
  if (_token) return _token;
  return localStorage.getItem('token');
}

const auth = { login, logout, getUser, getToken };
export default auth;
