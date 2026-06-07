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
adminApi.interceptors.request.use((config) => {
  // Ưu tiên admin_token trước, nếu không có thì lấy user_token
  let token = localStorage.getItem('admin_token');
  if (!token) {
    token = localStorage.getItem('user_token');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sửa userApi interceptor - cũng có thể đọc từ admin_token (nếu cần)
userApi.interceptors.request.use((config) => {
  let token = localStorage.getItem('user_token');
  if (!token) {
    token = localStorage.getItem('admin_token');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// shopApi tương tự nếu cần
shopApi.interceptors.request.use((config) => {
  let token = localStorage.getItem('shop_token');
  if (!token) {
    token = localStorage.getItem('user_token');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default userApi;