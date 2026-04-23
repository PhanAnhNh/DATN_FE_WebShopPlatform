export const BACKEND_URL = (() => {
  const url = 'https://datnwebshopplatform-production.up.railway.app';
  // Nếu có biến môi trường, ưu tiên dùng nhưng đảm bảo HTTPS
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.replace('http://', 'https://');
  }
  return url;
})();