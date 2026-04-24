// frontend/src/api/api.js
import axios from 'axios';
import { BACKEND_URL } from '../config';

const ensureHttps = (url) => {
  if (!url) return url;
  // Chuyển đổi http -> https
  let secureUrl = url.replace(/^http:\/\//i, 'https://');
  // Loại bỏ trailing slash
  secureUrl = secureUrl.replace(/\/$/, '');
  return secureUrl;
};

// ✅ QUAN TRỌNG: DÙNG secureBackendUrl cho tất cả instances
const secureBackendUrl = ensureHttps(BACKEND_URL);
console.log('🔐 API Base URL:', secureBackendUrl);

// Hàm tạo instance với HTTPS guarantee
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });
  
  // Interceptor mạnh hơn để đảm bảo HTTPS
  instance.interceptors.request.use(
    (config) => {
      // Force HTTPS cho baseURL
      if (config.baseURL && config.baseURL.includes('http://')) {
        config.baseURL = config.baseURL.replace(/http:\/\//g, 'https://');
      }
      
      // Force HTTPS cho URL nếu là absolute URL
      if (config.url && config.url.includes('http://')) {
        config.url = config.url.replace(/http:\/\//g, 'https://');
      }
      
      // Ghi log đầy đủ URL để debug
      const fullUrl = (config.baseURL || '') + (config.url || '');
      console.log('📡 [Request]', fullUrl);
      
      // Cảnh báo nếu vẫn còn HTTP
      if (fullUrl.includes('http://')) {
        console.error('❌ DETECTED HTTP URL!', fullUrl);
        // Tự động sửa
        if (config.url) config.url = config.url.replace(/http:\/\//g, 'https://');
        if (config.baseURL) config.baseURL = config.baseURL.replace(/http:\/\//g, 'https://');
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return instance;
};

// Tạo các instance với URL đã được secure
export const userApi = createApiInstance(secureBackendUrl);
export const shopApi = createApiInstance(secureBackendUrl);
export const adminApi = createApiInstance(secureBackendUrl);

// Thêm token riêng cho từng instance
userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

shopApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('shop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptors
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

// Export mặc định
export default userApi;