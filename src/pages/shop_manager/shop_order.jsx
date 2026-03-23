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
  FaEnvelope
} from 'react-icons/fa';
import { shopApi } from '../../api/api'; // SỬA: import shopApi dạng named export
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý', color: '#ffc107', icon: FaClock },
    { value: 'paid', label: 'Đã thanh toán', color: '#17a2b8', icon: FaCheck },
    { value: 'shipped', label: 'Đang giao', color: '#007bff', icon: FaTruck },
    { value: 'completed', label: 'Đã giao', color: '#28a745', icon: FaCheckCircle },
    { value: 'cancelled', label: 'Đã hủy', color: '#dc3545', icon: FaBan }
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
      
      // Dữ liệu mẫu nếu API lỗi
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
      
      // Dữ liệu mẫu
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
      total_price: 250000,
      status: 'pending',
      payment_status: 'unpaid',
      created_at: new Date().toISOString(),
      items: [
        { product_name: 'Dừa xiêm', price: 11000, quantity: 2, variant_name: 'Trái' },
        { product_name: 'Táo đỏ', price: 20000, quantity: 1, variant_name: 'Kẹp' }
      ]
    },
    {
      _id: '2',
      order_id: 'ORD002',
      customer_name: 'Trần Thị B',
      customer_username: 'tranthib',
      customer_phone: '0987654321',
      customer_email: 'tranthib@email.com',
      shipping_address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      total_price: 180000,
      status: 'paid',
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      items: [
        { product_name: 'Bơ tươi', price: 10000, quantity: 3, variant_name: '1kg' }
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
      
      // Dùng dữ liệu mẫu
      setSelectedOrder(order);
      setShowDetailModal(true);
    }
  };

  // Update order status
  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const confirmUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const orderId = selectedOrder.order_id || selectedOrder._id;
      
      await shopApi.put(`/api/v1/shop/orders/${orderId}/status`, {
        status: newStatus
      });

      // Refresh data
      fetchOrders();
      fetchStats();
      
      setShowStatusModal(false);
      setSelectedOrder(null);
      alert('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error updating status:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
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

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || { label: status, color: '#6c757d', icon: FaClock };
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

  return (
    <div className="shop-orders">
      {/* Header */}
      <div className="orders-header">
        <h1 className="orders-title">Quản Lý Đơn Hàng</h1>
      </div>

      {/* Stats Cards */}
      <div className="orders-stats">
        <div className="stat-card pending" onClick={() => setSelectedStatus('pending')}>
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <span className="stat-label">Chờ xử lý</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>

        <div className="stat-card paid" onClick={() => setSelectedStatus('paid')}>
          <div className="stat-icon">
            <FaCheck />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đã thanh toán</span>
            <span className="stat-value">{stats.paid}</span>
          </div>
        </div>

        <div className="stat-card shipped" onClick={() => setSelectedStatus('shipped')}>
          <div className="stat-icon">
            <FaTruck />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đang giao</span>
            <span className="stat-value">{stats.shipped}</span>
          </div>
        </div>

        <div className="stat-card completed" onClick={() => setSelectedStatus('completed')}>
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đã giao</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>

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
            <label>Trạng thái</label>
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
                <th>Thứ tự</th>
                <th>Tên Khách Hàng</th>
                <th>Số Điện Thoại</th>
                <th>Địa chỉ</th>
                <th>Thanh Toán</th>
                <th>Trạng thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order, index) => {
                  const statusInfo = getStatusBadge(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={order._id || order.order_id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
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
                      <td className="address-cell" title={order.shipping_address}>
                        <FaMapMarkerAlt className="address-icon" />
                        {order.shipping_address || 'Chưa có'}
                      </td>
                      <td>
                        <span className={`payment-badge ${order.payment_status || 'unpaid'}`}>
                          {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: statusInfo.color + '20',
                            color: statusInfo.color,
                            borderColor: statusInfo.color
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusInfo.label}
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
                          <button 
                            className="action-btn edit"
                            onClick={() => handleUpdateStatus(order)}
                            title="Cập nhật trạng thái"
                            disabled={order.status === 'cancelled' || order.status === 'completed'}
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
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

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng</h2>
              <button className="close-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedOrder(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Info */}
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

              {/* Shipping Info */}
              <div className="detail-section">
                <h3>Địa chỉ giao hàng</h3>
                <div className="shipping-address">
                  <FaMapMarkerAlt className="address-icon" />
                  <p>{selectedOrder.shipping_address}</p>
                </div>
              </div>

              {/* Order Info */}
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
                    <div>
                      <label>Trạng thái</label>
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
                                borderColor: status.color
                              }}
                            >
                              <StatusIcon size={12} />
                              {status.label}
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
                        <span className={`payment-badge ${selectedOrder.payment_status || 'unpaid'}`}>
                          {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
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
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedOrder(null);
              }}>
                Đóng
              </button>
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <button 
                  className="edit-btn"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleUpdateStatus(selectedOrder);
                  }}
                >
                  <FaEdit /> Cập nhật trạng thái
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content status-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cập nhật trạng thái đơn hàng</h2>
              <button className="close-btn" onClick={() => {
                setShowStatusModal(false);
                setSelectedOrder(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p className="order-info">
                Đơn hàng của <strong>{selectedOrder.customer_name || selectedOrder.customer_username}</strong>
              </p>
              
              <div className="status-options">
                {statusOptions
                  .filter(opt => opt.value !== 'cancelled')
                  .map(option => {
                    const StatusIcon = option.icon;
                    const isCurrent = selectedOrder.status === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        className={`status-option ${isCurrent ? 'current' : ''}`}
                        onClick={() => confirmUpdateStatus(option.value)}
                        disabled={updating || isCurrent}
                        style={{
                          backgroundColor: isCurrent ? option.color + '20' : 'transparent',
                          borderColor: option.color,
                          color: option.color
                        }}
                      >
                        <StatusIcon />
                        <span>{option.label}</span>
                        {isCurrent && <FaCheck className="check-icon" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowStatusModal(false);
                setSelectedOrder(null);
              }}>
                Hủy
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

export default ShopOrders;