import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './AdminSiderbarLeft';
import '../../css/AdminLayout.css'; 
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">
        <AdminHeader />
        <main>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;