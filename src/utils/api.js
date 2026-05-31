const API_URL = 'https://mypinkshop-dr93.vercel.app';

const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

const handleResponse = async (response, navigate) => {
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('adminRole');
    if (navigate) {
      navigate('/admin/login');
    } else {
      window.location.href = '/admin/login';
    }
    throw new Error('Session expired. Please login again.');
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }
  return data;
};

export const apiRequest = async (endpoint, options = {}, navigate = null) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return handleResponse(response, navigate);
};

export const api = {
  get: (endpoint, navigate) => apiRequest(endpoint, { method: 'GET' }, navigate),
  post: (endpoint, data, navigate) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }, navigate),
  put: (endpoint, data, navigate) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }, navigate),
  delete: (endpoint, navigate) => apiRequest(endpoint, { method: 'DELETE' }, navigate),
};
