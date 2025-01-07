import axios from 'axios';

// Define the base URL for your API
const API_BASE_URL = 'http://localhost:5000/api'; // Replace with your actual backend API URL

// Create an Axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Timeout after 5 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the authorization token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken'); // Assuming you store the token as 'userToken'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response.data, // Return the response data directly for successful requests
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle 401 Unauthorized errors (e.g., token expired)
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      // Redirect to login page using window.location.href
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message); // Return the error data or message
  }
);

// Define API endpoints using the Axios instance
const ordersApi = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/users/orders'),
  getRestaurantOrders: (restaurantId) => api.get(`/restaurant/${restaurantId}/orders`),
};

const restaurantApi = {
  getPanel: () => api.get('/restaurant/panel'),
  updateOrderStatus: (orderId, status) => api.patch(`/restaurant/orders/${orderId}`, { status }),
  getMenu: () => api.get('/restaurant/menu'),
  getMenuItems: (restaurantId) => api.get(`/restaurants/${restaurantId}/menu`),
  addMenuItem: (menuItem) => api.post('/restaurant/menu', menuItem),
  updateMenuItem: (itemId, data) => api.patch(`/restaurant/menu/${itemId}`, data),
  deleteMenuItem: (itemId) => api.delete(`/restaurant/menu/${itemId}`),
};

const usersApi = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
};

const restaurantsApi = {
  getAllRestaurants: () => api.get('/restaurants'),
  getRestaurantById: (restaurantId) => api.get(`/restaurants/${restaurantId}`),
  searchRestaurants: (query) => api.get(`/restaurants/search?q=${query}`),
  searchMenu: (restaurantId, query) => api.get(`/restaurants/${restaurantId}/menu/search?q=${query}`),
};

const adminApi = {
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  assignRole: (userId, roleData) => api.post(`/admin/assign-role/${userId}`, roleData),
};

// Export the API endpoint objects
export { ordersApi, restaurantApi, usersApi, restaurantsApi, adminApi };

export default api;