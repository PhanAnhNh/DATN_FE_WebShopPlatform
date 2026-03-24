// src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaEye, 
  FaSpinner, 
  FaTimes,
  FaBox,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaShoppingBag,
  FaStar,
  FaRegStar,
  FaDownload
} from 'react-icons/fa';
import api from '../../api/api';
import '../../css/Orders.css';
import ShopDetailLayout from '../../components/layout/ShopDetailLayout';

const Orders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0
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
  
  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Status configurations
  const statusConfig = {
    pending: {
      label: 'Chờ xử lý',
      color: '#ffc107',
      icon: FaClock,
      badgeClass: 'status-pending'
    },
    paid: {
      label: 'Đã thanh toán',
      color: '#17a2b8',
      icon: FaCheckCircle,
      badgeClass: 'status-paid'
    },
    shipped: {
      label: 'Đang giao',
      color: '#007bff',
      icon: FaTruck,
      badgeClass: 'status-shipped'
    },
    completed: {
      label: 'Đã giao',
      color: '#28a745',
      icon: FaCheckCircle,
      badgeClass: 'status-completed'
    },
    cancelled: {
      label: 'Đã hủy',
      color: '#dc3545',
      icon: FaBan,
      badgeClass: 'status-cancelled'
    }
  };

  // Payment status config
  const paymentStatusConfig = {
    unpaid: {
      label: 'Chưa thanh toán',
      color: '#dc3545',
      badgeClass: 'payment-unpaid'
    },
    paid: {
      label: 'Đã thanh toán',
      color: '#28a745',
      badgeClass: 'payment-paid'
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
  }, [pagination.page, debouncedSearch, selectedStatus, fromDate, toDate]);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  // src/pages/Orders.jsx - Cập nhật phần fetchOrders
