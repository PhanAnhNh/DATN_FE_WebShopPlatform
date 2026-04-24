export const BACKEND_URL = (() => {
  // ĐẢM BẢO DÙNG HTTPS
  const url = 'https://datnwebshopplatform-production.up.railway.app';
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (envUrl) {
    // Force HTTPS
    return envUrl.replace('http://', 'https://');
  }
  return url;
})();

// Log để debug
console.log('🔧 Backend URL:', BACKEND_URL);