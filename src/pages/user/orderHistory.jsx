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
  FaUndo,
  FaExclamationTriangle
} from 'react-icons/fa';
import api from '../../api/api';
import '../../css/Orders.css';
import ShopDetailLayout from '../../components/layout/ShopDetailLayout';
import Toast from '../../components/common/Toast';

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
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    orderId: null
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

  // Return modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [returnImages, setReturnImages] = useState([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [bankInfo, setBankInfo] = useState({ name: '', account: '', holder: '' });
  const [hasReturnRequest, setHasReturnRequest] = useState({}); 
  const [cancelling, setCancelling] = useState(false);

  // Helper function to show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Helper function to show confirm dialog
  const showConfirm = (title, message, onConfirm, orderId = null) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm: () => onConfirm(orderId),
      orderId
    });
  };

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

  // Kiểm tra có thể yêu cầu hoàn trả không
  const canRequestReturn = (order) => {
    if (!order) return false;
    if (order.status !== 'completed') return false;
    
    const completedDate = new Date(order.completed_at || order.created_at);
    const daysDiff = Math.floor((new Date() - completedDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7) return false;
    if (hasReturnRequest[order._id] === true) return false;
    
    return true;
  };

  // Kiểm tra đã có yêu cầu hoàn trả chưa
  const checkReturnRequest = async (orderId) => {
    try {
      const response = await api.get(`/api/v1/returns/my?order_id=${orderId}`);
      const returns = response.data.data || [];
      
      const hasActiveReturn = returns.some(ret => 
        ret.status === 'pending' || 
        ret.status === 'approved' || 
        ret.status === 'completed'
      );
      
      setHasReturnRequest(prev => ({ ...prev, [orderId]: hasActiveReturn }));
    } catch (error) {
      console.error('Error checking return request:', error);
      setHasReturnRequest(prev => ({ ...prev, [orderId]: false }));
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
      
      const processedOrders = ordersData.map(order => ({
        ...order,
        total_price: order.total_amount || order.total_price || 0,
        items: order.items.map(item => ({
          ...item,
          _id: item._id || `item_${Math.random()}`,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity
        }))
      }));
      
      setOrders(processedOrders);
      setPagination(paginationData);
      
      processedOrders.forEach(order => {
        if (order.status === 'completed') {
          checkReturnRequest(order._id);
        }
      });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
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
      setStats({
        total: 0,
        pending: 0,
        paid: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0
      });
    }
  };

  const handleReturnRequest = async () => {
    if (!selectedOrderForReturn) return;
    
    const selectedItems = returnItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 sản phẩm để yêu cầu hoàn trả', 'error');
      return;
    }
    
    if (!returnReason) {
      showToast('Vui lòng chọn lý do hoàn trả', 'error');
      return;
    }
    
    try {
      setSubmittingReturn(true);
      
      const returnData = {
        order_id: selectedOrderForReturn._id,
        items: selectedItems.map(item => ({
          order_item_id: String(item.order_item_id),
          product_id: String(item.product_id),
          product_name: String(item.product_name),
          variant_id: item.variant_id ? String(item.variant_id) : null,
          variant_name: item.variant_name || null,
          quantity: Number(item.quantity),
          price: Number(item.price),
          reason: String(returnReason),
          reason_note: returnNote || null,
          images: Array.isArray(returnImages) ? returnImages : []
        })),
        notes: returnNote || null,
        bank_name: bankInfo.name || null,
        bank_account: bankInfo.account || null,
        bank_holder: bankInfo.holder || null
      };
      
      await api.post('/api/v1/returns/request', returnData);
      
      showToast('Yêu cầu hoàn trả đã được gửi. Vui lòng chờ shop xử lý.', 'success');
      setShowReturnModal(false);
      setSelectedOrderForReturn(null);
      setReturnItems([]);
      setReturnReason('');
      setReturnNote('');
      setReturnImages([]);
      setBankInfo({ name: '', account: '', holder: '' });
      
      if (selectedOrderForReturn) {
        await checkReturnRequest(selectedOrderForReturn._id);
      }
      
    } catch (error) {
      console.error('Error creating return request:', error);
      if (error.response?.data?.detail) {
        const details = error.response.data.detail;
        if (Array.isArray(details)) {
          const errorMessages = details.map(err => {
            if (err.loc) {
              const field = err.loc.slice(1).join('.');
              return `${field}: ${err.msg}`;
            }
            return err.msg;
          }).join('\n');
          showToast(errorMessages, 'error');
        } else {
          showToast(details, 'error');
        }
      } else {
        showToast('Có lỗi xảy ra, vui lòng thử lại sau', 'error');
      }
    } finally {
      setSubmittingReturn(false);
    }
  };

  // SỬA: Hàm xử lý hủy đơn - không dùng window.confirm nữa
  const handleCancelOrder = async (orderId) => {
    try {
      setCancelling(true);
      await api.post(`/api/v1/orders/${orderId}/cancel`);
      showToast('Đơn hàng đã được hủy thành công!', 'success');
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast(error.response?.data?.detail || 'Không thể hủy đơn hàng này', 'error');
    } finally {
      setCancelling(false);
      setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, orderId: null });
    }
  };

  // Hàm mở confirm dialog trước khi hủy
  const openCancelConfirm = (orderId, orderCode) => {
    showConfirm(
      'Xác nhận hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng #${orderCode}? Hành động này không thể hoàn tác.`,
      handleCancelOrder,
      orderId
    );
  };

  const openReturnModal = (order) => {
    setSelectedOrderForReturn(order);
    const initialItems = order.items.map((item, index) => {
      const orderItemId = item._id || item.id || `item_${index}`;
      return {
        order_item_id: String(orderItemId),
        product_id: String(item.product_id),
        product_name: String(item.product_name),
        variant_id: item.variant_id ? String(item.variant_id) : null,
        variant_name: item.variant_name || null,
        quantity: Number(item.quantity),
        price: Number(item.price),
        selected: false
      };
    });
    
    setReturnItems(initialItems);
    setReturnReason('');
    setReturnNote('');
    setReturnImages([]);
    setBankInfo({ name: '', account: '', holder: '' });
    setShowReturnModal(true);
  };

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
      await api.post('/api/v1/reviews', {
        order_id: selectedOrderForReview._id,
        rating: reviewRating,
        comment: reviewComment
      });
      showToast('Cảm ơn bạn đã đánh giá!', 'success');
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Có lỗi xảy ra, vui lòng thử lại sau', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <ShopDetailLayout>
      <div className="orders-page">
        {/* Toast Component */}
        {toast.show && (
          <div className="toast-container">
            <Toast 
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />
          </div>
        )}

        {/* Confirm Dialog Component */}
        {confirmDialog.show && (
          <div className="modal-overlay" onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, orderId: null })}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle style={{ color: '#ff9800', marginRight: '8px' }} />
                  {confirmDialog.title}
                </h2>
                <button className="close-btn" onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, orderId: null })}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <p>{confirmDialog.message}</p>
                <p className="warning">⚠️ Hành động này không thể hoàn tác!</p>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn" 
                  onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, orderId: null })}
                >
                  Hủy
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={() => confirmDialog.onConfirm && confirmDialog.onConfirm(confirmDialog.orderId)}
                  style={{ background: '#dc3545' }}
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        )}

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
                const orderCode = order._id.slice(-8).toUpperCase();
                
                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-info-left">
                        <div className="order-number">
                          Mã đơn hàng: <strong>#{orderCode}</strong>
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
                        
                        {order.status !== 'cancelled' && (
                          <button 
                            className="action-btn reorder"
                            onClick={() => handleReorder(order)}
                          >
                            <FaShoppingBag /> Đặt lại
                          </button>
                        )}
                        
                        {/* SỬA: Dùng confirm dialog thay vì window.confirm */}
                        {(order.status === 'pending' || order.status === 'paid') && (
                          <button 
                            className="action-btn cancel"
                            onClick={() => openCancelConfirm(order._id, orderCode)}
                            disabled={cancelling}
                          >
                            <FaBan /> Hủy đơn
                          </button>
                        )}
                        
                        {canRequestReturn(order) && (
                          <button 
                            className="action-btn return"
                            onClick={() => openReturnModal(order)}
                          >
                            <FaUndo /> Yêu cầu hoàn trả
                          </button>
                        )}
                        
                        {hasReturnRequest[order._id] && (
                          <Link to={`/returns/${order._id}`} className="action-btn view-return">
                            <FaEye /> Xem hoàn trả
                          </Link>
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

      {/* Return Modal */}
      {showReturnModal && selectedOrderForReturn && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="modal-content return-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yêu cầu hoàn trả</h2>
              <button className="close-btn" onClick={() => setShowReturnModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {/* Modal body content - giữ nguyên */}
              <div className="return-items-selection">
                <h4>Chọn sản phẩm muốn trả</h4>
                {selectedOrderForReturn.items.map((item, idx) => (
                  <div key={idx} className="return-item-select">
                    <input
                      type="checkbox"
                      checked={returnItems.find(i => i.order_item_id === (item._id || item.id))?.selected || false}
                      onChange={(e) => {
                        const newItems = [...returnItems];
                        const existingIndex = newItems.findIndex(i => i.order_item_id === (item._id || item.id));
                        if (existingIndex !== -1) {
                          newItems[existingIndex].selected = e.target.checked;
                        } else {
                          newItems.push({
                            order_item_id: item._id || item.id,
                            product_id: item.product_id,
                            product_name: item.product_name,
                            variant_id: item.variant_id,
                            variant_name: item.variant_name,
                            quantity: item.quantity,
                            price: item.price,
                            selected: e.target.checked
                          });
                        }
                        setReturnItems(newItems);
                      }}
                    />
                    <div className="item-info">
                      <div className="item-name">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="item-variant">Đơn vị: {item.variant_name}</div>
                      )}
                      <div className="item-price">
                        {formatCurrency(item.price)} x {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="return-reason-section">
                <label>Lý do hoàn trả</label>
                <select 
                  value={returnReason} 
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="">Chọn lý do</option>
                  <option value="wrong_product">Sai sản phẩm</option>
                  <option value="damaged">Sản phẩm hư hỏng</option>
                  <option value="expired">Sản phẩm hết hạn</option>
                  <option value="quality">Chất lượng kém</option>
                  <option value="change_mind">Đổi ý</option>
                  <option value="other">Lý do khác</option>
                </select>
              </div>

              <div className="return-note-section">
                <label>Ghi chú thêm</label>
                <textarea
                  rows="3"
                  placeholder="Mô tả chi tiết vấn đề..."
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                />
              </div>

              <div className="return-images-section">
                <label>Hình ảnh chứng minh</label>
                <div className="image-upload-area">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      const uploadedUrls = [];
                      for (const file of files) {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const response = await api.post('/api/v1/returns/upload-image', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          uploadedUrls.push(response.data.url);
                        } catch (err) {
                          console.error('Error uploading image:', err);
                        }
                      }
                      setReturnImages([...returnImages, ...uploadedUrls]);
                    }}
                  />
                  <div className="image-preview">
                    {returnImages.map((url, idx) => (
                      <div key={idx} className="preview-item">
                        <img src={url} alt={`preview-${idx}`} />
                        <button onClick={() => setReturnImages(returnImages.filter((_, i) => i !== idx))}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bank-info-section">
                <h4>Thông tin nhận hoàn tiền</h4>
                <input
                  type="text"
                  placeholder="Tên ngân hàng"
                  value={bankInfo.name}
                  onChange={(e) => setBankInfo({ ...bankInfo, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Số tài khoản"
                  value={bankInfo.account}
                  onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Tên chủ tài khoản"
                  value={bankInfo.holder}
                  onChange={(e) => setBankInfo({ ...bankInfo, holder: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowReturnModal(false)}>
                Hủy
              </button>
              <button 
                className="submit-btn" 
                onClick={handleReturnRequest}
                disabled={submittingReturn}
              >
                {submittingReturn ? <FaSpinner className="spinning" /> : 'Gửi yêu cầu'}
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
        
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          animation: slideInRight 0.3s ease;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .confirm-modal {
          max-width: 450px;
        }
        
        .confirm-modal .warning {
          color: #dc3545;
          font-size: 13px;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #eee;
        }
        
        .confirm-modal .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .confirm-modal .confirm-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .confirm-modal .confirm-btn:hover {
          background: #c82333;
          transform: translateY(-1px);
        }
        
        .confirm-modal .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .confirm-modal .cancel-btn:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }
      `}</style>
    </ShopDetailLayout>
  );
};

export default Orders;