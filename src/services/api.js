// src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Helper function for API calls
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  },

  async getProduct(id) {
    return this.request(`/products/${id}`);
  },

  async getProductsByCategory(category) {
    return this.request(`/products/category/${category}`);
  },

  async getCategories() {
    return this.request('/products/categories/list');
  },

  async calculatePrice(productId, customizations) {
    return this.request(`/products/${productId}/calculate-price`, {
      method: 'POST',
      body: JSON.stringify(customizations)
    });
  },

  // Orders
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async getOrder(identifier) {
    return this.request(`/orders/${identifier}`);
  },

  async getCustomerOrders(email) {
    return this.request(`/orders/customer/${email}`);
  },

  // Payments
  async initializePayment(paymentData) {
    return this.request('/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },

  async verifyPayment(reference) {
    return this.request(`/payment/verify/${reference}`);
  },

  async getPaymentConfig() {
    return this.request('/payment/config');
  }
};

export default api;