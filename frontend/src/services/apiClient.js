import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// Relative URL in development (Vite proxy forwards /api → :5000), absolute in production
const API_BASE_URL = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const AUTH_EXPIRED_EVENT = 'reliefsync:auth-expired';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const isAuthEndpoint = (url = '') => url.includes('/auth/login') || url.includes('/auth/register');

// Normalise every failure into { message, code, status }
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (!response) {
      return Promise.reject({
        message: 'Cannot reach the ReliefSync server. Make sure the backend is running on port 5000.',
        code: 'NETWORK_ERROR',
      });
    }

    const { status, data } = response;
    const serverMessage = data?.message;

    // The backend answers 401 for a missing token and 403 for an invalid/expired one
    const tokenRejected =
      !isAuthEndpoint(config?.url) &&
      (status === 401 || (status === 403 && /invalid or expired token/i.test(serverMessage || '')));

    if (tokenRejected) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      return Promise.reject({ message: 'Your session has expired. Please sign in again.', code: 'UNAUTHORIZED', status });
    }

    const fallback = {
      400: 'Please check the information you entered.',
      401: 'Invalid email or password.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This record conflicts with an existing one.',
      500: 'The server ran into a problem. Please try again.',
    };

    return Promise.reject({
      message: serverMessage || fallback[status] || 'An unexpected error occurred.',
      code: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR',
      status,
    });
  }
);

export default apiClient;
