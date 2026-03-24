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
  FaUser
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../css/ShopHeader.css';
import NotificationBell from '../../pages/user/NotificationBell';

const ShopHeader = ({ toggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Hàm load dữ liệu từ localStorage
  const loadUserData = () => {
    try {
      const shopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
      const shop = JSON.parse(localStorage.getItem('shop_info') || '{}');
      console.log('Loading user data:', shopData); // Debug log
      setUserData(shopData);
      setShopInfo(shop);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Lắng nghe custom events
  useEffect(() => {
    const handleShopDataUpdate = (event) => {
      console.log('Shop data updated:', event.detail);
      setUserData(event.detail);
    };

    const handleShopInfoUpdate = (event) => {
      console.log('Shop info updated:', event.detail);
      setShopInfo(event.detail);
    };

    // Lắng nghe custom events
    window.addEventListener('shopDataUpdate', handleShopDataUpdate);
    window.addEventListener('shopInfoUpdate', handleShopInfoUpdate);

    // Vẫn giữ storage event cho trường hợp nhiều tab
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

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('shopDataUpdate', handleShopDataUpdate);
      window.removeEventListener('shopInfoUpdate', handleShopInfoUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reload dữ liệu khi component được focus
  useEffect(() => {
    const handleFocus = () => {
      loadUserData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Reload dữ liệu khi route thay đổi
  useEffect(() => {
    loadUserData();
  }, [location.pathname]);

  const user = {
    name: userData?.full_name || userData?.username || 'Chủ shop',
    email: userData?.email || '',
    avatar: userData?.avatar_url || null,
    shopName: shopInfo?.name || 'Cửa hàng của tôi'
  };

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Gọi API logout
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

      // Xóa tất cả dữ liệu shop trong localStorage
      localStorage.removeItem('shop_token');
      localStorage.removeItem('shop_data');
      localStorage.removeItem('shop_info');
      
      // Chuyển hướng về trang đăng nhập shop
      navigate('/shop/login');
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Đóng menu khi click ra ngoài
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
          <h2>{user.shopName}</h2>
        </div>
      </div>

      <div className="shop-header__search">
        <FaSearch className="shop-header__search-icon" />
        <input 
          type="text" 
          placeholder="Tìm kiếm sản phẩm, đơn hàng..." 
          className="shop-header__search-input"
        />
      </div>

      <div className="shop-header__right">
        <div className="shop-header__actions">
          <button className="shop-header__action-btn">
            <FaEnvelope />
            <span className="shop-header__badge">3</span>
          </button>
          
          
              
            
              <span style={{ 
                    marginLeft: "20px",
                    cursor: "pointer", 
                    display: "flex", 
                    border: "1px solid #ddd", 
                    padding: "2px", 
                    borderRadius: "50%", 
                    backgroundColor: "#f0f2f5",
                    transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8f5e9";
                    e.currentTarget.style.borderColor = "#2e7d32";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8f5e9";
                    e.currentTarget.style.borderColor = "#ddd";
                }}>
              <div className="shop-header__notification">
                <NotificationBell userType="shop" />
              </div>
              </span>
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
                <p className="shop-header__dropdown-name">{user.name}</p>
                <p className="shop-header__dropdown-email">{user.email}</p>
              </div>
              <ul className="shop-header__dropdown-menu">
                <li onClick={() => navigate('/shop/profile')}>
                  <FaUser />
                  <span>Thông tin cá nhân</span>
                </li>
                <li onClick={() => navigate('/shop/settings')}>
                  <FaCog />
                  <span>Cài đặt tài khoản</span>
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
    </header>
  );
};

export default ShopHeader;