import api from './api';

async function getRequests(){
  return api.request('/patient/requests');
}

export default { getRequests };
