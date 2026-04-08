// src/admin/components/ReportsManagement.jsx
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/api';

function ReportsManagement() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [action, setAction] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchReports();
        fetchStats();
    }, [filterStatus, filterType, currentPage]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            let url = `/api/v1/reports/admin/list?page=${currentPage}&limit=20`;
            if (filterStatus) {
                url += `&status=${filterStatus}`;
            }
            if (filterType) {
                url += `&report_type=${filterType}`;
            }
            const res = await adminApi.get(url);
            setReports(res.data.data || []);
            setTotalPages(res.data.pagination?.total_pages || 1);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminApi.get('/api/v1/reports/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleViewDetail = async (reportId) => {
        try {
            const res = await adminApi.get(`/api/v1/reports/admin/${reportId}`);
            setSelectedReport(res.data);
            setAdminNote(res.data.admin_note || '');
            setAction(res.data.action_taken || '');
            setShowDetailModal(true);
        } catch (err) {
            console.error('Error fetching report detail:', err);
            alert('Không thể tải chi tiết báo cáo');
        }
    };

    const handleUpdateStatus = async (reportId, status) => {
        try {
            await adminApi.put(`/api/v1/reports/admin/${reportId}`, {
                status: status,
                admin_note: adminNote,
                action_taken: action
            });
            
            // Refresh danh sách
            fetchReports();
            fetchStats();
            setShowDetailModal(false);
            setSelectedReport(null);
            setAdminNote('');
            setAction('');
            
            alert('Cập nhật trạng thái thành công');
        } catch (err) {
            console.error('Error updating report:', err);
            alert('Có lỗi xảy ra khi cập nhật báo cáo');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { background: '#fef3c7', color: '#d97706', label: 'Chờ xử lý', icon: '⏳' },
            approved: { background: '#fee2e2', color: '#dc2626', label: 'Đã xác nhận', icon: '⚠️' },
            rejected: { background: '#e5e7eb', color: '#6b7280', label: 'Từ chối', icon: '❌' },
            resolved: { background: '#d1fae5', color: '#059669', label: 'Đã xử lý', icon: '✅' }
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                background: s.background,
                color: s.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <span>{s.icon}</span>
                {s.label}
            </span>
        );
    };

    const getReportTypeLabel = (type) => {
        const types = {
            spam: { label: 'Spam', icon: '📧', color: '#f59e0b' },
            harassment: { label: 'Quấy rối', icon: '😡', color: '#dc2626' },
            hate_speech: { label: 'Thù địch', icon: '💢', color: '#dc2626' },
            violence: { label: 'Bạo lực', icon: '🔫', color: '#dc2626' },
            adult_content: { label: 'Người lớn', icon: '🔞', color: '#ec489a' },
            misinformation: { label: 'Tin giả', icon: '❌', color: '#f59e0b' },
            copyright: { label: 'Bản quyền', icon: '©️', color: '#3b82f6' },
            other: { label: 'Khác', icon: '📝', color: '#6b7280' }
        };
        const t = types[type] || types.other;
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
            }}>
                <span>{t.icon}</span>
                {t.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    };

    if (loading && reports.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #2e7d32',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }}></div>
                <p>Đang tải dữ liệu...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: '20px' }}>Quản lý báo cáo vi phạm</h2>

            {/* Thống kê */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#e5e7eb' }}>📊</div>
                        <div className="stat-info">
                            <h4>Tổng số</h4>
                            <p>{stats.total}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fef3c7' }}>⏳</div>
                        <div className="stat-info">
                            <h4>Chờ xử lý</h4>
                            <p style={{ color: '#d97706' }}>{stats.pending}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fee2e2' }}>⚠️</div>
                        <div className="stat-info">
                            <h4>Đã xác nhận</h4>
                            <p style={{ color: '#dc2626' }}>{stats.approved}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#e5e7eb' }}>❌</div>
                        <div className="stat-info">
                            <h4>Từ chối</h4>
                            <p>{stats.rejected}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#d1fae5' }}>✅</div>
                        <div className="stat-info">
                            <h4>Đã xử lý</h4>
                            <p>{stats.resolved}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                <select
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd',
                        background: 'white'
                    }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="approved">Đã xác nhận</option>
                    <option value="rejected">Từ chối</option>
                    <option value="resolved">Đã xử lý</option>
                </select>

                <select
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd',
                        background: 'white'
                    }}
                >
                    <option value="">Tất cả loại</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Quấy rối</option>
                    <option value="hate_speech">Ngôn ngữ thù địch</option>
                    <option value="violence">Bạo lực</option>
                    <option value="adult_content">Nội dung người lớn</option>
                    <option value="misinformation">Thông tin sai lệch</option>
                    <option value="copyright">Vi phạm bản quyền</option>
                    <option value="other">Khác</option>
                </select>

                <button
                    onClick={() => {
                        setFilterStatus('');
                        setFilterType('');
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        background: '#f3f4f6',
                        cursor: 'pointer'
                    }}
                >
                    Xóa lọc
                </button>
            </div>

            {/* Bảng danh sách báo cáo */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Người báo cáo</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Tác giả bài viết</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Lý do</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Trạng thái</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Ngày tạo</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    Không có báo cáo nào
                                </td>
                            </tr>
                        ) : (
                            reports.map((report, index) => (
                                <tr key={report._id} style={{
                                    borderBottom: index === reports.length - 1 ? 'none' : '1px solid #e5e7eb',
                                    transition: 'background 0.2s'
                                }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                background: '#e5e7eb',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px'
                                            }}>
                                                {report.reporter_avatar ? (
                                                    <img src={report.reporter_avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}/>
                                                ) : (
                                                    <span>👤</span>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', fontSize: '14px' }}>{report.reporter_name}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>ID: {report.reporter_id?.slice(-6)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{report.target_author_name || 'N/A'}</div>
                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {report.target_content_preview?.substring(0, 50)}...
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {getReportTypeLabel(report.report_type)}
                                        {report.reason && (
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                                {report.reason}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {getStatusBadge(report.status)}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                                        {formatDate(report.created_at)}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleViewDetail(report._id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#2e7d32',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '24px'
                }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1
                        }}
                    >
                        ← Trước
                    </button>
                    <span style={{
                        padding: '8px 16px',
                        background: '#2e7d32',
                        color: 'white',
                        borderRadius: '6px'
                    }}>
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Modal chi tiết báo cáo */}
            {showDetailModal && selectedReport && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowDetailModal(false)}>
                    <div style={{
                        background: 'white',
                        width: '800px',
                        maxWidth: '90%',
                        maxHeight: '90vh',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>Chi tiết báo cáo</h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >✕</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {/* Thông tin báo cáo */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ marginBottom: '12px', color: '#374151' }}>Thông tin báo cáo</h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '12px',
                                    background: '#f9fafb',
                                    padding: '16px',
                                    borderRadius: '12px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Người báo cáo</div>
                                        <div style={{ fontWeight: '500' }}>{selectedReport.reporter_name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Tác giả bài viết</div>
                                        <div style={{ fontWeight: '500' }}>{selectedReport.target_author_name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Loại vi phạm</div>
                                        <div>{getReportTypeLabel(selectedReport.report_type)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Trạng thái</div>
                                        <div>{getStatusBadge(selectedReport.status)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Ngày tạo</div>
                                        <div>{formatDate(selectedReport.created_at)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Lý do</div>
                                        <div>{selectedReport.reason}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Nội dung bài viết bị báo cáo */}
                            {selectedReport.target_post && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ marginBottom: '12px', color: '#374151' }}>Nội dung bài viết bị báo cáo</h4>
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '16px',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Tác giả</div>
                                            <div style={{ fontWeight: '500' }}>{selectedReport.target_post.author_name}</div>
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Nội dung</div>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.target_post.content || '[Không có nội dung]'}</div>
                                        </div>
                                        {selectedReport.target_post.images?.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Hình ảnh</div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {selectedReport.target_post.images.slice(0, 3).map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt={`post_img_${idx}`}
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                objectFit: 'cover',
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                    ))}
                                                    {selectedReport.target_post.images.length > 3 && (
                                                        <div style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            background: '#e5e7eb',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px',
                                                            color: '#6b7280'
                                                        }}>
                                                            +{selectedReport.target_post.images.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                                            Trạng thái: {selectedReport.target_post.is_active ? '🟢 Đang hiển thị' : '🔴 Đã bị ẩn'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mô tả thêm từ người báo cáo */}
                            {selectedReport.description && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ marginBottom: '12px', color: '#374151' }}>Mô tả thêm</h4>
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '16px',
                                        borderRadius: '12px'
                                    }}>
                                        {selectedReport.description}
                                    </div>
                                </div>
                            )}

                            {/* Xử lý báo cáo */}
                            {selectedReport.status === 'pending' && (
                                <div>
                                    <h4 style={{ marginBottom: '12px', color: '#374151' }}>Xử lý báo cáo</h4>
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '16px',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                                Ghi chú của admin
                                            </label>
                                            <textarea
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                placeholder="Nhập ghi chú về quyết định xử lý..."
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                                Hành động đã thực hiện
                                            </label>
                                            <input
                                                type="text"
                                                value={action}
                                                onChange={(e) => setAction(e.target.value)}
                                                placeholder="VD: Đã ẩn bài viết, gửi cảnh cáo..."
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedReport._id, 'rejected')}
                                                style={{
                                                    padding: '8px 20px',
                                                    background: '#6b7280',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Từ chối báo cáo
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedReport._id, 'approved')}
                                                style={{
                                                    padding: '8px 20px',
                                                    background: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Xác nhận vi phạm & Ẩn bài
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hiển thị thông tin xử lý nếu đã xử lý */}
                            {selectedReport.status !== 'pending' && (
                                <div>
                                    <h4 style={{ marginBottom: '12px', color: '#374151' }}>Thông tin xử lý</h4>
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '16px',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Ngày xử lý: </span>
                                            <span>{formatDate(selectedReport.resolved_at)}</span>
                                        </div>
                                        {selectedReport.admin_note && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Ghi chú: </span>
                                                <span>{selectedReport.admin_note}</span>
                                            </div>
                                        )}
                                        {selectedReport.action_taken && (
                                            <div>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Hành động: </span>
                                                <span>{selectedReport.action_taken}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .stat-card {
                    background: white;
                    padding: 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                .stat-info h4 {
                    margin: 0 0 4px 0;
                    font-size: 13px;
                    color: #6b7280;
                    font-weight: 500;
                }
                .stat-info p {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    color: #111827;
                }
                tr:hover {
                    background: #f9fafb;
                }
            `}</style>
        </div>
    );
}

export default ReportsManagement;