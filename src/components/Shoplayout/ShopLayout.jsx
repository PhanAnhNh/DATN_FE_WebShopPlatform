import React, { useState } from 'react';
import ShopHeader from './ShopHeader';
import ShopSidebarLeft from './ShopSidebarLeft';
import '../../css/ShopLayout.css';

const ShopLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="shop-layout">
      <ShopHeader toggleSidebar={toggleSidebar} />
      <div className="shop-layout__container">
        <ShopSidebarLeft collapsed={sidebarCollapsed} />
        <main className={`shop-layout__content ${sidebarCollapsed ? 'expanded' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;