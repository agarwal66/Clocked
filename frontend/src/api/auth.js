import axios from 'axios';

// API base URL - connects to your backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5004/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clocked_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions
export const authAPI = {
  // Login user
  login: async (identifier, password) => {
    console.log('authAPI: Making login call to /auth/login');
    console.log('authAPI: With data:', { identifier, password });
    const response = await api.post('/auth/login', {
      identifier,
      password,
    });
    
    console.log('authAPI: Raw response:', response);
    console.log('authAPI: Response data:', response.data);
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  // Remove from watchlist
  removeFromWatchlist: async (id) => {
    const response = await api.delete(`/watches/handle/${id}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.post('/dashboard/profile', profileData);
    return response.data;
  },

  // Update unsent letter
  updateUnsentLetter: async (text) => {
    const response = await api.put('/dashboard/unsent-letter', { text });
    return response.data;
  },

  // Send verification email
  sendVerificationEmail: async () => {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  },
};

export default api;
