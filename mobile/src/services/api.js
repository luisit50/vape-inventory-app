import axios from 'axios';

const API_URL = 'https://vape-inventory-app.onrender.com/api'; // Render backend

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to add token to headers
const withAuth = (token) => token ? { headers: { Authorization: `Bearer ${token}` } } : {};

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: (token) => api.get('/auth/profile', withAuth(token)),
};

// Inventory APIs
export const inventoryAPI = {
  getAllBottles: (token) => api.get('/inventory', withAuth(token)),
  getBottleById: (id, token) => api.get(`/inventory/${id}`, withAuth(token)),
  createBottle: (bottleData, token) => api.post('/inventory', bottleData, withAuth(token)),
  updateBottle: (id, bottleData, token) => api.put(`/inventory/${id}`, bottleData, withAuth(token)),
  deleteBottle: (id, token) => api.delete(`/inventory/${id}`, withAuth(token)),
  searchBottles: (query, token) => api.get(`/inventory/search?q=${query}`, withAuth(token)),
  getExpiringBottles: (token) => api.get('/inventory/expiring', withAuth(token)),
};

export default api;
