// src/pages/shop/ShopOrders.jsx
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
    limit: 10,
    total: 0,
    total_pages: 1
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusFormModal, setShowStatusFormModal] = useState(false);
  const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [selectedNewPaymentStatus, setSelectedNewPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [formError, setFormError] = useState('');

  // Status options
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
  }, [pagination.page, debouncedSearch, selectedStatus, fromDate, toDate]);

  // Fetch stats
  useEffect(() => {
    fetchStats();
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
      
      setOrders(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
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
      
      setOrders(mockOrders);
      setPagination({
        page: 1,
        limit: 10,
        total: mockOrders.length,
        total_pages: 1
      });
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
        pending: 5,
        paid: 3,
        shipped: 2,
        completed: 10,
        cancelled: 1,
        total: 21,
        today_revenue: 1500000
      });
    }
  };

  // Dữ liệu mẫu
  const mockOrders = [
    {
      _id: '1',
      order_id: 'ORD001',
      customer_name: 'Nguyễn Văn A',
      customer_username: 'nguyenvana',
      customer_phone: '0912345678',
      customer_email: 'nguyenvana@email.com',
      shipping_address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      shipping_address_details: {
        name: 'Nguyễn Văn A',
        phone: '0912345678',
        street: '123 Đường Lê Lợi',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        city: 'TP.HCM',
        country: 'Việt Nam'
      },
      total_price: 250000,
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: 'cod',
      created_at: new Date().toISOString(),
      items: [
        { product_name: 'Dừa xiêm', price: 11000, quantity: 2, variant_name: 'Trái' },
        { product_name: 'Táo đỏ', price: 20000, quantity: 1, variant_name: 'Kẹp' }
      ]
    }
  ];

  // View order detail
  const handleViewOrder = async (order) => {
    try {
      const orderId = order.order_id || order._id;
      const response = await shopApi.get(`/api/v1/shop/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
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

  // Lấy danh sách trạng thái có thể chuyển đến (không bao gồm trạng thái hiện tại)
  const getAvailableStatuses = (currentStatus) => {
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return [];
    }
    return statusOptions.filter(opt => opt.value !== currentStatus);
  };

  return (
    <div className="shop-orders">
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
                  <td colSpan="9" className="empty-state">
                    Không tìm thấy đơn hàng nào
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
            Trang {pagination.page}/{pagination.total_pages}
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
                  <div className="info-item">
                    <div>
                      <label>Trạng thái giao hàng</label>
                      <p>
                        {(() => {
                          const status = getStatusBadge(selectedOrder.status);
                          const StatusIcon = status.icon;
                          return (
                            <span 
                              className="status-badge"
                              style={{ 
                                backgroundColor: status.color + '20',
                                color: status.color,
                                borderColor: status.color,
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setShowDetailModal(false);
                                openStatusForm(selectedOrder);
                              }}
                            >
                              <StatusIcon size={12} />
                              {status.label}
                              <FaEdit size={10} style={{ marginLeft: '5px' }} />
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div>
                      <label>Thanh toán</label>
                      <p>
                        <span 
                          className={`payment-badge ${selectedOrder.payment_status || 'unpaid'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setShowDetailModal(false);
                            openPaymentForm(selectedOrder);
                          }}
                        >
                          {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          <FaEdit size={10} style={{ marginLeft: '5px' }} />
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voucher áp dụng */}
              {selectedOrder.voucher && (
                <div className="detail-section">
                  <h3>Voucher áp dụng</h3>
                  <div className="voucher-info">
                    <FaTag className="voucher-icon" />
                    <div>
                      <p><strong>Mã: {selectedOrder.voucher.code}</strong></p>
                      <p className="voucher-discount">Giảm: {formatCurrency(selectedOrder.voucher.discount)}</p>
                    </div>
                  </div>
                </div>
              )}

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

      {/* Form cập nhật trạng thái giao hàng */}
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

      {/* Form cập nhật trạng thái thanh toán */}
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
        .voucher-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #e8f5e9;
          padding: 12px;
          border-radius: 8px;
        }
        .voucher-icon {
          color: #2e7d32;
          font-size: 20px;
        }
        .voucher-discount {
          color: #dc3545;
          font-weight: 500;
        }
        .order-note {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #2e7d32;
        }
        
        /* Form Modal Styles */
        .status-form-modal, .payment-form-modal {
          max-width: 500px;
        }
        
        .order-info-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .order-info-summary p {
          margin: 8px 0;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 10px;
          color: #333;
        }
        
        .required {
          color: #dc3545;
        }
        
        .status-radio-group, .payment-radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .status-radio-label, .payment-radio-label {
          display: block;
          cursor: pointer;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          transition: all 0.2s;
        }
        
        .status-radio-label.selected, .payment-radio-label.selected {
          border-width: 2px;
          background: #f5f5f5;
        }
        
        .status-radio-label input, .payment-radio-label input {
          display: none;
        }
        
        .status-radio-content, .payment-radio-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
        }
        
        .status-radio-content svg, .payment-radio-content svg {
          font-size: 20px;
        }
        
        .status-radio-content div {
          display: flex;
          flex-direction: column;
        }
        
        .status-radio-content small {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }
        
        .form-error {
          color: #dc3545;
          font-size: 13px;
          margin-top: 8px;
          padding: 8px;
          background: #ffe6e6;
          border-radius: 6px;
        }
        
        .submit-btn {
          background: #2e7d32;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #1b5e20;
        }
        
        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

export default ShopOrders;