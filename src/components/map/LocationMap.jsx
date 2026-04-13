// src/components/map/LocationMap.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ==================== CUSTOM PHOTO MARKER (giống hệt cột "Hình ảnh" trong Admin) ====================
const createPhotoMarker = (location) => {
  // Hỗ trợ nhiều cách lưu ảnh trong DB
  const imageUrl = location.images?.[0] 
    || location.image_url 
    || location.image 
    || null;

  // Icon mặc định khi không có ảnh (giống admin)
  const emoji = location.category === 'store' 
    ? '🏪' 
    : location.category === 'restaurant' 
      ? '🍽️' 
      : '📍';

  const html = imageUrl
    ? `
      <div style="
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 4px solid #ffffff;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
      "></div>
    `
    : `
      <div style="
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 4px solid #ffffff;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
        background: #4285f4;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        color: white;
      ">${emoji}</div>
    `;

  return L.divIcon({
    className: 'custom-photo-marker',
    html: html,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0',
};

const defaultCenter = [12.2388, 109.1967]; // Nha Trang

const LocationMap = ({ locations, center, onMarkerClick, selectedLocation }) => {
  const [mapCenter, setMapCenter] = useState(center ? [center.lat, center.lng] : defaultCenter);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (center) {
      setMapCenter([center.lat, center.lng]);
    }
  }, [center]);

  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [locations]);

  const handleMarkerClick = (location) => {
    if (onMarkerClick) onMarkerClick(location);
  };

  return (
    <MapContainer
      key={mapKey}
      center={mapCenter}
      zoom={13}
      style={mapContainerStyle}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations && locations.map((location) => (
        <Marker
          key={location.id || location._id}
          position={[location.lat, location.lng]}
          icon={createPhotoMarker(location)}
          eventHandlers={{
            click: () => handleMarkerClick(location),
          }}
        >
          {selectedLocation?.id === location.id && (
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>
                  {location.name}
                </h4>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                  📍 {location.address}
                </p>
                {location.phone && (
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    📞 {location.phone}
                  </p>
                )}
                {location.rating > 0 && (
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#f5b042' }}>
                    ⭐ {location.rating} ({location.total_reviews || 0} đánh giá)
                  </p>
                )}
                <button
                  onClick={() => window.open(`/location/${location.id || location._id}`, '_blank')}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LocationMap;