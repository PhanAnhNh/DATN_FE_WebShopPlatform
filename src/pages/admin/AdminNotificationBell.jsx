// src/components/AdminNotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaSpinner, FaCheckDouble, FaTrash, FaUserPlus, FaStore, FaFileAlt, FaFlag, FaCog } from 'react-icons/fa';
import {adminApi} from '../../api/api';
import { useNavigate } from 'react-router-dom';
import '../../css/Notification.css';

const AdminNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Lấy token admin
  const getToken = () => {
    return localStorage.getItem('admin_token');
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
      const response = await adminApi.get('/api/v1/admin/notifications/unread-count', config);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching admin unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      const config = getApiConfig();
      const response = await adminApi.get('/api/v1/admin/notifications', {
        ...config,
        params: {
          page: pagination.page,
          limit: 10
        }
      });
      setNotifications(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
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
      await adminApi.put(`/api/v1/admin/notifications/${notificationId}/read`, {}, config);
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
      await adminApi.put('/api/v1/admin/notifications/read-all', {}, config);
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
      await adminApi.delete(`/api/v1/admin/notifications/${notificationId}`, config);
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
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    
    // Chuyển hướng dựa vào loại thông báo admin
    if (notification.reference_id) {
      switch (notification.type) {
        case 'new_user':
          navigate(`/admin/users/${notification.reference_id}`);
          break;
        case 'new_shop':
          navigate(`/admin/stores/${notification.reference_id}`);
          break;
        case 'new_post':
          navigate(`/admin/posts/${notification.reference_id}`);
          break;
        case 'report_user':
          navigate(`/admin/users/${notification.reference_id}/reports`);
          break;
        case 'report_shop':
          navigate(`/admin/stores/${notification.reference_id}/reports`);
          break;
        case 'report_post':
          navigate(`/admin/posts/${notification.reference_id}/reports`);
          break;
        default:
          break;
      }
    }
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_user': return <FaUserPlus />;
      case 'new_shop': return <FaStore />;
      case 'new_post': return <FaFileAlt />;
      case 'report_user': return <FaFlag />;
      case 'report_shop': return <FaFlag />;
      case 'report_post': return <FaFlag />;
      case 'system': return <FaCog />;
      default: return <FaBell />;
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
        <div className="notification-dropdown admin-dropdown">
          <div className="notification-dropdown-header">
            <h3>Thông báo quản trị</h3>
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
                    <div className="notification-item-icon admin-icon">
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

export default AdminNotificationBell;