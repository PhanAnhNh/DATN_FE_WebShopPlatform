// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// CHỈ GIỮ LẠI MỘT INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // Log để debug
    console.log('Request URL:', config.url);
    
    // Kiểm tra URL để quyết định dùng token nào
    const isAdminRequest = config.url?.includes('/admin/');
    const isShopRequest = config.url?.includes('/shop/');
    
    if (isAdminRequest) {
      const adminToken = localStorage.getItem('admin_token');
      console.log('Is admin request, token exists:', !!adminToken);
      
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else {
        // Thử dùng user_token nếu không có admin_token
        const userToken = localStorage.getItem('user_token');
        if (userToken) {
          config.headers.Authorization = `Bearer ${userToken}`;
          console.log('Using user token for admin request');
        }
      }
    } else if (isShopRequest) {
      // Request cho shop dashboard
      const shopToken = localStorage.getItem('shop_token');
      console.log('Is shop request, token exists:', !!shopToken);
      
      if (shopToken) {
        config.headers.Authorization = `Bearer ${shopToken}`;
      } else {
        // Fallback sang user_token nếu không có shop_token
        const userToken = localStorage.getItem('user_token');
        if (userToken) {
          config.headers.Authorization = `Bearer ${userToken}`;
          console.log('Using user token for shop request');
        }
      }
    } else {
      // Request cho user thông thường
      const userToken = localStorage.getItem('user_token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      const isAdminRequest = error.config?.url?.includes('/admin/');
      const isShopRequest = error.config?.url?.includes('/shop/');
      
      if (isAdminRequest) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
        window.location.href = '/admin/login';
      } else if (isShopRequest) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
      } else {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;