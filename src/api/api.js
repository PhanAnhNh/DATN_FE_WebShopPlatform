// src/api/api.js
import axios from 'axios';
import {BACKEND_URL} from '../config' 

const ensureHttps = (url) => {
  if (url && url.startsWith('http://')) {
    console.warn(`⚠️ Converting HTTP to HTTPS: ${url}`);
    return url.replace('http://', 'https://');
  }
  return url;
};

const secureBackendUrl = ensureHttps(BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tạo các instance riêng biệt
export const userApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const shopApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho userApi
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho shopApi
shopApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho adminApi
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor cho userApi
userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Response interceptor cho shopApi
shopApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('shop_token');
      localStorage.removeItem('shop_data');
      localStorage.removeItem('shop_info');
      window.location.href = '/shop/login';
    }
    return Promise.reject(error);
  }
);

// Response interceptor cho adminApi
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Export mặc định là userApi để không break code cũ
export default userApi;