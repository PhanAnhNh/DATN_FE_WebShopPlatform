// src/pages/admin/users/UsersManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Save, AlertCircle, CheckCircle, Upload, Link as LinkIcon, Image as ImageIcon
} from 'lucide-react';
import api from '../../api/api';
import '../../css/AdminManageLayout.css';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Toast states
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadMethod, setAvatarUploadMethod] = useState('url');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    address: '',
    gender: '',
    role: 'user',
    is_active: true,
    password: '',
    avatar_url: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/users');
      console.log('Users data:', response.data);
      setUsers(response.data);
      setTotalUsers(response.data.length);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPLOAD AVATAR TO R2 ====================
  
  const uploadImageToR2 = async (file) => {
    if (!file) return null;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await api.post('/api/v1/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        return response.data.image_url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      if (error.response?.data?.detail) {
        showToast(`Lỗi upload: ${error.response.data.detail}`, 'error');
      } else {
        showToast('Có lỗi xảy ra khi upload ảnh', 'error');
      }
      return null;
    }
  };

  // ==================== AVATAR HANDLERS ====================
  
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 5MB', 'error');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUrlInput('');
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  const handleAvatarUrlChange = (e) => {
    const url = e.target.value;
    setAvatarUrlInput(url);
    setAvatarPreview(url);
    setAvatarFile(null);
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  const resetAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrlInput('');
    setAvatarUploadMethod('url');
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const fullName = user.full_name?.toLowerCase() || '';
    const phone = user.phone?.toString() || '';
    return (
      username.includes(searchLower) ||
      email.includes(searchLower) ||
      fullName.includes(searchLower) ||
      phone.includes(searchTerm)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.username) errors.username = 'Tên đăng nhập không được để trống';
    if (!formData.email) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email không hợp lệ';
    
    if (modalMode === 'add' && !formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (modalMode === 'add' && formData.password && formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    return errors;
  };

  // Handle add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setUploadingAvatar(true);
    
    try {
      // Upload avatar if exists
      let uploadedAvatarUrl = null;
      if (avatarFile) {
        uploadedAvatarUrl = await uploadImageToR2(avatarFile);
        if (!uploadedAvatarUrl) {
          setSubmitting(false);
          setUploadingAvatar(false);
          return;
        }
      }
      
      const finalAvatarUrl = uploadedAvatarUrl || formData.avatar_url || null;
      
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        address: formData.address || null,
        gender: formData.gender || null,
        role: formData.role,
        avatar_url: finalAvatarUrl
      };
      
      console.log('Sending user data:', userData);
      
      const response = await api.post('/api/v1/users', userData);
      console.log('API Response:', response.data);
      
      if (response.data) {
        showToast('Thêm người dùng thành công!', 'success');
        setShowModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Có lỗi xảy ra khi thêm người dùng';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
      setUploadingAvatar(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setUploadingAvatar(true);
    
    try {
      // Upload new avatar if exists
      let uploadedAvatarUrl = null;
      if (avatarFile) {
        uploadedAvatarUrl = await uploadImageToR2(avatarFile);
      }
      
      const finalAvatarUrl = uploadedAvatarUrl || formData.avatar_url || null;
      
      const updateData = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        address: formData.address || null,
        gender: formData.gender || null,
        role: formData.role,
        is_active: formData.is_active,
        avatar_url: finalAvatarUrl
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      const response = await api.put(`/api/v1/users/${selectedUser._id}`, updateData);
      if (response.data) {
        showToast('Cập nhật người dùng thành công!', 'success');
        setShowModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showToast(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật', 'error');
    } finally {
      setSubmitting(false);
      setUploadingAvatar(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    setDialogConfig({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/api/v1/users/${userId}`);
          if (response.data) {
            showToast('Xóa người dùng thành công!', 'success');
            fetchUsers();
          }
        } catch (err) {
          console.error('Error deleting user:', err);
          showToast(err.response?.data?.detail || 'Có lỗi xảy ra khi xóa', 'error');
        }
      }
    });
    setShowConfirmDialog(true);
  };

  // Open modal for view/edit/add
  const openModal = (mode, user = null) => {
    setModalMode(mode);
    resetAvatar();
    
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        gender: user.gender || '',
        role: user.role || 'user',
        is_active: user.is_active !== false,
        password: '',
        avatar_url: user.avatar_url || ''
      });
      
      // Set preview for existing avatar
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
        setAvatarUrlInput(user.avatar_url);
      }
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      phone: '',
      address: '',
      gender: '',
      role: 'user',
      is_active: true,
      password: '',
      avatar_url: ''
    });
    setFormErrors({});
    setSelectedUser(null);
    resetAvatar();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = ['Thứ tự', 'Tên người dùng', 'Email', 'Số điện thoại', 'Địa chỉ', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map((user, index) => [
        index + 1,
        user.username,
        user.email,
        user.phone || '',
        user.address || '',
        user.is_active ? 'Hoạt động' : 'Khóa'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'danh_sach_nguoi_dung.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Xuất file Excel thành công!', 'success');
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  };

  // Component upload avatar
  const AvatarUploadSection = ({ isViewMode }) => (
    <div className="form-group full-width">
      <label>Ảnh đại diện (Avatar)</label>
      
      {!isViewMode && (
        <div className="image-method-selector" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            type="button"
            className={`method-btn ${avatarUploadMethod === 'url' ? 'active' : ''}`}
            onClick={() => setAvatarUploadMethod('url')}
            style={{
              padding: '8px 16px',
              background: avatarUploadMethod === 'url' ? '#1976d2' : '#e0e0e0',
              color: avatarUploadMethod === 'url' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <LinkIcon size={16} style={{ marginRight: '5px' }} /> Nhập URL
          </button>
          <button
            type="button"
            className={`method-btn ${avatarUploadMethod === 'file' ? 'active' : ''}`}
            onClick={() => setAvatarUploadMethod('file')}
            style={{
              padding: '8px 16px',
              background: avatarUploadMethod === 'file' ? '#1976d2' : '#e0e0e0',
              color: avatarUploadMethod === 'file' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Upload size={16} style={{ marginRight: '5px' }} /> Tải lên từ máy
          </button>
        </div>
      )}

      {avatarUploadMethod === 'url' ? (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Nhập URL ảnh đại diện"
            value={avatarUrlInput}
            onChange={handleAvatarUrlChange}
            disabled={isViewMode}
            style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
          />
        </div>
      ) : (
        !isViewMode && (
          <div className="image-upload-container" style={{ marginBottom: '10px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#4caf50',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              <Upload size={16} style={{ marginRight: '5px' }} /> Chọn ảnh từ máy
            </label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Hỗ trợ: JPG, PNG, GIF, WebP (Tối đa 5MB)
            </p>
          </div>
        )
      )}
      
      {avatarPreview && (
        <div className="image-preview" style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
          <img 
            src={avatarPreview} 
            alt="Avatar preview" 
            style={{ 
              width: '100px', 
              height: '100px', 
              objectFit: 'cover', 
              borderRadius: '50%', 
              border: '2px solid #1976d2'
            }} 
          />
          {!isViewMode && (
            <button 
              type="button"
              onClick={resetAvatar}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  // CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
      }
      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <div className="users-management">
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
      />

      <div className="page-header">
        <h2 className="page-title">Quản Lý Người Dùng</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Actions Bar */}
      <div className="actions-bar">
        <div className="users-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="users-search-input"
          />
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => openModal('add')}>
            <Plus size={18} />
            <span>Thêm người dùng</span>
          </button>
          <button className="btn btn-success" onClick={handleExportExcel}>
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className="user-info-cell">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="user-avatar-small" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="user-avatar-small default">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="user-name">{user.full_name || user.username}</div>
                          <div className="user-username">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td>{user.address || '—'}</td>
                    <td>
                      <span className={getStatusBadge(user.is_active)}>
                        {user.is_active ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button 
                          className="action-btn view" 
                          onClick={() => openModal('view', user)}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          onClick={() => openModal('edit', user)}
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDeleteUser(user._id)}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} / {filteredUsers.length} người dùng
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
          <div className="pagination-items-per-page">
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="items-per-page-select"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>
                {modalMode === 'add' ? 'Thêm người dùng mới' : 
                 modalMode === 'edit' ? 'Sửa thông tin người dùng' : 
                 'Chi tiết người dùng'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleAddUser : handleUpdateUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="username">Tên đăng nhập *</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view' || modalMode === 'edit'}
                      className={formErrors.username ? 'error' : ''}
                    />
                    {formErrors.username && (
                      <span className="error-message">{formErrors.username}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view' || modalMode === 'edit'}
                      className={formErrors.email ? 'error' : ''}
                    />
                    {formErrors.email && (
                      <span className="error-message">{formErrors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="full_name">Họ và tên</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Giới tính</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">Vai trò</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    >
                      <option value="user">Người dùng</option>
                      <option value="shop_owner">Chủ cửa hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>

                  {/* Avatar upload section */}
                  <AvatarUploadSection isViewMode={modalMode === 'view'} />

                  <div className="form-group full-width">
                    <label htmlFor="address">Địa chỉ</label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      rows="3"
                    />
                  </div>

                  {modalMode === 'add' && (
                    <div className="form-group">
                      <label htmlFor="password">Mật khẩu *</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={formErrors.password ? 'error' : ''}
                        placeholder="Ít nhất 6 ký tự"
                      />
                      {formErrors.password && (
                        <span className="error-message">{formErrors.password}</span>
                      )}
                    </div>
                  )}

                  {modalMode === 'edit' && (
                    <div className="form-group">
                      <label htmlFor="password">Mật khẩu mới (để trống nếu không đổi)</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
                      />
                    </div>
                  )}

                  {modalMode !== 'add' && (
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          disabled={modalMode === 'view'}
                        />
                        <span>Kích hoạt tài khoản</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                {modalMode !== 'view' && (
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting || uploadingAvatar}
                  >
                    <Save size={18} />
                    <span>{submitting ? 'Đang lưu...' : 'Lưu'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;