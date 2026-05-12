// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaSpinner, FaCheck, FaTrash, FaCheckDouble, FaEye } from 'react-icons/fa';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import '../../css/Notification.css';

const NotificationBell = ({ userType = 'user' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [markingAll, setMarkingAll] = useState(false);
  const [loadingFriendRequest, setLoadingFriendRequest] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Lấy token dựa vào userType
  const getToken = () => {
    switch(userType) {
      case 'shop':
        return localStorage.getItem('shop_token');
      case 'admin':
        return localStorage.getItem('admin_token');
      default:
        return localStorage.getItem('user_token');
    }
  };

  // Lấy current user ID
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user._id || user.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Cấu hình API headers
  const getApiConfig = () => {
    const token = getToken();
    if (token) {
      return {
        headers: { Authorization: `Bearer ${token}` }
      };
    }
    return {};
  };

  // Hiển thị toast message (tạo hàm đơn giản)
  const showToast = (message, type = 'info') => {
    // Kiểm tra nếu có toast container, nếu không thì tạo mới
    let toastContainer = document.querySelector('.toast-container-custom');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container-custom';
      toastContainer.style.cssText = 'position: fixed; top: 70px; right: 20px; z-index: 9999;';
      document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
      color: white;
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
      font-size: 14px;
      min-width: 250px;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const config = getApiConfig();
      const response = await api.get('/api/v1/notifications/unread-count', config);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      const config = getApiConfig();
      const response = await api.get('/api/v1/notifications', {
        ...config,
        params: {
          page: pagination.page,
          limit: 10
        }
      });
      setNotifications(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Polling mỗi 30 giây
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown, pagination.page]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const config = getApiConfig();
      await api.put(`/api/v1/notifications/${notificationId}/read`, {}, config);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const config = getApiConfig();
      await api.put('/api/v1/notifications/read-all', {}, config);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const config = getApiConfig();
      await api.delete(`/api/v1/notifications/${notificationId}`, config);
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      if (!deletedNotif?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Hàm xử lý click cho friend request
  const handleFriendRequestClick = async (notification) => {
    try {
      setLoadingFriendRequest(true);
      const config = getApiConfig();
      
      // Gọi API lấy thông tin chi tiết của friend request
      const response = await api.get(`/api/v1/friends/request/${notification.reference_id}`, config);
      const friendRequest = response.data;
      
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        showToast("Không tìm thấy thông tin người dùng", "error");
        return;
      }
      
      // Xác định ID người dùng cần chuyển đến (người gửi nếu current user là người nhận, hoặc người nhận nếu current user là người gửi)
      let targetUserId = null;
      if (friendRequest.user_id === currentUserId) {
        // Current user là người gửi -> chuyển đến profile người nhận
        targetUserId = friendRequest.friend_id;
      } else if (friendRequest.friend_id === currentUserId) {
        // Current user là người nhận -> chuyển đến profile người gửi
        targetUserId = friendRequest.user_id;
      }
      
      if (targetUserId) {
        navigate(`/profile/${targetUserId}`);
      } else {
        showToast("Không thể xác định người dùng", "error");
      }
    } catch (error) {
      console.error('Error fetching friend request:', error);
      // Fallback: thử lấy user ID từ message hoặc thông báo lỗi
      showToast("Không thể tải thông tin người dùng", "error");
    } finally {
      setLoadingFriendRequest(false);
      setShowDropdown(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Đánh dấu đã đọc
    if (!notification.is_read) {
      await markAsRead(notification._id);
    }
    
    // Kiểm tra nếu là thông báo friend_request và userType là shop thì không xử lý
    if (userType === 'shop' && (notification.type === 'friend_request' || notification.type === 'friend_accepted')) {
      console.log('Shop không nhận thông báo kết bạn');
      setShowDropdown(false);
      return;
    }
    
    // Xử lý đặc biệt cho friend_request và friend_accepted
    if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
      if (userType !== 'shop') {
        await handleFriendRequestClick(notification);
      }
      return;
    }
    
    // Chuyển hướng dựa vào loại thông báo và userType
    if (notification.reference_id) {
      switch (notification.type) {
        case 'order':
          if (userType === 'shop') {
            navigate(`/shop/orders/${notification.reference_id}`);
          } else if (userType === 'admin') {
            navigate(`/admin/orders/${notification.reference_id}`);
          } else {
            navigate(`/orders/${notification.reference_id}`);
          }
          break;
          
        case 'payment':
          if (userType === 'admin') {
            navigate(`/admin/orders/${notification.reference_id}`);
          } else {
            navigate(`/orders/${notification.reference_id}`);
          }
          break;
          
        case 'shipping':
          if (userType === 'shop') {
            navigate(`/shop/orders/${notification.reference_id}`);
          } else if (userType === 'admin') {
            navigate(`/admin/orders/${notification.reference_id}`);
          } else {
            navigate(`/orders/${notification.reference_id}`);
          }
          break;
          
        case 'product':
          if (userType === 'shop') {
            navigate(`/shop/products/${notification.reference_id}`);
          } else if (userType === 'admin') {
            navigate(`/admin/products/${notification.reference_id}`);
          } else {
            navigate(`/product/${notification.reference_id}`);
          }
          break;
          
        case 'review':
          if (userType === 'shop') {
            navigate(`/shop/reviews/${notification.reference_id}`);
          } else if (userType === 'admin') {
            navigate(`/admin/reviews/${notification.reference_id}`);
          } else {
            navigate(`/product/${notification.reference_id}`);
          }
          break;
          
        case 'follow':
          if (userType === 'shop') {
            console.log('Shop không nhận thông báo follow');
          } else {
            navigate(`/profile/${notification.reference_id}`);
          }
          break;
          
        case 'system':
          // Không chuyển hướng
          break;
          
        default:
          console.log('Unknown notification type:', notification.type);
          break;
      }
    }
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return '📦';
      case 'payment': return '💰';
      case 'shipping': return '🚚';
      case 'promotion': return '🎉';
      case 'review': return '⭐';
      case 'follow': return '👤';
      case 'friend_request': return '🤝';
      case 'friend_accepted': return '✅';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Thêm CSS animation cho toast
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loadingFriendRequest}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        {loadingFriendRequest && <FaSpinner className="spinning" style={{ marginLeft: '5px', fontSize: '12px' }} />}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Thông báo</h3>
            {notifications.some(n => !n.is_read) && (
              <button 
                className="mark-all-btn" 
                onClick={markAllAsRead}
                disabled={markingAll}
              >
                {markingAll ? <FaSpinner className="spinning" /> : <FaCheckDouble />}
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-loading">
                <FaSpinner className="spinning" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FaBell />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map(notif => (
                  <div 
                    key={notif._id} 
                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notification-item-icon">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-title">{notif.title}</div>
                      <div className="notification-item-message">{notif.message}</div>
                      <div className="notification-item-time">{formatTime(notif.created_at)}</div>
                    </div>
                    <button 
                      className="notification-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {pagination.total_pages > 1 && (
            <div className="notification-dropdown-footer">
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Trước
              </button>
              <span>{pagination.page}/{pagination.total_pages}</span>
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;