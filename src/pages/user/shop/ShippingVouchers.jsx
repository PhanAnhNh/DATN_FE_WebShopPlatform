import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaSpinner, FaTimes, FaSave, FaTag, FaPercent, FaMoneyBillWave,
  FaCalendarAlt, FaTruck, FaChevronLeft, FaChevronRight,
  FaAngleDoubleLeft, FaAngleDoubleRight, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaPowerOff, FaPlay
} from 'react-icons/fa';
import { shopApi } from '../../../api/api';
import '../../../css/ShippingVouchers.css';

const ShippingVouchers = () => {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
    total_used: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [shippingUnit, setShippingUnit] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_discount: '',
    min_order_value: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch shipping unit info
  useEffect(() => {
    fetchShippingUnit();
  }, []);

  // Fetch vouchers
  useEffect(() => {
    fetchVouchers();
    fetchStats();
  }, [pagination.page, debouncedSearch, selectedStatus]);

  const fetchShippingUnit = async () => {
    try {
      const response = await shopApi.get('/api/v1/shipping-units/shop');
      if (response.data && response.data.data && response.data.data.length > 0) {
        setShippingUnit(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching shipping unit:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shipping-vouchers/shop', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          status: selectedStatus || undefined
        }
      });
      
      setVouchers(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await shopApi.get('/api/v1/shipping-vouchers/shop/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVoucher = async () => {
    if (!formData.code || !formData.discount_value || !formData.start_date || !formData.end_date) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (!shippingUnit) {
      alert('Chưa có đơn vị vận chuyển');
      return;
    }

    try {
      setSaving(true);
      
      const voucherData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        shipping_unit_id: shippingUnit.id,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        description: formData.description
      };
      
      await shopApi.post('/api/v1/shipping-vouchers/shop', voucherData);
      
      fetchVouchers();
      fetchStats();
      setShowAddModal(false);
      resetForm();
      alert('Thêm voucher vận chuyển thành công!');
    } catch (error) {
      console.error('Error adding voucher:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleEditVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setFormData({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      max_discount: voucher.max_discount || '',
      min_order_value: voucher.min_order_value || '',
      usage_limit: voucher.usage_limit || '',
      start_date: new Date(voucher.start_date).toISOString().split('T')[0],
      end_date: new Date(voucher.end_date).toISOString().split('T')[0],
      description: voucher.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateVoucher = async () => {
    if (!selectedVoucher) return;

    try {
      setSaving(true);
      
      const updateData = {
        discount_value: parseFloat(formData.discount_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        description: formData.description
      };
      
      await shopApi.put(`/api/v1/shipping-vouchers/shop/${selectedVoucher.id}`, updateData);
      
      fetchVouchers();
      fetchStats();
      setShowEditModal(false);
      resetForm();
      alert('Cập nhật voucher thành công!');
    } catch (error) {
      console.error('Error updating voucher:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (voucher) => {
    const newStatus = voucher.status === 'active' ? 'inactive' : 'active';
    try {
      await shopApi.patch(`/api/v1/shipping-vouchers/shop/${voucher.id}/status?status=${newStatus}`);
      fetchVouchers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDeleteVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedVoucher) return;

    try {
      await shopApi.delete(`/api/v1/shipping-vouchers/shop/${selectedVoucher.id}`);
      fetchVouchers();
      fetchStats();
      setShowDeleteConfirm(false);
      setSelectedVoucher(null);
      alert('Xóa voucher thành công!');
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleViewDetail = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: '',
      max_discount: '',
      min_order_value: '',
      usage_limit: '',
      start_date: '',
      end_date: '',
      description: ''
    });
    setSelectedVoucher(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getDiscountText = (voucher) => {
    if (voucher.discount_type === 'percent') {
      return `${voucher.discount_value}%`;
    }
    return formatCurrency(voucher.discount_value);
  };

  const getDiscountDetail = (voucher) => {
    if (voucher.discount_type === 'percent' && voucher.max_discount) {
      return `Giảm ${voucher.discount_value}% tối đa ${formatCurrency(voucher.max_discount)}`;
    }
    return getDiscountText(voucher);
  };

  const getStatusBadge = (status, endDate) => {
    const isExpired = endDate && new Date(endDate) < new Date();
    
    if (isExpired) {
      return { label: 'Đã hết hạn', color: '#6c757d', icon: FaClock, class: 'expired' };
    }
    
    const statusMap = {
      active: { label: 'Đang hoạt động', color: '#28a745', icon: FaCheckCircle, class: 'active' },
      inactive: { label: 'Tạm ngưng', color: '#dc3545', icon: FaPowerOff, class: 'inactive' }
    };
    return statusMap[status] || { label: status, color: '#6c757d', icon: FaClock, class: 'unknown' };
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Modal: Add/Edit Voucher
  const VoucherFormModal = ({ isOpen, onClose, title, onSubmit, saving }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content voucher-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Mã voucher <span className="required">*</span></label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Nhập mã voucher (VD: SHIP10)"
                  disabled={title === 'Sửa voucher'}
                />
                {title !== 'Sửa voucher' && (
                  <small>Chỉ nhập chữ in hoa, số và dấu gạch dưới</small>
                )}
              </div>

              <div className="form-group">
                <label>Loại giảm giá <span className="required">*</span></label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                >
                  <option value="percent">Giảm theo phần trăm (%)</option>
                  <option value="fixed">Giảm theo số tiền cố định</option>
                </select>
              </div>

              <div className="form-group">
                <label>Giá trị giảm <span className="required">*</span></label>
                <input
                  type="number"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  placeholder={formData.discount_type === 'percent' ? 'Nhập số phần trăm' : 'Nhập số tiền giảm'}
                  min="0"
                  step={formData.discount_type === 'percent' ? '1' : '1000'}
                />
              </div>

              {formData.discount_type === 'percent' && (
                <div className="form-group">
                  <label>Giảm tối đa</label>
                  <input
                    type="number"
                    name="max_discount"
                    value={formData.max_discount}
                    onChange={handleInputChange}
                    placeholder="Nhập số tiền giảm tối đa"
                    min="0"
                    step="1000"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Đơn hàng tối thiểu</label>
                <input
                  type="number"
                  name="min_order_value"
                  value={formData.min_order_value}
                  onChange={handleInputChange}
                  placeholder="Nhập số tiền tối thiểu"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group">
                <label>Giới hạn số lượng</label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleInputChange}
                  placeholder="Để trống nếu không giới hạn"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Ngày bắt đầu <span className="required">*</span></label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Ngày kết thúc <span className="required">*</span></label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập mô tả voucher (nếu có)"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button 
              className="save-btn" 
              onClick={onSubmit}
              disabled={saving}
            >
              {saving ? <FaSpinner className="spinning" /> : <FaSave />}
              {saving ? 'Đang lưu...' : (title === 'Thêm voucher' ? 'Thêm voucher' : 'Cập nhật')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal: Detail Voucher
  const DetailModal = ({ isOpen, onClose, voucher }) => {
    if (!isOpen || !voucher) return null;

    const statusInfo = getStatusBadge(voucher.status, voucher.end_date);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Chi tiết voucher</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <div className="voucher-detail">
              <div className="detail-header">
                <div className="voucher-badge">
                  <FaTag />
                  {voucher.code}
                </div>
                <span 
                  className={`status-badge ${statusInfo.class}`}
                  style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                >
                  <StatusIcon size={12} />
                  {statusInfo.label}
                </span>
              </div>

              <div className="detail-section">
                <h3>Thông tin giảm giá</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Loại giảm giá:</label>
                    <span>{voucher.discount_type === 'percent' ? 'Phần trăm (%)' : 'Số tiền cố định'}</span>
                  </div>
                  <div className="info-item">
                    <label>Giá trị giảm:</label>
                    <span className="discount-value">{getDiscountDetail(voucher)}</span>
                  </div>
                  {voucher.max_discount && (
                    <div className="info-item">
                      <label>Giảm tối đa:</label>
                      <span>{formatCurrency(voucher.max_discount)}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Đơn hàng tối thiểu:</label>
                    <span>{formatCurrency(voucher.min_order_value)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Thông tin sử dụng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Đã sử dụng:</label>
                    <span>{voucher.used_count}/{voucher.usage_limit || '∞'}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày bắt đầu:</label>
                    <span>{formatDateTime(voucher.start_date)}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày kết thúc:</label>
                    <span>{formatDateTime(voucher.end_date)}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày tạo:</label>
                    <span>{formatDateTime(voucher.created_at)}</span>
                  </div>
                </div>
              </div>

              {voucher.description && (
                <div className="detail-section">
                  <h3>Mô tả</h3>
                  <p className="description">{voucher.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal: Delete Confirmation
  const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, voucher }) => {
    if (!isOpen || !voucher) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Xác nhận xóa</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <FaExclamationTriangle className="warning-icon" />
            <p>Bạn có chắc chắn muốn xóa voucher <strong>{voucher.code}</strong>?</p>
            <p className="warning-text">Hành động này không thể hoàn tác!</p>
          </div>

          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button className="delete-btn" onClick={onConfirm}>
              Xóa voucher
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="shipping-vouchers">
      <div className="vouchers-header">
        <h1 className="vouchers-title">
          <FaTruck style={{ marginRight: '12px' }} />
          Voucher Vận Chuyển
        </h1>
        
        <div className="vouchers-actions">
          <button 
            className="add-btn"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FaPlus /> Thêm voucher
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="vouchers-stats">
        <div className="stat-card">
          <div className="stat-icon green">
            <FaTag />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng voucher</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đang hoạt động</span>
            <span className="stat-value">{stats.active}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orange">
            <FaPowerOff />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tạm ngưng</span>
            <span className="stat-value">{stats.inactive}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple">
            <FaClock />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đã sử dụng</span>
            <span className="stat-value">{stats.total_used}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="vouchers-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Lọc
        </button>

        {(selectedStatus || searchTerm) && (
          <button className="clear-filters" onClick={clearFilters}>
            <FaTimes /> Xóa lọc
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Trạng thái</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>
        </div>
      )}

      {/* Vouchers Table */}
      <div className="vouchers-table-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="empty-state">
            <FaTag className="empty-icon" />
            <p>Chưa có voucher vận chuyển nào</p>
            <button 
              className="add-btn"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <FaPlus /> Thêm voucher đầu tiên
            </button>
          </div>
        ) : (
          <table className="vouchers-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã voucher</th>
                <th>Giảm giá</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng</th>
                <th>Hạn sử dụng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher, index) => {
                const statusInfo = getStatusBadge(voucher.status, voucher.end_date);
                const StatusIcon = statusInfo.icon;
                const isExpired = new Date(voucher.end_date) < new Date();
                
                return (
                  <tr key={voucher.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <div className="voucher-code">
                        <FaTag className="code-icon" />
                        {voucher.code}
                      </div>
                    </td>
                    <td className="discount-cell">{getDiscountText(voucher)}</td>
                    <td className="min-order">{formatCurrency(voucher.min_order_value)}</td>
                    <td className="usage-cell">
                      <span className="usage-count">{voucher.used_count}</span>
                      <span className="usage-limit">/{voucher.usage_limit || '∞'}</span>
                    </td>
                    <td className="date-cell">
                      <FaCalendarAlt className="date-icon" />
                      {formatDate(voucher.end_date)}
                      {isExpired && <span className="expired-badge">Đã hết hạn</span>}
                    </td>
                    <td>
                      <span 
                        className={`status-badge ${statusInfo.class}`}
                        style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                      >
                        <StatusIcon size={12} />
                        {isExpired ? 'Đã hết hạn' : statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewDetail(voucher)}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        {!isExpired && (
                          <>
                            <button 
                              className="action-btn edit"
                              onClick={() => handleEditVoucher(voucher)}
                              title="Sửa"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className={`action-btn ${voucher.status === 'active' ? 'disable' : 'enable'}`}
                              onClick={() => handleToggleStatus(voucher)}
                              title={voucher.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                            >
                              {voucher.status === 'active' ? <FaPowerOff /> : <FaPlay />}
                            </button>
                            <button 
                              className="action-btn delete"
                              onClick={() => handleDeleteVoucher(voucher)}
                              title="Xóa"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && !loading && (
        <div className="pagination">
          <div className="pagination-info">
            Trang hiển thị {pagination.page}/{pagination.total_pages}
          </div>
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              <FaAngleDoubleLeft />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <FaChevronLeft />
            </button>
            
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum;
              if (pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={`page-${pageNum}`}
                  className={pagination.page === pageNum ? 'active' : ''}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
            >
              <FaChevronRight />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.total_pages)}
              disabled={pagination.page === pagination.total_pages}
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <VoucherFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm voucher"
        onSubmit={handleAddVoucher}
        saving={saving}
      />

      <VoucherFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Sửa voucher"
        onSubmit={handleUpdateVoucher}
        saving={saving}
      />

      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        voucher={selectedVoucher}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        voucher={selectedVoucher}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-state p {
          margin-bottom: 20px;
          font-size: 16px;
        }
        .expired-badge {
          display: inline-block;
          margin-left: 8px;
          font-size: 11px;
          background: #6c757d;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .usage-cell {
          font-size: 14px;
        }
        .usage-count {
          font-weight: 600;
          color: #2e7d32;
        }
        .usage-limit {
          color: #6c757d;
        }
        .required {
          color: #dc3545;
          margin-left: 4px;
        }
        .voucher-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e8f5e9;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 18px;
          font-weight: 600;
          color: #2e7d32;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.active {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        .status-badge.inactive {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        .status-badge.expired {
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default ShippingVouchers;