import axios from 'axios';
import { BACKEND_URL } from '../config';

const ensureHttps = (url) => {
  if (!url) return url;
  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    console.warn(`⚠️ Converting HTTP to HTTPS: ${url} -> ${httpsUrl}`);
    return httpsUrl;
  }
  return url;
};

// ✅ QUAN TRỌNG: DÙNG secureBackendUrl cho tất cả instances
const secureBackendUrl = ensureHttps(BACKEND_URL);
console.log('🔐 API Base URL:', secureBackendUrl);

// Tạo các instance với URL đã được secure
export const userApi = axios.create({
  baseURL: secureBackendUrl,  // ← SỬA: DÙNG secureBackendUrl
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export const shopApi = axios.create({
  baseURL: secureBackendUrl,  // ← SỬA
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export const adminApi = axios.create({
  baseURL: secureBackendUrl,  // ← SỬA
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptor để đảm bảo URL luôn là HTTPS
userApi.interceptors.request.use(
  (config) => {
    // Kiểm tra và sửa URL nếu cần
    if (config.baseURL?.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    if (config.url?.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }
    
    const token = localStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📡 Request URL:', config.baseURL + config.url);
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