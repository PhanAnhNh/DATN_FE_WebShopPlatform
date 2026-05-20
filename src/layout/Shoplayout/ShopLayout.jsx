// src/components/Shoplayout/ShopLayout.jsx
import React, { useState, useEffect } from 'react';
import ShopHeader from './ShopHeader';
import ShopSidebarLeft from './ShopSidebarLeft';
import '../../css/ShopLayout.css';

const ShopLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Reset theme về light khi vào shop (tránh ảnh hưởng từ admin)
  useEffect(() => {
    // Xóa data-theme do admin set, để shop luôn ở chế độ sáng
    document.documentElement.removeAttribute('data-theme');
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="shop-layout">
      <ShopHeader toggleSidebar={toggleSidebar} />
      <div className="shop-layout__container">
        <ShopSidebarLeft 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
        />
        <main className={`shop-layout__content ${sidebarCollapsed ? 'expanded' : ''}`}>
          <div className="shop-layout__content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;