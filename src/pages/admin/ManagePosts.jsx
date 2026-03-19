import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Save, AlertCircle, CheckCircle, Image, Video,
  Globe, Users, Lock, Filter, Calendar, Tag
} from 'lucide-react';
import api from '../../api/api';
import '../../css/AdminManageLayout.css';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const PostsManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPosts, setTotalPosts] = useState(0);
  
  // Filter states
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit, view
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Toast states
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    content: '',
    images: [],
    videos: [],
    tags: [],
    location: '',
    visibility: 'public',
    post_type: 'text',
    product_category: 'general',
    allow_comment: true,
    allow_share: true,
    is_pinned: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Fetch posts from API
  useEffect(() => {
    fetchPosts();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchPosts = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Dùng API admin để lấy tất cả bài viết
    const response = await api.get('/api/v1/admin/posts?limit=100');
    console.log('Posts data:', response.data);
    
    setPosts(response.data);
    setTotalPosts(response.data.length);
  } catch (err) {
    console.error('Error fetching posts:', err);
    setError('Không thể tải danh sách bài viết');
  } finally {
    setLoading(false);
  }
};

  // Filter posts based on search term and filters
  const filteredPosts = posts.filter(post => {
    if (!post) return false;
    
    if (!searchTerm && visibilityFilter === 'all' && categoryFilter === 'all') return true;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const authorName = post.author_name?.toLowerCase() || '';
      const content = post.content?.toLowerCase() || '';
      
      if (!authorName.includes(searchLower) && !content.includes(searchLower)) {
        return false;
      }
    }
    
    // Visibility filter
    if (visibilityFilter !== 'all' && post.visibility !== visibilityFilter) {
      return false;
    }
    
    // Category filter (post_type)
    if (categoryFilter !== 'all' && post.post_type !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle tags
  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Handle images
  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrlInput.trim()]
      }));
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Handle videos
  const handleAddVideo = () => {
    if (videoUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, videoUrlInput.trim()]
      }));
      setVideoUrlInput('');
    }
  };

  const handleRemoveVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.content) {
      errors.content = 'Nội dung bài viết không được để trống';
    }
    return errors;
  };

  // SỬA: handleAddPost dùng API thật
    const handleAddPost = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setSubmitting(true);
    try {
        // Vẫn dùng API user để tạo bài viết
        const response = await api.post('/posts/', formData);
        console.log('Add post response:', response.data);
        
        showToast('Thêm bài viết thành công!', 'success');
        setShowModal(false);
        resetForm();
        fetchPosts();
    } catch (err) {
        console.error('Error adding post:', err);
        const errorMessage = err.response?.data?.detail || 'Có lỗi xảy ra khi thêm bài viết';
        showToast(errorMessage, 'error');
    } finally {
        setSubmitting(false);
    }
    };

  // SỬA: handleUpdatePost dùng API thật
    const handleUpdatePost = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setSubmitting(true);
    try {
        // Dùng API admin để cập nhật (không cần check quyền)
        const response = await api.put(`/admin/posts/${selectedPost._id}`, formData);
        console.log('Update post response:', response.data);
        
        showToast('Cập nhật bài viết thành công!', 'success');
        setShowModal(false);
        resetForm();
        fetchPosts();
    } catch (err) {
        console.error('Error updating post:', err);
        const errorMessage = err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật';
        showToast(errorMessage, 'error');
    } finally {
        setSubmitting(false);
    }
    };

    const handleDeletePost = (postId) => {
    setDialogConfig({
        title: 'Xác nhận xóa',
        message: 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.',
        type: 'warning',
        onConfirm: async () => {
        try {
            // Dùng API admin để xóa
            const response = await api.delete(`/admin/posts/${postId}`);
            console.log('Delete post response:', response.data);
            
            showToast('Xóa bài viết thành công!', 'success');
            fetchPosts();
        } catch (err) {
            console.error('Error deleting post:', err);
            const errorMessage = err.response?.data?.detail || 'Có lỗi xảy ra khi xóa';
            showToast(errorMessage, 'error');
        }
        }
    });
    setShowConfirmDialog(true);
    };
  // SỬA: handleToggleStatus dùng API thật
    const handleToggleStatus = (post) => {
    const newStatus = !post.is_active;
    setDialogConfig({
        title: newStatus ? 'Hiện bài viết' : 'Ẩn bài viết',
        message: `Bạn có chắc chắn muốn ${newStatus ? 'hiện' : 'ẩn'} bài viết này?`,
        type: 'warning',
        onConfirm: async () => {
        try {
            // Dùng API admin để cập nhật trạng thái
            const response = await api.put(`/admin/posts/${post._id}/status?is_active=${newStatus}`);
            console.log('Update status response:', response.data);
            
            showToast(`Cập nhật trạng thái thành công!`, 'success');
            fetchPosts();
        } catch (err) {
            console.error('Error updating status:', err);
            const errorMessage = err.response?.data?.detail || 'Có lỗi xảy ra';
            showToast(errorMessage, 'error');
        }
        }
    });
    setShowConfirmDialog(true);
    };

  // Open modal for view/edit/add
  const openModal = (mode, post = null) => {
    setModalMode(mode);
    if (post) {
      setSelectedPost(post);
      setFormData({
        content: post.content || '',
        images: post.images || [],
        videos: post.videos || [],
        tags: post.tags || [],
        location: post.location || '',
        visibility: post.visibility || 'public',
        post_type: post.post_type || 'text',
        product_category: post.product_category || 'general',
        allow_comment: post.allow_comment !== false,
        allow_share: post.allow_share !== false,
        is_pinned: post.is_pinned || false
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      content: '',
      images: [],
      videos: [],
      tags: [],
      location: '',
      visibility: 'public',
      post_type: 'text',
      product_category: 'general',
      allow_comment: true,
      allow_share: true,
      is_pinned: false
    });
    setFormErrors({});
    setSelectedPost(null);
    setTagInput('');
    setImageUrlInput('');
    setVideoUrlInput('');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = ['Thứ tự', 'Tên người đăng', 'Nội dung', 'Ngày đăng', 'Loại bài', 'Hình ảnh', 'Hiển thị'];
    const csvContent = [
      headers.join(','),
      ...filteredPosts.map((post, index) => [
        index + 1,
        post.author_name || '',
        `"${post.content?.substring(0, 50)}..."`,
        new Date(post.created_at).toLocaleDateString('vi-VN'),
        getPostTypeText(post.post_type),
        post.images?.length || 0,
        getVisibilityText(post.visibility)
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'danh_sach_bai_viet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Xuất file Excel thành công!', 'success');
  };

  const getVisibilityIcon = (visibility) => {
    switch(visibility) {
      case 'public': return <Globe size={14} />;
      case 'friends': return <Users size={14} />;
      case 'private': return <Lock size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const getVisibilityText = (visibility) => {
    switch(visibility) {
      case 'public': return 'Công Khai';
      case 'friends': return 'Bạn bè';
      case 'private': return 'Chỉ mình tôi';
      default: return 'Công Khai';
    }
  };

  const getVisibilityBadge = (visibility) => {
    switch(visibility) {
      case 'public':
        return 'status-badge success';
      case 'friends':
        return 'status-badge warning';
      case 'private':
        return 'status-badge inactive';
      default:
        return 'status-badge';
    }
  };

  const getPostTypeText = (type) => {
    switch(type) {
      case 'text': return 'Bài viết';
      case 'product': return 'Sản phẩm';
      case 'review': return 'Đánh giá';
      case 'share': return 'Chia sẻ';
      default: return 'Bài viết';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="users-management">
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
      />

      <div className="page-header">
        <h2 className="page-title">Quản Lý Bài Viết</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar" style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#666" />
          <span style={{ fontSize: '14px', color: '#666' }}>Lọc:</span>
        </div>
        
        <select 
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            minWidth: '120px'
          }}
        >
          <option value="all">Tất cả hiển thị</option>
          <option value="public">Công khai</option>
          <option value="friends">Bạn bè</option>
          <option value="private">Chỉ mình tôi</option>
        </select>

        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            minWidth: '120px'
          }}
        >
          <option value="all">Tất cả loại</option>
          <option value="text">Bài viết</option>
          <option value="product">Sản phẩm</option>
          <option value="review">Đánh giá</option>
          <option value="share">Chia sẻ</option>
        </select>
      </div>

      {/* Search and Actions Bar */}
      <div className="actions-bar">
        <div className="users-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên người đăng, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="users-search-input"
          />
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => openModal('add')}>
            <Plus size={18} />
            <span>Thêm bài viết</span>
          </button>
          <button className="btn btn-success" onClick={handleExportExcel}>
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Thứ tự</th>
                <th style={{ minWidth: '150px' }}>Tên người đăng</th>
                <th style={{ minWidth: '150px' }}>Ngày đăng</th>
                <th style={{ width: '100px' }}>Loại bài</th>
                <th style={{ width: '80px' }}>Hình ảnh</th>
                <th style={{ width: '100px' }}>Hiển thị</th>
                <th style={{ width: '120px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.length > 0 ? (
                currentPosts.map((post, index) => (
                  <tr key={post._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {post.author_avatar ? (
                          <img 
                            src={post.author_avatar} 
                            alt={post.author_name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#1976d2',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {post.author_name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{post.author_name || 'Người dùng'}</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {post.content?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} color="#666" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        background: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {getPostTypeText(post.post_type)}
                      </span>
                    </td>
                    <td>
                      {post.images?.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Image size={16} color="#1976d2" />
                          <span>{post.images.length}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={getVisibilityBadge(post.visibility)} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getVisibilityIcon(post.visibility)}
                        {getVisibilityText(post.visibility)}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button 
                          className="action-btn view" 
                          onClick={() => openModal('view', post)}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          onClick={() => openModal('edit', post)}
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className={`action-btn ${post.is_active ? 'delete' : 'view'}`}
                          onClick={() => handleToggleStatus(post)}
                          title={post.is_active ? 'Ẩn bài viết' : 'Hiện bài viết'}
                        >
                          {post.is_active ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredPosts.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredPosts.length)} / {filteredPosts.length} bài viết
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
          <div className="pagination-items-per-page">
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="items-per-page-select"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>
                {modalMode === 'add' ? 'Thêm bài viết mới' : 
                 modalMode === 'edit' ? 'Sửa bài viết' : 
                 'Chi tiết bài viết'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleAddPost : handleUpdatePost}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Nội dung */}
                  <div className="form-group full-width">
                    <label htmlFor="content">Nội dung bài viết *</label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      rows="5"
                      className={formErrors.content ? 'error' : ''}
                      placeholder="Nhập nội dung bài viết..."
                    />
                    {formErrors.content && (
                      <span className="error-message">{formErrors.content}</span>
                    )}
                  </div>

                  {/* Hình ảnh */}
                  <div className="form-group full-width">
                    <label>Hình ảnh</label>
                    {modalMode !== 'view' && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Nhập URL hình ảnh..."
                          style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddImage}
                          className="btn btn-secondary"
                          style={{ padding: '8px 15px' }}
                        >
                          Thêm
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {formData.images.map((img, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img 
                            src={img} 
                            alt={`img-${index}`}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0'
                            }}
                          />
                          {modalMode !== 'view' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#d32f2f',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Video */}
                  <div className="form-group full-width">
                    <label>Video</label>
                    {modalMode !== 'view' && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="Nhập URL video..."
                          style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddVideo}
                          className="btn btn-secondary"
                          style={{ padding: '8px 15px' }}
                        >
                          Thêm
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {formData.videos.map((video, index) => (
                        <div key={index} style={{ 
                          padding: '8px 12px',
                          background: '#f5f5f5',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Video size={16} />
                          <span style={{ fontSize: '13px' }}>Video {index + 1}</span>
                          {modalMode !== 'view' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#d32f2f',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="form-group full-width">
                    <label>Tags</label>
                    {modalMode !== 'view' && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Nhập tag..."
                          style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="btn btn-secondary"
                          style={{ padding: '8px 15px' }}
                        >
                          Thêm
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '4px 10px',
                            background: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '16px',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Tag size={12} />
                          {tag}
                          {modalMode !== 'view' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#1976d2',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginLeft: '4px'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Địa điểm */}
                  <div className="form-group">
                    <label htmlFor="location">Địa điểm</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      placeholder="Nhập địa điểm..."
                    />
                  </div>

                  {/* Loại bài viết */}
                  <div className="form-group">
                    <label htmlFor="post_type">Loại bài viết</label>
                    <select
                      id="post_type"
                      name="post_type"
                      value={formData.post_type}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    >
                      <option value="text">Bài viết thường</option>
                      <option value="product">Bài viết sản phẩm</option>
                      <option value="review">Đánh giá</option>
                      <option value="share">Chia sẻ</option>
                    </select>
                  </div>

                  {/* Danh mục sản phẩm */}
                  <div className="form-group">
                    <label htmlFor="product_category">Danh mục</label>
                    <select
                      id="product_category"
                      name="product_category"
                      value={formData.product_category}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    >
                      <option value="general">Chung/Khác</option>
                      <option value="agriculture">Nông sản</option>
                      <option value="seafood">Hải sản</option>
                      <option value="specialty">Đặc sản</option>
                    </select>
                  </div>

                  {/* Hiển thị */}
                  <div className="form-group">
                    <label htmlFor="visibility">Hiển thị</label>
                    <select
                      id="visibility"
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                    >
                      <option value="public">Công khai</option>
                      <option value="friends">Bạn bè</option>
                      <option value="private">Chỉ mình tôi</option>
                    </select>
                  </div>

                  {/* Tùy chọn */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="allow_comment"
                          checked={formData.allow_comment}
                          onChange={handleInputChange}
                          disabled={modalMode === 'view'}
                        />
                        <span>Cho phép bình luận</span>
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="allow_share"
                          checked={formData.allow_share}
                          onChange={handleInputChange}
                          disabled={modalMode === 'view'}
                        />
                        <span>Cho phép chia sẻ</span>
                      </label>

                      {modalMode !== 'add' && (
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="is_pinned"
                            checked={formData.is_pinned}
                            onChange={handleInputChange}
                            disabled={modalMode === 'view'}
                          />
                          <span>Ghim bài viết</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Thống kê (chỉ xem) */}
                  {modalMode === 'view' && selectedPost && (
                    <div className="form-group full-width" style={{ 
                      background: '#f5f5f5', 
                      padding: '15px', 
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>Thống kê tương tác</h4>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div><strong>❤️ {selectedPost.stats?.like_count || 0}</strong> lượt thích</div>
                        <div><strong>💬 {selectedPost.stats?.comment_count || 0}</strong> bình luận</div>
                        <div><strong>🔄 {selectedPost.stats?.share_count || 0}</strong> chia sẻ</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  {modalMode === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                {modalMode !== 'view' && (
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    <Save size={18} />
                    <span>{submitting ? 'Đang lưu...' : 'Lưu'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsManagement;