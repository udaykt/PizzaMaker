import axios from 'axios';
import store from '@/store';
import { authActions } from '@/store/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 for expired sessions only.
// Auth endpoints manage their own 401s (bad credentials); let the form's catch handle them.
// Skip redirect when there is no token — the call was already unauthenticated.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const hasToken = !!localStorage.getItem('token');
    if (err.response?.status === 401 && !url.includes('/api/v1/auth/') && hasToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      store.dispatch(authActions.reset());
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
