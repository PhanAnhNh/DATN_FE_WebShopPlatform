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
  FaUpload
} from 'react-icons/fa';
import api from '../../api/api';
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
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/shop/profile');
      setProfile(response.data);
      setFormData({
        shop: { ...response.data.shop },
        owner: { ...response.data.owner }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

// Trong ShopProfile.jsx - Sửa hàm saveOwnerInfo
const saveOwnerInfo = async () => {
  try {
    setSaving(true);
    const response = await api.put('/api/v1/shop/profile/owner', formData.owner);
    
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
    
    // Dispatch CUSTOM event thay vì storage event
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

// Sửa hàm saveShopInfo
const saveShopInfo = async () => {
  try {
    setSaving(true);
    const response = await api.put('/api/v1/shop/profile/shop', formData.shop);
    
    setProfile(prev => ({
      ...prev,
      shop: { ...prev.shop, ...response.data }
    }));
    
    // Cập nhật localStorage
    const currentShopInfo = JSON.parse(localStorage.getItem('shop_info') || '{}');
    const updatedShopInfo = {
      ...currentShopInfo,
      ...response.data
    };
    localStorage.setItem('shop_info', JSON.stringify(updatedShopInfo));
    
    // Dispatch CUSTOM event
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

// Sửa hàm uploadAvatar
const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    setUploading(prev => ({ ...prev, avatar: true }));
    const response = await api.post('/api/v1/shop/profile/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setProfile(prev => ({
      ...prev,
      owner: { ...prev.owner, avatar_url: response.data.avatar_url }
    }));

    // Cập nhật localStorage
    const shopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
    shopData.avatar_url = response.data.avatar_url;
    localStorage.setItem('shop_data', JSON.stringify(shopData));

    // Dispatch CUSTOM event
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

  // Upload logo
  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(prev => ({ ...prev, logo: true }));
      const response = await api.post('/api/v1/shop/profile/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfile(prev => ({
        ...prev,
        shop: { ...prev.shop, logo_url: response.data.logo_url }
      }));

      // Cập nhật localStorage
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

  // Upload banner
  const uploadBanner = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(prev => ({ ...prev, banner: true }));
      const response = await api.post('/api/v1/shop/profile/upload-banner', formData, {
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

  // Handle file selection
  const handleFileSelect = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Kiểm tra kích thước (max 5MB)
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

  // Change password
  const changePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validate
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
      await api.post('/api/v1/shop/profile/change-password', {
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

  if (loading) {
    return (
      <div className={styles["shop-profile loading"]}>
        <div className={styles["spinner"]}></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className={styles["shop-profile"]}>
      {/* Banner */}
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

            <div className={styles["info-item"] + ' ' + styles["full-width"]}>
              <label>Địa chỉ</label>
              {editMode.owner ? (
                <input
                  type="text"
                  value={formData.owner.address || ''}
                  onChange={(e) => handleInputChange('owner', 'address', e.target.value)}
                />
              ) : (
                <p>{profile.owner.address || 'Chưa cập nhật'}</p>
              )}
            </div>

            <div className={styles["info-item"]}>
              <label>Ngày tham gia</label>
              <p>{formatDate(profile.owner.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

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