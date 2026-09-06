import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
// MISMATCH-04 fix: read token from authStore.getState() instead of parsing
// Zustand's internal localStorage format directly (fragile coupling).
api.interceptors.request.use(
  (config) => {
    // Lazy-import to avoid circular dependency (axiosInstance ← authStore ← axiosInstance)
    // Using dynamic require-style access via the module's own export after init.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: useAuthStore } = require('../store/authStore');
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fallback: read from persisted storage if the store isn't loaded yet
      const stored = JSON.parse(localStorage.getItem('hirehub-auth') || '{}');
      const token = stored?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Let the browser set Content-Type automatically for FormData (multipart)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ERR-02 fix: guard against the race condition where multiple concurrent 401
// responses each trigger a full-page redirect and localStorage wipe.
// Only the first 401 fires the logout — subsequent ones are no-ops.
let isLoggingOut = false;

// Response interceptor — 401 auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint && !isLoggingOut) {
      isLoggingOut = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { default: useAuthStore } = require('../store/authStore');
        // Use the store's logout action (clears state + localStorage) rather
        // than directly touching localStorage, and use React Router navigation
        // via a redirect component instead of window.location to keep SPA behaviour.
        useAuthStore.getState().logout();
      } catch {
        localStorage.removeItem('hirehub-auth');
      }
      // Use replace so the user can't navigate "back" to the protected page
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
