// src/components/Shoplayout/ShopSidebarLeft.jsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt,
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaChartBar,
  FaExchangeAlt,
  FaCog,
  FaDiscourse,
  FaSignOutAlt,
  FaRegGem,
  FaLeaf,
  FaTruck,
  FaPercent,
  FaChevronDown,
  FaChevronUp,
  FaChevronRight
} from 'react-icons/fa';
import { Truck, ChevronLeft, ChevronRight, Star, TrendingUp, Sparkles } from 'lucide-react';
import '../../css/ShopSidebarLeft.css';
import { useAppContext } from '../../components/common/AppContext';

const ShopSidebarLeft = ({ collapsed, onToggle }) => {
  const { t } = useAppContext();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isExpanding, setIsExpanding] = useState(false);
  let expandTimeout = null;

  const handleMouseEnter = () => {
    if (collapsed) {
      if (expandTimeout) clearTimeout(expandTimeout);
      setIsExpanding(true);
    }
  };

  const handleMouseLeave = () => {
    if (collapsed) {
      expandTimeout = setTimeout(() => {
        setIsExpanding(false);
        setOpenSubmenu(null);
      }, 100);
    }
  };

  const handleSubmenuToggle = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  // Menu chính
  const mainMenuItems = [
    { path: '/shop/dashboard', icon: <FaTachometerAlt />, title: t('sidebar.dashboard') },
    { path: '/shop/customers', icon: <FaUsers />, title: t('sidebar.customers') },
    { path: '/shop/products', icon: <FaBox />, title: t('sidebar.products') },
    { path: '/shop/orders', icon: <FaShoppingCart />, title: t('sidebar.orders') },
    { path: '/shop/revenue', icon: <FaChartBar />, title: t('sidebar.revenue') },
    { path: '/shop/returns', icon: <FaExchangeAlt />, title: t('sidebar.returns') },
    { path: '/shop/shipping-units', icon: <Truck />, title: t('sidebar.shipping') },
    { path: '/shop/settings', icon: <FaCog />, title: t('sidebar.settings') }
  ];

  // Submenu voucher - THÊM bgGradient VÀ badge
  const voucherSubmenu = [
    { 
      path: '/shop/vouchers', 
      icon: <FaPercent />, 
      title: 'Voucher Shop',    
      
    },
    { 
      path: '/shop/shipping-vouchers', 
      icon: <FaTruck />, 
      title: 'Voucher Ship',      
      
    }
  ];

  const showExpanded = !collapsed || isExpanding;

  return (
    <aside 
      className={`shop-sidebar ${collapsed ? 'collapsed' : ''} ${isExpanding ? 'expanding' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >    
      <nav className="shop-sidebar__nav">
        <ul className="shop-sidebar__menu">
          {mainMenuItems.map((item, index) => {
            // Nếu đang ở vị trí của orders (index === 3), thì render orders trước
            if (item.path === '/shop/orders') {
              return (
                <React.Fragment key={index}>
                  {/* Orders menu item */}
                  <li 
                    className="shop-sidebar__menu-item"
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => `shop-sidebar__menu-link ${isActive ? 'active' : ''}`}
                    >
                      <span className="shop-sidebar__menu-icon">{item.icon}</span>
                      
                      {showExpanded && (
                        <>
                          <span className="shop-sidebar__menu-title">{item.title}</span>
                          <Sparkles className="shop-sidebar__menu-arrow" size={14} />
                        </>
                      )}
                      
                      {/* Tooltip khi collapsed */}
                      {collapsed && !isExpanding && hoveredItem === index && (
                        <div className="shop-sidebar__tooltip">
                          {item.title}
                        </div>
                      )}
                    </NavLink>
                  </li>

                  {/* Voucher menu item with submenu */}
                  <li 
                    className="shop-sidebar__menu-item shop-sidebar__menu-item--has-submenu"
                    onMouseEnter={() => setHoveredItem('voucher')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div 
                      className={`shop-sidebar__menu-link ${openSubmenu === 'voucher' ? 'active-submenu' : ''}`}
                      onClick={(e) => showExpanded && handleSubmenuToggle('voucher', e)}
                    >
                      <span className="shop-sidebar__menu-icon"><FaDiscourse /></span>
                      
                      {showExpanded && (
                        <>
                          <span className="shop-sidebar__menu-title">{t('sidebar.vouchers')}</span>
                          {openSubmenu === 'voucher' ? (
                            <FaChevronUp className="shop-sidebar__menu-arrow" />
                          ) : (
                            <FaChevronDown className="shop-sidebar__menu-arrow" />
                          )}
                        </>
                      )}
                      
                      {/* Tooltip khi collapsed */}
                      {collapsed && !isExpanding && hoveredItem === 'voucher' && (
                        <div className="shop-sidebar__tooltip">
                          {t('sidebar.vouchers')}
                        </div>
                      )}
                    </div>

                    
                    {/* Submenu - 2 voucher card giống menu chính */}
                      {/* Submenu - Cấu trúc mới dùng chung class với menu chính */}
{showExpanded && openSubmenu === 'voucher' && (
  <div className="shop-sidebar__submenu-list">
    {voucherSubmenu.map((subItem, idx) => {
      const isActive = location.pathname === subItem.path;
      
      return (
        <li key={idx} className="shop-sidebar__menu-item shop-sidebar__submenu-item">
          <NavLink
            to={subItem.path}
            className={`shop-sidebar__menu-link ${isActive ? 'active' : ''}`}
          >
            <span className="shop-sidebar__menu-icon">{subItem.icon}</span>
            <span className="shop-sidebar__menu-title">{subItem.title}</span>
            <FaChevronRight className="shop-sidebar__menu-arrow" size={12} />
          </NavLink>
        </li>
      );
    })}
  </div>
)}
                  </li>
                </React.Fragment>
              );
            }
            
            // Skip vì voucher đã được xử lý riêng
            if (item.path === '/shop/revenue') {
              return (
                <li 
                  key={index} 
                  className="shop-sidebar__menu-item"
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => `shop-sidebar__menu-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="shop-sidebar__menu-icon">{item.icon}</span>
                    
                    {showExpanded && (
                      <>
                        <span className="shop-sidebar__menu-title">{item.title}</span>
                        <Sparkles className="shop-sidebar__menu-arrow" size={14} />
                      </>
                    )}
                    
                    {/* Tooltip khi collapsed */}
                    {collapsed && !isExpanding && hoveredItem === index && (
                      <div className="shop-sidebar__tooltip">
                        {item.title}
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            }
            
            // Các menu item khác
            if (item.path !== '/shop/orders' && item.path !== '/shop/revenue') {
              return (
                <li 
                  key={index} 
                  className="shop-sidebar__menu-item"
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => `shop-sidebar__menu-link ${isActive ? 'active' : ''}`}
                    end={item.path === '/shop/dashboard'}
                  >
                    <span className="shop-sidebar__menu-icon">{item.icon}</span>
                    
                    {showExpanded && (
                      <>
                        <span className="shop-sidebar__menu-title">{item.title}</span>
                        <Sparkles className="shop-sidebar__menu-arrow" size={14} />
                      </>
                    )}
                    
                    {/* Tooltip khi collapsed */}
                    {collapsed && !isExpanding && hoveredItem === index && (
                      <div className="shop-sidebar__tooltip">
                        {item.title}
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            }
            
            return null;
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default ShopSidebarLeft;