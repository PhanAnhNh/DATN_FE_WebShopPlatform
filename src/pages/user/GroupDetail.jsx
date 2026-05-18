// src/pages/GroupDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import groupService from '../../api/groupApi';
import Toast from '../../components/common/Toast';
import GroupSettingsModal from '../../components/groups/GroupSettingsModal';
import api from '../../api/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ReactMarkdown from 'react-markdown';

function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImages, setNewPostImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
    const [likedPosts, setLikedPosts] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [showComments, setShowComments] = useState({});
    const [commentsData, setCommentsData] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const currentUser = JSON.parse(localStorage.getItem('user_data') || localStorage.getItem('user') || '{}');
    const isAdmin = group?.user_role === 'admin';
    const isMember = group?.user_role === 'admin' || group?.user_role === 'member';

    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const showConfirm = (title, message, onConfirm, type = 'warning') => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: () => {
                onConfirm();
                setConfirmDialog({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
            }
        });
    };

    const handleCloseConfirm = () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
    };

    const loadGroupData = async () => {
    setLoading(true);
    try {
        const [groupRes, postsRes, membersRes] = await Promise.all([
            groupService.getGroup(groupId),
            groupService.getGroupPosts(groupId),
            groupService.getGroupMembers(groupId, 20)
        ]);
        
        console.log('Group data:', groupRes);
        console.log('Posts response:', postsRes);
        console.log('Members response:', membersRes);
        
        setGroup(groupRes);
        // Đảm bảo postsRes là mảng
        setPosts(Array.isArray(postsRes) ? postsRes : []);
        setMembers(Array.isArray(membersRes) ? membersRes : []);
    } catch (error) {
        console.error('Error loading group:', error);
        showToast('Không thể tải dữ liệu nhóm', 'error');
        setPosts([]);
        setMembers([]);
    } finally {
        setLoading(false);
    }
};

    const handleJoin = async () => {
        try {
            await groupService.joinGroup(groupId);
            showToast(group?.privacy === 'private' ? 'Đã gửi yêu cầu tham gia nhóm' : 'Đã tham gia nhóm');
            loadGroupData();
        } catch (error) {
            showToast('Không thể tham gia nhóm', 'error');
        }
    };

    const handleLeave = () => {
        showConfirm(
            'Rời nhóm',
            'Bạn có chắc chắn muốn rời nhóm không?',
            async () => {
                try {
                    await groupService.leaveGroup(groupId);
                    showToast('Đã rời nhóm', 'success');
                    setTimeout(() => navigate('/groups'), 1500);
                } catch (error) {
                    showToast('Không thể rời nhóm', 'error');
                }
            },
            'warning'
        );
    };

    const handleDeleteGroup = () => {
        showConfirm(
            'Xóa nhóm',
            `Bạn có chắc chắn muốn xóa nhóm "${group?.name}" không? Hành động này không thể hoàn tác!`,
            async () => {
                try {
                    await groupService.deleteGroup(groupId);
                    showToast('Đã xóa nhóm', 'success');
                    setTimeout(() => navigate('/groups'), 1500);
                } catch (error) {
                    showToast('Không thể xóa nhóm', 'error');
                }
            },
            'warning'
        );
    };

    const handleRemoveMember = (member) => {
        showConfirm(
            'Xóa thành viên',
            `Bạn có chắc chắn muốn xóa ${member.full_name} khỏi nhóm không?`,
            async () => {
                try {
                    await groupService.removeMember(groupId, member._id);
                    showToast(`Đã xóa ${member.full_name} khỏi nhóm`, 'success');
                    loadGroupData();
                } catch (error) {
                    showToast('Không thể xóa thành viên', 'error');
                }
            },
            'warning'
        );
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && newPostImages.length === 0) {
            showToast('Vui lòng nhập nội dung hoặc thêm ảnh', 'error');
            return;
        }
        
        setUploading(true);
        try {
            const postData = {
                content: newPostContent,
                images: newPostImages,
                post_type: 'text',
                visibility: 'public'
            };
            const newPost = await groupService.createGroupPost(groupId, postData);
            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setNewPostImages([]);
            showToast('Đã đăng bài viết');
        } catch (error) {
            console.error('Error creating post:', error);
            showToast('Không thể đăng bài', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Upload từng file một
    const uploadedUrls = [];
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file); // Chỉ append 1 file mỗi lần
        
        try {
            const response = await api.post('/api/v1/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            uploadedUrls.push(response.data.image_url);
        } catch (error) {
            console.error('Upload error for file:', file.name, error);
            showToast(`Không thể upload ảnh: ${file.name}`, 'error');
            return; // Dừng nếu upload thất bại
        }
    }
    
    if (uploadedUrls.length > 0) {
        setNewPostImages([...newPostImages, ...uploadedUrls]);
        showToast(`Đã thêm ${uploadedUrls.length} ảnh`, 'success');
    }
};

    const handleLikePost = async (postId) => {
    const isCurrentlyLiked = likedPosts[postId];
    
    setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPosts(prevPosts => prevPosts.map(p => {
        if (p._id === postId) {
            const currentLikes = p.stats?.like_count || 0;
            return {
                ...p,
                stats: { 
                    ...p.stats, 
                    like_count: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1 
                }
            };
        }
        return p;
    }));

    try {
        await api.post(`/api/v1/likes/${postId}`);
    } catch (error) {
        setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                const currentLikes = p.stats?.like_count || 0;
                return {
                    ...p,
                    stats: { 
                        ...p.stats, 
                        like_count: isCurrentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1) 
                    }
                };
            }
            return p;
        }));
        showToast("Không thể thực hiện", "error");
    }
};

