import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFileExcel, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSpinner
} from 'react-icons/fa';
import { shopApi } from '../../api/api';
import '../../css/ShopCustomers.css';

const ShopCustomers = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, debouncedSearch]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching customers with shop token...');
      
      // DÙNG shopApi - không cần thêm token thủ công
      const response = await shopApi.get('/api/v1/shop/customers', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined
        }
      });
      
      console.log('Customers response:', response.data);
      
      setCustomers(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      
      if (error.response?.status === 401) {
        console.log('Token expired, redirecting to login...');
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      setError('Không thể tải danh sách khách hàng');
      // Dữ liệu mẫu nếu API lỗi
      setCustomers(mockCustomers);
      setPagination({
        page: 1,
        limit: 10,
        total: mockCustomers.length,
        total_pages: Math.ceil(mockCustomers.length / 10)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (customer) => {
    try {
      // DÙNG shopApi
      const response = await shopApi.get(`/api/v1/shop/customers/${customer.id}`);
      setSelectedCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer detail:', error);
      // Dữ liệu mẫu
      setSelectedCustomer({
        ...customer,
        orders: [
          { id: 'DH001', total_price: 500000, status: 'completed', created_at: '2024-03-15T10:30:00', items_count: 3 },
          { id: 'DH002', total_price: 300000, status: 'completed', created_at: '2024-03-10T14:20:00', items_count: 2 },
          { id: 'DH003', total_price: 700000, status: 'pending', created_at: '2024-03-18T16:45:00', items_count: 4 }
        ]
      });
    }
    setShowDetailModal(true);
  };

  // Dữ liệu mẫu
  const mockCustomers = [
    {
      id: '1',
      full_name: 'Nguyễn Văn A',
      username: 'nguyenvana',
      email: 'nguyenvana@email.com',
      phone: '0123670934',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      total_spent: 1500000,
      order_count: 5,
      last_order: '2024-03-15T10:30:00',
      created_at: '2024-01-10T08:00:00',
      gender: 'male'
    },
    {
      id: '2',
      full_name: 'Nguyễn Văn B',
      username: 'nguyenvanb',
      email: 'nguyenvanb@email.com',
      phone: '0123670834',
      address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      total_spent: 850000,
      order_count: 3,
      last_order: '2024-03-10T14:20:00',
      created_at: '2024-01-15T09:30:00',
      gender: 'male'
    },
    {
      id: '3',
      full_name: 'Trần Thị C',
      username: 'tranthic',
      email: 'tranthic@email.com',
      phone: '0987654321',
      address: '789 Đường Võ Văn Tần, Quận 3, TP.HCM',
      total_spent: 2300000,
      order_count: 7,
      last_order: '2024-03-18T16:45:00',
      created_at: '2024-01-05T10:15:00',
      gender: 'female'
    },
    {
      id: '4',
      full_name: 'Lê Văn D',
      username: 'levand',
      email: 'levand@email.com',
      phone: '0912345678',
      address: '321 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
      total_spent: 450000,
      order_count: 2,
      last_order: '2024-03-05T09:10:00',
      created_at: '2024-02-01T11:20:00',
      gender: 'male'
    }
  ];

  // Sửa thông tin khách hàng
  const handleEditCustomer = (customer) => {
    setEditFormData({
      id: customer.id,
      full_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      gender: customer.gender || ''
    });
    setShowEditModal(true);
  };

  // Lưu thông tin khách hàng
  const handleSaveCustomer = async () => {
    try {
      // DÙNG shopApi
      await shopApi.put(`/api/v1/shop/customers/${editFormData.id}`, {
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        address: editFormData.address,
        gender: editFormData.gender
      });

      // Cập nhật lại danh sách
      setCustomers(prev => prev.map(c => 
        c.id === editFormData.id 
          ? { ...c, ...editFormData }
          : c
      ));

      setShowEditModal(false);
      alert('Cập nhật thông tin khách hàng thành công!');
    } catch (error) {
      console.error('Error updating customer:', error);
      
      if (error.response?.status === 401) {
        window.location.href = '/shop/login';
        return;
      }
      
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  // Xóa khách hàng
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      return;
    }

    try {
      // DÙNG shopApi
      await shopApi.delete(`/api/v1/shop/customers/${customerId}`);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      alert('Xóa khách hàng thành công!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      
      if (error.response?.status === 401) {
        window.location.href = '/shop/login';
        return;
      }
      
      alert('Có lỗi xảy ra khi xóa khách hàng');
    }
  };

  // Xuất Excel
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      // DÙNG shopApi
      const response = await shopApi.get('/api/v1/shop/customers/export/excel');
      
      // Tạo file Excel từ dữ liệu
      const data = response.data.data;
      const csv = convertToCSV(data);
      downloadCSV(csv, 'danh_sach_khach_hang.csv');
      
      alert('Xuất file thành công!');
    } catch (error) {
      console.error('Error exporting customers:', error);
      
      if (error.response?.status === 401) {
        window.location.href = '/shop/login';
        return;
      }
      
      // Fallback: xuất dữ liệu mẫu
      const mockData = mockCustomers.map((c, index) => ({
        STT: index + 1,
        'Tên khách hàng': c.full_name,
        'Số điện thoại': c.phone,
        'Email': c.email,
        'Địa chỉ': c.address,
        'Tổng chi tiêu': c.total_spent,
        'Số đơn hàng': c.order_count
      }));
      
      const csv = convertToCSV(mockData);
      downloadCSV(csv, 'danh_sach_khach_hang.csv');
    } finally {
      setExportLoading(false);
    }
  };

  // Helper functions for CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]?.toString() || '';
        return `"${value.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="shop-customers">
      <div className="customers-header">
        <h1 className="customers-title">Quản Lý Khách Hàng</h1>
        
        <div className="customers-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className="export-btn"
            onClick={handleExportExcel}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <FaSpinner className="spinning" />
            ) : (
              <FaFileExcel />
            )}
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="customers-table-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchCustomers}>Thử lại</button>
          </div>
        ) : (
          <table className="customers-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên Khách Hàng</th>
                <th>Số Điện Thoại</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Chi tiêu</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <div className="customer-name">
                        <div className="customer-avatar">
                          {customer.full_name?.charAt(0) || '?'}
                        </div>
                        {customer.full_name || 'Chưa có tên'}
                      </div>
                    </td>
                    <td>{customer.phone || 'Chưa có'}</td>
                    <td>{customer.email || 'Chưa có'}</td>
                    <td className="address-cell" title={customer.address}>
                      {customer.address || 'Chưa có'}
                    </td>
                    <td className="spent-cell">{formatCurrency(customer.total_spent)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewCustomer(customer)}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditCustomer(customer)}
                          title="Sửa thông tin"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && !loading && (
        <div className="pagination">
          <div className="pagination-info">
            Trang hiển thị {pagination.page}/{pagination.total_pages}
          </div>
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              <FaAngleDoubleLeft />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <FaChevronLeft />
            </button>
            
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum;
              if (pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={pagination.page === pageNum ? 'active' : ''}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {pagination.total_pages > 5 && pagination.page < pagination.total_pages - 2 && (
              <>
                <span className="pagination-dots">...</span>
                <button onClick={() => handlePageChange(pagination.total_pages)}>
                  {pagination.total_pages}
                </button>
              </>
            )}
            
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
            >
              <FaChevronRight />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.total_pages)}
              disabled={pagination.page === pagination.total_pages}
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}

      {/* Customer Detail Modal - giữ nguyên */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content customer-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết khách hàng</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="customer-info-section">
                <h3>Thông tin cơ bản</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <label>Họ và tên</label>
                      <p>{selectedCustomer.full_name || selectedCustomer.username}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <label>Email</label>
                      <p>{selectedCustomer.email || 'Chưa có'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <div>
                      <label>Số điện thoại</label>
                      <p>{selectedCustomer.phone || 'Chưa có'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <div>
                      <label>Địa chỉ</label>
                      <p>{selectedCustomer.address || 'Chưa có'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaCalendarAlt className="info-icon" />
                    <div>
                      <label>Ngày tham gia</label>
                      <p>{formatDateShort(selectedCustomer.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="customer-stats-section">
                <h3>Thống kê mua hàng</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <FaShoppingBag className="stat-icon" />
                    <div>
                      <span className="stat-label">Tổng đơn hàng</span>
                      <span className="stat-value">{selectedCustomer.order_count || 0}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FaMoneyBillWave className="stat-icon" />
                    <div>
                      <span className="stat-label">Tổng chi tiêu</span>
                      <span className="stat-value">{formatCurrency(selectedCustomer.total_spent)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="customer-orders-section">
                <h3>Lịch sử mua hàng</h3>
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày mua</th>
                        <th>Số sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orders?.map(order => (
                        <tr key={order.id}>
                          <td>#{order.id.slice(-6).toUpperCase()}</td>
                          <td>{formatDateShort(order.created_at)}</td>
                          <td>{order.items_count}</td>
                          <td>{formatCurrency(order.total_price)}</td>
                          <td>
                            <span className={`order-status ${order.status}`}>
                              {order.status === 'completed' ? 'Hoàn thành' : 
                               order.status === 'pending' ? 'Chờ xử lý' : 
                               order.status === 'cancelled' ? 'Đã hủy' : order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal - giữ nguyên */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa thông tin khách hàng</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    full_name: e.target.value
                  })}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    phone: e.target.value
                  })}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    address: e.target.value
                  })}
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <select
                  value={editFormData.gender || ''}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    gender: e.target.value
                  })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>
                Hủy
              </button>
              <button className="save-btn" onClick={handleSaveCustomer}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        .error-state {
          text-align: center;
          padding: 40px;
          color: #dc3545;
        }
        .error-state button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #2e7d32;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ShopCustomers;