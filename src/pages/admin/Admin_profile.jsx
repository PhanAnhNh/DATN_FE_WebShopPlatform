// src/pages/admin/AdminProfile.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, 
  FaMapMarkerAlt, FaVenusMars, FaCamera, FaSave, 
  FaSpinner, FaCheck, FaExclamationTriangle, FaLock,
  FaEye, FaEyeSlash, FaEdit, FaTimes, FaUserCircle
} from 'react-icons/fa';
import { adminApi } from '../../api/api';
import '../../css/AdminProfile.css';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: '',
    address: '',
    dob: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get('/api/v1/admin/profile');
      setUser(response.data);
      setFormData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        gender: response.data.gender || '',
        address: response.data.address || '',
        dob: response.data.dob ? new Date(response.data.dob).toISOString().split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMessage('Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.get('/api/v1/admin/profile/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước file không được vượt quá 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setShowAvatarUpload(true);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      setSaving(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', avatarFile);

      const response = await adminApi.post('/api/v1/admin/profile/avatar', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(prev => ({ ...prev, avatar_url: response.data.avatar_url }));
      setShowAvatarUpload(false);
      setAvatarFile(null);
      setSuccessMessage('Cập nhật ảnh đại diện thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setErrorMessage(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      await adminApi.put('/api/v1/admin/profile', formData);
      setUser(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      setSuccessMessage('Cập nhật thông tin thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setSaving(true);
      await adminApi.put('/api/v1/admin/profile/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setShowPasswordForm(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setSuccessMessage('Đổi mật khẩu thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getGenderLabel = (gender) => {
    const genderMap = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác'
    };
    return genderMap[gender] || 'Chưa cập nhật';
  };

  if (loading) {
    return (
      <div className="admin-profile loading">
        <FaSpinner className="spinning" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile">
      {successMessage && (
        <div className="alert success">
          <FaCheck /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert error">
          <FaExclamationTriangle /> {errorMessage}
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          <img 
            src={user?.cover_url || 'https://via.placeholder.com/1200x300/2e7d32/ffffff?text=Admin+Profile'} 
            alt="Cover" 
          />
        </div>
        
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name || user.username} />
            ) : (
              <div className="avatar-placeholder">
                <FaUserCircle />
              </div>
            )}
            <button 
              className="avatar-upload-btn"
              onClick={() => document.getElementById('avatar-input').click()}
            >
              <FaCamera />
            </button>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarSelect}
            />
          </div>
          <div className="profile-info">
            <h1>{user?.full_name || user?.username}</h1>
            <p className="profile-role">
              <span className="role-badge admin">Quản trị viên</span>
              <span className="role-badge verified">
                {user?.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="stats-card">
            <h3>Thống kê hoạt động</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-label">Ngày tham gia</span>
                <span className="stat-value">{formatDate(user?.created_at)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lần đăng nhập cuối</span>
                <span className="stat-value">{formatDateTime(user?.last_login)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Số người dùng quản lý</span>
                <span className="stat-value">{stats?.total_users || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Số cửa hàng quản lý</span>
                <span className="stat-value">{stats?.total_shops || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Số bài viết</span>
                <span className="stat-value">{stats?.total_posts || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Số báo cáo xử lý</span>
                <span className="stat-value">{stats?.total_reports || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-main">
          {/* Thông tin cá nhân */}
          <div className="info-card">
            <div className="card-header">
              <h2>
                <FaUser /> Thông tin cá nhân
              </h2>
              {!editMode ? (
                <button className="edit-btn" onClick={() => setEditMode(true)}>
                  <FaEdit /> Chỉnh sửa
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={() => {
                    setEditMode(false);
                    setFormData({
                      full_name: user?.full_name || '',
                      phone: user?.phone || '',
                      gender: user?.gender || '',
                      address: user?.address || '',
                      dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
                    });
                  }}>
                    <FaTimes /> Hủy
                  </button>
                  <button className="save-btn" onClick={handleUpdateProfile} disabled={saving}>
                    {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                    Lưu
                  </button>
                </div>
              )}
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Tên đăng nhập</label>
                <div className="info-value">
                  <FaUser className="info-icon" />
                  <span>{user?.username}</span>
                </div>
              </div>

              <div className="info-item">
                <label>Email</label>
                <div className="info-value">
                  <FaEnvelope className="info-icon" />
                  <span>{user?.email}</span>
                </div>
              </div>

              <div className="info-item">
                <label>Họ và tên</label>
                <div className="info-value">
                  <FaUser className="info-icon" />
                  {editMode ? (
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <span>{user?.full_name || 'Chưa cập nhật'}</span>
                  )}
                </div>
              </div>

              <div className="info-item">
                <label>Số điện thoại</label>
                <div className="info-value">
                  <FaPhone className="info-icon" />
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <span>{user?.phone || 'Chưa cập nhật'}</span>
                  )}
                </div>
              </div>

              <div className="info-item">
                <label>Giới tính</label>
                <div className="info-value">
                  <FaVenusMars className="info-icon" />
                  {editMode ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  ) : (
                    <span>{getGenderLabel(user?.gender)}</span>
                  )}
                </div>
              </div>

              <div className="info-item">
                <label>Ngày sinh</label>
                <div className="info-value">
                  <FaCalendarAlt className="info-icon" />
                  {editMode ? (
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <span>{formatDate(user?.dob)}</span>
                  )}
                </div>
              </div>

              <div className="info-item full-width">
                <label>Địa chỉ</label>
                <div className="info-value">
                  <FaMapMarkerAlt className="info-icon" />
                  {editMode ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <span>{user?.address || 'Chưa cập nhật'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="info-card">
            <div className="card-header">
              <h2>
                <FaLock /> Bảo mật
              </h2>
              {!showPasswordForm && (
                <button className="edit-btn" onClick={() => setShowPasswordForm(true)}>
                  <FaLock /> Đổi mật khẩu
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <div className="password-form">
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small>Mật khẩu phải có ít nhất 6 ký tự</small>
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <div className="password-input-wrapper">
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}>
                    Hủy
                  </button>
                  <button className="save-btn" onClick={handleChangePassword} disabled={saving}>
                    {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            ) : (
              <div className="security-info">
                <p>Để bảo mật tài khoản, vui lòng đổi mật khẩu định kỳ.</p>
                <p className="security-tip">
                  <FaExclamationTriangle /> Không chia sẻ mật khẩu với bất kỳ ai.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && avatarPreview && (
        <div className="modal-overlay" onClick={() => setShowAvatarUpload(false)}>
          <div className="modal-content avatar-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cập nhật ảnh đại diện</h2>
              <button className="close-btn" onClick={() => setShowAvatarUpload(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="avatar-preview">
                <img src={avatarPreview} alt="Preview" />
              </div>
              <p>Bạn có muốn sử dụng ảnh này làm ảnh đại diện?</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAvatarUpload(false)}>
                Hủy
              </button>
              <button className="save-btn" onClick={handleUploadAvatar} disabled={saving}>
                {saving ? <FaSpinner className="spinning" /> : <FaCheck />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;