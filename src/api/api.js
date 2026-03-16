import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token vào request
api.interceptors.request.use(
  (config) => {
    // Kiểm tra URL để quyết định dùng token nào
    const isAdminRequest = config.url?.startsWith('/admin/');
    
    if (isAdminRequest) {
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
        console.log('Gửi request admin với token:', adminToken.substring(0, 20) + '...');
      } else {
        console.log('Không tìm thấy admin_token');
      }
    } else {
      const userToken = localStorage.getItem('user_token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
        console.log(`Gửi request user (${config.url}) với token:`, userToken.substring(0, 20) + '...');
      } else {
        console.log(`Không tìm thấy user_token cho request: ${config.url}`);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      const isAdminRequest = error.config?.url?.startsWith('/admin/');
      
      if (isAdminRequest) {
        // Token admin hết hạn
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
        window.location.href = '/admin/login';
      } else {
        // Token user hết hạn
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