// src/pages/user/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import Layout from '../../components/layout/Layout';
import { 
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, 
    FaSpinner, FaCamera, FaPencilAlt, FaUserPlus, FaUserCheck,
    FaTh, FaInfoCircle, FaUsers, FaPhotoVideo, FaClock
} from 'react-icons/fa';
import FriendButton from '../../components/common/FriendButton';

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); // posts, about, friends
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [likedPosts, setLikedPosts] = useState({});

    // Trong UserProfile.jsx, thêm debug
    useEffect(() => {
        // Lấy current user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Đảm bảo có _id
            if (!parsedUser._id && parsedUser.id) {
                parsedUser._id = parsedUser.id;
            }
            setCurrentUser(parsedUser);
            console.log('Current user set:', parsedUser);
        }
        fetchUserProfile();
    }, [userId]);

    useEffect(() => {
        if (user && user._id) {
            fetchUserPosts();
            checkFollowStatus();
        }
    }, [user]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/v1/users/${userId}`);
            setUser(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Không thể tải thông tin người dùng');
            if (err.response?.status === 404) {
                setError('Không tìm thấy người dùng');
            }
        } finally {
            setLoading(false);
        }
    };

    // src/pages/user/UserProfile.jsx
const fetchUserPosts = async () => {
    try {
        // Truyền currentUser để backend kiểm tra quyền
        const response = await api.get(`/api/v1/posts/user/${userId}`, {
            params: {
                // Không cần params, backend sẽ lấy từ token
            }
        });
        const activePosts = response.data.filter(post => post.is_active !== false);
        setPosts(activePosts);
        
        // Check likes
        const likeChecks = activePosts.map(post =>
            api.get(`/api/v1/likes/check/${post._id}`)
                .then(res => ({ id: post._id, isLiked: res.data.liked }))
                .catch(() => ({ id: post._id, isLiked: false }))
        );
        const likeResults = await Promise.all(likeChecks);
        const likeMap = {};
        likeResults.forEach(result => {
            likeMap[result.id] = result.isLiked;
        });
        setLikedPosts(likeMap);
    } catch (err) {
        console.error('Error fetching user posts:', err);
    }
};

    const checkFollowStatus = async () => {
    if (!currentUser || currentUser._id === userId) return;
    try {
        // Đảm bảo endpoint đúng
        const response = await api.get(`/api/v1/follows/check/${userId}`);
        setIsFollowing(response.data.isFollowing);
    } catch (err) {
        console.error('Error checking follow status:', err);
        // Không hiển thị lỗi cho người dùng, chỉ log
    }
};

    const handleFollow = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setFollowingLoading(true);
        try {
            if (isFollowing) {
                await api.delete(`/api/v1/follow/${userId}`);
                setIsFollowing(false);
                setUser(prev => ({ ...prev, followers_count: (prev.followers_count || 0) - 1 }));
            } else {
                await api.post(`/api/v1/follow/${userId}`);
                setIsFollowing(true);
                setUser(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
            }
        } catch (err) {
            console.error('Error following/unfollowing:', err);
        } finally {
            setFollowingLoading(false);
        }
    };

    const handleToggleComments = async (postId) => {
        const isCurrentlyShown = showComments[postId];
        setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyShown }));
        if (!isCurrentlyShown && !postComments[postId]) {
            try {
                const res = await api.get(`/api/v1/comments/${postId}`);
                setPostComments(prev => ({ ...prev, [postId]: res.data }));
            } catch (error) {
                console.error("Lỗi khi tải bình luận:", error);
            }
        }
    };

    const handlePostComment = async (postId) => {
        const text = commentInputs[postId];
        if (!text || text.trim() === "") return;
        try {
            await api.post("/api/v1/comments/", { post_id: postId, content: text });
            const res = await api.get(`/api/v1/comments/${postId}`);
            setPostComments(prev => ({ ...prev, [postId]: res.data }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === postId ? { ...p, stats: { ...p.stats, comment_count: (p.stats.comment_count || 0) + 1 } } : p
            ));
        } catch (error) {
            console.error("Lỗi đăng bình luận:", error);
        }
    };

    const handleToggleLike = async (postId) => {
        const isCurrentlyLiked = likedPosts[postId];
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                const currentLikes = p.stats?.like_count || 0;
                return { ...p, stats: { ...p.stats, like_count: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1 } };
            }
            return p;
        }));
        try {
            await api.post(`/api/v1/likes/${postId}`);
        } catch (error) {
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    if (loading) {
        return (
            <Layout userProfile={user}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <FaSpinner className="spinning" size={40} color="#2e7d32" />
                    <p>Đang tải thông tin...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout userProfile={user}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h2 style={{ color: '#dc3545' }}>Lỗi</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Quay lại
                    </button>
                </div>
            </Layout>
        );
    }

    const isOwnProfile = currentUser?._id === userId;

    return (
        <Layout userProfile={user}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Banner và Avatar */}
                <div style={{ position: 'relative', marginBottom: '60px' }}>
                    {/* Banner */}
                    <div style={{
                        height: '300px',
                        background: user?.cover_url ? `url(${user.cover_url})` : 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '12px 12px 0 0',
                        position: 'relative'
                    }}>
                        {isOwnProfile && (
                            <button style={{
                                position: 'absolute',
                                bottom: '15px',
                                right: '15px',
                                background: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '13px'
                            }}>
                                <FaCamera /> Chỉnh sửa ảnh bìa
                            </button>
                        )}
                    </div>

                    {/* Avatar */}
                    <div style={{ position: 'absolute', bottom: '-50px', left: '30px' }}>
                        <div style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            border: '4px solid white',
                            overflow: 'hidden',
                            background: '#e4e6eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FaUser size={60} color="#2e7d32" />
                            )}
                        </div>
                        {isOwnProfile && (
                            <button style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                <FaCamera size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Thông tin người dùng */}
                <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
                                {user?.full_name || user?.username}
                            </h1>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '8px', color: '#666', fontSize: '14px' }}>
                                <span>📅 Tham gia {formatDate(user?.created_at)}</span>
                                {user?.location && <span>📍 {user.location}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                <span><strong>{user?.followers_count || 0}</strong> người theo dõi</span>
                                <span><strong>{user?.following_count || 0}</strong> đang theo dõi</span>
                                <span><strong>{user?.posts_count || 0}</strong> bài viết</span>
                            </div>
                        </div>
                        
                        {!isOwnProfile && (
                            <button 
                                onClick={handleFollow}
                                disabled={followingLoading}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: isFollowing ? '#e4e6eb' : '#2e7d32',
                                    color: isFollowing ? '#333' : 'white',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                                {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {!isOwnProfile && (
                                <FriendButton 
                                    userId={user?._id} 
                                    currentUserId={currentUser?._id}
                                    onStatusChange={(newStatus) => {
                                        // Cập nhật UI nếu cần
                                        console.log('Friend status changed:', newStatus);
                                        // Có thể refresh lại trang hoặc cập nhật state
                                        if (newStatus === 'friends') {
                                            // Cập nhật số lượng bạn bè nếu cần
                                            setUser(prev => ({ ...prev, friends_count: (prev.friends_count || 0) + 1 }));
                                        } else if (newStatus === 'not_friends') {
                                            setUser(prev => ({ ...prev, friends_count: Math.max(0, (prev.friends_count || 0) - 1) }));
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #ddd', marginTop: '10px' }}>
                    {[
                        { key: 'posts', label: 'Bài viết', icon: FaTh },
                        { key: 'about', label: 'Giới thiệu', icon: FaInfoCircle },
                        { key: 'friends', label: 'Bạn bè', icon: FaUsers }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '12px 24px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    color: activeTab === tab.key ? '#2e7d32' : '#65676B',
                                    borderBottom: activeTab === tab.key ? '3px solid #2e7d32' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ padding: '20px 0' }}>
                    {activeTab === 'posts' && (
                        <div>
                            {posts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                                    <FaPhotoVideo size={40} color="#ccc" />
                                    <p style={{ marginTop: '10px', color: '#666' }}>Chưa có bài viết nào</p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post._id} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e4e6eb' }}>
                                                {post.author_avatar ? <img src={post.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaUser size={24} style={{ margin: '8px' }} />}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '15px' }}>{post.author_name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888' }}>
                                                    <span><FaClock size={10} /> {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                                                    {post.location && <span>📍 {post.location}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ marginBottom: '15px' }}>
                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                                            {post.tags && post.tags.length > 0 && (
                                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    {post.tags.map(tag => <span key={tag} style={{ color: '#2e7d32', fontSize: '12px' }}>#{tag}</span>)}
                                                </div>
                                            )}
                                        </div>

                                        {post.images && post.images.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(post.images.length, 3)}, 1fr)`, gap: '4px', marginBottom: '15px' }}>
                                                {post.images.map((img, idx) => (
                                                    <img key={idx} src={img} alt="" style={{ width: '100%', borderRadius: '8px', aspectRatio: '1/1', objectFit: 'cover' }} />
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                                            <button onClick={() => handleToggleLike(post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: likedPosts[post._id] ? '#1877F2' : '#555' }}>
                                                👍 {post.stats?.like_count || 0}
                                            </button>
                                            <button onClick={() => handleToggleComments(post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                💬 {post.stats?.comment_count || 0} bình luận
                                            </button>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                ↗️ {post.stats?.share_count || 0} chia sẻ
                                            </button>
                                        </div>

                                        {showComments[post._id] && (
                                            <div style={{ marginTop: '15px' }}>
                                                {postComments[post._id]?.map(cmt => (
                                                    <div key={cmt._id} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {cmt.author_avatar ? <img src={cmt.author_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <FaUser size={14} />}
                                                        </div>
                                                        <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: '18px', flex: 1 }}>
                                                            <strong style={{ fontSize: '13px' }}>{cmt.author_name}</strong>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{cmt.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Viết bình luận..."
                                                        value={commentInputs[post._id] || ''}
                                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id)}
                                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: 'none', background: '#f0f2f5', outline: 'none' }}
                                                    />
                                                    <button onClick={() => handlePostComment(post._id)} style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer' }}>Gửi</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Giới thiệu</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div><strong>Tên đăng nhập:</strong> {user?.username}</div>
                                {user?.email && <div><strong>Email:</strong> {user.email}</div>}
                                {user?.phone && <div><strong>Số điện thoại:</strong> {user.phone}</div>}
                                {user?.address && <div><strong>Địa chỉ:</strong> {user.address}</div>}
                                {user?.dob && <div><strong>Ngày sinh:</strong> {formatDate(user.dob)}</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                            <FaUsers size={40} color="#ccc" />
                            <p style={{ marginTop: '10px', color: '#666' }}>Tính năng đang phát triển</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </Layout>
    );
};

export default UserProfile;