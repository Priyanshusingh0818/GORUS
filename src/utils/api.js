// ✅ Use same-origin requests (works on both gorus.in and gorus.onrender.com)
// Empty string means "same origin" - requests go to the same domain the app is loaded from
const API_BASE_URL = process.env.REACT_APP_API_URL || "";

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
      credentials: 'same-origin', // ✅ Include credentials for same-origin requests
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
  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password) =>
    apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  updateProfile: (name, email) =>
    apiCall('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiCall('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Products API
export const productsAPI = {
  getAll: () => apiCall('/api/products'),
  getById: (id) => apiCall(`/api/products/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (orderData) =>
    apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getMyOrders: () => apiCall('/api/orders/my-orders'),
  getById: (id) => apiCall(`/api/orders/${id}`),
  cancel: (id) =>
    apiCall(`/api/orders/${id}/cancel`, {
      method: 'PUT',
    }),
};

// Admin API
export const adminAPI = {
  getAllOrders: () => apiCall('/api/admin/orders'),
  updateOrderStatus: (orderId, status) =>
    apiCall(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  getAllProducts: () => apiCall('/api/admin/products'),
  createProduct: (productData) =>
    apiCall('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  updateProduct: (id, productData) =>
    apiCall(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  deleteProduct: (id) =>
    apiCall(`/api/admin/products/${id}`, {
      method: 'DELETE',
    }),
  getAllUsers: () => apiCall('/api/admin/users'),
  getDashboardStats: () => apiCall('/api/admin/analytics/dashboard'),
};

// Payments API
export const paymentsAPI = {
  createOrder: (amount, orderId, orderNumber, customer, currency = 'INR') =>
    apiCall('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, orderId, orderNumber, customer, currency }),
    }),

  verifyPayment: (orderId, paymentReference) =>
    apiCall('/api/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentReference }),
    }),
};