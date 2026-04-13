// src/pages/ProvinceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../../components/layout/Layout';
import LocationMap from '../../../components/map/LocationMap';
import locationApi from '../../../api/locationApi';

const ProvinceDetail = () => {
  const { provinceId } = useParams();
  const [province, setProvince] = useState(null);
  const [locations, setLocations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchProvinceData();
  }, [provinceId]);

  const fetchProvinceData = async () => {
    setLoading(true);
    try {
      const [provinceRes, locationsRes, statsRes] = await Promise.all([
        locationApi.getProvince(provinceId),
        locationApi.getLocationsByProvince(provinceId, 200),
        locationApi.getProvinceStatistics(provinceId)
      ]);
      setProvince(provinceRes.data);
      setLocations(locationsRes.data.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error fetching province data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    if (filterCategory !== 'all' && location.category !== filterCategory) {
      return false;
    }
    if (searchKeyword && !location.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    return true;
  });

  const mapCenter = province?.center_lat && province?.center_lng
    ? { lat: province.center_lat, lng: province.center_lng }
    : filteredLocations.length > 0
      ? { lat: filteredLocations[0].lat, lng: filteredLocations[0].lng }
      : { lat: 12.2388, lng: 109.1967 }; // Nha Trang center (từ ảnh screenshot)

  // Xử lý click item trong panel → highlight marker + zoom nhẹ (nếu cần)
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    // Leaflet sẽ tự động mở Popup vì selectedLocation được truyền xuống
  };

  if (loading) {
    return (
      <>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
          Đang tải bản đồ...
        </div>
      </>
    );
  }

  return (
    <>
      {/* Container full màn hình - giống Google Maps */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 64px)', // trừ chiều cao header của Layout (nếu Layout có navbar ~64px)
        overflow: 'hidden',
        background: '#f5f5f5'
      }}>
        
        {/* MAP FULL SCREEN */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}>
          <LocationMap
            locations={filteredLocations}
            center={mapCenter}
            selectedLocation={selectedLocation}
            onMarkerClick={setSelectedLocation}
          />
        </div>

        {/* TOP BAR - giống Google Maps */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'white',
          borderRadius: '9999px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          padding: '6px 8px',
          maxWidth: '720px',
          margin: '0 auto'
        }}>
          
          {/* Search bar */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f1f1',
            borderRadius: '9999px',
            padding: '10px 20px',
            gap: '12px'
          }}>
            <span style={{ fontSize: '22px', color: '#4285f4' }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm trên Google Maps"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '16px',
                color: '#202124'
              }}
            />
          </div>

          {/* Category chips (giống Google) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '4px 0',
            scrollbarWidth: 'none'
          }}>
            <button
              onClick={() => setFilterCategory('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: filterCategory === 'all' ? '2px solid #4285f4' : '1px solid #dadce0',
                background: filterCategory === 'all' ? '#e8f0fe' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: filterCategory === 'all' ? '#4285f4' : '#3c4043'
              }}
            >
              <span>🌐</span>
              Tất cả
            </button>

            <button
              onClick={() => setFilterCategory('restaurant')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: filterCategory === 'restaurant' ? '2px solid #4285f4' : '1px solid #dadce0',
                background: filterCategory === 'restaurant' ? '#e8f0fe' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: filterCategory === 'restaurant' ? '#4285f4' : '#3c4043'
              }}
            >
              <span>🍽️</span>
              Nhà hàng
            </button>

            <button
              onClick={() => setFilterCategory('store')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: filterCategory === 'store' ? '2px solid #4285f4' : '1px solid #dadce0',
                background: filterCategory === 'store' ? '#e8f0fe' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: filterCategory === 'store' ? '#4285f4' : '#3c4043'
              }}
            >
              <span>🏪</span>
              Cửa hàng
            </button>

            <button
              onClick={() => setFilterCategory('tourist_spot')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: filterCategory === 'tourist_spot' ? '2px solid #4285f4' : '1px solid #dadce0',
                background: filterCategory === 'tourist_spot' ? '#e8f0fe' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: filterCategory === 'tourist_spot' ? '#4285f4' : '#3c4043'
              }}
            >
              <span>📸</span>
              Điểm tham quan
            </button>
          </div>

          {/* Right side buttons (giống Google) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'white',
              border: '1px solid #dadce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              🧭
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#4285f4',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              👤
            </div>
          </div>
        </div>

        {/* LEFT PANEL - giống hệt Google Maps (danh sách + khu vực) */}
        <div style={{
          position: 'absolute',
          top: '78px',
          left: '20px',
          width: '380px',
          height: 'calc(100% - 100px)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Phần "Nhà riêng" */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#f8f9fa'
          }}>
            <div style={{ fontSize: '28px' }}>🏠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>Nhà riêng</div>
              <div style={{ fontSize: '13px', color: '#666' }}>Nha Trang, Khánh Hòa</div>
            </div>
            <button style={{
              padding: '8px 16px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Đặt vị trí
            </button>
          </div>

          {/* Danh sách địa điểm (dynamic từ filteredLocations) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {filteredLocations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                Không tìm thấy địa điểm nào
              </div>
            ) : (
              filteredLocations.map(location => (
                <div
                  key={location.id}
                  onClick={() => handleLocationClick(location)}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    gap: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: selectedLocation?.id === location.id ? '#f0f8ff' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  {/* Icon clock */}
                  <div style={{ fontSize: '22px', color: '#666', marginTop: '2px' }}>🕒</div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#202124' }}>
                      {location.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                      📍 {location.address}
                    </div>
                    {location.opening_hours && (
                      <div style={{
                        fontSize: '13px',
                        marginTop: '6px',
                        color: location.opening_hours.includes('đóng') || location.opening_hours.includes('Đã đóng') 
                          ? '#d93025' 
                          : '#ea8600'
                      }}>
                        {location.opening_hours}
                      </div>
                    )}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px',
                      padding: '2px 10px',
                      background: '#e8f5e9',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      color: '#137333'
                    }}>
                      {location.category === 'store' ? '🏪 Cửa hàng' :
                       location.category === 'restaurant' ? '🍽️ Nhà hàng' : '📍 Điểm tham quan'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer panel "Khu vực này" - giống hệt ảnh */}
          <div style={{
            borderTop: '1px solid #f0f0f0',
            padding: '16px 20px',
            background: 'white',
            borderRadius: '0 0 12px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>🌤️</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '600' }}>26°</span>
                  <span style={{ color: '#666' }}>☀️</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>
                  Khu vực này
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: '#f0f8ff',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>🚗</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      Giao thông thưa thớt ở khu này
                    </div>
                    <div style={{ fontSize: '12px', color: '#137333' }}>
                      Không bị chậm trễ gần đây
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '20px' }}>›</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating bottom-right controls (giống Google) */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button style={{
            width: '48px',
            height: '48px',
            background: 'white',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            📍
          </button>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', fontSize: '18px' }}>+</button>
            <div style={{ height: '1px', background: '#dadce0' }}></div>
            <button style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', fontSize: '18px' }}>-</button>
          </div>
        </div>

        {/* Số lượng địa điểm (floating badge trên map) */}
        {filteredLocations.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '90px',
            left: '420px',
            background: 'white',
            padding: '6px 14px',
            borderRadius: '9999px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#202124'
          }}>
            <span>{filteredLocations.length}</span>
            <span style={{ color: '#666' }}>địa điểm</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ProvinceDetail;