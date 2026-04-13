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

const handleNotificationClick = (notification) => {
    // Đánh dấu đã đọc
    if (!notification.is_read) {
        markAsRead(notification._id);
    }
    
    // THÊM: Kiểm tra nếu là thông báo friend_request và userType là shop thì không xử lý
    if (userType === 'shop' && (notification.type === 'friend_request' || notification.type === 'friend_accepted')) {
        console.log('Shop không nhận thông báo kết bạn');
        setShowDropdown(false);
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
                
            case 'friend_request':
            case 'friend_accepted':
                // THÊM: Kiểm tra userType trước khi chuyển hướng
                if (userType === 'shop') {
                    // Shop không xử lý thông báo kết bạn
                    console.log('Shop không nhận thông báo kết bạn');
                } else {
                    // Chuyển đến trang profile của người gửi
                    navigate(`/profile/${notification.reference_id}`);
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

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
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