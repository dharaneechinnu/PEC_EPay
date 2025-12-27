const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';

async function request(path, options = {}){
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    credentials: 'include',
    ...options,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(errorData.message || errorText || `Request failed with status ${res.status}`);
  }
  
  return res.json();
}

const api = { request, BASE_URL };
export default api; 
