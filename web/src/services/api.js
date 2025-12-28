import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
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

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Inventory APIs
export const inventoryAPI = {
  getAllBottles: () => api.get('/inventory'),
  getBottleById: (id) => api.get(`/inventory/${id}`),
  createBottle: (bottleData) => api.post('/inventory', bottleData),
  updateBottle: (id, bottleData) => api.put(`/inventory/${id}`, bottleData),
  deleteBottle: (id) => api.delete(`/inventory/${id}`),
  searchBottles: (query) => api.get(`/inventory/search?q=${query}`),
};

export default api;