const fetchOrders = async () => {
  try {
    setLoading(true);
    const response = await api.get('/api/v1/orders/my', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      }
    });
    
    console.log('Orders response:', response.data); // Debug để xem cấu trúc dữ liệu
    
    // Xử lý dữ liệu từ API
    let ordersData = [];
    let paginationData = pagination;
    
    if (response.data.data) {
      ordersData = response.data.data;
      paginationData = response.data.pagination;
    } else if (Array.isArray(response.data)) {
      ordersData = response.data;
      paginationData = {
        page: 1,
        limit: 10,
        total: response.data.length,
        total_pages: Math.ceil(response.data.length / 10)
      };
    } else {
      ordersData = [];
    }
    
    // Đảm bảo mỗi order có đầy đủ các trường cần thiết
    const processedOrders = ordersData.map(order => ({
      ...order,
      // Đảm bảo total_price có giá trị
      total_price: order.total_amount || order.total_price || 0,
      // Đảm bảo items là mảng
      items: order.items || []
    }));
    
    setOrders(processedOrders);
    setPagination(paginationData);
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    if (error.response?.status === 401) {
      navigate('/login');
      return;
    }
    
    // Dữ liệu mẫu
    setOrders(mockOrders);
  } finally {
    setLoading(false);
  }
};

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/v1/orders/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Dữ liệu mẫu
      setStats({
        total: 15,
        pending: 3,
        paid: 2,
        shipped: 4,
        completed: 5,
        cancelled: 1
      });
    }
  };

  // Dữ liệu mẫu
  const mockOrders = [
    {
      _id: '1',
      order_id: 'ORD001',
      customer_name: 'Nguyễn Văn A',
      total_price: 250000,
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: 'cod',
      created_at: new Date().toISOString(),
      items: [
        { product_name: 'Dừa xiêm', price: 11000, quantity: 2, variant_name: 'Trái' }
      ]
    },
    {
      _id: '2',
      order_id: 'ORD002',
      customer_name: 'Nguyễn Văn A',
      total_price: 180000,
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'bank',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { product_name: 'Bơ tươi', price: 10000, quantity: 3, variant_name: '1kg' }
      ]
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hôm nay, ' + date.toLocaleTimeString('vi-VN');
    } else if (diffDays === 1) {
      return 'Hôm qua, ' + date.toLocaleTimeString('vi-VN');
    } else {
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`status-badge ${config.badgeClass}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const config = paymentStatusConfig[status] || paymentStatusConfig.unpaid;
    return (
      <span className={`payment-badge ${config.badgeClass}`}>
        {config.label}
      </span>
    );
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

  const handleReorder = (order) => {
    const itemsToReorder = order.items.map(item => ({
      ...item,
      quantity: item.quantity
    }));
    localStorage.setItem('selectedCartItems', JSON.stringify(itemsToReorder));
    navigate('/checkout');
  };

  const openReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedOrderForReview) return;
    
    try {
      setSubmittingReview(true);
      // Gọi API đánh giá
      await api.post('/api/v1/reviews', {
        order_id: selectedOrderForReview._id,
        rating: reviewRating,
        comment: reviewComment
      });
      alert('Cảm ơn bạn đã đánh giá!');
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại sau');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="star-filled" />);
      } else {
        stars.push(<FaRegStar key={i} className="star-empty" />);
      }
    }
    return stars;
  };

  return (
    <ShopDetailLayout>
      <div className="orders-page">
        <div className="orders-container">
          {/* Header */}
          <div className="orders-header">
            <h1>Lịch sử mua hàng</h1>
            <p>Quản lý và theo dõi tất cả đơn hàng của bạn</p>
          </div>

          {/* Stats Cards */}
          <div className="orders-stats">
            <div className="stat-card total" onClick={() => setSelectedStatus('')}>
              <div className="stat-icon">
                <FaShoppingBag />
              </div>
              <div className="stat-content">
                <span className="stat-label">Tổng đơn hàng</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
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
                <FaCheckCircle />
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
          </div>

          {/* Search and Filters */}
          <div className="orders-filters">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng..."
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
                  <option value="">Tất cả</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
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

          {/* Orders List */}
          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spinning" />
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <FaShoppingBag className="empty-icon" />
              <h3>Chưa có đơn hàng nào</h3>
              <p>Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!</p>
              <Link to="/" className="shop-now-btn">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const statusConfigItem = statusConfig[order.status];
                const StatusIcon = statusConfigItem?.icon || FaClock;
                
                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-info-left">
                        <div className="order-number">
                          Mã đơn hàng: <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                        </div>
                        <div className="order-date">
                          <FaCalendarAlt />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div className="order-info-right">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>
                    </div>

                    <div className="order-items">
                      {order.items && order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="order-item">
                          <FaBox className="item-icon" />
                          <div className="item-details">
                            <div className="item-name">{item.product_name}</div>
                            {item.variant_name && (
                              <div className="item-variant">Đơn vị: {item.variant_name}</div>
                            )}
                            <div className="item-meta">
                              <span>Số lượng: {item.quantity}</span>
                              <span>Đơn giá: {formatCurrency(item.price)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.items && order.items.length > 2 && (
                        <div className="more-items">
                          và {order.items.length - 2} sản phẩm khác
                        </div>
                      )}
                    </div>

                    <div className="order-footer">
                      <div className="order-total">
                        <span>Tổng tiền:</span>
                        <strong>{formatCurrency(order.total_price)}</strong>
                      </div>
                      <div className="order-actions">
                        <Link to={`/orders/${order._id}`} className="action-btn view">
                          <FaEye /> Xem chi tiết
                        </Link>
                        {order.status === 'completed' && (
                          <button 
                            className="action-btn review"
                            onClick={() => openReviewModal(order)}
                          >
                            <FaStar /> Đánh giá
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                          <button 
                            className="action-btn reorder"
                            onClick={() => handleReorder(order)}
                          >
                            <FaShoppingBag /> Đặt lại
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && !loading && (
            <div className="pagination">
              <div className="pagination-info">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} đơn hàng
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
                      key={pageNum}
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
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedOrderForReview && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đánh giá đơn hàng</h2>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p className="order-info">
                Đánh giá cho đơn hàng <strong>#{selectedOrderForReview._id.slice(-8).toUpperCase()}</strong>
              </p>
              
              <div className="rating-section">
                <label>Đánh giá của bạn</label>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${reviewRating >= star ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      {reviewRating >= star ? <FaStar /> : <FaRegStar />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="comment-section">
                <label>Nhận xét của bạn</label>
                <textarea
                  rows="4"
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowReviewModal(false)}>
                Hủy
              </button>
              <button 
                className="submit-btn" 
                onClick={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? <FaSpinner className="spinning" /> : 'Gửi đánh giá'}
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
    </ShopDetailLayout>
  );
};

export default Orders;