// hooks/useUserLocation.js
import { useState, useEffect } from 'react';

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị");
      setLoading(false);
      return;
    }

    // Kiểm tra cache trong sessionStorage
    const cachedLocation = sessionStorage.getItem('user_location');
    const cacheTime = sessionStorage.getItem('user_location_timestamp');
    const now = Date.now();
    const isCacheValid = cacheTime && (now - parseInt(cacheTime) < 600000); // 10 phút

    if (cachedLocation && isCacheValid) {
      try {
        const parsed = JSON.parse(cachedLocation);
        setLocation(parsed);
        setLoading(false);
        console.log("✅ Loaded location from cache:", parsed);
        return;
      } catch (e) {
        console.error("Error parsing cached location:", e);
      }
    }

    // Lấy vị trí mới
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(newLocation);
        setLoading(false);
        
        // Lưu cache
        sessionStorage.setItem('user_location', JSON.stringify(newLocation));
        sessionStorage.setItem('user_location_timestamp', Date.now().toString());
        
        console.log("✅ Got user location:", newLocation);
      },
      (err) => {
        console.error("❌ Error getting location:", err);
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  return { location, loading, error };
};