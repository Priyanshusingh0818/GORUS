// Use environment variable or default to production URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://gorus.onrender.com";

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('gorasToken');
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      
      // Handle authentication errors - but NOT for login/signup endpoints
      // Login/signup 401 means invalid credentials, not expired session
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
        // Clear invalid token only for authenticated endpoints
        localStorage.removeItem('gorasToken');
        localStorage.removeItem('gorasUser');
        // Throw error that can be caught and handled
        throw new Error('SESSION_EXPIRED');
      }
      
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  } catch (error) {
    // If it's a network error, provide a more helpful message
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      console.error('Network error - is the backend server running?', error);
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (email, password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  signup: (name, email, password) => apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }),
  updateProfile: (name, email) => apiCall('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, email }),
  }),
  changePassword: (currentPassword, newPassword) => apiCall('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  }),
};

// Products API
export const productsAPI = {
  getAll: () => apiCall('/products'),
  getById: (id) => apiCall(`/products/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
  getMyOrders: () => apiCall('/orders/my-orders'),
  getById: (id) => apiCall(`/orders/${id}`),
  cancel: (id) => apiCall(`/orders/${id}/cancel`, {
    method: 'PUT',
  }),
};

// Admin API
export const adminAPI = {
  getAllOrders: () => apiCall('/admin/orders'),
  updateOrderStatus: (orderId, status) => apiCall(`/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  getAllProducts: () => apiCall('/admin/products'),
  createProduct: (productData) => apiCall('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),
  updateProduct: (id, productData) => apiCall(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  }),
  deleteProduct: (id) => apiCall(`/admin/products/${id}`, {
    method: 'DELETE',
  }),
  getAllUsers: () => apiCall('/admin/users'),
  getDashboardStats: () => apiCall('/admin/analytics/dashboard'),
};

// Payments API
export const paymentsAPI = {
  createOrder: (amount, orderId, orderNumber, customer, currency = 'INR') => apiCall('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount, orderId, orderNumber, customer, currency }),
  }),
  verifyPayment: (orderId, paymentReference) => apiCall('/payments/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId, paymentReference }),
  }),
};
