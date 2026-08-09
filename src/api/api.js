import axios from 'axios';

const BASE = 'https://talharehman125-derma-vision-backend.hf.space';

const api = axios.create({ baseURL: BASE });

// Attach JWT token to every request automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('dv_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('dv_token');
    localStorage.removeItem('dv_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// ── Auth ─────────────────────────────────────────────────────────────────────
// POST /api/auth/register  { username, email, password }
export const authAPI = {
  register: d => api.post('/api/auth/register', d),
  verifyOtp: d => api.post('/api/auth/verify-otp', d),       // { email, otp }
  login: d => api.post('/api/auth/login', d),                // { email, password }
  forgotPassword: d => api.post('/api/auth/forgot-password', d), // { email }
  resetPassword: d => api.post('/api/auth/reset-password', d),   // { email, otp, new_password }
};

// ── Predict / Scans ───────────────────────────────────────────────────────────
// POST /api/predict  multipart/form-data  field name: "image"
// GET  /api/scans?page=1&limit=10
// DELETE /api/scans/{scan_id}
export const scanAPI = {
  predict: formData => api.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  history: (page = 1, limit = 10) =>
    api.get('/api/scans', { params: { page, limit } }),
  deleteScan: id => api.delete(`/api/scans/${id}`),
};

// ── Chat ─────────────────────────────────────────────────────────────────────
// POST /api/chat  { message, diagnosis? }
export const chatAPI = {
  send: (message, diagnosis = '') =>
    api.post('/api/chat', { message, diagnosis }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// GET /api/admin/users
// GET /api/admin/scans
// DELETE /api/admin/scans/{scan_id}
// DELETE /api/admin/users/{target_user_id}
export const adminAPI = {
  stats: () => api.get('/api/admin/stats'),
  users: () => api.get('/api/admin/users'),
  allScans: (page = 1, limit = 20) =>
    api.get('/api/admin/scans', { params: { page, limit } }),
  deleteScan: id => api.delete(`/api/admin/scans/${id}`),
  deleteUser: id => api.delete(`/api/admin/users/${id}`),
};

export default api;
