import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaBox,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaTruck,
  FaCheckCircle,
  FaBan,
  FaClock,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaDownload,
  FaEnvelope,
  FaCreditCard,
  FaShippingFast,
  FaTag,
  FaSave
} from 'react-icons/fa';
import { shopApi } from '../../api/api';
import '../../css/ShopOrders.css';

const ShopOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [shippingUnits, setShippingUnits] = useState([]); // Thêm state cho shipping units
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
    today_revenue: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    total_pages: 1
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusFormModal, setShowStatusFormModal] = useState(false);
  const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
  const [showAssignShippingModal, setShowAssignShippingModal] = useState(false); // Thêm modal gán shipping
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [selectedNewPaymentStatus, setSelectedNewPaymentStatus] = useState('');
  const [selectedShippingUnitId, setSelectedShippingUnitId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý', color: '#ffc107', icon: FaClock, description: 'Đơn hàng mới, chưa xử lý' },
    { value: 'paid', label: 'Đã thanh toán', color: '#17a2b8', icon: FaCheck, description: 'Khách hàng đã thanh toán' },
    { value: 'shipped', label: 'Đang giao', color: '#007bff', icon: FaTruck, description: 'Đơn hàng đang được giao' },
    { value: 'completed', label: 'Đã giao', color: '#28a745', icon: FaCheckCircle, description: 'Đơn hàng đã giao thành công' },
    { value: 'cancelled', label: 'Đã hủy', color: '#dc3545', icon: FaBan, description: 'Đơn hàng đã bị hủy' }
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: 'unpaid', label: 'Chưa thanh toán', color: '#dc3545', icon: FaBan },
    { value: 'paid', label: 'Đã thanh toán', color: '#28a745', icon: FaCheck }
  ];

  // Fetch shipping units
  const fetchShippingUnits = async () => {
    try {
      const response = await shopApi.get('/api/v1/shipping-units/shop');
      let unitsData = [];
      if (response.data && response.data.data) {
        unitsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        unitsData = response.data;
      }
      setShippingUnits(unitsData.filter(u => u.status === 'active'));
    } catch (error) {
      console.error('Error fetching shipping units:', error);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, [pagination.page, pagination.limit, debouncedSearch, selectedStatus, fromDate, toDate]);

  // Fetch stats
  useEffect(() => {
    fetchStats();
    fetchShippingUnits(); // Lấy danh sách shipping units
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shop/orders', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          status: selectedStatus || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined
        }
      });
      
      console.log('Orders response:', response.data);
      console.log('Pagination data:', response.data.pagination);
      
      setOrders(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 5,
        total: 0,
        total_pages: 1
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
        
        if (error.response?.status === 401) {
          localStorage.removeItem('shop_token');
          localStorage.removeItem('shop_data');
          localStorage.removeItem('shop_info');
          window.location.href = '/shop/login';
          return;
        }
        
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

  const fetchStats = async () => {
    try {
      const response = await shopApi.get('/api/v1/shop/orders/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      setStats({
        pending: 0,
        paid: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
        today_revenue: 0
      });
    }
  };

  // View order detail
  const handleViewOrder = async (order) => {
    try {
      const orderId = order.order_id || order._id;
      const response = await shopApi.get(`/api/v1/shop/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      setSelectedOrder(order);
      setShowDetailModal(true);
    }
  };

  // Mở form cập nhật trạng thái giao hàng
  const openStatusForm = (order) => {
    setSelectedOrder(order);
    setSelectedNewStatus(order.status);
    setFormError('');
    setShowStatusFormModal(true);
  };

  // Mở form cập nhật trạng thái thanh toán
  const openPaymentForm = (order) => {
    setSelectedOrder(order);
    setSelectedNewPaymentStatus(order.payment_status);
    setFormError('');
    setShowPaymentFormModal(true);
  };

  // Mở form gán đơn vị vận chuyển
  const openAssignShippingForm = (order) => {
    setSelectedOrder(order);
    setSelectedShippingUnitId(order.shipping_unit_id || '');
    setFormError('');
    setShowAssignShippingModal(true);
  };

  // Xử lý gán đơn vị vận chuyển
  const handleAssignShipping = async () => {
    if (!selectedOrder || !selectedShippingUnitId) {
      setFormError('Vui lòng chọn đơn vị vận chuyển');
      return;
    }

    try {
      setUpdating(true);
      const orderId = selectedOrder.order_id || selectedOrder._id;
      
      await shopApi.put(`/api/v1/shop/orders/${orderId}/assign-shipping?shipping_unit_id=${selectedShippingUnitId}`);
      
      await fetchOrders();
      await fetchStats();
      
      setShowAssignShippingModal(false);
      setSelectedOrder(null);
      setSelectedShippingUnitId('');
      setSuccessMessage('Đã gán đơn vị vận chuyển thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Đóng modal chi tiết nếu đang mở
      if (showDetailModal) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error assigning shipping:', error);
      const errorMessage = error.response?.data?.detail || 'Có lỗi xảy ra khi gán đơn vị vận chuyển';
      setFormError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý cập nhật trạng thái giao hàng
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    if (selectedNewStatus === selectedOrder.status) {
      setFormError('Vui lòng chọn trạng thái khác với trạng thái hiện tại');
      return;
    }
    
    try {
      setUpdating(true);
      const orderId = selectedOrder.order_id || selectedOrder._id;
      
      await shopApi.put(`/api/v1/shop/orders/${orderId}/status`, {
        status: selectedNewStatus
      });
      
      await fetchOrders();
      await fetchStats();
      
      setShowStatusFormModal(false);
      setSelectedOrder(null);
      setSelectedNewStatus('');
      
      // Đóng modal chi tiết nếu đang mở
      if (showDetailModal) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật trạng thái';
      setFormError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý cập nhật trạng thái thanh toán
  const handleUpdatePaymentStatus = async () => {
    if (!selectedOrder) return;
    
    if (selectedNewPaymentStatus === selectedOrder.payment_status) {
      setFormError('Vui lòng chọn trạng thái khác với trạng thái hiện tại');
      return;
    }
    
    try {
      setUpdating(true);
      const orderId = selectedOrder.order_id || selectedOrder._id;
      
      await shopApi.put(`/api/v1/shop/orders/${orderId}/payment-status`, {
        payment_status: selectedNewPaymentStatus
      });
      
      await fetchOrders();
      await fetchStats();
      
      setShowPaymentFormModal(false);
      setSelectedOrder(null);
      setSelectedNewPaymentStatus('');
      
      // Đóng modal chi tiết nếu đang mở
      if (showDetailModal) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      const errorMessage = error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật trạng thái thanh toán';
      setFormError(errorMessage);
    } finally {
      setUpdating(false);
    }
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
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || { label: status, color: '#6c757d', icon: FaClock };
  };

  const getPaymentStatusBadge = (status) => {
    const option = paymentStatusOptions.find(opt => opt.value === status);
    return option || { label: status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán', color: status === 'paid' ? '#28a745' : '#dc3545' };
  };

  const getFullAddress = (order) => {
    if (order.shipping_address_details) {
      const addr = order.shipping_address_details;
      const parts = [addr.street, addr.ward, addr.district, addr.city, addr.country].filter(p => p && p.trim());
      return parts.join(', ') || order.shipping_address;
    }
    return order.shipping_address || 'Chưa có';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setFromDate('');
    setToDate('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Lấy danh sách trạng thái có thể chuyển đến
  const getAvailableStatuses = (currentStatus) => {
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return [];
    }
    return statusOptions.filter(opt => opt.value !== currentStatus);
  };

  return (
    <div className="shop-orders">
      {/* Success message */}
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="orders-header">
        <h1 className="orders-title">Quản Lý Đơn Hàng</h1>
      </div>

      {/* Stats Cards */}
      <div className="orders-stats">
        {statusOptions.map(opt => (
          <div key={opt.value} className={`stat-card ${opt.value}`} onClick={() => setSelectedStatus(opt.value)}>
            <div className="stat-icon">
              <opt.icon />
            </div>
            <div className="stat-content">
              <span className="stat-label">{opt.label}</span>
              <span className="stat-value">{stats[opt.value] || 0}</span>
            </div>
          </div>
        ))}
        <div className="stat-card revenue">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <span className="stat-label">Doanh thu hôm nay</span>
            <span className="stat-value">{formatCurrency(stats.today_revenue)}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="orders-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên khách, số ĐT, mã đơn..."
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

        {(selectedStatus || searchTerm || fromDate || toDate) && (
          <button className="clear-filters" onClick={clearFilters}>
            <FaTimes /> Xóa lọc
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Trạng thái đơn hàng</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái giao</th>
                <th>Đơn vị VC</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order, index) => {
                  const statusInfo = getStatusBadge(order.status);
                  const StatusIcon = statusInfo.icon;
                  const paymentInfo = getPaymentStatusBadge(order.payment_status);
                  
                  return (
                    <tr key={order._id || order.order_id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td className="order-id">#{order.order_id?.slice(-6) || order._id?.slice(-6)}</td>
                      <td>
                        <div className="customer-name">
                          <FaUser className="customer-icon" />
                          {order.customer_name || order.customer_username}
                        </div>
                      </td>
                      <td>
                        <div className="customer-phone">
                          <FaPhone className="phone-icon" />
                          {order.customer_phone || 'Chưa có'}
                        </div>
                      </td>
                      <td className="address-cell" title={getFullAddress(order)}>
                        <FaMapMarkerAlt className="address-icon" />
                        {getFullAddress(order).substring(0, 50)}...
                      </td>
                      <td className="total-price">{formatCurrency(order.total_price)}</td>
                      <td>
                        <span 
                          className={`payment-badge ${order.payment_status || 'unpaid'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openPaymentForm(order)}
                          title="Click để cập nhật trạng thái thanh toán"
                        >
                          <FaEdit size={10} style={{ marginRight: '5px' }} />
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: statusInfo.color + '20',
                            color: statusInfo.color,
                            borderColor: statusInfo.color,
                            cursor: order.status !== 'cancelled' && order.status !== 'completed' ? 'pointer' : 'default'
                          }}
                          onClick={() => order.status !== 'cancelled' && order.status !== 'completed' && openStatusForm(order)}
                          title={order.status !== 'cancelled' && order.status !== 'completed' ? 'Click để cập nhật trạng thái giao hàng' : 'Không thể cập nhật'}
                        >
                          <StatusIcon size={12} />
                          {statusInfo.label}
                          {order.status !== 'cancelled' && order.status !== 'completed' && <FaEdit size={10} style={{ marginLeft: '5px' }} />}
                        </span>
                      </td>
                      <td className="shipping-cell">
                        {order.shipping_unit ? (
                          <div className="shipping-info">
                            <span className="shipping-badge">
                              <FaTruck size={12} /> {order.shipping_unit.name}
                            </span>
                            <span className="shipping-fee">
                              Phí: {formatCurrency(order.shipping_unit.shipping_fee || 0)}
                            </span>
                          </div>
                        ) : (
                          <button 
                            className="assign-shipping-btn"
                            onClick={() => openAssignShippingForm(order)}
                            title="Gán đơn vị vận chuyển"
                          >
                            <FaTruck /> Gán VC
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => handleViewOrder(order)}
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="empty-state">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      { !loading && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> -{' '}
            <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> của{' '}
            <strong>{pagination.total}</strong> đơn hàng
          </div>
          <div className="pagination-controls">
            {/* First page button */}
            <button 
              onClick={() => handlePageChange(1)} 
              disabled={pagination.page === 1}
              className="pagination-nav-btn"
              title="Trang đầu"
            >
              <FaAngleDoubleLeft />
            </button>
            
            {/* Previous page button */}
            <button 
              onClick={() => handlePageChange(pagination.page - 1)} 
              disabled={pagination.page === 1}
              className="pagination-nav-btn"
              title="Trang trước"
            >
              <FaChevronLeft />
            </button>
            
            {/* Page numbers - dynamically adjust based on screen size */}
            <div className="pagination-numbers">
              {(() => {
                const pages = [];
                const totalPages = pagination.total_pages;
                const currentPage = pagination.page;
                
                // Responsive: show fewer pages on mobile
                const isMobile = window.innerWidth <= 768;
                const maxVisible = isMobile ? 3 : 5;
                
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                
                // Show first page if not at start
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      className={currentPage === 1 ? 'active' : ''}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="start-ellipsis" className="ellipsis">...</span>
                    );
                  }
                }
                
                // Show page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={currentPage === i ? 'active' : ''}
                      onClick={() => handlePageChange(i)}
                    >
                      {i}
                    </button>
                  );
                }
                
                // Show last page if not at end
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="end-ellipsis" className="ellipsis">...</span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      className={currentPage === totalPages ? 'active' : ''}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pages;
              })()}
            </div>
            
            {/* Next page button */}
            <button 
              onClick={() => handlePageChange(pagination.page + 1)} 
              disabled={pagination.page === pagination.total_pages}
              className="pagination-nav-btn"
              title="Trang sau"
            >
              <FaChevronRight />
            </button>
            
            {/* Last page button */}
            <button 
              onClick={() => handlePageChange(pagination.total_pages)} 
              disabled={pagination.page === pagination.total_pages}
              className="pagination-nav-btn"
              title="Trang cuối"
            >
              <FaAngleDoubleRight />
            </button>
          </div>
          
          {/* Page size selector - optional but helpful */}
          <div className="page-size-selector">
            <select 
              value={pagination.limit} 
              onChange={(e) => {
                setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
              }}
              className="page-size-select"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      )}

      {/* Assign Shipping Modal */}
      {showAssignShippingModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowAssignShippingModal(false)}>
          <div className="modal-content assign-shipping-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gán đơn vị vận chuyển</h2>
              <button className="close-btn" onClick={() => {
                setShowAssignShippingModal(false);
                setSelectedOrder(null);
                setFormError('');
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-info-summary">
                <p><strong>Đơn hàng:</strong> #{selectedOrder.order_id?.slice(-8) || selectedOrder._id?.slice(-8)}</p>
                <p><strong>Khách hàng:</strong> {selectedOrder.customer_name || selectedOrder.customer_username}</p>
                <p><strong>Địa chỉ:</strong> {getFullAddress(selectedOrder)}</p>
              </div>

              <div className="form-group">
                <label>Chọn đơn vị vận chuyển <span className="required">*</span></label>
                <select 
                  value={selectedShippingUnitId} 
                  onChange={(e) => setSelectedShippingUnitId(e.target.value)}
                  className="shipping-select"
                >
                  <option value="">-- Chọn đơn vị vận chuyển --</option>
                  {shippingUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} - Phí ship: {formatCurrency(unit.shipping_fee_base)} - Giao trong {unit.estimated_delivery_days} ngày
                    </option>
                  ))}
                </select>
                {formError && <div className="form-error">{formError}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowAssignShippingModal(false);
                setSelectedOrder(null);
                setFormError('');
              }}>
                Hủy
              </button>
              <button 
                className="submit-btn"
                onClick={handleAssignShipping}
                disabled={updating || !selectedShippingUnitId}
              >
                {updating ? <FaSpinner className="spinning" /> : <FaTruck />}
                {updating ? ' Đang gán...' : ' Gán đơn vị vận chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal - Giữ nguyên như cũ */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng #{selectedOrder.order_id?.slice(-8) || selectedOrder._id?.slice(-8)}</h2>
              <button className="close-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedOrder(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* Thông tin khách hàng */}
              <div className="detail-section">
                <h3>Thông tin khách hàng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <label>Họ tên</label>
                      <p>{selectedOrder.customer_name || selectedOrder.customer_username}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <div>
                      <label>Số điện thoại</label>
                      <p>{selectedOrder.customer_phone || 'Chưa có'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <label>Email</label>
                      <p>{selectedOrder.customer_email || 'Chưa có'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              <div className="detail-section">
                <h3>Địa chỉ giao hàng</h3>
                <div className="shipping-address">
                  <FaMapMarkerAlt className="address-icon" />
                  <p>{getFullAddress(selectedOrder)}</p>
                </div>
              </div>

              {/* Thông tin đơn hàng */}
              <div className="detail-section">
                <h3>Thông tin đơn hàng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <FaCalendarAlt className="info-icon" />
                    <div>
                      <label>Ngày đặt</label>
                      <p>{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaMoneyBillWave className="info-icon" />
                    <div>
                      <label>Tổng tiền</label>
                      <p className="total-price">{formatCurrency(selectedOrder.total_price)}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaShippingFast className="info-icon" />
                    <div>
                      <label>Phí vận chuyển</label>
                      <p>{formatCurrency(selectedOrder.shipping_fee || 0)}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaTag className="info-icon" />
                    <div>
                      <label>Giảm giá</label>
                      <p className="discount-price">-{formatCurrency(selectedOrder.discount || 0)}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaCreditCard className="info-icon" />
                    <div>
                      <label>Phương thức thanh toán</label>
                      <p>{selectedOrder.payment_method === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : 'Chuyển khoản'}</p>
                    </div>
                  </div>
                  {selectedOrder.shipping_unit && (
                    <div className="info-item">
                      <FaTruck className="info-icon" />
                      <div>
                        <label>Đơn vị vận chuyển</label>
                        <p>{selectedOrder.shipping_unit.name} - Giao trong {selectedOrder.shipping_unit.estimated_delivery_days} ngày</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sản phẩm đã đặt */}
              <div className="detail-section">
                <h3>Sản phẩm đã đặt</h3>
                <div className="order-items">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="item-name">
                              <FaBox className="item-icon" />
                              <div>
                                <div>{item.product_name}</div>
                                {item.variant_name && (
                                  <small className="variant-name">Biến thể: {item.variant_name}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="price">{formatCurrency(item.price)}</td>
                          <td className="quantity">{item.quantity}</td>
                          <td className="subtotal">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="total-label">Tổng cộng:</td>
                        <td className="total-value">{formatCurrency(selectedOrder.total_price)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Ghi chú */}
              {selectedOrder.note && (
                <div className="detail-section">
                  <h3>Ghi chú</h3>
                  <div className="order-note">
                    <p>{selectedOrder.note}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedOrder(null);
              }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form cập nhật trạng thái giao hàng - Giữ nguyên */}
      {showStatusFormModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowStatusFormModal(false)}>
          <div className="modal-content status-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cập nhật trạng thái giao hàng</h2>
              <button className="close-btn" onClick={() => {
                setShowStatusFormModal(false);
                setSelectedOrder(null);
                setFormError('');
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-info-summary">
                <p><strong>Đơn hàng:</strong> #{selectedOrder.order_id?.slice(-8) || selectedOrder._id?.slice(-8)}</p>
                <p><strong>Khách hàng:</strong> {selectedOrder.customer_name || selectedOrder.customer_username}</p>
                <p><strong>Trạng thái hiện tại:</strong> 
                  <span className="status-badge" style={{ 
                    backgroundColor: getStatusBadge(selectedOrder.status).color + '20',
                    color: getStatusBadge(selectedOrder.status).color,
                    marginLeft: '8px'
                  }}>
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </p>
              </div>

              <div className="form-group">
                <label>Chọn trạng thái mới <span className="required">*</span></label>
                <div className="status-radio-group">
                  {getAvailableStatuses(selectedOrder.status).map(opt => {
                    const StatusIcon = opt.icon;
                    const isSelected = selectedNewStatus === opt.value;
                    return (
                      <label 
                        key={opt.value} 
                        className={`status-radio-label ${isSelected ? 'selected' : ''}`}
                        style={{ borderColor: opt.color }}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={opt.value}
                          checked={isSelected}
                          onChange={(e) => setSelectedNewStatus(e.target.value)}
                        />
                        <div className="status-radio-content">
                          <StatusIcon style={{ color: opt.color }} />
                          <div>
                            <strong>{opt.label}</strong>
                            <small>{opt.description}</small>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {formError && <div className="form-error">{formError}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowStatusFormModal(false);
                setSelectedOrder(null);
                setFormError('');
              }}>
                Hủy
              </button>
              <button 
                className="submit-btn"
                onClick={handleUpdateStatus}
                disabled={updating || !selectedNewStatus || selectedNewStatus === selectedOrder.status}
              >
                {updating ? <FaSpinner className="spinning" /> : <FaSave />}
                {updating ? ' Đang cập nhật...' : ' Cập nhật trạng thái'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form cập nhật trạng thái thanh toán - Giữ nguyên */}
      {showPaymentFormModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowPaymentFormModal(false)}>
          <div className="modal-content payment-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cập nhật trạng thái thanh toán</h2>
              <button className="close-btn" onClick={() => {
                setShowPaymentFormModal(false);
                setSelectedOrder(null);
                setFormError('');
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-info-summary">
                <p><strong>Đơn hàng:</strong> #{selectedOrder.order_id?.slice(-8) || selectedOrder._id?.slice(-8)}</p>
                <p><strong>Khách hàng:</strong> {selectedOrder.customer_name || selectedOrder.customer_username}</p>
                <p><strong>Tổng tiền:</strong> {formatCurrency(selectedOrder.total_price)}</p>
                <p><strong>Trạng thái hiện tại:</strong> 
                  <span className={`payment-badge ${selectedOrder.payment_status}`} style={{ marginLeft: '8px' }}>
                    {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </p>
              </div>

              <div className="form-group">
                <label>Chọn trạng thái thanh toán mới <span className="required">*</span></label>
                <div className="payment-radio-group">
                  {paymentStatusOptions.map(opt => {
                    const PaymentIcon = opt.icon;
                    const isSelected = selectedNewPaymentStatus === opt.value;
                    return (
                      <label 
                        key={opt.value} 
                        className={`payment-radio-label ${isSelected ? 'selected' : ''}`}
                        style={{ borderColor: opt.color }}
                      >
                        <input
                          type="radio"
                          name="payment_status"
                          value={opt.value}
                          checked={isSelected}
                          onChange={(e) => setSelectedNewPaymentStatus(e.target.value)}
                        />
                        <div className="payment-radio-content">
                          <PaymentIcon style={{ color: opt.color }} />
                          <strong>{opt.label}</strong>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {formError && <div className="form-error">{formError}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowPaymentFormModal(false);
                setSelectedOrder(null);
                setFormError('');
              }}>
                Hủy
              </button>
              <button 
                className="submit-btn"
                onClick={handleUpdatePaymentStatus}
                disabled={updating || !selectedNewPaymentStatus || selectedNewPaymentStatus === selectedOrder.payment_status}
              >
                {updating ? <FaSpinner className="spinning" /> : <FaSave />}
                {updating ? ' Đang cập nhật...' : ' Cập nhật trạng thái'}
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
        .order-id {
          font-weight: 500;
          color: #2e7d32;
          font-family: monospace;
        }
        .discount-price {
          color: #dc3545;
        }
        .success-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #d4edda;
          color: #155724;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .shipping-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .assign-shipping-btn {
          background: #ffc107;
          color: #856404;
          border: none;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
        .assign-shipping-btn:hover {
          background: #e0a800;
          transform: translateY(-1px);
        }
        .shipping-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        .assign-shipping-modal {
          max-width: 500px;
        }
      `}</style>
    </div>
  );
};

export default ShopOrders;