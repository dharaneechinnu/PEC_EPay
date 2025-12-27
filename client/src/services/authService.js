// Very small auth service (placeholder)
let _user = null;

async function login({ email, password }){
  // call API in real app
  _user = { email, role: 'patient' };
  return _user;
}

function logout(){ _user = null; }
function getUser(){ return _user; }

const auth = { login, logout, getUser };
export default auth; 
