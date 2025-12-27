const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';

async function request(path, options = {}){
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const api = { request, BASE_URL };
export default api; 
