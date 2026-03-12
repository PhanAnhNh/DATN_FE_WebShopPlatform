// src/api/api.js
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
});

// Mở file api.js và sửa lại chỗ interceptor:
api.interceptors.request.use(
    (config) => {
        // ĐỔI "token" THÀNH "access_token" Ở ĐÂY 👇
        const token = localStorage.getItem("access_token"); 
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Nếu Backend trả về 401 (Hết hạn token hoặc chưa đăng nhập)
        if (error.response && error.response.status === 401) {        
            localStorage.removeItem("access_token"); // Xóa token cũ đi
            window.location.href = "/login"; // Tự động đá về trang đăng nhập (sửa lại URL theo route của bạn)
        }
        return Promise.reject(error);
    }
);
export default api;