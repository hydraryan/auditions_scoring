import axios from 'axios';

const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4001';
const api = axios.create({
  baseURL: apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`,
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
