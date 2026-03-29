// src/pages/shop/ShopReturns.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaSpinner, 
    FaEye, 
    FaCheck, 
    FaTimes,
    FaSearch,
    FaFilter,
    FaUndo,
    FaMoneyBillWave,
    FaClock
} from 'react-icons/fa';
import api from '../../../api/api';
import ShopDetailLayout from '../../../components/layout/ShopDetailLayout';
import '../../../css/ProductReturns.css';

const ProductReturns = () => {
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState(null);

    const statusConfig = {
        pending: { label: 'Chờ xử lý', color: '#ffc107', icon: FaClock },
        approved: { label: 'Đã duyệt', color: '#17a2b8', icon: FaCheck },
        rejected: { label: 'Từ chối', color: '#dc3545', icon: FaTimes },
        completed: { label: 'Hoàn thành', color: '#28a745', icon: FaCheck }
    };

    useEffect(() => {
        fetchReturns();
        fetchStats();
    }, [pagination.page, filters]);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/v1/returns/shop', {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    status: filters.status || undefined,
                    search: filters.search || undefined
                }
            });
            setReturns(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/v1/returns/shop/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleProcessReturn = async (action, data = {}) => {
        if (!selectedReturn) return;
        
        try {
            setProcessing(true);
            await api.put(`/api/v1/returns/shop/${selectedReturn._id}/process`, {
                status: action,
                admin_note: data.note,
                approved_items: data.approvedItems,
                refund_amount: data.refundAmount,
                rejected_reason: data.rejectReason
            });
            alert('Đã cập nhật trạng thái yêu cầu');
            setShowProcessModal(false);
            fetchReturns();
            fetchStats();
        } catch (error) {
            console.error('Error processing return:', error);
            alert(error.response?.data?.detail || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hôm nay, ' + date.toLocaleTimeString('vi-VN');
        } else if (diffDays === 1) {
            return 'Hôm qua, ' + date.toLocaleTimeString('vi-VN');
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    };

    return (
        <ShopDetailLayout>
            <div className="shop-returns-page">
                <div className="returns-header">
                    <h1>Quản lý đổi trả</h1>
                    <p>Xử lý yêu cầu đổi trả sản phẩm từ khách hàng</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="returns-stats">
                        <div className="stat-card">
                            <div className="stat-icon pending">
                                <FaClock />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Chờ xử lý</span>
                                <span className="stat-value">{stats.pending || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon approved">
                                <FaCheck />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Đã duyệt</span>
                                <span className="stat-value">{stats.approved || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon completed">
                                <FaUndo />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Hoàn thành</span>
                                <span className="stat-value">{stats.completed || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon total">
                                <FaMoneyBillWave />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Tổng hoàn trả</span>
                                <span className="stat-value">{formatCurrency(stats.total_refund || 0)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="returns-filters">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã yêu cầu, tên khách hàng..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Từ chối</option>
                        <option value="completed">Hoàn thành</option>
                    </select>
                </div>

                {/* Returns List */}
                {loading ? (
                    <div className="loading-state">
                        <FaSpinner className="spinning" />
                        <p>Đang tải danh sách...</p>
                    </div>
                ) : returns.length === 0 ? (
                    <div className="empty-state">
                        <FaUndo className="empty-icon" />
                        <h3>Chưa có yêu cầu đổi trả</h3>
                        <p>Hiện tại chưa có yêu cầu đổi trả nào từ khách hàng</p>
                    </div>
                ) : (
                    <div className="returns-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã yêu cầu</th>
                                    <th>Khách hàng</th>
                                    <th>Đơn hàng</th>
                                    <th>Số lượng</th>
                                    <th>Tổng hoàn</th>
                                    <th>Ngày yêu cầu</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map(ret => {
                                    const StatusIcon = statusConfig[ret.status]?.icon || FaClock;
                                    const statusInfo = statusConfig[ret.status] || statusConfig.pending;
                                    
                                    return (
                                        <tr key={ret._id}>
                                            <td>
                                                <strong>{ret.return_code}</strong>
                                            </td>
                                            <td>
                                                <div>{ret.user_name}</div>
                                                <small>{ret.user_phone}</small>
                                            </td>
                                            <td>#{ret.order_code}</td>
                                            <td>{ret.items.reduce((sum, i) => sum + i.quantity, 0)} sp</td>
                                            <td className="refund-amount">{formatCurrency(ret.total_refund)}</td>
                                            <td>{formatDate(ret.created_at)}</td>
                                            <td>
                                                <span className="status-badge" style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
                                                    <StatusIcon size={12} />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/shop/returns/${ret._id}`} className="view-btn">
                                                    <FaEye /> Xem
                                                </Link>
                                                {ret.status === 'pending' && (
                                                    <button 
                                                        className="process-btn"
                                                        onClick={() => {
                                                            setSelectedReturn(ret);
                                                            setShowProcessModal(true);
                                                        }}
                                                    >
                                                        Xử lý
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                        >
                            Trước
                        </button>
                        <span>Trang {pagination.page} / {pagination.total_pages}</span>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page === pagination.total_pages}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* Process Modal */}
            {showProcessModal && selectedReturn && (
                <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
                    <div className="modal-content process-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Xử lý yêu cầu đổi trả</h2>
                            <button className="close-btn" onClick={() => setShowProcessModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="return-info">
                                <p><strong>Mã yêu cầu:</strong> {selectedReturn.return_code}</p>
                                <p><strong>Khách hàng:</strong> {selectedReturn.user_name}</p>
                                <p><strong>Số điện thoại:</strong> {selectedReturn.user_phone}</p>
                                <p><strong>Tổng hoàn trả:</strong> {formatCurrency(selectedReturn.total_refund)}</p>
                            </div>

                            <div className="return-items-list">
                                <h4>Sản phẩm yêu cầu trả</h4>
                                {selectedReturn.items.map((item, idx) => (
                                    <div key={idx} className="return-item">
                                        <div className="item-name">{item.product_name}</div>
                                        {item.variant_name && <div className="item-variant">Đơn vị: {item.variant_name}</div>}
                                        <div className="item-detail">
                                            <span>Số lượng: {item.quantity}</span>
                                            <span>Đơn giá: {formatCurrency(item.price)}</span>
                                        </div>
                                        <div className="item-reason">
                                            <strong>Lý do:</strong> {item.reason}
                                            {item.reason_note && <div className="reason-note">Ghi chú: {item.reason_note}</div>}
                                        </div>
                                        {item.images.length > 0 && (
                                            <div className="item-images">
                                                {item.images.map((img, i) => (
                                                    <img key={i} src={img} alt={`evidence-${i}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="admin-note">
                                <label>Ghi chú của shop</label>
                                <textarea
                                    rows="3"
                                    placeholder="Nhập ghi chú cho khách hàng..."
                                    id="adminNote"
                                />
                            </div>

                            <div className="process-actions">
                                <button
                                    className="approve-btn"
                                    onClick={() => {
                                        const note = document.getElementById('adminNote').value;
                                        handleProcessReturn('approved', { note });
                                    }}
                                    disabled={processing}
                                >
                                    <FaCheck /> Duyệt yêu cầu
                                </button>
                                <button
                                    className="reject-btn"
                                    onClick={() => {
                                        const reason = prompt('Nhập lý do từ chối:');
                                        if (reason) {
                                            const note = document.getElementById('adminNote').value;
                                            handleProcessReturn('rejected', { note, rejectReason: reason });
                                        }
                                    }}
                                    disabled={processing}
                                >
                                    <FaTimes /> Từ chối
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ShopDetailLayout>
    );
};

export default ProductReturns;