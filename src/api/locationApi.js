// src/api/locationApi.js
import { adminApi } from './api';  // ← SỬA: dùng adminApi thay vì api mặc định

const locationApi = {
  // Province APIs
  getAllProvinces: (status = 'active') => 
    adminApi.get(`/api/v1/locations/provinces/all?status=${status}`),  // ← thêm adminApi
  
  getProvince: (provinceId) => 
    adminApi.get(`/api/v1/locations/provinces/${provinceId}`),
  
  createProvince: (data) => 
    adminApi.post('/api/v1/locations/provinces', data),
  
  updateProvince: (provinceId, data) => 
    adminApi.put(`/api/v1/locations/provinces/${provinceId}`, data),
  
  deleteProvince: (provinceId, hardDelete = false) => 
    adminApi.delete(`/api/v1/locations/provinces/${provinceId}?hard_delete=${hardDelete}`),
  
  getProvinceStatistics: (provinceId) => 
    adminApi.get(`/api/v1/locations/provinces/${provinceId}/statistics`),
  
  // Location APIs
  getLocationsByProvince: (provinceId, limit = 500, page = 1) =>
    adminApi.get(`/api/v1/locations/province/${provinceId}?limit=${limit}&page=${page}`),
  
  getNearbyLocations: (lat, lng, radiusKm = 10, category = null, limit = 50) => {
    let url = `/api/v1/locations/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    return adminApi.get(url);
  },
  
  getLocation: (locationId) => 
    adminApi.get(`/api/v1/locations/${locationId}`),
  
  createLocation: (data) => 
    adminApi.post('/api/v1/locations', data),
  
  updateLocation: (locationId, data) => 
    adminApi.put(`/api/v1/locations/${locationId}`, data),
  
  deleteLocation: (locationId, hardDelete = false) => 
    adminApi.delete(`/api/v1/locations/${locationId}?hard_delete=${hardDelete}`),
};

export default locationApi;