import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

const API_URL = 'https://vape-inventory-app.onrender.com/api'; // Render backend

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (logout on invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token and redirect to login
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Inventory APIs
export const inventoryAPI = {
  getAllBottles: () => api.get('/inventory'),
  getBottleById: (id) => api.get(`/inventory/${id}`),
  createBottle: (bottleData) => api.post('/inventory', bottleData),
  updateBottle: (id, bottleData) => api.put(`/inventory/${id}`, bottleData),
  deleteBottle: (id) => api.delete(`/inventory/${id}`),
  searchBottles: (query) => api.get(`/inventory/search?q=${query}`),
  getExpiringBottles: () => api.get('/inventory/expiring'),
};

export default api;
