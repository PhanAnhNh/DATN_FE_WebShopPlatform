// frontend/src/config.js
export const BACKEND_URL = (() => {
  // ĐẢM BẢO DÙNG HTTPS
  const url = 'https://datnwebshopplatform-production.up.railway.app';
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  let finalUrl = url;
  if (envUrl) {
    finalUrl = envUrl;
  }
  
  // Force HTTPS
  if (finalUrl.startsWith('http://')) {
    finalUrl = finalUrl.replace('http://', 'https://');
  }
  
  // Đảm bảo không có trailing slash
  finalUrl = finalUrl.replace(/\/$/, '');
  
  console.log('🔧 Backend URL (secure):', finalUrl);
  return finalUrl;
})();

// Export URL để dùng ở nhiều nơi
export const SECURE_BACKEND_URL = BACKEND_URL;