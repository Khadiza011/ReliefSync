import apiClient from './apiClient';
import { STORAGE_KEYS } from '../utils/constants';

export const authService = {
  /** POST /auth/login → { token, user } */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { token, user };
  },

  /** POST /auth/register — only VOLUNTEER and DONOR self-registration is allowed */
  async register({ full_name, email, password, phone, role }) {
    const response = await apiClient.post('/auth/register', { full_name, email, password, phone, role });
    return response.data;
  },

  /** GET /auth/profile → current signed-in user's database profile */
  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data.user;
  },

  /** PUT /auth/profile → update current user's name/email/phone */
  async updateProfile({ full_name, email, phone }) {
    const response = await apiClient.put('/auth/profile', { full_name, email, phone });
    return response.data;
  },

  /** PUT /auth/password → verify current password and set a new one */
  async changePassword({ current_password, new_password }) {
    const response = await apiClient.put('/auth/password', { current_password, new_password });
    return response.data;
  },

  /** POST /auth/delete-account → donor deletes immediately; other roles request admin approval */
  async deleteAccount({ current_password, reason }) {
    const response = await apiClient.post('/auth/delete-account', { current_password, reason });
    return response.data;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
};

export default authService;
