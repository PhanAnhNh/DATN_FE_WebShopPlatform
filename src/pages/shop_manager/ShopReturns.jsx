// src/pages/shop/ShopReturns.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaEye, 
  FaEdit, 
  FaCheck,
  FaTimes,
  FaSpinner,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaBox,
  FaUser,
  FaPhone,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaUndo,
  FaDownload,
  FaImage
} from 'react-icons/fa';
import {shopApi} from '../../api/api';
import '../../css/ShopReturns.css';

const ShopReturns = () => {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
    total_refund: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approvedItems, setApprovedItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý', color: '#ffc107', icon: FaClock },
    { value: 'approved', label: 'Đã duyệt', color: '#17a2b8', icon: FaCheck },
    { value: 'rejected', label: 'Từ chối', color: '#dc3545', icon: FaTimes },
    { value: 'completed', label: 'Hoàn thành', color: '#28a745', icon: FaCheckCircle },
    { value: 'cancelled', label: 'Đã hủy', color: '#6c757d', icon: FaBan }
  ];

  const reasonOptions = [
    { value: 'wrong_product', label: 'Sai sản phẩm' },
    { value: 'damaged', label: 'Hư hỏng' },
    { value: 'expired', label: 'Hết hạn' },
    { value: 'quality', label: 'Chất lượng kém' },
    { value: 'change_mind', label: 'Đổi ý' },
    { value: 'other', label: 'Lý do khác' }
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch returns
  useEffect(() => {
    fetchReturns();
  }, [pagination.page, debouncedSearch, selectedStatus]);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shop/returns', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          status: selectedStatus || undefined
        }
      });
      
      setReturns(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1
      });
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await shopApi.get('/api/v1/shop/returns/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // View return detail
  const handleViewReturn = async (ret) => {
    try {
      const response = await shopApi.get(`/api/v1/shop/returns/${ret._id || ret.id}`);
      setSelectedReturn(response.data);
      
      // Pre-fill form data
      setAdminNote(response.data.admin_note || '');
      setApprovedItems(response.data.items.map(item => item.order_item_id));
      setRefundAmount(response.data.total_refund || 0);
      
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching return detail:', error);
      alert('Không thể tải chi tiết yêu cầu');
    }
  };

  // Process return
  const handleProcessReturn = (ret) => {
    setSelectedReturn(ret);
    setAdminNote(ret.admin_note || '');
    setApprovedItems(ret.items.map(item => item.order_item_id));
    setRefundAmount(ret.total_refund || 0);
    setRejectReason('');
    setShowProcessModal(true);
  };

  // Approve return
  const handleApprove = async () => {
    try {
      setProcessing(true);
      
      await shopApi.put(`/api/v1/shop/returns/${selectedReturn._id}/status`, {
        status: 'approved',
        admin_note: adminNote,
        approved_items: approvedItems,
        refund_amount: refundAmount
      });

      // Refresh data
      fetchReturns();
      fetchStats();
      
      setShowProcessModal(false);
      setShowDetailModal(false);
      alert('Đã duyệt yêu cầu đổi trả thành công!');
    } catch (error) {
      console.error('Error approving return:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  // Reject return
  const handleReject = async () => {
    if (!rejectReason) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setProcessing(true);
      
      await shopApi.put(`/api/v1/shop/returns/${selectedReturn._id}/status`, {
        status: 'rejected',
        admin_note: adminNote,
        rejected_reason: rejectReason
      });

      // Refresh data
      fetchReturns();
      fetchStats();
      
      setShowProcessModal(false);
      setShowDetailModal(false);
      alert('Đã từ chối yêu cầu đổi trả');
    } catch (error) {
      console.error('Error rejecting return:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  // Complete return
  const handleComplete = async () => {
    try {
      setProcessing(true);
      
      await shopApi.put(`/api/v1/shop/returns/${selectedReturn._id}/status`, {
        status: 'completed',
        admin_note: adminNote
      });

      // Refresh data
      fetchReturns();
      fetchStats();
      
      setShowDetailModal(false);
      alert('Đã hoàn tất xử lý đổi trả!');
    } catch (error) {
      console.error('Error completing return:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  // Format functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN') + ' ' + 
           new Date(dateString).toLocaleTimeString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || { label: status, color: '#6c757d', icon: FaSpinner };
  };

  const getReasonLabel = (reason) => {
    const option = reasonOptions.find(opt => opt.value === reason);
    return option ? option.label : reason;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleItemApproval = (itemId) => {
    setApprovedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="shop-returns">
      {/* Header */}
      <div className="returns-header">
        <h1 className="returns-title">Quản Lý Đổi Trả</h1>
      </div>

      {/* Stats Cards */}
      <div className="returns-stats">
        <div className="stat-card pending" onClick={() => setSelectedStatus('pending')}>
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <span className="stat-label">Chờ xử lý</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>

        <div className="stat-card approved" onClick={() => setSelectedStatus('approved')}>
          <div className="stat-icon">
            <FaCheck />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đã duyệt</span>
            <span className="stat-value">{stats.approved}</span>
          </div>
        </div>

        <div className="stat-card completed" onClick={() => setSelectedStatus('completed')}>
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-label">Hoàn thành</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>

        <div className="stat-card rejected" onClick={() => setSelectedStatus('rejected')}>
          <div className="stat-icon">
            <FaTimes />
          </div>
          <div className="stat-content">
            <span className="stat-label">Từ chối</span>
            <span className="stat-value">{stats.rejected}</span>
          </div>
        </div>

        <div className="stat-card refund">
          <div className="stat-icon">
            <FaUndo />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng hoàn trả</span>
            <span className="stat-value">{formatCurrency(stats.total_refund)}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="returns-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã yêu cầu, tên khách, số ĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Lọc
        </button>

        {(selectedStatus || searchTerm) && (
          <button className="clear-filters" onClick={clearFilters}>
            <FaTimes /> Xóa lọc
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Trạng thái</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Returns Table */}
      <div className="returns-table-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="returns-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Mã yêu cầu</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Mã đơn</th>
                <th>Số lượng</th>
                <th>Tổng hoàn</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {returns.length > 0 ? (
                returns.map((ret, index) => {
                  const statusInfo = getStatusBadge(ret.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={ret._id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>
                        <span className="return-code">{ret.return_code}</span>
                      </td>
                      <td>
                        <div className="customer-name">
                          <FaUser className="customer-icon" />
                          {ret.user_name || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="customer-phone">
                          <FaPhone className="phone-icon" />
                          {ret.user_phone || 'Chưa có'}
                        </div>
                      </td>
                      <td>
                        <span className="order-code">#{ret.order_code}</span>
                      </td>
                      <td>{ret.items?.length || 0}</td>
                      <td className="refund-amount">{formatCurrency(ret.total_refund)}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: statusInfo.color + '20',
                            color: statusInfo.color,
                            borderColor: statusInfo.color
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>{formatDate(ret.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => handleViewReturn(ret)}
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                          {ret.status === 'pending' && (
                            <button 
                              className="action-btn process"
                              onClick={() => handleProcessReturn(ret)}
                              title="Xử lý"
                            >
                              <FaEdit />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="empty-state">
                    Không tìm thấy yêu cầu đổi trả nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
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
                  key={`page-${pageNum}`}
                  className={pagination.page === pageNum ? 'active' : ''}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
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

      {/* Detail Modal */}
      {showDetailModal && selectedReturn && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content return-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết yêu cầu đổi trả</h2>
              <button className="close-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedReturn(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* Return Info */}
              <div className="detail-section">
                <h3>Thông tin yêu cầu</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Mã yêu cầu:</label>
                    <span className="return-code">{selectedReturn.return_code}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày tạo:</label>
                    <span>{formatDate(selectedReturn.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <label>Trạng thái:</label>
                    {(() => {
                      const status = getStatusBadge(selectedReturn.status);
                      const StatusIcon = status.icon;
                      return (
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: status.color + '20',
                            color: status.color,
                            borderColor: status.color
                          }}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="detail-section">
                <h3>Thông tin khách hàng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <label>Họ tên</label>
                      <p>{selectedReturn.user_name}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <div>
                      <label>Số điện thoại</label>
                      <p>{selectedReturn.user_phone || 'Chưa có'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <label>Email</label>
                      <p>{selectedReturn.user_email || 'Chưa có'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="detail-section">
                <h3>Thông tin đơn hàng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Mã đơn hàng:</label>
                    <span className="order-code">#{selectedReturn.order_code}</span>
                  </div>
                  <div className="info-item">
                    <label>Ngày đặt:</label>
                    <span>{formatDate(selectedReturn.order_info?.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <label>Tổng đơn:</label>
                    <span>{formatCurrency(selectedReturn.order_info?.total)}</span>
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div className="detail-section">
                <h3>Sản phẩm yêu cầu đổi trả</h3>
                <div className="return-items">
                  {selectedReturn.items.map((item, idx) => (
                    <div key={idx} className="return-item">
                      <div className="item-header">
                        <FaBox className="item-icon" />
                        <div className="item-name">
                          <div>{item.product_name}</div>
                          {item.variant_name && (
                            <small className="variant-name">Biến thể: {item.variant_name}</small>
                          )}
                        </div>
                      </div>
                      
                      <div className="item-details">
                        <div className="detail-row">
                          <span className="detail-label">Số lượng:</span>
                          <span>{item.quantity}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Đơn giá:</span>
                          <span>{formatCurrency(item.price)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Lý do:</span>
                          <span className="reason-badge">
                            <FaExclamationTriangle />
                            {getReasonLabel(item.reason)}
                          </span>
                        </div>
                        {item.reason_note && (
                          <div className="detail-row">
                            <span className="detail-label">Ghi chú:</span>
                            <span className="reason-note">{item.reason_note}</span>
                          </div>
                        )}
                        {item.images && item.images.length > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Ảnh:</span>
                            <div className="item-images">
                              {item.images.map((img, i) => (
                                <a 
                                  key={i} 
                                  href={img} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="image-link"
                                >
                                  <FaImage />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Info */}
              <div className="detail-section">
                <h3>Thông tin hoàn tiền</h3>
                <div className="refund-info">
                  <div className="refund-row">
                    <span className="refund-label">Tổng tiền hoàn:</span>
                    <span className="refund-amount">{formatCurrency(selectedReturn.total_refund)}</span>
                  </div>
                  {selectedReturn.bank_name && (
                    <>
                      <div className="refund-row">
                        <span className="refund-label">Ngân hàng:</span>
                        <span>{selectedReturn.bank_name}</span>
                      </div>
                      <div className="refund-row">
                        <span className="refund-label">Số tài khoản:</span>
                        <span>{selectedReturn.bank_account}</span>
                      </div>
                      <div className="refund-row">
                        <span className="refund-label">Chủ tài khoản:</span>
                        <span>{selectedReturn.bank_holder}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedReturn.notes && (
                <div className="detail-section">
                  <h3>Ghi chú của khách</h3>
                  <p className="notes">{selectedReturn.notes}</p>
                </div>
              )}

              {selectedReturn.admin_note && (
                <div className="detail-section">
                  <h3>Ghi chú xử lý</h3>
                  <p className="admin-notes">{selectedReturn.admin_note}</p>
                </div>
              )}

              {selectedReturn.rejected_reason && (
                <div className="detail-section">
                  <h3>Lý do từ chối</h3>
                  <p className="reject-reason">{selectedReturn.rejected_reason}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedReturn(null);
              }}>
                Đóng
              </button>
              {selectedReturn.status === 'pending' && (
                <button 
                  className="process-btn"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleProcessReturn(selectedReturn);
                  }}
                >
                  <FaEdit /> Xử lý yêu cầu
                </button>
              )}
              {selectedReturn.status === 'approved' && (
                <button 
                  className="complete-btn"
                  onClick={handleComplete}
                  disabled={processing}
                >
                  {processing ? <FaSpinner className="spinning" /> : <FaCheck />}
                  Xác nhận hoàn tất
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedReturn && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal-content process-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xử lý yêu cầu đổi trả</h2>
              <button className="close-btn" onClick={() => {
                setShowProcessModal(false);
                setSelectedReturn(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p className="return-info">
                Yêu cầu <strong>{selectedReturn.return_code}</strong> - 
                Khách: <strong>{selectedReturn.user_name}</strong>
              </p>

              {/* Items */}
              <div className="process-section">
                <h3>Chọn sản phẩm duyệt</h3>
                {selectedReturn.items.map((item, idx) => (
                  <div key={idx} className="approve-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={approvedItems.includes(item.order_item_id)}
                        onChange={() => toggleItemApproval(item.order_item_id)}
                      />
                      <div className="item-info">
                        <div className="item-name">{item.product_name}</div>
                        {item.variant_name && (
                          <div className="item-variant">Biến thể: {item.variant_name}</div>
                        )}
                        <div className="item-details">
                          SL: {item.quantity} x {formatCurrency(item.price)}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Refund Amount */}
              <div className="process-section">
                <h3>Số tiền hoàn trả</h3>
                <input
                  type="number"
                  className="refund-input"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                  min="0"
                  step="1000"
                />
              </div>

              {/* Admin Note */}
              <div className="process-section">
                <h3>Ghi chú xử lý</h3>
                <textarea
                  className="note-input"
                  rows="3"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>

              {/* Reject Reason */}
              <div className="process-section">
                <h3>Lý do từ chối (nếu từ chối)</h3>
                <textarea
                  className="note-input"
                  rows="2"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowProcessModal(false)}>
                Hủy
              </button>
              <button 
                className="reject-btn"
                onClick={handleReject}
                disabled={processing}
              >
                {processing ? <FaSpinner className="spinning" /> : <FaTimes />}
                Từ chối
              </button>
              <button 
                className="approve-btn"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? <FaSpinner className="spinning" /> : <FaCheck />}
                Duyệt yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopReturns;