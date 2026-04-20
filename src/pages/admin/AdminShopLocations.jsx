// src/pages/admin/AdminLocations.jsx
import React, { useState, useEffect } from 'react';
import locationApi from '../../api/locationApi';
import Toast from '../../components/common/Toast';

const AdminLocations = () => {
  const [provinces, setProvinces] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [activeTab, setActiveTab] = useState('provinces');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    code: '',
    region: '',
    center_lat: '',
    center_lng: '',
    image_url: '',
    description: ''
  });
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    province_id: '',
    province_name: '',
    category: 'store',
    phone: '',
    opening_hours: '',
    description: '',
    images: []
  });

  useEffect(() => {
    fetchProvinces();
  }, []);

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
    };

  const fetchProvinces = async () => {
    try {
      const res = await locationApi.getAllProvinces('all');
      // Map dữ liệu để đảm bảo mỗi province có trường id
      const provincesWithId = (res.data || []).map(province => ({
        ...province,
        id: province.id || province._id
      }));
      setProvinces(provincesWithId);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const fetchLocationsByProvince = async (provinceId) => {
    try {
      const res = await locationApi.getLocationsByProvince(provinceId, 500);
      // Map dữ liệu để có trường id
      const locationsWithId = (res.data.data || []).map(loc => ({
        ...loc,
        id: loc.id || loc._id
      }));
      setLocations(locationsWithId);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleProvinceSelect = (province) => {
    const provinceId = province.id || province._id;
    console.log("Selected province ID:", provinceId);
    
    const provinceWithId = { ...province, id: provinceId };
    setSelectedProvince(provinceWithId);
    fetchLocationsByProvince(provinceId);
    setActiveTab('locations');
};

  const handleSaveProvince = async () => {
    try {
      if (editingItem) {
        await locationApi.updateProvince(editingItem.id, formData);
      } else {
        await locationApi.createProvince(formData);
      }
      await fetchProvinces();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving province:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleDeleteProvince = async (provinceId) => {
    if (window.confirm('Bạn có chắc muốn xóa tỉnh thành này?')) {
      try {
        await locationApi.deleteProvince(provinceId);
        await fetchProvinces();
      } catch (error) {
        console.error('Error deleting province:', error);
        showToast('Có lỗi xảy ra', 'error');
      }
    }
  };

  const handleSaveLocation = async () => {
  try {
    // Kiểm tra selectedProvince
    if (!selectedProvince) {
      showToast('Vui lòng chọn tỉnh thành trước', 'error');
      return;
    }

    // Lấy đúng ID từ selectedProvince
    const provinceId = selectedProvince.id || selectedProvince._id;
    
    if (!provinceId) {
      console.error('selectedProvince:', selectedProvince);
      showToast('Không tìm thấy ID của tỉnh thành', 'error');
      return;
    }

    const data = {
      name: locationForm.name,
      address: locationForm.address,
      lat: parseFloat(locationForm.lat),
      lng: parseFloat(locationForm.lng),
      province_id: provinceId,
      province_name: selectedProvince.name,
      category: locationForm.category,
      phone: locationForm.phone || null,
      opening_hours: locationForm.opening_hours || null,
      description: locationForm.description || null,
      images: locationForm.images || []
    };

    // Log dữ liệu để debug
    console.log('Dữ liệu gửi lên:', JSON.stringify(data, null, 2));
    console.log('editingItem:', editingItem);

    // Kiểm tra các trường bắt buộc
    if (!data.name) {
      showToast('Vui lòng nhập tên địa điểm', 'error');
      return;
    }
    if (!data.address) {
      showToast('Vui lòng nhập địa chỉ', 'error');
      return;
    }
    if (isNaN(data.lat) || data.lat === '') {
      showToast('Vui lòng nhập vĩ độ (lat) hợp lệ', 'error');
      return;
    }
    if (isNaN(data.lng) || data.lng === '') {
      showToast('Vui lòng nhập kinh độ (lng) hợp lệ', 'error');
      return;
    }
    if (!data.province_id) {
      showToast('Không tìm thấy ID tỉnh thành', 'error');
      return;
    }

    if (editingItem) {
      // Lấy đúng ID từ editingItem (location object)
      const locationId = editingItem.id || editingItem._id;
      if (!locationId) {
        showToast('Không tìm thấy ID địa điểm cần cập nhật', 'error');
        return;
      }
      console.log('Updating location with ID:', locationId);
      await locationApi.updateLocation(locationId, data);
      showToast('Cập nhật địa điểm thành công!', 'success');
    } else {
      await locationApi.createLocation(data);
      showToast('Thêm địa điểm thành công!', 'success');
    }
    
    await fetchLocationsByProvince(provinceId);
    setShowModal(false);
    resetLocationForm();
  } catch (error) {
    console.error('Error saving location:', error);
    console.error('Response error:', error.response?.data);
    const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Có lỗi xảy ra';
    showToast(`Lỗi: ${errorMsg}`, 'error');
  }
};

  const handleDeleteLocation = async (location) => {
  // Lấy đúng ID từ location object
  const locationId = location.id || location._id;
  
    if (!locationId) {
      console.error('Không tìm thấy ID của địa điểm:', location);
      showToast('Không thể xóa: không tìm thấy ID', 'error');
      return;
    }
    
    if (window.confirm(`Bạn có chắc muốn xóa địa điểm "${location.name}"?`)) {
      try {
        await locationApi.deleteLocation(locationId);
        await fetchLocationsByProvince(selectedProvince.id);
        showToast('Xóa địa điểm thành công!', 'success');
      } catch (error) {
        console.error('Error deleting location:', error);
        showToast('Có lỗi xảy ra khi xóa', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      code: '',
      region: '',
      center_lat: '',
      center_lng: '',
      image_url: '',
      description: ''
    });
    setEditingItem(null);
  };

  const resetLocationForm = () => {
    setLocationForm({
      name: '',
      address: '',
      lat: '',
      lng: '',
      province_id: '',
      province_name: '',
      category: 'store',
      phone: '',
      opening_hours: '',
      description: ''
    });
    setEditingItem(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Quản lý Địa điểm</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('provinces')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'provinces' ? '#4CAF50' : 'transparent',
            color: activeTab === 'provinces' ? 'white' : '#333',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer'
          }}
        >
          Quản lý Tỉnh/Thành
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          disabled={!selectedProvince}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'locations' ? '#4CAF50' : 'transparent',
            color: activeTab === 'locations' ? 'white' : !selectedProvince ? '#999' : '#333',
            borderRadius: '8px 8px 0 0',
            cursor: selectedProvince ? 'pointer' : 'not-allowed'
          }}
        >
          Quản lý Địa điểm {selectedProvince && `- ${selectedProvince.name}`}
        </button>
      </div>

      {/* Provinces Tab */}
      {activeTab === 'provinces' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + Thêm Tỉnh/Thành
            </button>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {provinces.map(province => (
              <div
                key={province.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  background: province.status === 'inactive' ? '#f5f5f5' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                  {province.image_url && (
                    <img
                      src={province.image_url}
                      alt={province.name}
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <h3 style={{ margin: 0 }}>{province.name}</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
                      Mã: {province.code} | Miền: {province.region || 'Chưa phân loại'}
                    </p>
                    {province.status === 'inactive' && (
                      <span style={{ color: '#ff9800', fontSize: '12px' }}>Đã ẩn</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleProvinceSelect(province)}
                    style={{
                      padding: '8px 16px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Xem địa điểm
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(province);
                      setFormData({
                        name: province.name,
                        name_en: province.name_en || '',
                        code: province.code,
                        region: province.region || '',
                        center_lat: province.center_lat || '',
                        center_lng: province.center_lng || '',
                        image_url: province.image_url || '',
                        description: province.description || ''
                      });
                      setShowModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteProvince(province.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && selectedProvince && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => {
                resetLocationForm();
                setShowModal(true);
              }}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + Thêm Địa điểm
            </button>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {locations.map(location => (
              <div
                key={location.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  border: '1px solid #eee',
                  borderRadius: '8px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{location.name}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    📍 {location.address}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: '#e8f5e9' }}>
                      {location.category === 'store' ? '🏪 Cửa hàng' :
                       location.category === 'restaurant' ? '🍽️ Nhà hàng' : '📍 Điểm du lịch'}
                    </span>
                    {location.phone && (
                      <span style={{ fontSize: '12px', color: '#666' }}>📞 {location.phone}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      // Đảm bảo location có id
                      const locationWithId = {
                        ...location,
                        id: location.id || location._id
                      };
                      setEditingItem(locationWithId);
                      setLocationForm({
                        name: location.name,
                        address: location.address,
                        lat: location.lat,
                        lng: location.lng,
                        province_id: location.province_id,
                        province_name: location.province_name,
                        category: location.category,
                        phone: location.phone || '',
                        opening_hours: location.opening_hours || '',
                        description: location.description || '',
                        images: location.images || []
                      });
                      setShowModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location)}
                    style={{
                      padding: '8px 16px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {locations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              Chưa có địa điểm nào trong tỉnh này
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeTab === 'provinces' ? 'Tỉnh/Thành' : 'Địa điểm'}</h2>

            {activeTab === 'provinces' ? (
              // Province Form
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Tên tỉnh/thành *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Tên tiếng Anh</label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Mã tỉnh *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Miền</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="">Chọn miền</option>
                    <option value="North">Miền Bắc</option>
                    <option value="Central">Miền Trung</option>
                    <option value="South">Miền Nam</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Tọa độ trung tâm (lat)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.center_lat}
                    onChange={(e) => setFormData({ ...formData, center_lat: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Tọa độ trung tâm (lng)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.center_lng}
                    onChange={(e) => setFormData({ ...formData, center_lng: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>URL Hình ảnh</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
            ) : (
              // Location Form
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Tên địa điểm *</label>
                  <input
                    type="text"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    value={locationForm.address}
                    onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Vĩ độ (lat) *</label>
                  <input
                    type="number"
                    step="any"
                    value={locationForm.lat}
                    onChange={(e) => setLocationForm({ ...locationForm, lat: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Kinh độ (lng) *</label>
                  <input
                    type="number"
                    step="any"
                    value={locationForm.lng}
                    onChange={(e) => setLocationForm({ ...locationForm, lng: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Loại hình</label>
                  <select
                    value={locationForm.category}
                    onChange={(e) => setLocationForm({ ...locationForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="store">Cửa hàng</option>
                    <option value="restaurant">Nhà hàng</option>
                    <option value="tourist_spot">Điểm du lịch</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={locationForm.phone}
                    onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Giờ mở cửa</label>
                  <input
                    type="text"
                    value={locationForm.opening_hours}
                    onChange={(e) => setLocationForm({ ...locationForm, opening_hours: e.target.value })}
                    placeholder="VD: 08:00 - 21:00"
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                {/* Trong phần Location Form, thêm sau ô Mô tả */}
                <div style={{ marginBottom: '15px' }}>
                  <label>URL Hình ảnh (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={Array.isArray(locationForm.images) ? locationForm.images.join(', ') : ''}
                    onChange={(e) => {
                      const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url);
                      setLocationForm(prev => ({ ...prev, images: urls }));
                    }}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Nhập URL hình ảnh, cách nhau bằng dấu phẩy
                  </div>
                  
                  {/* Preview ảnh */}
                  {Array.isArray(locationForm.images) && locationForm.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {locationForm.images.map((url, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img 
                            src={url} 
                            alt={`Hình ${index + 1}`}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=Error'; }}
                          />
                          <button
                            onClick={() => {
                              const newImages = locationForm.images.filter((_, i) => i !== index);
                              setLocationForm(prev => ({ ...prev, images: newImages }));
                            }}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Mô tả</label>
                  <textarea
                    value={locationForm.description}
                    onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={activeTab === 'provinces' ? handleSaveProvince : handleSaveLocation}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Lưu
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  resetLocationForm();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLocations;