// src/pages/shop/ShopVouchers.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaTimes,
  FaSave,
  FaTag,
  FaPercent,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUsers,
  FaBox,
  FaStore,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import { shopApi } from '../../api/api'; // SỬA: import shopApi dạng named export
import '../../css/ShopVouchers.css';

const ShopVouchers = () => {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
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
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_discount: '',
    min_order_value: '',
    usage_limit: '',
    target_type: 'shop',
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

  // Fetch vouchers
  useEffect(() => {
    fetchVouchers();
  }, [pagination.page, debouncedSearch, selectedStatus, selectedType]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shop/vouchers', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          status: selectedStatus || undefined,
          discount_type: selectedType || undefined
        }
      });
      
      console.log('Vouchers response:', response.data);
      
      // Chuẩn hóa dữ liệu: đảm bảo có trường id
      const normalizedData = (response.data.data || []).map(voucher => ({
        ...voucher,
        id: voucher.id || voucher._id
      }));
      
      setVouchers(normalizedData);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1
      });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      // Dữ liệu mẫu nếu API lỗi
      const mockData = mockVouchers.map(v => ({
        ...v,
        id: v.id || v._id
      }));
      setVouchers(mockData);
      setPagination({
        page: 1,
        limit: 10,
        total: mockData.length,
        total_pages: Math.ceil(mockData.length / 10)
      });
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu mẫu
  const mockVouchers = [
    {
      id: '1',
      code: 'SALE10',
      discount_type: 'percent',
      discount_value: 10,
      max_discount: 50000,
      min_order_value: 100000,
      usage_limit: 100,
      used_count: 45,
      target_type: 'shop',
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-12-31T23:59:59Z',
      status: 'active',
      description: 'Giảm 10% cho đơn hàng từ 100k',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      code: 'FREESHIP',
      discount_type: 'fixed',
      discount_value: 30000,
      min_order_value: 200000,
      usage_limit: 50,
      used_count: 12,
      target_type: 'shop',
      start_date: '2024-02-01T00:00:00Z',
      end_date: '2024-12-31T23:59:59Z',
      status: 'active',
      description: 'Miễn phí vận chuyển đơn từ 200k',
      created_at: '2024-02-01T00:00:00Z'
    }
  ];

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add voucher
  const handleAddVoucher = async () => {
    if (!formData.code || !formData.discount_value || !formData.start_date || !formData.end_date) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
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
        target_type: formData.target_type,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        status: 'active',
        created_by: 'shop'
      };

      console.log('Adding voucher:', voucherData);
      
      const response = await shopApi.post('/api/v1/shop/vouchers', voucherData);
      
      fetchVouchers();
      setShowAddModal(false);
      resetForm();
      alert('Thêm voucher thành công!');
    } catch (error) {
      console.error('Error adding voucher:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      alert(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Edit voucher
  const handleEditVoucher = (voucher) => {
    console.log("Editing voucher:", voucher);
    setSelectedVoucher(voucher);
    setFormData({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      max_discount: voucher.max_discount || '',
      min_order_value: voucher.min_order_value || '',
      usage_limit: voucher.usage_limit || '',
      target_type: voucher.target_type,
      start_date: new Date(voucher.start_date).toISOString().split('T')[0],
      end_date: new Date(voucher.end_date).toISOString().split('T')[0],
      description: voucher.description || '',
      status: voucher.status
    });
    setShowEditModal(true);
  };

  // Update voucher
  const handleUpdateVoucher = async () => {
    if (!selectedVoucher) {
      console.error("No voucher selected");
      return;
    }

    const voucherId = selectedVoucher.id || selectedVoucher._id;
    if (!voucherId) {
      console.error("Voucher ID is undefined", selectedVoucher);
      alert("Không tìm thấy ID voucher");
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        discount_value: parseFloat(formData.discount_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        status: formData.status || selectedVoucher.status
      };

      console.log("Updating voucher:", voucherId, updateData);
      
      await shopApi.put(`/api/v1/shop/vouchers/${voucherId}`, updateData);
      
      fetchVouchers();
      setShowEditModal(false);
      resetForm();
      alert('Cập nhật voucher thành công!');
    } catch (error) {
      console.error('Error updating voucher:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  // View voucher detail
  const handleViewVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  // Delete voucher
  const handleDeleteVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedVoucher) return;

    const voucherId = selectedVoucher.id || selectedVoucher._id;
    if (!voucherId) {
      console.error("Voucher ID is undefined", selectedVoucher);
      alert("Không tìm thấy ID voucher");
      return;
    }

    try {
      await shopApi.delete(`/api/v1/shop/vouchers/${voucherId}`);
      fetchVouchers();
      setShowDeleteConfirm(false);
      setSelectedVoucher(null);
      alert('Xóa voucher thành công!');
    } catch (error) {
      console.error('Error deleting voucher:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi xóa voucher');
    }
  };

  // Toggle status
  const handleToggleStatus = async (voucher) => {
    const voucherId = voucher.id || voucher._id;
    if (!voucherId) {
      console.error("Voucher ID is undefined", voucher);
      return;
    }

    try {
      const newStatus = voucher.status === 'active' ? 'inactive' : 'active';
      await shopApi.put(`/api/v1/shop/vouchers/${voucherId}/status`, { status: newStatus });
      fetchVouchers();
    } catch (error) {
      console.error('Error toggling status:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      alert('Có lỗi xảy ra');
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: '',
      max_discount: '',
      min_order_value: '',
      usage_limit: '',
      target_type: 'shop',
      start_date: '',
      end_date: '',
      description: ''
    });
    setSelectedVoucher(null);
  };

  // Format functions
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

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return { label: 'Đang hoạt động', color: '#28a745', icon: FaCheckCircle };
    }
    return { label: 'Tạm ngưng', color: '#dc3545', icon: FaTimes };
  };

  const getTargetIcon = (target_type) => {
    switch(target_type) {
      case 'shop': return FaStore;
      case 'product': return FaBox;
      default: return FaTag;
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedType('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Phần render giữ nguyên như code của bạn
  return (
    <div className="shop-vouchers">
      {/* Header */}
      <div className="vouchers-header">
        <h1 className="vouchers-title">Quản Lý Voucher</h1>
        
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

        {(selectedStatus || selectedType || searchTerm) && (
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
              <option value="expired">Đã hết hạn</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Loại giảm giá</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="percent">Phần trăm</option>
              <option value="fixed">Số tiền cố định</option>
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
        ) : (
          <table className="vouchers-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
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
              {vouchers.length > 0 ? (
                vouchers.map((voucher, index) => {
                  const StatusIcon = getStatusBadge(voucher.status).icon;
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
                        <FaUsers className="usage-icon" />
                        {voucher.used_count}/{voucher.usage_limit || '∞'}
                      </td>
                      <td className="date-cell">
                        <FaCalendarAlt className="date-icon" />
                        {formatDate(voucher.end_date)}
                        {isExpired && <span className="expired-badge">Đã hết hạn</span>}
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${voucher.status}`}
                          style={{ 
                            backgroundColor: getStatusBadge(voucher.status).color + '20', 
                            color: getStatusBadge(voucher.status).color 
                          }}
                        >
                          <StatusIcon size={12} />
                          {isExpired ? 'Đã hết hạn' : getStatusBadge(voucher.status).label}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => handleViewVoucher(voucher)}
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
                                {voucher.status === 'active' ? <FaTimes /> : <FaCheckCircle />}
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
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    Không tìm thấy voucher nào
                  </td>
                </tr>
              )}
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
            <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1}>
              <FaAngleDoubleLeft />
            </button>
            <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
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
            
            <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}>
              <FaChevronRight />
            </button>
            <button onClick={() => handlePageChange(pagination.total_pages)} disabled={pagination.page === pagination.total_pages}>
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}

      {/* Modals - giữ nguyên code của bạn */}
      {/* Add Voucher Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content voucher-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm Voucher Mới</h2>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
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
                    placeholder="Nhập mã voucher (VD: SALE10)"
                    maxLength="20"
                  />
                  <small>Chỉ nhập chữ in hoa, số và dấu gạch dưới</small>
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
              <button className="cancel-btn" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                Hủy
              </button>
              <button 
                className="save-btn" 
                onClick={handleAddVoucher}
                disabled={saving}
              >
                {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                {saving ? 'Đang lưu...' : 'Thêm voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Voucher Modal */}
      {showEditModal && selectedVoucher && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content voucher-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Voucher</h2>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Mã voucher</label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="disabled-input"
                  />
                  <small>Không thể sửa mã voucher</small>
                </div>

                <div className="form-group">
                  <label>Loại giảm giá</label>
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
                  <label>Giá trị giảm</label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
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
                  />
                </div>

                <div className="form-group">
                  <label>Giới hạn số lượng</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}>
                Hủy
              </button>
              <button 
                className="save-btn" 
                onClick={handleUpdateVoucher}
                disabled={saving}
              >
                {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVoucher && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết Voucher</h2>
              <button className="close-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedVoucher(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="voucher-detail">
                <div className="detail-header">
                  <div className="voucher-badge">
                    <FaTag />
                    {selectedVoucher.code}
                  </div>
                  <span className={`status-badge ${selectedVoucher.status}`}>
                    {selectedVoucher.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>

                <div className="detail-section">
                  <h3>Thông tin giảm giá</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Loại giảm giá:</label>
                      <span>{selectedVoucher.discount_type === 'percent' ? 'Phần trăm (%)' : 'Số tiền cố định'}</span>
                    </div>
                    <div className="info-item">
                      <label>Giá trị giảm:</label>
                      <span className="discount-value">{getDiscountDetail(selectedVoucher)}</span>
                    </div>
                    {selectedVoucher.max_discount && (
                      <div className="info-item">
                        <label>Giảm tối đa:</label>
                        <span>{formatCurrency(selectedVoucher.max_discount)}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <label>Đơn hàng tối thiểu:</label>
                      <span>{formatCurrency(selectedVoucher.min_order_value)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Thông tin sử dụng</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Đã sử dụng:</label>
                      <span>{selectedVoucher.used_count}/{selectedVoucher.usage_limit || '∞'}</span>
                    </div>
                    <div className="info-item">
                      <label>Ngày bắt đầu:</label>
                      <span>{formatDate(selectedVoucher.start_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>Ngày kết thúc:</label>
                      <span>{formatDate(selectedVoucher.end_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>Ngày tạo:</label>
                      <span>{formatDate(selectedVoucher.created_at)}</span>
                    </div>
                  </div>
                </div>

                {selectedVoucher.description && (
                  <div className="detail-section">
                    <h3>Mô tả</h3>
                    <p className="description">{selectedVoucher.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedVoucher && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <FaExclamationTriangle className="warning-icon" />
              <p>Bạn có chắc chắn muốn xóa voucher <strong>{selectedVoucher.code}</strong>?</p>
              <p className="warning-text">Hành động này không thể hoàn tác!</p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Hủy
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Xóa voucher
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShopVouchers;