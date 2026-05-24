import axios from 'axios';
import store from '../store';
import { userActions } from '../store/userSlice';

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

// Auto-logout on 401 — clears both localStorage and Redux state
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      store.dispatch(userActions.reset());
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