// Thêm hàm load comments cho bài viết
const loadComments = async (postId) => {
    if (showComments[postId]) {
        setShowComments(prev => ({ ...prev, [postId]: false }));
        return;
    }
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
        const response = await api.get(`/api/v1/comments/${postId}`);
        setCommentsData(prev => ({ ...prev, [postId]: response.data }));
        setShowComments(prev => ({ ...prev, [postId]: true }));
    } catch (error) {
        console.error('Error loading comments:', error);
    } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
};

// Thêm hàm đăng comment
const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    
    try {
        const response = await api.post('/api/v1/comments/', {
            post_id: postId,
            content: content
        });
        
        // Cập nhật comments
        setCommentsData(prev => ({
            ...prev,
            [postId]: [response.data, ...(prev[postId] || [])]
        }));
        
        // Cập nhật số lượng comment
        setPosts(prevPosts => prevPosts.map(p =>
            p._id === postId
                ? { ...p, stats: { ...p.stats, comment_count: (p.stats?.comment_count || 0) + 1 } }
                : p
        ));
        
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        showToast('Đã đăng bình luận', 'success');
    } catch (error) {
        console.error('Error posting comment:', error);
        showToast('Không thể đăng bình luận', 'error');
    }
};

    const removeImage = (index) => {
        setNewPostImages(newPostImages.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '3px solid #f3f3f3', 
                        borderTop: '3px solid #2e7d32', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p>Đang tải...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </Layout>
        );
    }

    if (!group) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <span style={{ fontSize: '48px' }}>🔍</span>
                    <h3>Không tìm thấy nhóm</h3>
                    <p>Nhóm bạn đang tìm không tồn tại hoặc đã bị xóa</p>
                    <button 
                        onClick={() => navigate('/groups')}
                        style={{
                            padding: '10px 24px',
                            background: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginTop: '16px'
                        }}
                    >
                        Quay lại danh sách nhóm
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Cover Image */}
                <div style={{
                    height: '290px',
                    backgroundColor: '#667eea',
                    backgroundImage: group.cover_url ? `url(${group.cover_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px 16px 0 0',
                    position: 'relative',
                    
                }}>
                    <div style={{
                        position: 'absolute',
                        bottom: '-50px',
                        left: '24px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '20px',
                        top: '400px'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            border: '4px solid white',
                            backgroundColor: group.avatar_url ? 'transparent' : '#ccc',
                            backgroundImage: group.avatar_url ? `url(${group.avatar_url})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px'
                        }}>
                            {!group.avatar_url && '👥'}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <h1 style={{ margin: 0, fontSize: '28px', color: '#1c1e21' }}>{group.name}</h1>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '8px', color: '#65676B', fontSize: '14px' }}>
                                <span>👥 {group.member_count || 0} thành viên</span>
                                <span>📝 {group.post_count || 0} bài viết</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '0 0 16px 16px',
                    padding: '16px 24px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    borderBottom: '1px solid #e4e6eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {!isMember && group.privacy === 'public' && (
                        <button onClick={handleJoin} style={{
                            padding: '8px 24px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            + Tham gia nhóm
                        </button>
                    )}
                    {!isMember && group.privacy === 'private' && (
                        <button onClick={handleJoin} style={{
                            padding: '8px 24px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            ✉️ Gửi yêu cầu tham gia
                        </button>
                    )}
                    {group.user_role === 'pending' && (
                        <button disabled style={{
                            padding: '8px 24px',
                            backgroundColor: '#f5f5f5',
                            color: '#888',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'not-allowed',
                            fontSize: '14px'
                        }}>
                            ⏳ Đang chờ duyệt
                        </button>
                    )}
                    {isMember && (
                        <button onClick={handleLeave} style={{
                            padding: '8px 24px',
                            backgroundColor: '#e4e6eb',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginTop: '40px',
                            marginBottom: '15px'
                        }}>
                            Rời nhóm
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => setShowSettingsModal(true)} style={{
                            padding: '8px 24px',
                            backgroundColor: '#e4e6eb',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginTop: '40px',
                            marginBottom: '15px'
                        }}>
                            ⚙️ Quản lý
                        </button>
                    )}
                </div>
                
                {/* Tabs */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    marginBottom: '10px',
                    display: 'flex',
                    borderBottom: '1px solid #e4e6eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {[
                        { key: 'posts', label: 'Bài viết', icon: '📝' },
                        { key: 'members', label: 'Thành viên', icon: '👥' },
                        { key: 'about', label: ' Giới thiệu', icon: 'ℹ️' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                padding: '14px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.key ? '600' : '500',
                                color: activeTab === tab.key ? '#2e7d32' : '#65676B',
                                borderBottom: activeTab === tab.key ? '3px solid #2e7d32' : 'none',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                {/* Content - Posts Tab */}
                {activeTab === 'posts' && (
                    <>
                        {/* Create Post */}
                        {isMember && (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '20px',
                                marginBottom: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f0f2f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {currentUser?.avatar_url ? (
                                            <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '20px' }}>👤</span>
                                        )}
                                    </div>
                                    <textarea
                                        placeholder={`Chia sẻ điều gì đó với ${group.name}...`}
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        rows="3"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            border: '1px solid #e4e6eb',
                                            borderRadius: '12px',
                                            resize: 'none',
                                            fontSize: '14px',
                                            fontFamily: 'inherit',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                
                                {newPostImages.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                        {newPostImages.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative' }}>
                                                <img 
                                                    src={img} 
                                                    alt="preview" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px', 
                                                        objectFit: 'cover', 
                                                        borderRadius: '12px',
                                                        border: '1px solid #e4e6eb'
                                                    }} 
                                                />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-8px',
                                                        right: '-8px',
                                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e4e6eb', paddingTop: '16px' }}>
                                    <label style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#f0f2f5',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        📷 Thêm ảnh
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                    <button
                                        onClick={handleCreatePost}
                                        disabled={(!newPostContent.trim() && newPostImages.length === 0) || uploading}
                                        style={{
                                            padding: '8px 28px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: ((newPostContent.trim() || newPostImages.length > 0) && !uploading) ? '#2e7d32' : '#ccc',
                                            color: 'white',
                                            cursor: ((newPostContent.trim() || newPostImages.length > 0) && !uploading) ? 'pointer' : 'not-allowed',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {uploading ? 'Đang đăng...' : 'Đăng bài'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Posts List */}
                        {posts.length === 0 ? (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '60px 20px',
                                textAlign: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <span style={{ fontSize: '64px' }}>📝</span>
                                <h3 style={{ margin: '16px 0 8px', color: '#1c1e21' }}>Chưa có bài viết nào</h3>
                                <p style={{ color: '#65676B' }}>
                                    {isMember ? 'Hãy là người đầu tiên đăng bài trong nhóm!' : 'Hãy tham gia nhóm để xem bài viết'}
                                </p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <div key={post._id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f0f2f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {post.author_avatar ? (
                                                <img src={post.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '22px' }}>👤</span>
                                            )}
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '15px', color: '#1c1e21' }}>{post.author_name}</strong>
                                            <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>
                                                {new Date(post.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    {post.content && (
                                        <div style={{ 
                                            marginBottom: '16px', 
                                            fontSize: '15px', 
                                            lineHeight: '1.5', 
                                            color: '#1c1e21'
                                        }}>
                                            <ReactMarkdown
                                                components={{
                                                    p: ({node, ...props}) => <p style={{margin: '0 0 8px 0'}} {...props} />,
                                                    h1: ({node, ...props}) => <h1 style={{fontSize: '24px', margin: '16px 0 8px 0'}} {...props} />,
                                                    h2: ({node, ...props}) => <h2 style={{fontSize: '20px', margin: '12px 0 8px 0'}} {...props} />,
                                                    h3: ({node, ...props}) => <h3 style={{fontSize: '18px', margin: '10px 0 6px 0'}} {...props} />,
                                                    ul: ({node, ...props}) => <ul style={{margin: '8px 0', paddingLeft: '20px'}} {...props} />,
                                                    ol: ({node, ...props}) => <ol style={{margin: '8px 0', paddingLeft: '20px'}} {...props} />,
                                                    li: ({node, ...props}) => <li style={{margin: '4px 0'}} {...props} />,
                                                }}
                                            >
                                                {post.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    
                                    {/* Images */}
                                    {post.images?.length > 0 && (
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(2, 1fr)', 
                                            gap: '10px', 
                                            marginBottom: '8px' 
                                        }}>
                                            {post.images.slice(0, 4).map((img, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    alt="" 
                                                    style={{ 
                                                        width: '100%', 
                                                        borderRadius: '12px', 
                                                        aspectRatio: '1/1',
                                                        objectFit: 'cover',
                                                        cursor: 'pointer'
                                                    }} 
                                                />
                                            ))}
                                            {post.images.length > 4 && (
                                                <div style={{ position: 'relative', cursor: 'pointer' }}>
                                                    <img src={post.images[4]} alt="" style={{ width: '100%', borderRadius: '12px', aspectRatio: '1/1', objectFit: 'cover', opacity: 0.7 }} />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        color: 'white',
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        background: 'rgba(0,0,0,0.5)',
                                                        padding: '4px 12px',
                                                        borderRadius: '20px'
                                                    }}>
                                                        +{post.images.length - 4}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Stats */}
                                    <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center", 
                                        marginBottom: "10px", 
                                        fontSize: "14px", 
                                        color: "#65676B" 
                                    }}>
                                        <div>👍 {post.stats?.like_count || 0} lượt thích</div>
                                        <div>{post.stats?.comment_count || 0} bình luận</div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        borderTop: "1px solid #eee", 
                                        borderBottom: "1px solid #eee", 
                                        padding: "10px 0", 
                                        color: "#555", 
                                        fontWeight: "500", 
                                        fontSize: "14px" 
                                    }}>
                                        <div 
                                            onClick={() => handleLikePost(post._id)} 
                                            style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "5px", 
                                                cursor: "pointer", 
                                                flex: 1, 
                                                justifyContent: "center", 
                                                color: likedPosts[post._id] ? "#1877F2" : "#555" 
                                            }}
                                        >
                                            👍 Thích
                                        </div>
                                        <div 
                                            onClick={() => loadComments(post._id)}
                                            style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "5px", 
                                                cursor: "pointer", 
                                                flex: 1, 
                                                justifyContent: "center", 
                                                color: "#555" 
                                            }}
                                        >
                                            💬 Bình luận
                                        </div>
                                        <div 
                                            onClick={() => {}}  // Thêm hàm share sau
                                            style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "5px", 
                                                cursor: "pointer", 
                                                flex: 1, 
                                                justifyContent: "center" 
                                            }}
                                        >
                                            ↗️ Chia sẻ
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {showComments[post._id] && (
                                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #eee" }}>
                                            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Viết bình luận..."
                                                    value={commentInputs[post._id] || ''}
                                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                    style={{
                                                        flex: 1,
                                                        padding: "10px 14px",
                                                        borderRadius: "20px",
                                                        border: "1px solid #ddd",
                                                        background: "#f0f2f5",
                                                        outline: "none",
                                                        fontSize: "14px"
                                                    }}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                                                />
                                                <button
                                                    onClick={() => handleComment(post._id)}
                                                    disabled={!commentInputs[post._id]?.trim()}
                                                    style={{
                                                        padding: "8px 20px",
                                                        borderRadius: "20px",
                                                        border: "none",
                                                        background: commentInputs[post._id]?.trim() ? "#2e7d32" : "#ccc",
                                                        color: "white",
                                                        cursor: commentInputs[post._id]?.trim() ? "pointer" : "not-allowed"
                                                    }}
                                                >
                                                    Gửi
                                                </button>
                                            </div>
                                            
                                            {loadingComments[post._id] ? (
                                                <div style={{ textAlign: "center", padding: "20px" }}>Đang tải bình luận...</div>
                                            ) : (
                                                (commentsData[post._id] || []).slice(0, 3).map(comment => (
                                                    <div key={comment._id} style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
                                                        <div style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "50%",
                                                            background: "#e4e6eb",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "14px"
                                                        }}>
                                                            {comment.author_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "18px" }}>
                                                                <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
                                                                    {comment.author_name}
                                                                </strong>
                                                                <span style={{ fontSize: "14px" }}>{comment.content}</span>
                                                            </div>
                                                            <div style={{ fontSize: "11px", color: "#65676B", marginTop: "4px", marginLeft: "8px" }}>
                                                                {new Date(comment.created_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            
                                            {(post.stats?.comment_count || 0) > 3 && (
                                                <button
                                                    onClick={() => {}}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        color: "#2e7d32",
                                                        cursor: "pointer",
                                                        fontSize: "13px",
                                                        fontWeight: "500",
                                                        padding: "8px"
                                                    }}
                                                >
                                                    Xem tất cả {(post.stats?.comment_count || 0) - 3} bình luận
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </>
                )}
                
                {/* Content - Members Tab */}
                {activeTab === 'members' && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        {members.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <span style={{ fontSize: '48px' }}>👥</span>
                                <p style={{ color: '#65676B', marginTop: '12px' }}>Chưa có thành viên nào</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e4e6eb' }}>
                                    <strong style={{ fontSize: '16px' }}>👥 Thành viên ({members.length})</strong>
                                </div>
                                {members.map(member => (
                                    <div key={member._id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '12px',
                                        borderBottom: '1px solid #f0f2f5'
                                    }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f0f2f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '24px' }}>👤</span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: '15px' }}>{member.full_name}</strong>
                                            <div style={{ 
                                                fontSize: '12px', 
                                                color: member.role === 'admin' ? '#2e7d32' : '#65676B',
                                                marginTop: '2px'
                                            }}>
                                                {member.role === 'admin' ? '👑 Quản trị viên' : '👤 Thành viên'}
                                            </div>
                                        </div>
                                        {isAdmin && member.role !== 'admin' && (
                                            <button
                                                onClick={() => handleRemoveMember(member)}
                                                style={{
                                                    padding: '6px 16px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
                
                {/* Content - About Tab */}
                {activeTab === 'about' && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📝</span> Mô tả
                            </h3>
                            <p style={{ margin: 0, color: '#65676B', lineHeight: '1.6' }}>
                                {group.description || 'Chưa có mô tả'}
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔒</span> Quyền riêng tư
                            </h3>
                            <p style={{ margin: 0, color: '#65676B' }}>
                                {group.privacy === 'public' ? (
                                    <>🌍 <strong>Công khai</strong> - Ai cũng có thể nhìn thấy nhóm và bài viết</>
                                ) : (
                                    <>🔒 <strong>Riêng tư</strong> - Chỉ thành viên mới nhìn thấy nhóm và bài viết</>
                                )}
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📅</span> Ngày tạo
                            </h3>
                            <p style={{ margin: 0, color: '#65676B' }}>
                                {new Date(group.created_at).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                        
                        <div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>👑</span> Chủ nhóm
                            </h3>
                            <p style={{ margin: 0, color: '#2e7d32', fontWeight: '500' }}>
                                {group.owner_name}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Settings Modal */}
            {showSettingsModal && (
                <GroupSettingsModal
                    group={group}
                    onClose={() => setShowSettingsModal(false)}
                    onUpdate={loadGroupData}
                />
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
                isOpen={confirmDialog.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
            />
        </Layout>
    );
}

export default GroupDetail;