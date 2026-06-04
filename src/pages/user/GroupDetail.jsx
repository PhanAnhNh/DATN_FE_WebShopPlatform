// src/pages/GroupDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../layout/layoutUser/Layout';
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
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [modalComments, setModalComments] = useState([]);
    const [modalCommentInput, setModalCommentInput] = useState("");
    const [modalLiked, setModalLiked] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const [commentLimit] = useState(5);
    const [totalComments, setTotalComments] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyInput, setReplyInput] = useState("");
    const [expandedReplies, setExpandedReplies] = useState({});
    const [allRepliesData, setAllRepliesData] = useState({});
    const [activeCommentMenu, setActiveCommentMenu] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");
    const [lightboxImages, setLightboxImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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

    const openLightbox = (images, startIndex) => {
        setLightboxImages(images);
        setCurrentImageIndex(startIndex);
        setIsLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    // Hàm đóng lightbox
    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setLightboxImages([]);
        setCurrentImageIndex(0);
        document.body.style.overflow = 'unset';
    };

    // Hàm mở modal xem chi tiết bài viết
    const openPostModal = async (post) => {
        try {
            const res = await api.get(`/api/v1/posts/${post._id}`);
            const updatedPost = res.data;
            
            setSelectedPost(updatedPost);
            setIsPostModalOpen(true);
            setModalCommentInput("");
            setCommentPage(1);
            setReplyingTo(null);
            
            try {
                const likeRes = await api.get(`/api/v1/likes/check/${post._id}`);
                setModalLiked(likeRes.data.liked);
            } catch(e) { setModalLiked(false); }
            
            await fetchModalComments(post._id, 1);
            
        } catch (error) {
            setSelectedPost(post);
            setIsPostModalOpen(true);
        }
    };

    // Hàm fetch comments cho modal
    const fetchModalComments = async (postId, page) => {
        try {
            const commentsRes = await api.get(`/api/v1/comments/${postId}`);
            const allComments = commentsRes.data;
            
            const parentComments = allComments.filter(c => !c.parent_id);
            const childComments = allComments.filter(c => c.parent_id);
            
            const repliesMap = {};
            childComments.forEach(reply => {
                const parentId = reply.parent_id;
                if (!repliesMap[parentId]) {
                    repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(reply);
            });
            
            setAllRepliesData(repliesMap);
            
            const start = (page - 1) * commentLimit;
            const end = start + commentLimit;
            const paginatedComments = parentComments.slice(start, end);
            
            setModalComments(paginatedComments);
            setTotalComments(parentComments.length);
            
        } catch(e) { 
            setModalComments([]);
            setTotalComments(0);
        }
    };

    // Hàm load thêm comments
    const loadMoreComments = async () => {
        const nextPage = commentPage + 1;
        try {
            const commentsRes = await api.get(`/api/v1/comments/${selectedPost._id}`);
            const allComments = commentsRes.data;
            
            const parentComments = allComments.filter(c => !c.parent_id);
            const childComments = allComments.filter(c => c.parent_id);
            
            const repliesMap = {};
            childComments.forEach(reply => {
                const parentId = reply.parent_id;
                if (!repliesMap[parentId]) {
                    repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(reply);
            });
            
            const commentsWithReplies = parentComments.map(parent => ({
                ...parent,
                replies: repliesMap[parent._id] || []
            }));
            
            const start = (nextPage - 1) * commentLimit;
            const end = start + commentLimit;
            const newComments = commentsWithReplies.slice(start, end);
            
            setModalComments(prev => [...prev, ...newComments]);
            setCommentPage(nextPage);
            setTotalComments(commentsWithReplies.length);
            
        } catch(e) {
            console.error("Lỗi tải thêm bình luận:", e);
        }
    };

    // Hàm đăng comment trong modal
    const handleModalComment = async (parentId = null) => {
        const content = parentId ? replyInput : modalCommentInput;
        if (!content.trim() || !selectedPost) return;
        
        try {
            const commentData = {
                post_id: selectedPost._id,
                content: content
            };
            if (parentId) {
                commentData.parent_id = parentId;
            }
            
            await api.post("/api/v1/comments/", commentData);
            
            await fetchModalComments(selectedPost._id, 1);
            setModalCommentInput("");
            setReplyInput("");
            setReplyingTo(null);
            setCommentPage(1);
            
            setSelectedPost(prev => ({
                ...prev,
                stats: { ...prev.stats, comment_count: (prev.stats?.comment_count || 0) + 1 }
            }));
            
            // Cập nhật lại bài viết trong danh sách posts
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === selectedPost._id 
                    ? { ...p, stats: { ...p.stats, comment_count: (p.stats?.comment_count || 0) + 1 } }
                    : p
            ));
            
            showToast("Đã thêm bình luận", "success");
        } catch(err) {
            showToast("Không thể đăng bình luận", "error");
        }
    };

    // Hàm sửa comment trong modal
    const handleEditModalComment = (comment) => {
        setEditingCommentId(comment._id);
        setEditCommentContent(comment.content);
        setActiveCommentMenu(null);
    };

    // Hàm lưu comment đã sửa
    const handleSaveModalComment = async (postId, commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            await api.put(`/api/v1/comments/${commentId}`, { content: editCommentContent });
            
            await fetchModalComments(postId, 1);
            setCommentPage(1);
            
            setEditingCommentId(null);
            setEditCommentContent("");
            
            showToast("Đã sửa bình luận thành công", "success");
        } catch (error) {
            showToast("Không thể sửa bình luận. Vui lòng thử lại!", "error");
        }
    };

    // Hàm xóa comment trong modal
    const handleDeleteModalComment = (postId, commentId) => {
        showConfirm("Bạn có chắc chắn muốn xóa bình luận này không?", async () => {
            try {
                await api.delete(`/api/v1/comments/${commentId}`);
            
                await fetchModalComments(postId, 1);
                setCommentPage(1);
            
                setSelectedPost(prev => ({
                    ...prev,
                    stats: { ...prev.stats, comment_count: Math.max(0, (prev.stats?.comment_count || 1) - 1) }
                }));
            
                setPosts(prevPosts => prevPosts.map(p =>
                    p._id === postId
                        ? { ...p, stats: { ...p.stats, comment_count: Math.max(0, (p.stats?.comment_count || 1) - 1) } }
                        : p
                ));
            
                setActiveCommentMenu(null);
                showToast("Đã xóa bình luận thành công", "success");
            } catch (error) {
                showToast("Không thể xóa bình luận!", "error");
            }
        });
    };

    // Hàm toggle replies
    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    // Hàm lấy replies cho comment
    const getRepliesForComment = (commentId) => {
        return allRepliesData[commentId] || [];
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
                                        <div onClick={() => openPostModal(post)} style={{ 
                                            marginBottom: '16px', 
                                            fontSize: '15px', 
                                            lineHeight: '1.5', 
                                            color: '#1c1e21',
                                            cursor: 'pointer',
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
                                            onClick={() => openPostModal(post)}
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

            {/* Modal xem chi tiết bài viết */}
            {isPostModalOpen && selectedPost && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2000,
                    overflowY: "auto"
                }} onClick={() => setIsPostModalOpen(false)}>
                    <div style={{
                        background: "white",
                        width: "700px",
                        maxWidth: "90%",
                        maxHeight: "90vh",
                        borderRadius: "16px",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        position: "relative"
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        <div style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #e4e6eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexShrink: 0
                        }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>Chi tiết bài viết</h3>
                            <button
                                onClick={() => setIsPostModalOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >✕</button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                            {/* Header bài viết */}
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "15px" }}>
                                <div style={{ 
                                    width: "48px", 
                                    height: "48px", 
                                    background: "#e4e6eb", 
                                    borderRadius: "50%", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    overflow: "hidden",
                                    flexShrink: 0
                                }}>
                                    {selectedPost.author_avatar ? (
                                        <img src={selectedPost.author_avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                                    ) : (
                                        <span style={{ fontSize: "24px" }}>👤</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{selectedPost.author_name}</h4>
                                    <span style={{ fontSize: "12px", color: "#888" }}>{new Date(selectedPost.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Nội dung bài viết */}
                            <div style={{ marginBottom: "15px" }} >
                                {selectedPost.content && (
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
                                                strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
                                                em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />
                                            }}
                                        >
                                            {selectedPost.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                {selectedPost.location && (
                                    <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                                        📍 <strong>Vị trí:</strong> {selectedPost.location}
                                    </p>
                                )}
                                {selectedPost.tags && selectedPost.tags.length > 0 && (
                                    <p style={{ margin: "5px 0", color: "#2e7d32", fontSize: "14px", fontWeight: "500" }}>
                                        {selectedPost.tags.map(tag => `#${tag}`).join(" ")}
                                    </p>
                                )}
                            </div>

                            {/* Ảnh bài viết */}
                            {selectedPost.images && selectedPost.images.length > 0 && (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: selectedPost.images.length > 1 ? "repeat(2, 1fr)" : "1fr",
                                    gap: "10px",
                                    marginBottom: "15px"
                                }}>
                                    {selectedPost.images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={img} 
                                            alt="post" 
                                            style={{ 
                                                width: "100%", 
                                                borderRadius: "8px", 
                                                objectFit: "cover",
                                                cursor: "pointer",
                                                transition: "transform 0.2s"
                                            }}
                                            onClick={() => openLightbox(selectedPost.images, idx)}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Thống kê */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "14px", color: "#65676B" }}>
                                <div>👍 {selectedPost.stats?.like_count || 0} lượt thích</div>
                                <div>{selectedPost.stats?.comment_count || 0} bình luận</div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "8px 0", marginBottom: "15px" }}>
                                <div
                                    onClick={async () => {
                                        const newLiked = !modalLiked;
                                        setModalLiked(newLiked);
                                        setSelectedPost(prev => ({
                                            ...prev,
                                            stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? 1 : -1) }
                                        }));
                                        try {
                                            await api.post(`/api/v1/likes/${selectedPost._id}`);
                                            // Cập nhật lại likedPosts state
                                            setLikedPosts(prev => ({ ...prev, [selectedPost._id]: newLiked }));
                                        } catch(e) {
                                            setModalLiked(!newLiked);
                                            setSelectedPost(prev => ({
                                                ...prev,
                                                stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? -1 : 1) }
                                            }));
                                        }
                                    }}
                                    style={{ flex: 1, textAlign: "center", cursor: "pointer", color: modalLiked ? "#1877F2" : "#555", fontWeight: "500", padding: "6px 0", borderRadius: "6px" }}
                                >
                                    👍 Thích
                                </div>
                                <div style={{ flex: 1, textAlign: "center", color: "#555", fontWeight: "500", padding: "6px 0" }}>💬 Bình luận</div>
                                <div style={{ flex: 1, textAlign: "center", cursor: "pointer", color: "#555", fontWeight: "500", padding: "6px 0", borderRadius: "6px" }}>
                                    ↗️ Chia sẻ
                                </div>
                            </div>

                            {/* Phần bình luận */}
                            <div style={{ marginTop: "15px" }}>
                                <h4 style={{ fontSize: "15px", marginBottom: "12px" }}>Bình luận</h4>
                                
                                {replyingTo && (
                                    <div style={{ 
                                        background: "#f0f2f5", 
                                        padding: "12px", 
                                        borderRadius: "12px", 
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        flexWrap: "wrap"
                                    }}>
                                        <span style={{ fontSize: "14px", color: "#65676B" }}>
                                            Trả lời <strong>{replyingTo.author_name}</strong>:
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Viết câu trả lời..."
                                            value={replyInput}
                                            onChange={(e) => setReplyInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleModalComment(replyingTo._id)}
                                            style={{
                                                flex: 1,
                                                minWidth: "200px",
                                                padding: "8px 12px",
                                                borderRadius: "20px",
                                                border: "1px solid #ddd",
                                                background: "white",
                                                outline: "none",
                                                fontSize: "14px"
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleModalComment(replyingTo._id)}
                                            style={{ border: "none", background: "#2e7d32", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                                        >
                                            Trả lời
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            style={{ border: "none", background: "#e4e6eb", color: "#333", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {modalComments.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#888", padding: "20px 0" }}>Chưa có bình luận nào.</div>
                                ) : (
                                    <>
                                        {modalComments.map(cmt => {
                                            const isCommentOwner = currentUser && String(currentUser._id || currentUser.id) === String(cmt.author_id);
                                            const isAdmin = currentUser && currentUser.role === "admin";
                                            const showMenu = isCommentOwner || isAdmin;
                                            const replies = getRepliesForComment(cmt._id);
                                            const isExpanded = expandedReplies[cmt._id] || false;
                                            
                                            return (
                                                <div key={cmt._id} style={{ marginBottom: "20px" }}>
                                                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                        <div style={{ 
                                                            width: "40px", 
                                                            height: "40px", 
                                                            background: "#2e7d32", 
                                                            borderRadius: "50%", 
                                                            display: "flex", 
                                                            alignItems: "center", 
                                                            justifyContent: "center", 
                                                            color: "white", 
                                                            fontSize: "16px", 
                                                            fontWeight: "bold", 
                                                            flexShrink: 0 
                                                        }}>
                                                            {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            {editingCommentId === cmt._id ? (
                                                                <div style={{ background: "#f0f2f5", padding: "10px 14px", borderRadius: "18px" }}>
                                                                    <input
                                                                        type="text"
                                                                        value={editCommentContent}
                                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                                        style={{
                                                                            width: "100%",
                                                                            padding: "8px 12px",
                                                                            borderRadius: "8px",
                                                                            border: "1px solid #2e7d32",
                                                                            outline: "none",
                                                                            fontSize: "14px",
                                                                            background: "white"
                                                                        }}
                                                                        autoFocus
                                                                        onKeyDown={(e) => e.key === "Enter" && handleSaveModalComment(selectedPost._id, cmt._id)}
                                                                    />
                                                                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                                                        <button
                                                                            onClick={() => handleSaveModalComment(selectedPost._id, cmt._id)}
                                                                            style={{ padding: "4px 12px", background: "#2e7d32", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                                                                        >
                                                                            Lưu
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setEditingCommentId(null); setEditCommentContent(""); }}
                                                                            style={{ padding: "4px 12px", background: "#e4e6eb", color: "#333", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                                                                        >
                                                                            Hủy
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div style={{ background: "#f0f2f5", padding: "10px 14px", borderRadius: "18px", position: "relative" }}>
                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                            <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px", color: "#1c1e21" }}>
                                                                                {cmt.author_name}
                                                                            </strong>
                                                                            {showMenu && (
                                                                                <div style={{ position: "relative" }}>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveCommentMenu(activeCommentMenu === cmt._id ? null : cmt._id);
                                                                                        }}
                                                                                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#65676B", fontSize: "18px", padding: "0 8px", fontWeight: "bold" }}
                                                                                    >
                                                                                        •••
                                                                                    </button>
                                                                                    {activeCommentMenu === cmt._id && (
                                                                                        <div style={{ position: "absolute", top: "24px", right: "0", background: "white", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "120px", zIndex: 20, overflow: "hidden" }}>
                                                                                            <button onClick={() => handleEditModalComment(cmt)} style={{ padding: "10px 12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "13px", width: "100%", borderBottom: "1px solid #eee" }}>✏️ Sửa</button>
                                                                                            <button onClick={() => handleDeleteModalComment(selectedPost._id, cmt._id)} style={{ padding: "10px 12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "13px", color: "#dc3545", width: "100%" }}>🗑️ Xóa</button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontSize: "14px", color: "#1c1e21", wordBreak: "break-word" }}>
                                                                            {cmt.content}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: "flex", gap: "16px", marginTop: "6px", marginLeft: "8px", fontSize: "12px", color: "#65676B" }}>
                                                                        <span>{new Date(cmt.created_at).toLocaleString()}</span>
                                                                        <button onClick={() => setReplyingTo(cmt)} style={{ border: "none", background: "transparent", color: "#2e7d32", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>Trả lời</button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Replies */}
                                                    {replies && replies.length > 0 && (
                                                        <div style={{ marginLeft: "52px", marginTop: "8px" }}>
                                                            {!isExpanded ? (
                                                                <button onClick={() => toggleReplies(cmt._id)} style={{ background: "transparent", border: "none", color: "#2e7d32", fontSize: "13px", fontWeight: "500", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                                                                    💬 Xem {replies.length} câu trả lời
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => toggleReplies(cmt._id)} style={{ background: "transparent", border: "none", color: "#65676B", fontSize: "13px", cursor: "pointer", padding: "4px 0", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                                        🔽 Ẩn câu trả lời
                                                                    </button>
                                                                    <div style={{ paddingLeft: "12px", borderLeft: "2px solid #e4e6eb" }}>
                                                                        {replies.map(reply => {
                                                                            const isReplyOwner = currentUser && String(currentUser._id || currentUser.id) === String(reply.author_id);
                                                                            return (
                                                                                <div key={reply._id} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                                                                                    <div style={{ width: "32px", height: "32px", background: "#e4e6eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                                                                                        {reply.author_name ? reply.author_name.charAt(0).toUpperCase() : "U"}
                                                                                    </div>
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "16px" }}>
                                                                                            <strong style={{ fontSize: "12px", display: "block", marginBottom: "2px" }}>{reply.author_name}</strong>
                                                                                            <span style={{ fontSize: "13px" }}>{reply.content}</span>
                                                                                        </div>
                                                                                        <div style={{ marginTop: "4px", marginLeft: "8px", fontSize: "11px", color: "#65676B" }}>
                                                                                            {new Date(reply.created_at).toLocaleString()}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {modalComments.length < totalComments && totalComments > commentLimit && (
                                            <div style={{ textAlign: "center", marginTop: "16px" }}>
                                                <button onClick={loadMoreComments} style={{ padding: "8px 24px", background: "transparent", border: "1px solid #2e7d32", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#2e7d32" }}>
                                                    Xem thêm {totalComments - modalComments.length} bình luận
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Input bình luận */}
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #e4e6eb", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ width: "32px", height: "32px", background: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {currentUser?.avatar_url ? (
                                    <img src={currentUser.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}/>
                                ) : "👤"}
                            </div>
                            <input
                                type="text"
                                placeholder={replyingTo ? `Trả lời ${replyingTo.author_name}...` : "Viết bình luận..."}
                                value={modalCommentInput}
                                onChange={(e) => setModalCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && modalCommentInput.trim() && handleModalComment()}
                                style={{ flex: 1, padding: "10px 14px", borderRadius: "20px", border: "none", background: "#f0f2f5", outline: "none", fontSize: "14px" }}
                            />
                            <button onClick={() => handleModalComment()} style={{ border: "none", background: "transparent", color: "#1877F2", fontWeight: "bold", cursor: "pointer" }}>
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox xem ảnh */}
            {isLightboxOpen && lightboxImages.length > 0 && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.95)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={closeLightbox}>
                    <button onClick={closeLightbox} style={{ position: "absolute", top: "20px", right: "30px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", width: "50px", height: "50px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>✕</button>
                    
                    {lightboxImages.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length); }} style={{ position: "absolute", left: "30px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "40px", cursor: "pointer", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>◀</button>
                    )}
                    
                    <img src={lightboxImages[currentImageIndex]} alt={`Lightbox ${currentImageIndex + 1}`} style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", cursor: "default", borderRadius: "8px" }} onClick={(e) => e.stopPropagation()} />
                    
                    {lightboxImages.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % lightboxImages.length); }} style={{ position: "absolute", right: "30px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "40px", cursor: "pointer", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>▶</button>
                    )}
                    
                    <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "500", pointerEvents: "none" }}>
                        {currentImageIndex + 1} / {lightboxImages.length}
                    </div>
                </div>
            )}
            
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