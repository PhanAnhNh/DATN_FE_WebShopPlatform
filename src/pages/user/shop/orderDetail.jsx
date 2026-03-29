import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaSpinner, 
  FaBox, 
  FaUser, 
  FaPhone, 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaTag,
  FaShippingFast,
  FaEnvelope,
  FaPrint,
  FaDownload,
  FaShareAlt,
  FaUndo,
  FaExclamationTriangle
} from 'react-icons/fa';
import api from '../../../api/api';
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";
import "../../../css/orderDetail.css";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [returnInfo, setReturnInfo] = useState(null); // Thêm state để lưu thông tin hoàn trả

  const statusConfig = {
    pending: {
      label: 'Chờ xử lý',
      color: '#ffc107',
      icon: FaClock,
      description: 'Đơn hàng đang được xử lý',
      nextStatus: 'paid'
    },
    paid: {
      label: 'Đã thanh toán',
      color: '#17a2b8',
      icon: FaCheckCircle,
      description: 'Đơn hàng đã được thanh toán',
      nextStatus: 'shipped'
    },
    shipped: {
      label: 'Đang giao',
      color: '#007bff',
      icon: FaTruck,
      description: 'Đơn hàng đang được vận chuyển',
      nextStatus: 'completed'
    },
    completed: {
      label: 'Đã giao',
      color: '#28a745',
      icon: FaCheckCircle,
      description: 'Đơn hàng đã giao thành công',
      nextStatus: null
    },
    cancelled: {
      label: 'Đã hủy',
      color: '#dc3545',
      icon: FaBan,
      description: 'Đơn hàng đã bị hủy',
      nextStatus: null
    }
  };

  // Payment status config
  const paymentStatusConfig = {
    unpaid: {
      label: 'Chưa thanh toán',
      color: '#dc3545',
      icon: FaBan
    },
    paid: {
      label: 'Đã thanh toán',
      color: '#28a745',
      icon: FaCheckCircle
    }
  };

  // Return status config
  const returnStatusConfig = {
    pending: {
      label: 'Chờ xử lý',
      color: '#ffc107',
      icon: FaClock,
      message: 'Yêu cầu hoàn trả đang được xử lý'
    },
    approved: {
      label: 'Đã duyệt',
      color: '#17a2b8',
      icon: FaCheckCircle,
      message: 'Yêu cầu hoàn trả đã được duyệt, tiền sẽ được hoàn trong 3-5 ngày'
    },
    rejected: {
      label: 'Từ chối',
      color: '#dc3545',
      icon: FaBan,
      message: 'Yêu cầu hoàn trả đã bị từ chối'
    },
    completed: {
      label: 'Hoàn thành',
      color: '#28a745',
      icon: FaCheckCircle,
      message: 'Đã hoàn trả thành công'
    },
    cancelled: {
      label: 'Đã hủy',
      color: '#dc3545',
      icon: FaBan,
      message: 'Yêu cầu hoàn trả đã bị hủy'
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    checkReturnStatus(); // Thêm kiểm tra trạng thái hoàn trả
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      if (error.response?.status === 404) {
        alert('Không tìm thấy đơn hàng');
        navigate('/orders');
      } else if (error.response?.status === 403) {
        alert('Bạn không có quyền xem đơn hàng này');
        navigate('/orders');
      } else {
        alert('Có lỗi xảy ra khi tải thông tin đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm kiểm tra trạng thái hoàn trả
  const checkReturnStatus = async () => {
    try {
      const response = await api.get(`/api/v1/returns/my?order_id=${orderId}`);
      if (response.data.data && response.data.data.length > 0) {
        setReturnInfo(response.data.data[0]); // Lấy yêu cầu hoàn trả đầu tiên
      }
    } catch (error) {
      console.error('Error checking return status:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      setCancelling(true);
      await api.post(`/api/v1/orders/${orderId}/cancel`);
      alert('Đơn hàng đã được hủy thành công!');
      await fetchOrderDetail();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.detail || 'Không thể hủy đơn hàng này');
    } finally {
      setCancelling(false);
    }
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
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const getPaymentStatusInfo = (status) => {
    return paymentStatusConfig[status] || paymentStatusConfig.unpaid;
  };

  const getFullAddress = () => {
    if (!order) return '';
    if (order.shipping_address_details) {
      const addr = order.shipping_address_details;
      const parts = [addr.street, addr.ward, addr.district, addr.city, addr.country].filter(p => p && p.trim());
      return parts.join(', ') || order.shipping_address;
    }
    return order.shipping_address || 'Chưa có';
  };

  const canCancel = () => {
    if (!order) return false;
    // Không thể hủy nếu đã có yêu cầu hoàn trả
    if (returnInfo && ['pending', 'approved'].includes(returnInfo.status)) return false;
    return order.status === 'pending' || order.status === 'paid';
  };

  const canReorder = () => {
    if (!order) return false;
    return order.status !== 'cancelled';
  };

  const handleReorder = () => {
    const itemsToReorder = order.items.map(item => ({
      ...item,
      quantity: item.quantity
    }));
    localStorage.setItem('selectedCartItems', JSON.stringify(itemsToReorder));
    navigate('/checkout');
  };

  const handlePrint = () => {
    window.print();
  };

  // Kiểm tra xem đơn hàng đã được hoàn trả chưa
  const isReturned = () => {
    return returnInfo && ['approved', 'completed'].includes(returnInfo.status);
  };

  // Lấy thông báo hoàn trả
  const getReturnMessage = () => {
    if (!returnInfo) return null;
    
    const config = returnStatusConfig[returnInfo.status] || returnStatusConfig.pending;
    const Icon = config.icon;
    
    return {
      icon: Icon,
      label: config.label,
      message: config.message,
      color: config.color
    };
  };

  if (loading) {
    return (
      <ShopDetailLayout>
        <div className="order-detail-loading">
          <FaSpinner className="spinning" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </ShopDetailLayout>
    );
  }

  if (!order) {
    return (
      <ShopDetailLayout>
        <div className="order-detail-not-found">
          <h2>Không tìm thấy đơn hàng</h2>
          <Link to="/orders" className="btn-primary">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </ShopDetailLayout>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const paymentInfo = getPaymentStatusInfo(order.payment_status);
  const PaymentIcon = paymentInfo.icon;
  const returnMessage = getReturnMessage();

  return (
    <ShopDetailLayout>
      <div className="order-detail-container">
        {/* Header */}
        <div className="order-detail-header">
          <button className="back-btn" onClick={() => navigate('/use/shop')}>
            <FaArrowLeft /> Quay lại
          </button>
          <div className="order-header-right">
            <button className="print-btn" onClick={handlePrint}>
              <FaPrint /> In đơn hàng
            </button>
            {canReorder() && !isReturned() && (
              <button className="reorder-btn" onClick={handleReorder}>
                <FaShareAlt /> Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Order Title */}
        <div className="order-title-section">
          <h1>Chi tiết đơn hàng</h1>
          <div className="order-id">
            Mã đơn hàng: <strong>#{order._id.slice(-8).toUpperCase()}</strong>
          </div>
        </div>

        {/* Thêm thông báo hoàn trả */}
        {returnMessage && (
          <div className="return-info-banner" style={{ borderLeftColor: returnMessage.color }}>
            <div className="return-icon" style={{ color: returnMessage.color }}>
              <returnMessage.icon size={24} />
            </div>
            <div className="return-content">
              <div className="return-title">Đơn hàng đã được hoàn trả</div>
              <div className="return-status" style={{ color: returnMessage.color }}>
                Trạng thái: {returnMessage.label}
              </div>
              <div className="return-message">{returnMessage.message}</div>
              {returnInfo?.total_refund && (
                <div className="return-amount">
                  Số tiền hoàn trả: <strong>{formatCurrency(returnInfo.total_refund)}</strong>
                </div>
              )}
              {returnInfo?.completed_at && (
                <div className="return-date">
                  Ngày hoàn tất: {formatDate(returnInfo.completed_at)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Timeline - Ẩn timeline nếu đã hoàn trả */}
        {!isReturned() && (
          <div className="status-timeline">
            <div className="timeline-steps">
              <div className={`step ${order.status === 'pending' || order.status === 'paid' || order.status === 'shipped' || order.status === 'completed' ? 'active' : ''}`}>
                <div className="step-icon">
                  <FaClock />
                </div>
                <div className="step-label">Chờ xử lý</div>
              </div>
              <div className={`step ${order.status === 'paid' || order.status === 'shipped' || order.status === 'completed' ? 'active' : ''}`}>
                <div className="step-icon">
                  <FaCheckCircle />
                </div>
                <div className="step-label">Đã thanh toán</div>
              </div>
              <div className={`step ${order.status === 'shipped' || order.status === 'completed' ? 'active' : ''}`}>
                <div className="step-icon">
                  <FaTruck />
                </div>
                <div className="step-label">Đang giao</div>
              </div>
              <div className={`step ${order.status === 'completed' ? 'active' : ''}`}>
                <div className="step-icon">
                  <FaCheckCircle />
                </div>
                <div className="step-label">Hoàn thành</div>
              </div>
            </div>
          </div>
        )}

        {/* Order Status Cards */}
        <div className="status-cards">
          <div className="status-card" style={{ borderColor: statusInfo.color }}>
            <div className="status-icon" style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
              <StatusIcon />
            </div>
            <div className="status-info">
              <div className="status-label">Trạng thái đơn hàng</div>
              <div className="status-value" style={{ color: statusInfo.color }}>{statusInfo.label}</div>
              <div className="status-desc">{statusInfo.description}</div>
            </div>
          </div>

          <div className="status-card" style={{ borderColor: paymentInfo.color }}>
            <div className="status-icon" style={{ backgroundColor: paymentInfo.color + '20', color: paymentInfo.color }}>
              <PaymentIcon />
            </div>
            <div className="status-info">
              <div className="status-label">Trạng thái thanh toán</div>
              <div className="status-value" style={{ color: paymentInfo.color }}>{paymentInfo.label}</div>
              <div className="status-desc">
                {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Đã chuyển khoản'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="order-detail-content">
          {/* Left Column */}
          <div className="order-left">
            {/* Customer Info */}
            <div className="info-section">
              <h3>Thông tin khách hàng</h3>
              <div className="info-grid">
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div>
                    <label>Họ tên</label>
                    <p>{order.customer_name || order.shipping_address_details?.name || 'Chưa có'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <FaPhone className="info-icon" />
                  <div>
                    <label>Số điện thoại</label>
                    <p>{order.customer_phone || order.shipping_address_details?.phone || 'Chưa có'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <FaEnvelope className="info-icon" />
                  <div>
                    <label>Email</label>
                    <p>{order.customer_email || 'Chưa có'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="info-section">
              <h3>Địa chỉ giao hàng</h3>
              <div className="address-info">
                <FaMapMarkerAlt className="address-icon" />
                <p>{getFullAddress()}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="info-section">
              <h3>Sản phẩm đã đặt</h3>
              <div className="order-items-table">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Đơn giá</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="product-info">
                            <FaBox className="product-icon" />
                            <div>
                              <div className="product-name">{item.product_name}</div>
                              {item.variant_name && (
                                <div className="product-variant">Đơn vị: {item.variant_name}</div>
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
                </table>
              </div>
            </div>

            {/* Note */}
            {order.note && (
              <div className="info-section">
                <h3>Ghi chú</h3>
                <div className="order-note">
                  <p>{order.note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-right">
            <div className="summary-card">
              <h3>Tổng quan đơn hàng</h3>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Ngày đặt hàng</span>
                  <span className="value">
                    <FaCalendarAlt /> {formatDate(order.created_at)}
                  </span>
                </div>
                
                <div className="summary-row">
                  <span>Phương thức thanh toán</span>
                  <span className="value">
                    <FaCreditCard /> {order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}
                  </span>
                </div>
                
                <div className="divider"></div>
                
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span className="value">{formatCurrency(order.subtotal || order.total_price)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Phí vận chuyển</span>
                  <span className="value">{formatCurrency(order.shipping_fee || 0)}</span>
                </div>
                
                {order.discount > 0 && (
                  <div className="summary-row discount">
                    <span>
                      <FaTag /> Giảm giá
                      {order.voucher && ` (${order.voucher.code})`}
                    </span>
                    <span className="value">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                
                <div className="divider"></div>
                
                <div className="summary-row total">
                  <span>Tổng cộng</span>
                  <span className="total-value">{formatCurrency(order.total_amount || order.total_price)}</span>
                </div>
              </div>

              {/* Voucher Info */}
              {order.voucher && (
                <div className="voucher-info">
                  <FaTag className="voucher-icon" />
                  <div>
                    <strong>Mã giảm giá: {order.voucher.code}</strong>
                    <p>Giảm {formatCurrency(order.voucher.discount)}</p>
                  </div>
                </div>
              )}

              {/* Cancel Button - Ẩn nếu đã hoàn trả */}
              {canCancel() && !isReturned() && (
                <div className="cancel-section">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <FaBan /> Hủy đơn hàng
                  </button>
                  <p className="cancel-note">
                    * Chỉ có thể hủy đơn hàng khi chưa được xử lý
                  </p>
                </div>
              )}
            </div>

            {/* Support Info */}
            <div className="support-card">
              <h4>Cần hỗ trợ?</h4>
              <p>Liên hệ với chúng tôi qua:</p>
              <ul>
                <li>📞 Hotline: 1900 1234</li>
                <li>📧 Email: support@organicfood.com</li>
                <li>💬 Chat trực tuyến</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="modal-content cancel-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận hủy đơn hàng</h2>
              <button className="close-btn" onClick={() => setShowCancelConfirm(false)}>
                <FaBan />
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn hủy đơn hàng <strong>#{order._id.slice(-8).toUpperCase()}</strong>?</p>
              <p className="warning">⚠️ Hành động này không thể hoàn tác!</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCancelConfirm(false)}>
                Quay lại
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? <FaSpinner className="spinning" /> : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ShopDetailLayout>
  );
};

export default OrderDetail;