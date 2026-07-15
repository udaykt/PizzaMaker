import axios from 'axios';
import store from '@/store';
import { authActions } from '@/store/authSlice';
import { API_BASE } from '@/config/apiBase';
import { beginRequest } from '@/api/warmup';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT to every request, and arm the cold-start warm-up detector. The
// returned settle fn is stashed on the config and called from both response
// branches below, so a slow login/order surfaces the "firing up the oven"
// overlay instead of a silent 40s spinner.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.__endWarmup = beginRequest();
  return config;
});

// Auto-logout on 401 for expired sessions only.
// Auth endpoints manage their own 401s (bad credentials); let the form's catch handle them.
// Skip redirect when there is no token — the call was already unauthenticated.
api.interceptors.response.use(
  (res) => {
    res.config?.__endWarmup?.();
    return res;
  },
  (err) => {
    err.config?.__endWarmup?.();
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
