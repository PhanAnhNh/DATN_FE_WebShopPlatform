import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Save, AlertCircle, CheckCircle
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
    password: ''
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
// Filter users based on search term - Cách an toàn nhất
const filteredUsers = users.filter(user => {
  if (!user) return false;
  
  // Nếu searchTerm rỗng thì hiển thị tất cả
  if (!searchTerm) return true;
  
  const searchLower = searchTerm.toLowerCase();
  
  // Kiểm tra từng field với optional chaining và ép kiểu về string
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
    }
    
    return errors;
  };

  // Handle add user
// Sửa lại handleAddUser
const handleAddUser = async (e) => {
  e.preventDefault();
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  setSubmitting(true);
  try {
    // Log dữ liệu gửi lên
    console.log('Sending data to API:', formData);
    
    const response = await api.post('/api/v1/users', formData);
    console.log('API Response:', response.data);
    
    if (response.data) {
      showToast('Thêm người dùng thành công!', 'success');
      setShowModal(false);
      resetForm();
      fetchUsers();
    }
  } catch (err) {
    console.error('Error details:', err);
    // Log chi tiết lỗi từ server
    console.error('Server error response:', err.response?.data);
    
    // Hiển thị lỗi chi tiết hơn
    const errorMessage = err.response?.data?.detail || 
                        err.response?.data?.message || 
                        'Có lỗi xảy ra khi thêm người dùng';
    showToast(errorMessage, 'error');
  } finally {
    setSubmitting(false);
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
    try {
      const response = await api.put(`/api/v1/users/${selectedUser._id}`, formData);
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
        password: ''
      });
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
      password: ''
    });
    setFormErrors({});
    setSelectedUser(null);
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

  // Thêm CSS animations vào file CSS
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
        <div className="toast-container"> {/* THÊM container này */}
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
                          <img src={user.avatar_url} alt={user.username} className="user-avatar-small" />
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                      disabled={modalMode === 'view'}
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
                      disabled={modalMode === 'view'}
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
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        className={formErrors.password ? 'error' : ''}
                      />
                      {formErrors.password && (
                        <span className="error-message">{formErrors.password}</span>
                      )}
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
                    disabled={submitting}
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