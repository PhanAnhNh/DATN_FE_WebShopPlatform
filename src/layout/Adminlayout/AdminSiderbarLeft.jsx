import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Store, FileText, 
  BarChart3, Settings, Ticket, Truck, Map,
  Package, ShoppingCart, ChartNoAxesCombined, 
  Repeat, Cog, ChevronRight, MessageCircle
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Tổng Quan', path: '/admin/dashboard' },
    { icon: <Users size={20}/>, label: 'Quản Lý Người Dùng', path: '/admin/users' },
    { icon: <Store size={20}/>, label: 'Quản Lý Cửa Hàng', path: '/admin/stores' },
    { icon: <FileText size={20}/>, label: 'Quản Lý Bài Viết', path: '/admin/posts' },
    { icon: <Map size={20}/>, label: 'Map và Tỉnh Thành', path: '/admin/map-locations' }, // Đổi thành Truck icon và đường dẫn riêng
    { icon: <Settings size={20}/>, label: 'Cài Đặt Hệ Thống', path: '/admin/settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <span>🧺</span>
        </div>
        <span className="logo-text">Đặc Sản<br />Quê Tôi</span>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            style={{ cursor: 'pointer' }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;