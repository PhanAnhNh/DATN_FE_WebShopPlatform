// src/pages/admin/ViolationsManagement.jsx
import React, { useState, useEffect } from 'react';
import {adminApi} from '../../api/api';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ViolationsManagement = () => {
  const [violatedPosts, setViolatedPosts] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchViolatedPosts();
    } else {
      fetchBannedUsers();
    }
  }, [activeTab]);

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchViolatedPosts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/api/v1/admin/violations/posts');
      setViolatedPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching violated posts:', error);
      showToastMessage('Không thể tải danh sách bài viết vi phạm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/api/v1/admin/violations/users/banned');
      setBannedUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching banned users:', error);
      showToastMessage('Không thể tải danh sách tài khoản bị cấm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePost = async (postId) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận khôi phục',
      message: 'Bạn có chắc chắn muốn khôi phục bài viết này? Bài viết sẽ hiển thị lại trên trang chủ.',
      onConfirm: async () => {
        try {
          await adminApi.put(`/api/v1/admin/violations/posts/${postId}/restore`);
          showToastMessage('Đã khôi phục bài viết thành công', 'success');
          fetchViolatedPosts();
        } catch (error) {
          showToastMessage('Không thể khôi phục bài viết', 'error');
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handlePermanentDeletePost = async (postId) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa vĩnh viễn',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await adminApi.delete(`/api/v1/admin/violations/posts/${postId}/permanent`);
          showToastMessage('Đã xóa vĩnh viễn bài viết', 'success');
          fetchViolatedPosts();
        } catch (error) {
          showToastMessage('Không thể xóa bài viết', 'error');
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleBanUser = async (userId, userName) => {
    const reason = prompt(`Nhập lý do cấm tài khoản ${userName}:`);
    if (!reason) return;

    try {
      await adminApi.post(`/api/v1/admin/violations/users/${userId}/ban?reason=${encodeURIComponent(reason)}`);
      showToastMessage(`Đã cấm tài khoản ${userName}`, 'success');
      fetchViolatedPosts();
      if (activeTab === 'users') fetchBannedUsers();
    } catch (error) {
      showToastMessage('Không thể cấm tài khoản', 'error');
    }
  };

  const handleUnbanUser = async (userId, userName) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận mở khóa',
      message: `Bạn có chắc chắn muốn mở khóa tài khoản ${userName}?`,
      onConfirm: async () => {
        try {
          await adminApi.post(`/api/v1/admin/violations/users/${userId}/unban`);
          showToastMessage(`Đã mở khóa tài khoản ${userName}`, 'success');
          fetchBannedUsers();
        } catch (error) {
          showToastMessage('Không thể mở khóa tài khoản', 'error');
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const getViolationBadges = (post) => {
    const badges = [];
    if (post.hidden_by_ai) badges.push({ color: '#f44336', text: 'AI phát hiện' });
    if (post.hidden_by_report) badges.push({ color: '#ff9800', text: 'Người dùng báo cáo' });
    if (post.hidden_by_ban) badges.push({ color: '#9c27b0', text: 'Tài khoản bị cấm' });
    return badges;
  };

  return (
    <div className="violations-management" style={{ padding: '20px' }}>
      <h2>Quản Lý Vi Phạm</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'posts' ? '#2e7d32' : 'transparent',
            color: activeTab === 'posts' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0'
          }}
        >
          📋 Bài viết vi phạm ({violatedPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'users' ? '#2e7d32' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0'
          }}
        >
          🚫 Tài khoản bị cấm ({bannedUsers.length})
        </button>
      </div>

      {loading && <div>Đang tải...</div>}

      {/* Tab: Bài viết vi phạm */}
      {activeTab === 'posts' && !loading && (
        <div>
          {violatedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              🎉 Không có bài viết vi phạm nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {violatedPosts.map(post => (
                <div
                  key={post._id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '15px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${post.hidden_by_ai ? '#f44336' : post.hidden_by_report ? '#ff9800' : '#9c27b0'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {post.author?.avatar ? (
                        <img src={post.author.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#e4e6eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          👤
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{post.author?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {new Date(post.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {getViolationBadges(post).map((badge, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: badge.color,
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <p style={{ color: '#555', marginBottom: '8px' }}>
                      {post.content || '(Không có nội dung text)'}
                    </p>
                    {post.images?.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        {post.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        ))}
                        {post.images.length > 3 && <span>+{post.images.length - 3}</span>}
                      </div>
                    )}
                  </div>

                  {post.ai_moderation_result && (
                    <div style={{
                      background: '#fff3e0',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginTop: '10px',
                      fontSize: '12px'
                    }}>
                      <strong>🤖 Lý do AI:</strong> {post.ai_moderation_result.reasons?.join(', ') || 'Không xác định'}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setSelectedPost(post);
                        setShowPostDetail(true);
                      }}
                      style={{ padding: '6px 12px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      👁️ Xem chi tiết
                    </button>
                    <button
                      onClick={() => handleRestorePost(post._id)}
                      style={{ padding: '6px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      🔓 Khôi phục
                    </button>
                    <button
                      onClick={() => handlePermanentDeletePost(post._id)}
                      style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      🗑️ Xóa vĩnh viễn
                    </button>
                    <button
                      onClick={() => handleBanUser(post.author.id, post.author.name)}
                      style={{ padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      🚫 Cấm tài khoản
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Tài khoản bị cấm */}
      {activeTab === 'users' && !loading && (
        <div>
          {bannedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              ✅ Không có tài khoản nào bị cấm
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {bannedUsers.map(user => (
                <div
                  key={user._id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '15px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: '#e4e6eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        👤
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.full_name || user.username}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>@{user.username}</div>
                      <div style={{ fontSize: '12px', color: '#f44336', marginTop: '4px' }}>
                        🚫 {user.banned_reason}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Cấm lúc: {new Date(user.banned_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnbanUser(user._id, user.full_name || user.username)}
                    style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    🔓 Mở khóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.show}
        onClose={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      {/* Post Detail Modal */}
      {showPostDetail && selectedPost && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowPostDetail(false)}
        >
          <div
            style={{
              background: 'white',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              borderRadius: '16px',
              overflow: 'auto',
              padding: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Chi tiết bài viết vi phạm</h3>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
              {JSON.stringify(selectedPost, null, 2)}
            </pre>
            <button
              onClick={() => setShowPostDetail(false)}
              style={{ marginTop: '15px', padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationsManagement;