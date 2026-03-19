import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import '../../css/AdminLayout.css';

const AdminHeader = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Đọc key RIÊNG của admin
  const adminData = JSON.parse(localStorage.getItem('admin_data') || '{}');
  const adminName = adminData?.username || 'Admin';
  const adminEmail = adminData?.email || 'admin@example.com';

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('admin_token'); // Key riêng
      await api.post('/api/v1/admin/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Lỗi logout", error);
    } finally {
      // Chỉ xóa key của admin
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      // Không ảnh hưởng đến user token
      navigate('/admin/login');
    }
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleViewProfile = () => {
    navigate('/api/v1/admin/profile');
    setIsDropdownOpen(false);
  };

  const handleSettings = () => {
    navigate('/api/v1/admin/settings');
    setIsDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Tìm kiếm bài viết, sản phẩm..." />
      </div>
      
      <div className="user-info">
        <button className="notification-btn">
          🔔
          <span className="notification-dot"></span>
        </button>
        
        <div className="avatar-container" ref={dropdownRef}>
          <div 
            className={`user-avatar ${isDropdownOpen ? 'active' : ''}`}
            onClick={handleAvatarClick}
          >
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=2e7d32&color=fff&size=128`} // SỬA: userName -> adminName
              alt="avatar" 
            />
          </div>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="avatar-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=2e7d32&color=fff&size=128`} // SỬA: userName -> adminName
                    alt="avatar" 
                  />
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{adminName}</div> {/* SỬA: userName -> adminName */}
                  <div className="dropdown-user-email">{adminEmail}</div> {/* SỬA: userEmail -> adminEmail */}
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <ul className="dropdown-menu">
                <li className="dropdown-item" onClick={handleViewProfile}>
                  <span className="dropdown-icon">👤</span>
                  Xem profile
                </li>
                <li className="dropdown-item" onClick={handleSettings}>
                  <span className="dropdown-icon">⚙️</span>
                  Cài đặt
                </li>
                <li className="dropdown-divider"></li>
                <li className="dropdown-item logout" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  Đăng xuất
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;