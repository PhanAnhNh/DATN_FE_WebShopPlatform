// src/pages/shop/ShopHeader.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaBars, 
  FaSearch, 
  FaBell, 
  FaEnvelope, 
  FaUserCircle,
  FaChevronDown,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaLeaf,
  FaSpinner
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../css/ShopHeader.css';
import NotificationBell from '../../pages/user/NotificationBell';
import { shopApi } from '../../api/api';

const ShopHeader = ({ toggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Hàm lấy thông tin shop từ API
  // src/pages/shop/ShopHeader.jsx - Phần fetchShopInfo
const fetchShopInfo = async () => {
  try {
    setRefreshing(true);
    const response = await shopApi.get('/api/v1/shops/info');
    
    const newShopInfo = response.data;
    setShopInfo(newShopInfo);
    
    // Cập nhật localStorage
    localStorage.setItem('shop_info', JSON.stringify(newShopInfo));
    
    // Dispatch event để các component khác cập nhật
    window.dispatchEvent(new CustomEvent('shopInfoUpdate', { detail: newShopInfo }));
    
    return newShopInfo;
  } catch (error) {
    console.error('Error fetching shop info:', error);
    
    // Nếu API lỗi 404, thử lấy từ localStorage
    if (error.response?.status === 404) {
      console.log('API /shop/info not found, using localStorage data');
    }
    
    // Fallback sang localStorage nếu API lỗi
    try {
      const cached = JSON.parse(localStorage.getItem('shop_info') || '{}');
      if (cached.name) {
        setShopInfo(cached);
      } else {
        // Tạo dữ liệu mặc định từ shop_data
        const shopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
        const defaultInfo = {
          name: shopData.shop_name || 'Cửa hàng của tôi',
          email: shopData.email || '',
          phone: shopData.phone || '',
          address: ''
        };
        setShopInfo(defaultInfo);
      }
    } catch (e) {
      console.error('Error parsing cached shop info:', e);
    }
  } finally {
    setRefreshing(false);
  }
};

  const loadUserData = () => {
    try {
      const shopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
      setUserData(shopData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
    fetchShopInfo();
  }, []);

  // Lắng nghe sự kiện cập nhật từ trang settings
  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      // Khi settings được cập nhật, reload shop info
      fetchShopInfo();
    };

    const handleShopInfoUpdate = (event) => {
      setShopInfo(event.detail);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'shop_data') {
        try {
          const newData = JSON.parse(e.newValue || '{}');
          setUserData(newData);
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
      if (e.key === 'shop_info') {
        try {
          const newInfo = JSON.parse(e.newValue || '{}');
          setShopInfo(newInfo);
        } catch (error) {
          console.error('Error parsing storage info:', error);
        }
      }
    };

    window.addEventListener('shopSettingsUpdate', handleSettingsUpdate);
    window.addEventListener('shopInfoUpdate', handleShopInfoUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('shopSettingsUpdate', handleSettingsUpdate);
      window.removeEventListener('shopInfoUpdate', handleShopInfoUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadUserData();
      fetchShopInfo();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Tự động refresh khi route thay đổi
  useEffect(() => {
    fetchShopInfo();
  }, [location.pathname]);

  const user = {
    name: userData?.full_name || userData?.username || 'Chủ shop',
    email: userData?.email || '',
    avatar: userData?.avatar_url || null,
    shopName: shopInfo?.name || 'Cửa hàng của tôi',
    shopEmail: shopInfo?.email || '',
    shopPhone: shopInfo?.phone || '',
    shopAddress: shopInfo?.address || ''
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      try {
        await fetch('http://localhost:8000/api/v1/shop/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('shop_token')}`
          }
        });
      } catch (error) {
        console.log('Logout API error:', error);
      }

      localStorage.removeItem('shop_token');
      localStorage.removeItem('shop_data');
      localStorage.removeItem('shop_info');
      
      navigate('/shop/login');
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.shop-header__user')) {
        setShowUserMenu(false);
      }
      if (!event.target.closest('.shop-header__notification')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="shop-header">
      <div className="shop-header__left">
        <button className="shop-header__menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <div className="shop-header__logo">
          <div className="shop-header__logo-icon">
            {shopInfo?.logo_url ? (
              <img src={shopInfo.logo_url} alt={user.shopName} style={{ width: 32, height: 32, borderRadius: 8 }} />
            ) : (
              <FaLeaf />
            )}
          </div>
          <h2>{user.shopName}</h2>
          {refreshing && <FaSpinner className="spinning-small" />}
        </div>
      </div>

      <div className={`shop-header__search ${searchFocused ? 'focused' : ''}`}>
        <FaSearch className="shop-header__search-icon" />
        <input 
          type="text" 
          placeholder="Tìm kiếm sản phẩm, đơn hàng..." 
          className="shop-header__search-input"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      <div className="shop-header__right">
        <div className="shop-header__actions">
          <button className="shop-header__action-btn">
            <FaEnvelope />
            <span className="shop-header__badge">3</span>
          </button>
          
          <div className="shop-header__notification-wrapper">
            <div className="shop-header__notification">
              <NotificationBell userType="shop" />
            </div>
          </div>
        </div>

        <div className="shop-header__user">
          <button 
            className="shop-header__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            disabled={loading}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="shop-header__avatar" />
            ) : (
              <FaUserCircle className="shop-header__avatar-icon" />
            )}
            <span className="shop-header__user-name">{user.name}</span>
            <FaChevronDown className={`shop-header__arrow ${showUserMenu ? 'rotated' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="shop-header__user-dropdown">
              <div className="shop-header__dropdown-header">
                <div className="shop-header__dropdown-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <FaUserCircle />
                  )}
                </div>
                <div className="shop-header__dropdown-info">
                  <p className="shop-header__dropdown-name">{user.name}</p>
                  <p className="shop-header__dropdown-email">{user.email}</p>
                </div>
              </div>
              
              {/* Hiển thị thông tin shop */}
              <div className="shop-header__dropdown-shop-info">
                <div className="shop-info-item">
                  <FaLeaf className="shop-info-icon" />
                  <div>
                    <p className="shop-info-label">Cửa hàng</p>
                    <p className="shop-info-value">{user.shopName}</p>
                  </div>
                </div>
                {user.shopEmail && (
                  <div className="shop-info-item">
                    <FaEnvelope className="shop-info-icon" />
                    <div>
                      <p className="shop-info-label">Email</p>
                      <p className="shop-info-value">{user.shopEmail}</p>
                    </div>
                  </div>
                )}
                {user.shopPhone && (
                  <div className="shop-info-item">
                    <FaEnvelope className="shop-info-icon" />
                    <div>
                      <p className="shop-info-label">Điện thoại</p>
                      <p className="shop-info-value">{user.shopPhone}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <ul className="shop-header__dropdown-menu">
                <li onClick={() => navigate('/shop/profile')}>
                  <FaUser />
                  <span>Thông tin cá nhân</span>
                </li>
                <li onClick={() => navigate('/shop/settings')}>
                  <FaCog />
                  <span>Cài đặt hệ thống</span>
                </li>
                <li className="divider"></li>
                <li 
                  className={`logout ${loading ? 'disabled' : ''}`} 
                  onClick={!loading ? handleLogout : undefined}
                >
                  <FaSignOutAlt />
                  <span>{loading ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning-small {
          animation: spin 1s linear infinite;
          margin-left: 8px;
          font-size: 12px;
          color: #2e7d32;
        }
        .shop-header__dropdown-shop-info {
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        .shop-info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .shop-info-item:last-child {
          margin-bottom: 0;
        }
        .shop-info-icon {
          color: #2e7d32;
          font-size: 14px;
          width: 20px;
        }
        .shop-info-label {
          font-size: 11px;
          color: #6c757d;
          margin: 0;
        }
        .shop-info-value {
          font-size: 13px;
          color: #212529;
          margin: 0;
          font-weight: 500;
        }
      `}</style>
    </header>
  );
};

export default ShopHeader;