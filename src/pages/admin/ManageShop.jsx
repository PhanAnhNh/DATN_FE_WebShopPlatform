// src/pages/admin/shops/ShopsManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Save, AlertCircle, CheckCircle, Store, MapPin, Link as LinkIcon
} from 'lucide-react';
import api from '../../api/api';
import '../../css/AdminManageLayout.css';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

const ShopsManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalShops, setTotalShops] = useState(0);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit, view
  const [selectedShop, setSelectedShop] = useState(null);
  
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
    status: 'active',
    is_verified: false
  });

  const [createOwnerAccount, setCreateOwnerAccount] = useState(false);
  const [ownerFormData, setOwnerFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    gender: '',
    address: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch shops from API
  useEffect(() => {
    fetchShops();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchShops = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await api.get('/admin/shops');
    console.log('Shops data:', response.data);
    setShops(response.data);
    setTotalShops(response.data.length);
  } catch (err) {
    console.error('Error fetching shops:', err);
    setError('Không thể tải danh sách cửa hàng');
  } finally {
    setLoading(false);
  }
};

  const handleOwnerInputChange = (e) => {
    const { name, value } = e.target;
    setOwnerFormData(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi khi người dùng nhập
    if (formErrors[`owner_${name}`]) {
      setFormErrors(prev => ({ ...prev, [`owner_${name}`]: '' }));
    }
  };

  // Filter shops based on search term
  const filteredShops = shops.filter(shop => {
    if (!shop) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    const name = shop.name?.toLowerCase() || '';
    const phone = shop.phone?.toString() || '';
    const email = shop.email?.toLowerCase() || '';
    const address = shop.address?.toLowerCase() || '';
    
    return (
      name.includes(searchLower) ||
      phone.includes(searchTerm) ||
      email.includes(searchLower) ||
      address.includes(searchLower)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShops = filteredShops.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Tạo slug tự động từ tên nếu đang thêm mới
    if (name === 'name' && modalMode === 'add') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // SỬA LẠI hàm validateForm
  const validateForm = () => {
    const errors = {};
    
    // Validate shop
    if (!formData.name) errors.name = 'Tên cửa hàng không được để trống';
    if (!formData.slug) errors.slug = 'Slug không được để trống';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    // Validate owner nếu có chọn tạo tài khoản
    if (createOwnerAccount) {
      if (!ownerFormData.username) errors.owner_username = 'Tên đăng nhập không được để trống';
      if (!ownerFormData.email) errors.owner_email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(ownerFormData.email)) {
        errors.owner_email = 'Email không hợp lệ';
      }
      if (!ownerFormData.password) errors.owner_password = 'Mật khẩu không được để trống';
      else if (ownerFormData.password.length < 6) {
        errors.owner_password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }
    
    return errors;
  };

  // Handle add shop
  // SỬA LẠI hàm handleAddShop (QUAN TRỌNG NHẤT)
  const handleAddShop = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      let response;
      
      if (createOwnerAccount) {
        // Gọi API tạo cả shop và tài khoản
        const combinedData = {
          // Thông tin shop
          shop_name: formData.name,
          shop_slug: formData.slug,
          shop_description: formData.description,
          shop_phone: formData.phone,
          shop_email: formData.email,
          shop_address: formData.address,
          shop_province: formData.province,
          shop_district: formData.district,
          shop_ward: formData.ward,
          shop_logo_url: formData.logo_url,
          shop_banner_url: formData.banner_url,
          
          // Thông tin chủ shop
          owner_username: ownerFormData.username,
          owner_email: ownerFormData.email,
          owner_password: ownerFormData.password,
          owner_full_name: ownerFormData.full_name,
          owner_phone: ownerFormData.phone,
          owner_gender: ownerFormData.gender,
          owner_address: ownerFormData.address || formData.address
        };
        
        console.log('Sending combined data:', combinedData);
        response = await api.post('/shops/with-owner', combinedData);
      } else {

        showToast('Vui lòng chọn "Tạo tài khoản chủ shop" hoặc thêm chức năng chọn owner', 'error');
        setSubmitting(false);
        return;

      }
      
      console.log('API Response:', response.data);
      
      if (response.data) {
        let message = 'Thêm cửa hàng thành công!';
        if (createOwnerAccount && response.data.data) {
          const { login_info } = response.data.data;
          message = `Tạo cửa hàng và tài khoản thành công! 
Tên đăng nhập: ${login_info.username}
Mật khẩu: ${login_info.password}`;
        }
        
        showToast(message, 'success');
        setShowModal(false);
        
        // Reset form
        resetForm();
        setOwnerFormData({
          username: '', email: '', password: '', 
          full_name: '', phone: '', gender: '', address: ''
        });
        setCreateOwnerAccount(false);
        
        fetchShops();
      }
    } catch (err) {
      console.error('Error details:', err);
      console.error('Server error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Có lỗi xảy ra khi thêm cửa hàng';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update shop
  const handleUpdateShop = async (e) => {
  e.preventDefault();
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  setSubmitting(true);
  try {
    const response = await api.put(`/admin/shops/${selectedShop._id}`, formData);
    if (response.data) {
      showToast('Cập nhật cửa hàng thành công!', 'success');
      setShowModal(false);
      resetForm();
      fetchShops();
    }
  } catch (err) {
    console.error('Error updating shop:', err);
    showToast(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật', 'error');
  } finally {
    setSubmitting(false);
  }
};

  // Handle delete shop
  const handleDeleteShop = (shopId) => {
  setDialogConfig({
    title: 'Xác nhận xóa',
    message: 'Bạn có chắc chắn muốn xóa cửa hàng này? Hành động này không thể hoàn tác.',
    type: 'warning',
    onConfirm: async () => {
      try {
        const response = await api.delete(`/admin/shops/${shopId}`);
        if (response.data) {
          showToast('Xóa cửa hàng thành công!', 'success');
          fetchShops();
        }
      } catch (err) {
        console.error('Error deleting shop:', err);
        showToast(err.response?.data?.detail || 'Có lỗi xảy ra khi xóa', 'error');
      }
    }
  });
  setShowConfirmDialog(true);
};
  
  // Open modal for view/edit/add
  const openModal = (mode, shop = null) => {
    setModalMode(mode);
    if (shop) {
      setSelectedShop(shop);
      setFormData({
        name: shop.name || '',
        slug: shop.slug || '',
        description: shop.description || '',
        phone: shop.phone || '',
        email: shop.email || '',
        address: shop.address || '',
        province: shop.province || '',
        district: shop.district || '',
        ward: shop.ward || '',
        logo_url: shop.logo_url || '',
        banner_url: shop.banner_url || '',
        status: shop.status || 'active',
        is_verified: shop.is_verified || false
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // THÊM resetFormOwner
  const resetForm = () => {
    setFormData({
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
      status: 'active',
      is_verified: false
    });
    setFormErrors({});
    setSelectedShop(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = ['Thứ tự', 'Tên cửa hàng', 'Số điện thoại', 'Địa chỉ', 'Link trang', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...filteredShops.map((shop, index) => [
        index + 1,
        shop.name,
        shop.phone || '',
        shop.address || '',
        `/shop/${shop.slug}`,
        shop.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'danh_sach_cua_hang.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Xuất file Excel thành công!', 'success');
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'status-badge active' : 'status-badge inactive';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động';
  };

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
        <h2 className="page-title">Quản Lý Cửa Hàng</h2>
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
            placeholder="Nhập tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="users-search-input"
          />
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => openModal('add')}>
            <Plus size={18} />
            <span>Thêm cửa hàng</span>
          </button>
          <button className="btn btn-success" onClick={handleExportExcel}>
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Shops Table */}
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
                <th>Tên Cửa Hàng</th>
                <th>Số Điện Thoại</th>
                <th>Địa chỉ</th>
                <th>Link trang</th>
                <th>Trạng thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {currentShops.length > 0 ? (
                currentShops.map((shop, index) => (
                  <tr key={shop._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className="user-info-cell">
                        {shop.logo_url ? (
                          <img src={shop.logo_url} alt={shop.name} className="user-avatar-small" />
                        ) : (
                          <div className="user-avatar-small default">
                            <Store size={18} />
                          </div>
                        )}
                        <div>
                          <div className="user-name">{shop.name}</div>
                          <div className="user-username">SLUG: {shop.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{shop.phone || '—'}</td>
                    <td>
                      {shop.address ? (
                        <div className="user-username">
                          <MapPin size={12} style={{ marginRight: '4px' }} />
                          {shop.address}
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {shop.slug ? (
                        <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="user-username">
                          <LinkIcon size={12} style={{ marginRight: '4px' }} />
                          /shop/{shop.slug}
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={getStatusBadge(shop.status)}>
                        {getStatusText(shop.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button 
                          className="action-btn view" 
                          onClick={() => openModal('view', shop)}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          onClick={() => openModal('edit', shop)}
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteShop(shop._id)} // Gọi hàm xóa
                          title="Xóa cửa hàng"
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
      {!loading && filteredShops.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredShops.length)} / {filteredShops.length} cửa hàng
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

      {/* Shop Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'add' ? 'Thêm cửa hàng mới' : 
                 modalMode === 'edit' ? 'Sửa thông tin cửa hàng' : 
                 'Chi tiết cửa hàng'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleAddShop : handleUpdateShop}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Tên cửa hàng */}
                  <div className="form-group">
                    <label htmlFor="name">Tên cửa hàng *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className={formErrors.name ? 'error' : ''}
                    />
                    {formErrors.name && (
                      <span className="error-message">{formErrors.name}</span>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="form-group">
                    <label htmlFor="slug">Slug (URL) *</label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className={formErrors.slug ? 'error' : ''}
                      placeholder="ten-cua-hang"
                    />
                    {formErrors.slug && (
                      <span className="error-message">{formErrors.slug}</span>
                    )}
                  </div>

                  {/* Số điện thoại */}
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

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
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

                  {/* Địa chỉ */}
                  <div className="form-group full-width">
                    <label htmlFor="address">Địa chỉ</label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      rows="2"
                    />
                  </div>

                  {/* Tỉnh/Thành */}
                  <div className="form-group">
                    <label htmlFor="province">Tỉnh/Thành phố</label>
                    <input
                      type="text"
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  {/* Quận/Huyện */}
                  <div className="form-group">
                    <label htmlFor="district">Quận/Huyện</label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  {/* Phường/Xã */}
                  <div className="form-group">
                    <label htmlFor="ward">Phường/Xã</label>
                    <input
                      type="text"
                      id="ward"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  {/* Logo URL */}
                  <div className="form-group">
                    <label htmlFor="logo_url">Logo URL</label>
                    <input
                      type="text"
                      id="logo_url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  {/* Banner URL */}
                  <div className="form-group">
                    <label htmlFor="banner_url">Banner URL</label>
                    <input
                      type="text"
                      id="banner_url"
                      name="banner_url"
                      value={formData.banner_url}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  {/* Mô tả */}
                  <div className="form-group full-width">
                    <label htmlFor="description">Mô tả</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      rows="3"
                    />
                  </div>
                  
            {modalMode === 'add' && (
            <div className="owner-section" style={{ 
                marginTop: '30px', 
                borderTop: '2px dashed #1976d2', 
                paddingTop: '20px' 
            }}>
                <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                background: '#e3f2fd',
                padding: '10px 15px',
                borderRadius: '8px'
                }}>
                <input
                    type="checkbox"
                    id="createOwner"
                    checked={createOwnerAccount}
                    onChange={(e) => setCreateOwnerAccount(e.target.checked)}
                    style={{ 
                    width: '18px', 
                    height: '18px', 
                    marginRight: '10px',
                    cursor: 'pointer'
                    }}
                />
                <label htmlFor="createOwner" style={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}>
                    Tạo tài khoản chủ shop mới (Khuyến nghị)
                </label>
                </div>
                
                {createOwnerAccount && (
                <div className="owner-form" style={{ 
                    background: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0'
                }}>
                    <h4 style={{ 
                    marginBottom: '20px', 
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                    }}>
                    <span style={{
                        background: '#1976d2',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                    }}>✓</span>
                    Thông tin tài khoản chủ shop
                    </h4>
                    
                    <div className="form-grid">
                    {/* Username */}
                    <div className="form-group">
                        <label htmlFor="owner_username">
                        Tên đăng nhập <span style={{ color: '#d32f2f' }}>*</span>
                        </label>
                        <input
                        type="text"
                        id="owner_username"
                        name="username"
                        value={ownerFormData.username}
                        onChange={handleOwnerInputChange}
                        className={formErrors.owner_username ? 'error' : ''}
                        placeholder="vd: chushop123"
                        />
                        {formErrors.owner_username && (
                        <span className="error-message">{formErrors.owner_username}</span>
                        )}
                    </div>
                    
                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="owner_email">
                        Email <span style={{ color: '#d32f2f' }}>*</span>
                        </label>
                        <input
                        type="email"
                        id="owner_email"
                        name="email"
                        value={ownerFormData.email}
                        onChange={handleOwnerInputChange}
                        className={formErrors.owner_email ? 'error' : ''}
                        placeholder="shop@example.com"
                        />
                        {formErrors.owner_email && (
                        <span className="error-message">{formErrors.owner_email}</span>
                        )}
                    </div>
                    
                    {/* Password */}
                    <div className="form-group">
                        <label htmlFor="owner_password">
                        Mật khẩu <span style={{ color: '#d32f2f' }}>*</span>
                        </label>
                        <input
                        type="password"
                        id="owner_password"
                        name="password"
                        value={ownerFormData.password}
                        onChange={handleOwnerInputChange}
                        className={formErrors.owner_password ? 'error' : ''}
                        placeholder="Ít nhất 6 ký tự"
                        />
                        {formErrors.owner_password && (
                        <span className="error-message">{formErrors.owner_password}</span>
                        )}
                    </div>
                    
                    {/* Họ tên */}
                    <div className="form-group">
                        <label htmlFor="owner_full_name">Họ và tên</label>
                        <input
                        type="text"
                        id="owner_full_name"
                        name="full_name"
                        value={ownerFormData.full_name}
                        onChange={handleOwnerInputChange}
                        placeholder="Nguyễn Văn A"
                        />
                    </div>
                    
                    {/* Số điện thoại */}
                    <div className="form-group">
                        <label htmlFor="owner_phone">Số điện thoại</label>
                        <input
                        type="tel"
                        id="owner_phone"
                        name="phone"
                        value={ownerFormData.phone}
                        onChange={handleOwnerInputChange}
                        placeholder="0912345678"
                        />
                    </div>
                    
                    {/* Giới tính */}
                    <div className="form-group">
                        <label htmlFor="owner_gender">Giới tính</label>
                        <select
                        id="owner_gender"
                        name="gender"
                        value={ownerFormData.gender}
                        onChange={handleOwnerInputChange}
                        >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                        </select>
                    </div>
                    
                    {/* Địa chỉ */}
                    <div className="form-group full-width">
                        <label htmlFor="owner_address">Địa chỉ</label>
                        <textarea
                        id="owner_address"
                        name="address"
                        value={ownerFormData.address}
                        onChange={handleOwnerInputChange}
                        rows="2"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                        />
                    </div>
                    </div>
                    
                    {/* Ghi chú */}
                    <div style={{
                    background: '#fff3e0',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '15px',
                    fontSize: '13px',
                    color: '#e65100',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                    }}>
                    <AlertCircle size={16} />
                    <span>
                        Tài khoản sẽ được tạo với quyền "Chủ shop". 
                        Sau khi tạo, chủ shop có thể đăng nhập bằng email/mật khẩu này.
                    </span>
                    </div>
                </div>
                )}
                
                {!createOwnerAccount && (
                <div style={{
                    background: '#fff3e0',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #ffe0b2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertCircle size={20} color="#e65100" />
                    <span style={{ color: '#e65100' }}>
                    Bạn cần tạo tài khoản chủ shop để có thể đăng nhập vào cửa hàng này!
                    </span>
                </div>
                )}
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

export default ShopsManagement;