import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt,
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaChartBar,
  FaExchangeAlt,
  FaCog,
  FaChevronRight,
  FaDiscourse
} from 'react-icons/fa';
import '../../css/ShopSidebarLeft.css';

const ShopSidebarLeft = ({ collapsed }) => {
  const menuItems = [
    { path: '/shop/dashboard', icon: <FaTachometerAlt />, title: 'Tổng Quan' },
    { path: '/shop/customers', icon: <FaUsers />, title: 'Quản Lý Khách Hàng' },
    { path: '/shop/products', icon: <FaBox />, title: 'Quản Lý Sản phẩm' },
    { path: '/shop/vouchers', icon: <FaDiscourse />, title: 'quản Lý Voucher' },
    { path: '/shop/orders', icon: <FaShoppingCart />, title: 'Quản Lý Đơn Hàng' },
    { path: '/shop/revenue', icon: <FaChartBar />, title: 'Thống Kê Doanh Thu' },
    { path: '/shop/returns', icon: <FaExchangeAlt />, title: 'Quản Lý Đổi Trả' },
    { path: '/shop/settings', icon: <FaCog />, title: 'Cài Đặt Hệ Thống' } // Sửa cả cái này
  ];

  return (
    <aside className={`shop-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="shop-sidebar__shop-info">
        {!collapsed && (
          <>
            <div className="shop-sidebar__shop-avatar">
              <img src="https://via.placeholder.com/50" alt="Shop" />
            </div>
            <div className="shop-sidebar__shop-details">
              <h3>Đặc Sản Quê Tôi</h3>
              <p>Hoạt động · 2 tuần</p>
            </div>
          </>
        )}
      </div>

      <nav className="shop-sidebar__nav">
        <ul className="shop-sidebar__menu">
          {menuItems.map((item, index) => (
            <li key={index} className="shop-sidebar__menu-item">
              <NavLink 
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                end={item.path === '/shop/dashboard'} // Thêm prop end cho dashboard để tránh match partial
              >
                <span className="shop-sidebar__menu-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="shop-sidebar__menu-title">{item.title}</span>
                    <FaChevronRight className="shop-sidebar__menu-arrow" />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      
    </aside>
  );
};

export default ShopSidebarLeft;