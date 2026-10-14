import axios from 'axios';
import toast from 'react-hot-toast';

// Backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;

    // Handle 401 (Unauthorized) - token expired
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    }
    // Handle 403 (Forbidden)
    else if (error.response?.status === 403) {
      toast.error(message || 'You do not have permission');
    }
    // Handle 404
    else if (error.response?.status === 404) {
      toast.error(message || 'Not found');
    }
    // Handle 500
    else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  team: () => api.get('/auth/team'),
  inviteManager: (data) => api.post('/auth/invite-manager', data),
  inviteTenant: (data) => api.post('/auth/invite-tenant', data),
  acceptInvite: (data) => api.post('/auth/accept-invite', data),
};

// ============================================
// DASHBOARD API
// ============================================
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ============================================
// INFRASTRUCTURES API
// ============================================
export const infrastructureAPI = {
  list: (params) => api.get('/infrastructures', { params }),
  get: (id) => api.get(`/infrastructures/${id}`),
  create: (data) => api.post('/infrastructures', data),
  update: (id, data) => api.put(`/infrastructures/${id}`, data),
  delete: (id) => api.delete(`/infrastructures/${id}`),
};

// ============================================
// UNITS API
// ============================================
export const unitAPI = {
  list: (params) => api.get('/units', { params }),
  get: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  updateStatus: (id, status) => api.patch(`/units/${id}/status`, { status }),
  delete: (id) => api.delete(`/units/${id}`),
  available: (params) => api.get('/units/available', { params }),
};

// ============================================
// TENANTS API
// ============================================
export const tenantAPI = {
  list: (params) => api.get('/tenants', { params }),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
};

// ============================================
// LEDGERS API
// ============================================
export const ledgerAPI = {
  list: (params) => api.get('/ledgers', { params }),
  get: (id) => api.get(`/ledgers/${id}`),
  generate: (data) => api.post('/ledgers/generate', data),
  balance: (tenantId) => api.get(`/ledgers/balance/${tenantId}`),
  update: (id, data) => api.put(`/ledgers/${id}`, data),
};

// ============================================
// PAYMENTS API
// ============================================
export const paymentAPI = {
  list: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  byTenant: (tenantId) => api.get(`/payments/tenant/${tenantId}`),
  updateStatus: (id, status) => api.patch(`/payments/${id}/status`, { status }),
  uploadProof: (id, formData) => api.post(`/payments/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadReceipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ============================================
// EXPENSES API
// ============================================
export const expenseAPI = {
  list: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  approve: (id) => api.patch(`/expenses/${id}/approve`),
  reject: (id, reason) => api.patch(`/expenses/${id}/reject`, { reason }),
  delete: (id) => api.delete(`/expenses/${id}`),
  summary: (params) => api.get('/expenses/summary', { params }),
  pending: () => api.get('/expenses/pending'),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationAPI = {
  sendRentReminder: (data) => api.post('/notifications/rent-reminder', data),
  sendPaymentReceipt: (data) => api.post('/notifications/payment-receipt', data),
  sendWelcome: (data) => api.post('/notifications/welcome', data),
  sendOverdue: (data) => api.post('/notifications/overdue', data),
  sendCustom: (data) => api.post('/notifications/custom', data),
};

export default api;