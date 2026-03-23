// src/pages/shop/ShopProfile.jsx

// src/pages/shop/ShopProfile.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaStore, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaCamera,
  FaSave,
  FaKey,
  FaSpinner,
  FaEdit,
  FaCheck,
  FaTimes,
  FaUpload,
  FaPlus,
  FaTrash,
  FaHome,
  FaBuilding,
  FaAddressCard
} from 'react-icons/fa';
import { shopApi } from '../../api/api';  // Import shopApi thay vì api mặc định
import styles from '../../css/ShopProfile.module.css'; 

const ShopProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({
    avatar: false,
    logo: false,
    banner: false
  });
  
  const [profile, setProfile] = useState({
    shop: {
      id: '',
      name: '',
      slug: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      province: '',
      district: '',
      ward: '',
      logo_url: '',
      banner_url: '',
      status: '',
      is_verified: false,
      products_count: 0,
      followers_count: 0,
      total_orders: 0,
      total_revenue: 0,
      created_at: '',
      updated_at: ''
    },
    owner: {
      id: '',
      username: '',
      email: '',
      full_name: '',
      phone: '',
      gender: '',
      dob: '',
      address: '',
      avatar_url: '',
      cover_url: '',
      role: '',
      created_at: ''
    }
  });

  // State cho địa chỉ
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    is_default: false,
    address_type: 'home',
    note: ''
  });

  const [editMode, setEditMode] = useState({
    shop: false,
    owner: false
  });

  const [formData, setFormData] = useState({
    shop: {},
    owner: {}
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching shop profile with shop token...');
      const response = await shopApi.get('/api/v1/shop/profile');
      console.log('Shop profile response:', response.data);
      console.log('Owner ID:', response.data.owner.id);
      console.log('Owner username:', response.data.owner.username);
      setProfile(response.data);
      setFormData({
        shop: { ...response.data.shop },
        owner: { ...response.data.owner }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        // Token hết hạn hoặc không hợp lệ, redirect về login
        window.location.href = '/shop/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses - Dùng shopApi để lấy địa chỉ của shop owner
  const fetchAddresses = async () => {
    try {
      console.log('Fetching addresses with shop token...');
      const response = await shopApi.get('/api/v1/addresses');
      console.log('Addresses response:', response.data);
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  // Các hàm còn lại giữ nguyên, chỉ thay api thành shopApi
  const handleInputChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleAddressFormChange = (field, value) => {
    setAddressFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetAddressForm = () => {
    setAddressFormData({
      name: '',
      phone: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      country: 'Việt Nam',
      is_default: false,
      address_type: 'home',
      note: ''
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressFormData({
      name: profile.owner.full_name || '',
      phone: profile.owner.phone || '',
      street: '',
      ward: '',
      district: '',
      city: '',
      country: 'Việt Nam',
      is_default: addresses.length === 0,
      address_type: 'home',
      note: ''
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressFormData({
      name: address.name,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      city: address.city,
      country: address.country,
      is_default: address.is_default,
      address_type: address.address_type || 'home',
      note: address.note || ''
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    if (!addressFormData.name.trim()) {
      alert('Vui lòng nhập tên người nhận');
      return;
    }
    if (!addressFormData.phone.trim()) {
      alert('Vui lòng nhập số điện thoại');
      return;
    }
    if (!addressFormData.street.trim()) {
      alert('Vui lòng nhập số nhà và tên đường');
      return;
    }
    if (!addressFormData.ward.trim()) {
      alert('Vui lòng nhập phường/xã');
      return;
    }
    if (!addressFormData.district.trim()) {
      alert('Vui lòng nhập quận/huyện');
      return;
    }
    if (!addressFormData.city.trim()) {
      alert('Vui lòng nhập tỉnh/thành phố');
      return;
    }

    try {
      setSaving(true);
      
      let response;
      if (editingAddress) {
        response = await shopApi.put(`/api/v1/addresses/${editingAddress.id}`, addressFormData);
      } else {
        response = await shopApi.post('/api/v1/addresses', addressFormData);
      }
      
      await fetchAddresses();
      resetAddressForm();
      alert(editingAddress ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Có lỗi xảy ra khi lưu địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    try {
      await shopApi.delete(`/api/v1/addresses/${addressId}`);
      await fetchAddresses();
      alert('Xóa địa chỉ thành công!');
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Có lỗi xảy ra khi xóa địa chỉ');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await shopApi.post(`/api/v1/addresses/${addressId}/set-default`);
      await fetchAddresses();
      alert('Đã đặt địa chỉ mặc định!');
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const saveOwnerInfo = async () => {
    try {
      setSaving(true);
      const response = await shopApi.put('/api/v1/shop/profile/owner', formData.owner);
      
      setProfile(prev => ({
        ...prev,
        owner: { ...prev.owner, ...response.data.user }
      }));
      
      // Cập nhật localStorage
      const currentShopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
      const updatedShopData = {
        ...currentShopData,
        ...response.data.user
      };
      localStorage.setItem('shop_data', JSON.stringify(updatedShopData));
      
      window.dispatchEvent(new CustomEvent('shopDataUpdate', { 
        detail: updatedShopData 
      }));
      
      setEditMode(prev => ({ ...prev, owner: false }));
      alert('Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      console.error('Error saving owner info:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin cá nhân');
    } finally {
      setSaving(false);
    }
  };

  const saveShopInfo = async () => {
    try {
      setSaving(true);
      const response = await shopApi.put('/api/v1/shop/profile/shop', formData.shop);
      
      setProfile(prev => ({
        ...prev,
        shop: { ...prev.shop, ...response.data }
      }));
      
      const currentShopInfo = JSON.parse(localStorage.getItem('shop_info') || '{}');
      const updatedShopInfo = {
        ...currentShopInfo,
        ...response.data
      };
      localStorage.setItem('shop_info', JSON.stringify(updatedShopInfo));
      
      window.dispatchEvent(new CustomEvent('shopInfoUpdate', { 
        detail: updatedShopInfo 
      }));
      
      setEditMode(prev => ({ ...prev, shop: false }));
      alert('Cập nhật thông tin shop thành công!');
    } catch (error) {
      console.error('Error saving shop info:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin shop');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(prev => ({ ...prev, avatar: true }));
      const response = await shopApi.post('/api/v1/shop/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfile(prev => ({
        ...prev,
        owner: { ...prev.owner, avatar_url: response.data.avatar_url }
      }));

      const shopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
      shopData.avatar_url = response.data.avatar_url;
      localStorage.setItem('shop_data', JSON.stringify(shopData));

      window.dispatchEvent(new CustomEvent('shopDataUpdate', { 
        detail: shopData 
      }));

      alert('Upload avatar thành công!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Có lỗi xảy ra khi upload avatar');
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }));
    }
  };

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(prev => ({ ...prev, logo: true }));
      const response = await shopApi.post('/api/v1/shop/profile/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfile(prev => ({
        ...prev,
        shop: { ...prev.shop, logo_url: response.data.logo_url }
      }));

      const shopInfo = JSON.parse(localStorage.getItem('shop_info') || '{}');
      shopInfo.logo_url = response.data.logo_url;
      localStorage.setItem('shop_info', JSON.stringify(shopInfo));

      alert('Upload logo thành công!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Có lỗi xảy ra khi upload logo');
    } finally {
      setUploading(prev => ({ ...prev, logo: false }));
    }
  };

  const uploadBanner = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(prev => ({ ...prev, banner: true }));
      const response = await shopApi.post('/api/v1/shop/profile/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfile(prev => ({
        ...prev,
        shop: { ...prev.shop, banner_url: response.data.banner_url }
      }));
      alert('Upload banner thành công!');
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Có lỗi xảy ra khi upload banner');
    } finally {
      setUploading(prev => ({ ...prev, banner: false }));
    }
  };

  const handleFileSelect = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    switch(type) {
      case 'avatar':
        uploadAvatar(file);
        break;
      case 'logo':
        uploadLogo(file);
        break;
      case 'banner':
        uploadBanner(file);
        break;
    }
  };

  const changePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setSaving(true);
      await shopApi.post('/api/v1/shop/profile/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });

      setPasswordSuccess('Đổi mật khẩu thành công!');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatFullAddress = (address) => {
    const parts = [address.street, address.ward, address.district, address.city, address.country];
    return parts.filter(p => p).join(', ');
  };

  const getAddressTypeIcon = (type) => {
    switch(type) {
      case 'home': return <FaHome />;
      case 'office': return <FaBuilding />;
      default: return <FaAddressCard />;
    }
  };

  const getAddressTypeText = (type) => {
    switch(type) {
      case 'home': return 'Nhà riêng';
      case 'office': return 'Văn phòng';
      default: return 'Khác';
    }
  };

  if (loading) {
    return (
      <div className={styles["shop-profile loading"]}>
        <div className={styles["spinner"]}></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  // Phần render giữ nguyên
  return (
    <div className={styles["shop-profile"]}>
      {/* Banner - giữ nguyên */}
      <div className={styles["profile-banner"]}>
        {profile.shop.banner_url ? (
          <img src={profile.shop.banner_url} alt="Shop Banner" />
        ) : (
          <div className={styles["banner-placeholder"]}>
            <FaStore size={50} />
          </div>
        )}
        
        <label className={styles["upload-banner-btn"]}>
          <FaCamera />
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileSelect('banner', e)}
            disabled={uploading.banner}
          />
          {uploading.banner ? <FaSpinner className={styles["spinning"]} /> : 'Thay ảnh bìa'}
        </label>
      </div>

      {/* Shop Info Section */}
      <div className={styles["profile-section"]}>
        <div className={styles["section-header"]}>
          <div className={styles["section-title"]}>
            <FaStore />
            <h2>Thông tin cửa hàng</h2>
          </div>
          {!editMode.shop ? (
            <button 
              className={styles["edit-btn"]}
              onClick={() => setEditMode({ ...editMode, shop: true })}
            >
              <FaEdit /> Chỉnh sửa
            </button>
          ) : (
            <div className={styles["action-buttons"]}>
              <button 
                className={styles["save-btn"]}
                onClick={saveShopInfo}
                disabled={saving}
              >
                {saving ? <FaSpinner className={styles["spinning"]} /> : <FaCheck />}
                Lưu
              </button>
              <button 
                className={styles["cancel-btn"]}
                onClick={() => {
                  setFormData({ ...formData, shop: { ...profile.shop } });
                  setEditMode({ ...editMode, shop: false });
                }}
              >
                <FaTimes /> Hủy
              </button>
            </div>
          )}
        </div>

        <div className={styles["section-content"]}>
          <div className={styles["shop-logo-section"]}>
            <div className={styles["logo-container"]}>
              {profile.shop.logo_url ? (
                <img src={profile.shop.logo_url} alt="Shop Logo" />
              ) : (
                <div className={styles["logo-placeholder"]}>
                  <FaStore size={40} />
                </div>
              )}
              <label className={styles["upload-logo-btn"]}>
                <FaCamera />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileSelect('logo', e)}
                  disabled={uploading.logo}
                />
                {uploading.logo ? <FaSpinner className={styles["spinning"]} /> : 'Đổi logo'}
              </label>
            </div>

            <div className={styles["shop-stats"]}>
              <div className={styles["stat-item"]}>
                <span className={styles["stat-label"]}>Sản phẩm</span>
                <span className={styles["stat-value"]}>{profile.shop.products_count}</span>
              </div>
              <div className={styles["stat-item"]}>
                <span className={styles["stat-label"]}>Người theo dõi</span>
                <span className={styles["stat-value"]}>{profile.shop.followers_count}</span>
              </div>
              <div className={styles["stat-item"]}>
                <span className={styles["stat-label"]}>Đơn hàng</span>
                <span className={styles["stat-value"]}>{profile.shop.total_orders}</span>
              </div>
              <div className={styles["stat-item"]}>
                <span className={styles["stat-label"]}>Doanh thu</span>
                <span className={styles["stat-value"]}>{formatCurrency(profile.shop.total_revenue)}</span>
              </div>
            </div>
          </div>

          <div className={styles["info-grid"]}>
            <div className={styles["info-item"]}>
              <label>Tên cửa hàng</label>
              {editMode.shop ? (
                <input
                  type="text"
                  value={formData.shop.name || ''}
                  onChange={(e) => handleInputChange('shop', 'name', e.target.value)}
                />
              ) : (
                <p>{profile.shop.name}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Slug</label>
              <p>{profile.shop.slug}</p>
            </div>

            <div className={styles["info-item"] + ' ' + styles["full-width"]}>
              <label>Mô tả</label>
              {editMode.shop ? (
                <textarea
                  value={formData.shop.description || ''}
                  onChange={(e) => handleInputChange('shop', 'description', e.target.value)}
                  rows="4"
                />
              ) : (
                <p>{profile.shop.description || 'Chưa có mô tả'}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Email</label>
              {editMode.shop ? (
                <input
                  type="email"
                  value={formData.shop.email || ''}
                  onChange={(e) => handleInputChange('shop', 'email', e.target.value)}
                />
              ) : (
                <p>{profile.shop.email || 'Chưa cập nhật'}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Số điện thoại</label>
              {editMode.shop ? (
                <input
                  type="tel"
                  value={formData.shop.phone || ''}
                  onChange={(e) => handleInputChange('shop', 'phone', e.target.value)}
                />
              ) : (
                <p>{profile.shop.phone || 'Chưa cập nhật'}</p>
              )}
            </div>

            <div className={styles["info-item"] + ' ' + styles["full-width"]}>
              <label>Địa chỉ</label>
              {editMode.shop ? (
                <input
                  type="text"
                  value={formData.shop.address || ''}
                  onChange={(e) => handleInputChange('shop', 'address', e.target.value)}
                />
              ) : (
                <p>{profile.shop.address || 'Chưa cập nhật'}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Trạng thái</label>
              <p className={`status-badge ${profile.shop.status}`}>
                {profile.shop.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                {profile.shop.is_verified && ' ✓ Đã xác thực'}
              </p>
            </div>

            <div className={styles["info-item"]}>
              <label>Ngày tạo</label>
              <p>{formatDate(profile.shop.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Info Section */}
      <div className={styles["profile-section"]}>
        <div className={styles["section-header"]}>
          <div className={styles["section-title"]}>
            <FaUser />
            <h2>Thông tin chủ shop</h2>
          </div>
          {!editMode.owner ? (
            <button 
              className={styles["edit-btn"]}
              onClick={() => setEditMode({ ...editMode, owner: true })}
            >
              <FaEdit /> Chỉnh sửa
            </button>
          ) : (
            <div className={styles["action-buttons"]}>
              <button 
                className={styles["save-btn"]}
                onClick={saveOwnerInfo}
                disabled={saving}
              >
                {saving ? <FaSpinner className={styles["spinning"]} /> : <FaCheck />}
                Lưu
              </button>
              <button 
                className={styles["cancel-btn"]}
                onClick={() => {
                  setFormData({ ...formData, owner: { ...profile.owner } });
                  setEditMode({ ...editMode, owner: false });
                }}
              >
                <FaTimes /> Hủy
              </button>
            </div>
          )}
        </div>

        <div className={styles["section-content"]}>
          <div className={styles["owner-avatar-section"]}>
            <div className={styles["avatar-container"]}>
              {profile.owner.avatar_url ? (
                <img src={profile.owner.avatar_url} alt="Owner Avatar" />
              ) : (
                <div className={styles["avatar-placeholder"]}>
                  <FaUser size={40} />
                </div>
              )}
              <label className={styles["upload-avatar-btn"]}>
                <FaCamera />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileSelect('avatar', e)}
                  disabled={uploading.avatar}
                />
                {uploading.avatar ? <FaSpinner className={styles["spinning"]} /> : 'Đổi ảnh đại diện'}
              </label>
            </div>
          </div>

          <div className={styles["info-grid"]}>
            <div className={styles["info-item"]}>
              <label>Họ và tên</label>
              {editMode.owner ? (
                <input
                  type="text"
                  value={formData.owner.full_name || ''}
                  onChange={(e) => handleInputChange('owner', 'full_name', e.target.value)}
                />
              ) : (
                <p>{profile.owner.full_name || 'Chưa cập nhật'}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Tên đăng nhập</label>
              <p>{profile.owner.username}</p>
            </div>

            <div className={styles["info-item"]}>
              <label>Email</label>
              {editMode.owner ? (
                <input
                  type="email"
                  value={formData.owner.email || ''}
                  onChange={(e) => handleInputChange('owner', 'email', e.target.value)}
                />
              ) : (
                <p>{profile.owner.email}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Số điện thoại</label>
              {editMode.owner ? (
                <input
                  type="tel"
                  value={formData.owner.phone || ''}
                  onChange={(e) => handleInputChange('owner', 'phone', e.target.value)}
                />
              ) : (
                <p>{profile.owner.phone || 'Chưa cập nhật'}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Giới tính</label>
              {editMode.owner ? (
                <select
                  value={formData.owner.gender || ''}
                  onChange={(e) => handleInputChange('owner', 'gender', e.target.value)}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              ) : (
                <p>
                  {profile.owner.gender === 'male' ? 'Nam' : 
                   profile.owner.gender === 'female' ? 'Nữ' : 
                   profile.owner.gender || 'Chưa cập nhật'}
                </p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Ngày sinh</label>
              {editMode.owner ? (
                <input
                  type="date"
                  value={formData.owner.dob ? formData.owner.dob.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('owner', 'dob', e.target.value)}
                />
              ) : (
                <p>{formatDate(profile.owner.dob)}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Ngày tham gia</label>
              <p>{formatDate(profile.owner.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Management Section - NEW */}
      <div className={styles["profile-section"]}>
        <div className={styles["section-header"]}>
          <div className={styles["section-title"]}>
            <FaMapMarkerAlt />
            <h2>Danh sách địa chỉ</h2>
          </div>
          <button 
            className={styles["add-btn"]}
            onClick={handleAddAddress}
          >
            <FaPlus /> Thêm địa chỉ mới
          </button>
        </div>

        <div className={styles["section-content"]}>
          {addresses.length === 0 ? (
            <div className={styles["empty-state"]}>
              <FaMapMarkerAlt size={48} color="#ccc" />
              <p>Chưa có địa chỉ nào</p>
              <button onClick={handleAddAddress} className={styles["add-address-btn"]}>
                Thêm địa chỉ đầu tiên
              </button>
            </div>
          ) : (
            <div className={styles["address-list"]}>
              {addresses.map(address => (
                <div key={address.id} className={`${styles["address-card"]} ${address.is_default ? styles["default"] : ''}`}>
                  <div className={styles["address-header"]}>
                    <div className={styles["address-type"]}>
                      {getAddressTypeIcon(address.address_type)}
                      <span>{getAddressTypeText(address.address_type)}</span>
                      {address.is_default && <span className={styles["default-badge"]}>Mặc định</span>}
                    </div>
                    <div className={styles["address-actions"]}>
                      <button onClick={() => handleEditAddress(address)} className={styles["edit-address-btn"]}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteAddress(address.id)} className={styles["delete-address-btn"]}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className={styles["address-info"]}>
                    <p><strong>{address.name}</strong> | {address.phone}</p>
                    <p>{formatFullAddress(address)}</p>
                    {address.note && <p className={styles["address-note"]}>Ghi chú: {address.note}</p>}
                  </div>
                  {!address.is_default && (
                    <button 
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className={styles["set-default-btn"]}
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"] + ' ' + styles["address-modal"]}>
            <div className={styles["modal-header"]}>
              <h3>{editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
              <button className={styles["close-btn"]} onClick={resetAddressForm}>
                <FaTimes />
              </button>
            </div>

            <div className={styles["modal-body"]}>
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Họ và tên <span className={styles["required"]}>*</span></label>
                  <input
                    type="text"
                    value={addressFormData.name}
                    onChange={(e) => handleAddressFormChange('name', e.target.value)}
                    placeholder="Nhập họ tên người nhận"
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Số điện thoại <span className={styles["required"]}>*</span></label>
                  <input
                    type="tel"
                    value={addressFormData.phone}
                    onChange={(e) => handleAddressFormChange('phone', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>Số nhà, tên đường <span className={styles["required"]}>*</span></label>
                <input
                  type="text"
                  value={addressFormData.street}
                  onChange={(e) => handleAddressFormChange('street', e.target.value)}
                  placeholder="VD: 123 Nguyễn Văn A"
                />
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Phường/Xã <span className={styles["required"]}>*</span></label>
                  <input
                    type="text"
                    value={addressFormData.ward}
                    onChange={(e) => handleAddressFormChange('ward', e.target.value)}
                    placeholder="VD: Phường Hòa Hải"
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Quận/Huyện <span className={styles["required"]}>*</span></label>
                  <input
                    type="text"
                    value={addressFormData.district}
                    onChange={(e) => handleAddressFormChange('district', e.target.value)}
                    placeholder="VD: Quận Ngũ Hành Sơn"
                  />
                </div>
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Tỉnh/Thành phố <span className={styles["required"]}>*</span></label>
                  <input
                    type="text"
                    value={addressFormData.city}
                    onChange={(e) => handleAddressFormChange('city', e.target.value)}
                    placeholder="VD: Đà Nẵng"
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Quốc gia</label>
                  <input
                    type="text"
                    value={addressFormData.country}
                    onChange={(e) => handleAddressFormChange('country', e.target.value)}
                    placeholder="Việt Nam"
                  />
                </div>
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Loại địa chỉ</label>
                  <select
                    value={addressFormData.address_type}
                    onChange={(e) => handleAddressFormChange('address_type', e.target.value)}
                  >
                    <option value="home">Nhà riêng</option>
                    <option value="office">Văn phòng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>&nbsp;</label>
                  <label className={styles["checkbox-label"]}>
                    <input
                      type="checkbox"
                      checked={addressFormData.is_default}
                      onChange={(e) => handleAddressFormChange('is_default', e.target.checked)}
                    />
                    <span>Đặt làm địa chỉ mặc định</span>
                  </label>
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>Ghi chú</label>
                <textarea
                  value={addressFormData.note}
                  onChange={(e) => handleAddressFormChange('note', e.target.value)}
                  placeholder="Ghi chú thêm (ví dụ: gần trường, có cổng riêng...)"
                  rows="2"
                />
              </div>
            </div>

            <div className={styles["modal-footer"]}>
              <button className={styles["cancel-btn"]} onClick={resetAddressForm}>
                Hủy
              </button>
              <button 
                className={styles["save-btn"]}
                onClick={handleSaveAddress}
                disabled={saving}
              >
                {saving ? <FaSpinner className={styles["spinning"]} /> : 'Lưu địa chỉ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Section */}
      <div className={styles["profile-section"] + ' ' + styles["security-section"]}>
        <div className={styles["section-header"]}>
          <div className={styles["section-title"]}>
            <FaKey />
            <h2>Bảo mật</h2>
          </div>
        </div>

        <div className={styles["section-content"]}>
          <button 
            className={styles["change-password-btn"]}
            onClick={() => setShowPasswordModal(true)}
          >
            <FaKey /> Đổi mật khẩu
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"]}>
            <div className={styles["modal-header"]}>
              <h3>Đổi mật khẩu</h3>
              <button 
                className={styles["close-btn"]}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                  setPasswordData({
                    old_password: '',
                    new_password: '',
                    confirm_password: ''
                  });
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles["modal-body"]}>
              {passwordError && (
                <div className={styles["error-message"]}>{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className={styles["success-message"]}>{passwordSuccess}</div>
              )}

              <div className={styles["form-group"]}>
                <label>Mật khẩu cũ</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    old_password: e.target.value
                  })}
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    new_password: e.target.value
                  })}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value
                  })}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <div className={styles["modal-footer"]}>
              <button 
                className={styles["cancel-btn"]}
                onClick={() => setShowPasswordModal(false)}
              >
                Hủy
              </button>
              <button 
                className={styles["save-btn"]}
                onClick={changePassword}
                disabled={saving}
              >
                {saving ? <FaSpinner className={styles["spinning"]} /> : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProfile;