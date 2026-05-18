// src/components/groups/GroupPostCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

function GroupPostCard({ post, group, currentUserId, onLike, onDelete, onEdit }) {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(post.is_liked || false);
    const [likeCount, setLikeCount] = useState(post.stats?.like_count || 0);
    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    
    const isOwner = currentUserId === post.author_id;
    const isAdmin = currentUserId && group?.user_role === 'admin';
    const canModify = isOwner || isAdmin;
    
    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        
        try {
            await api.post(`/api/v1/likes/${post._id}`);
            onLike?.(post._id, newLiked);
        } catch (error) {
            setLiked(!newLiked);
            setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
            console.error('Error liking post:', error);
        }
    };
    
    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
            try {
                await api.delete(`/api/v1/posts/${post._id}`);
                onDelete?.(post._id);
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Không thể xóa bài viết');
            }
        }
    };
    
    const loadComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }
        
        setLoadingComments(true);
        try {
            const response = await api.get(`/api/v1/comments/${post._id}`);
            setComments(response.data);
            setShowComments(true);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };
    
    const handleComment = async () => {
        if (!commentInput.trim()) return;
        
        try {
            const response = await api.post('/api/v1/comments/', {
                post_id: post._id,
                content: commentInput
            });
            setComments([response.data, ...comments]);
            setCommentInput('');
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Không thể đăng bình luận');
        }
    };
    
    const goToPostDetail = () => {
        navigate(`/post/${post._id}`);
    };
    
    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            marginBottom: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    {/* Avatar */}
                    <div 
                        onClick={() => navigate(`/profile/${post.author_id}`)}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f0f2f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden'
                        }}
                    >
                        {post.author_avatar ? (
                            <img src={post.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '20px' }}>👤</span>
                        )}
                    </div>
                    
                    {/* Author info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong 
                                onClick={() => navigate(`/profile/${post.author_id}`)}
                                style={{ cursor: 'pointer', color: '#2e7d32' }}
                            >
                                {post.author_name}
                            </strong>
                            {group && (
                                <span style={{ fontSize: '12px', color: '#65676B' }}>
                                    trong <strong style={{ color: '#2e7d32' }}>{group.name}</strong>
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>
                            {new Date(post.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>
                
                {/* Menu */}
                {canModify && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '18px',
                                cursor: 'pointer',
                                padding: '4px 8px'
                            }}
                        >
                            •••
                        </button>
                        {showMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '30px',
                                right: '0',
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                zIndex: 10,
                                minWidth: '120px'
                            }}>
                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            onEdit?.(post);
                                            setShowMenu(false);
                                        }}
                                        style={{
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'white',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            borderBottom: '1px solid #eee'
                                        }}
                                    >
                                        ✏️ Sửa bài viết
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        handleDelete();
                                        setShowMenu(false);
                                    }}
                                    style={{
                                        padding: '10px 16px',
                                        border: 'none',
                                        background: 'white',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        color: '#dc3545'
                                    }}
                                >
                                    🗑️ Xóa bài viết
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Content */}
            <div onClick={goToPostDetail} style={{ padding: '0 16px 16px', cursor: 'pointer' }}>
                {post.content && (
                    <p style={{ margin: '0 0 12px', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {post.content}
                    </p>
                )}
                
                {/* Images */}
                {post.images && post.images.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                        gap: '8px',
                        marginTop: '12px',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        {post.images.slice(0, 4).map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: post.images.length === 1 ? 'auto' : '200px',
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Open lightbox
                                }}
                            />
                        ))}
                        {post.images.length > 4 && (
                            <div style={{
                                position: 'relative',
                                background: '#000',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}>
                                <img src={post.images[4]} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', opacity: 0.7 }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: 'white',
                                    fontSize: '24px',
                                    fontWeight: 'bold'
                                }}>
                                    +{post.images.length - 4}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Stats */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid #e4e6eb', borderBottom: '1px solid #e4e6eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#65676B' }}>
                    <div>👍 {likeCount} lượt thích</div>
                    <div>💬 {post.stats?.comment_count || 0} bình luận</div>
                </div>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', padding: '8px 0' }}>
                <button
                    onClick={handleLike}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        color: liked ? '#1877F2' : '#65676B',
                        fontWeight: liked ? '600' : '500',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    👍 Thích
                </button>
                <button
                    onClick={loadComments}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        color: '#65676B',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    💬 Bình luận
                </button>
                <button
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        color: '#65676B',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    ↗️ Chia sẻ
                </button>
            </div>
            
            {/* Comments section */}
            {showComments && (
                <div style={{ padding: '16px', borderTop: '1px solid #e4e6eb', background: '#fafafa' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="Viết bình luận..."
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '20px',
                                border: '1px solid #ddd',
                                background: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                        />
                        <button
                            onClick={handleComment}
                            disabled={!commentInput.trim()}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '20px',
                                border: 'none',
                                background: commentInput.trim() ? '#2e7d32' : '#ccc',
                                color: 'white',
                                cursor: commentInput.trim() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Gửi
                        </button>
                    </div>
                    
                    {loadingComments ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải bình luận...</div>
                    ) : (
                        comments.slice(0, 3).map(comment => (
                            <div key={comment._id} style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#e4e6eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px'
                                }}>
                                    {comment.author_name?.charAt(0) || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: '18px' }}>
                                        <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                            {comment.author_name}
                                        </strong>
                                        <span style={{ fontSize: '14px' }}>{comment.content}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#65676B', marginTop: '4px', marginLeft: '8px' }}>
                                        {new Date(comment.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {(post.stats?.comment_count || 0) > 3 && (
                        <button
                            onClick={goToPostDetail}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#2e7d32',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                padding: '8px'
                            }}
                        >
                            Xem tất cả {(post.stats?.comment_count || 0) - 3} bình luận
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default GroupPostCard;