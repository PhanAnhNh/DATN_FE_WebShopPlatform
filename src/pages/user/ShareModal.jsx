// components/share/ShareModal.jsx
import React, { useState, useEffect } from 'react';
import { 
    FaTimes, 
    FaPaperPlane, 
    FaSearch, 
    FaUserFriends, 
    FaGlobe, 
    FaChevronDown,
    FaCheck,
    FaUserCircle,
    FaShareAlt,
    FaComment,
    FaHashtag,
    FaMapMarkerAlt,
    FaImage,
    FaSmile,
    FaFacebook,
    FaUsers,
    FaRegNewspaper
} from 'react-icons/fa';
import api from '../../api/api';
import socket from '../../socket';

const ShareModal = ({ post, onClose, onShareSuccess }) => {
    const [shareType, setShareType] = useState('messenger'); // 'messenger' hoặc 'timeline'
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [timelineContent, setTimelineContent] = useState('');
    const [timelineVisibility, setTimelineVisibility] = useState('public');
    const [timelineImages, setTimelineImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
    
    const currentUserId = JSON.parse(localStorage.getItem('user_data') || '{}')?.id;
    const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');

    useEffect(() => { 
        fetchFriends();
        // Tự động điền nội dung chia sẻ
        setTimelineContent(`Chia sẻ bài viết của ${post.author_name}: ${post.content?.substring(0, 100)}...`);
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/api/v1/friends/list');
            setFriends(res.data);
        } catch (err) { console.error("Lỗi lấy danh sách bạn bè:", err); }
    };

    const toggleFriend = (friendId) => {
        const newSelected = new Set(selectedFriends);
        if (newSelected.has(friendId)) newSelected.delete(friendId);
        else newSelected.add(friendId);
        setSelectedFriends(newSelected);
    };

    // Chia sẻ qua Messenger
    const handleShareToMessenger = async () => {
        if (selectedFriends.size === 0) return;
        setLoading(true);
        try {
            const postUrl = `${window.location.origin}/post/${post._id}`;
            const shareContent = message 
                ? `${message}\n\n📌 ${post.content || 'Chia sẻ bài viết'}\n🔗 ${postUrl}`
                : `📌 ${post.content || 'Chia sẻ bài viết'}\n🔗 ${postUrl}`;

            const sharePromises = Array.from(selectedFriends).map(friendId => 
                api.post('/api/v1/chat/send', { 
                    receiver_id: friendId, 
                    content: shareContent, 
                    message_type: "share" 
                })
            );
            await Promise.all(sharePromises);

            if (socket.connected) {
                Array.from(selectedFriends).forEach(friendId => {
                    socket.emit('send_chat_message', {
                        sender_id: currentUserId, 
                        receiver_id: friendId,
                        content: shareContent, 
                        message_type: "share"
                    });
                });
            }
            await api.post(`/api/v1/shares/${post._id}`);
            onShareSuccess?.();
            onClose();
        } catch (err) { 
            alert("Lỗi chia sẻ, vui lòng thử lại!");
        } finally { 
            setLoading(false); 
        }
    };

    // Chia sẻ lên Timeline (đăng bài viết mới)
    const handleShareToTimeline = async () => {
    if (!timelineContent.trim() && timelineImages.length === 0) {
        alert("Vui lòng nhập nội dung chia sẻ hoặc thêm ảnh");
        return;
    }
    
    setLoading(true);
    try {
        // Tạo nội dung bài viết chia sẻ
        const sharePostData = {
            content: timelineContent,
            images: timelineImages,
            videos: [],
            tags: [`chia sẻ từ ${post.author_name}`, ...(post.tags || [])],
            location: post.location || "",
            visibility: timelineVisibility,
            post_type: "share",  // Quan trọng: đánh dấu là bài chia sẻ
            product_category: post.product_category || "general",
            allow_comment: true,
            allow_share: true,
            shared_post_id: post._id  // ID của bài viết gốc
        };
        
        const res = await api.post('/api/v1/posts/', sharePostData);
        
        // Tăng share_count cho bài gốc
        await api.post(`/api/v1/shares/${post._id}`);
        
        onShareSuccess?.();
        onClose();
        
        // Hiển thị thông báo thành công
        alert("Đã chia sẻ bài viết lên tường thành công!");
        
    } catch (err) { 
        console.error("Lỗi chia sẻ lên timeline:", err);
        alert(err.response?.data?.detail || "Không thể chia sẻ bài viết. Vui lòng thử lại!");
    } finally { 
        setLoading(false); 
    }
};

    const handleShare = () => {
        if (shareType === 'messenger') {
            handleShareToMessenger();
        } else {
            handleShareToTimeline();
        }
    };

    // Upload ảnh cho timeline
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        setUploadingImages(true);
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            
            const response = await api.post('/api/v1/upload/images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setTimelineImages(prev => [...prev, ...response.data.urls]);
        } catch (error) {
            console.error('Lỗi upload ảnh:', error);
            alert('Không thể upload ảnh. Vui lòng thử lại!');
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = (index) => {
        setTimelineImages(prev => prev.filter((_, i) => i !== index));
    };

    const filteredFriends = friends.filter(f => 
        (f.full_name || f.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedList = friends.filter(f => selectedFriends.has(f.user_id));

    const visibilityLabels = {
        public: '🌍 Công khai',
        friends: '👥 Bạn bè',
        private: '🔒 Chỉ mình tôi'
    };

    return (
        <>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .share-modal-overlay { animation: overlayFadeIn 0.2s ease-out; }
                .share-modal-container { animation: modalFadeIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1); }
                .share-tab { transition: all 0.2s ease; position: relative; }
                .share-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #007bff;
                    border-radius: 3px;
                }
                .friend-item { transition: all 0.2s ease; }
                .friend-item:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
                .send-btn { transition: all 0.2s ease; }
                .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4); }
            `}</style>
            
            <div className="share-modal-overlay" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)',
                zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }} onClick={onClose}>
                <div className="share-modal-container" style={{
                    width: '100%', maxWidth: '640px', background: 'white', borderRadius: '28px',
                    overflow: 'hidden', boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)'
                }} onClick={(e) => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div style={{
                        padding: '20px 24px', borderBottom: '1px solid #eff2f5',
                        background: 'linear-gradient(135deg, #fff 0%, #fafbfc 100%)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #007bff, #00b4d8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,123,255,0.3)'
                                }}>
                                    <FaShareAlt size={24} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a1a2e' }}>Chia sẻ bài viết</h2>
                                </div>
                            </div>
                            <button onClick={onClose} style={{
                                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                                background: '#f0f2f5', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                            }} onMouseEnter={(e) => e.currentTarget.style.background = '#e4e6eb'}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* 2 Tab: Messenger và Timeline */}
                        <div style={{ display: 'flex', gap: '30px', marginTop: '20px', borderBottom: '1px solid #e9ecef' }}>
                            <div 
                                className={`share-tab ${shareType === 'messenger' ? 'active' : ''}`}
                                onClick={() => setShareType('messenger')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 0', cursor: 'pointer', color: shareType === 'messenger' ? '#007bff' : '#65676b',
                                    fontWeight: shareType === 'messenger' ? 600 : 500
                                }}
                            >
                                <FaFacebook size={20} />
                                <span>Gửi qua Messenger</span>
                            </div>
                            <div 
                                className={`share-tab ${shareType === 'timeline' ? 'active' : ''}`}
                                onClick={() => setShareType('timeline')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 0', cursor: 'pointer', color: shareType === 'timeline' ? '#007bff' : '#65676b',
                                    fontWeight: shareType === 'timeline' ? 600 : 500
                                }}
                            >
                                <FaRegNewspaper size={20} />
                                <span>Chia sẻ lên tường</span>
                            </div>
                        </div>
                    </div>

                    {/* Nội dung theo từng tab */}
                    {shareType === 'messenger' ? (
                        // ============= TAB MESSENGER =============
                        <>
                            {/* Message Input */}
                            <div style={{ padding: '20px 24px' }}>
                                <div style={{
                                    display: 'flex', gap: '12px', marginBottom: '20px',
                                    background: '#f8f9fa', borderRadius: '20px', padding: '16px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <FaUserCircle size={28} color="white" />
                                    </div>
                                    <textarea
                                        placeholder="✏️ Viết điều gì đó về bài viết này..."
                                        style={{
                                            flex: 1, border: 'none', background: 'transparent',
                                            outline: 'none', fontSize: '15px', resize: 'none',
                                            height: '80px', fontFamily: 'inherit', color: '#1a1a2e'
                                        }}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>

                                {/* Post Preview */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%)',
                                    borderRadius: '20px', padding: '16px', border: '1px solid #e9ecef'
                                }}>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <img src={post.author_avatar || `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${post.author_name?.[0] || 'U'}`}
                                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a2e', marginBottom: '4px' }}>{post.author_name}</div>
                                            <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '10px' }}>{new Date(post.created_at).toLocaleDateString('vi-VN')}</div>
                                            <div style={{ fontSize: '14px', color: '#2c3e50', background: 'white', padding: '12px', borderRadius: '14px' }}>
                                                {post.content?.substring(0, 120)}{post.content?.length > 120 && '...'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Friends Selection */}
                            <div style={{ padding: '0 24px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaUserFriends size={20} color="#007bff" />
                                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#1a1a2e' }}>Gửi qua Messenger</span>
                                        {selectedFriends.size > 0 && (
                                            <span style={{ background: '#007bff', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                                {selectedFriends.size} đã chọn
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: '30px', padding: '6px 16px', gap: '8px' }}>
                                        <FaSearch size={14} color="#65676b" />
                                        <input type="text" placeholder="Tìm kiếm bạn bè..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '180px' }}
                                            onChange={(e) => setSearchTerm(e.target.value)} />
                                    </div>
                                </div>

                                {/* Selected Friends Badges */}
                                {selectedList.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', padding: '12px 0', overflowX: 'auto', borderBottom: '1px solid #eff2f5', marginBottom: '16px' }}>
                                        {selectedList.map(f => (
                                            <div key={f.user_id} onClick={() => toggleFriend(f.user_id)} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px 6px 8px',
                                                background: 'linear-gradient(135deg, #e3f2fd, #bbdef5)', borderRadius: '40px',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#007bff'
                                            }}>
                                                <img src={f.avatar_url || `https://ui-avatars.com/api/?background=007bff&color=fff&name=${f.full_name?.[0] || 'U'}`}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%' }} alt="" />
                                                <span>{f.full_name?.split(' ')[0] || f.username}</span>
                                                <FaTimes size={12} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Friends Grid */}
                                <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px 0 16px 0' }}>
                                    {filteredFriends.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                            <FaUserFriends size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                            <p>Không tìm thấy bạn bè</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                            {filteredFriends.map(friend => {
                                                const isSelected = selectedFriends.has(friend.user_id);
                                                return (
                                                    <div key={friend.user_id} className="friend-item" onClick={() => toggleFriend(friend.user_id)} style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                                                        padding: '16px 12px', borderRadius: '20px', cursor: 'pointer',
                                                        background: isSelected ? 'linear-gradient(135deg, #e3f2fd, #f0f8ff)' : 'white',
                                                        border: isSelected ? '2px solid #007bff' : '1px solid #e9ecef', position: 'relative'
                                                    }}>
                                                        <div style={{ position: 'relative' }}>
                                                            <img src={friend.avatar_url || `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${friend.full_name?.[0] || 'U'}`}
                                                                style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: isSelected ? '3px solid #007bff' : '2px solid white' }} alt="" />
                                                            {isSelected && (
                                                                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#007bff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                                                    <FaCheck size={12} color="white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ fontWeight: 500, fontSize: '14px', color: '#1a1a2e', textAlign: 'center' }}>
                                                            {friend.full_name || friend.username}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // ============= TAB TIMELINE (CHIA SẺ LÊN TƯỜNG) =============
                        <div style={{ padding: '20px 24px' }}>
                            {/* Thông tin người chia sẻ */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <img src={currentUser?.avatar_url || `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${currentUser?.full_name?.[0] || 'U'}`}
                                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '16px', color: '#1a1a2e' }}>{currentUser?.full_name || currentUser?.username}</div>
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                                            style={{ background: '#f0f2f5', border: 'none', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            {visibilityLabels[timelineVisibility]} <FaChevronDown size={10} />
                                        </button>
                                        {showVisibilityDropdown && (
                                            <div style={{ position: 'absolute', top: '30px', left: 0, background: 'white', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, width: '160px' }}>
                                                {Object.entries(visibilityLabels).map(([key, label]) => (
                                                    <div key={key} onClick={() => { setTimelineVisibility(key); setShowVisibilityDropdown(false); }}
                                                        style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                                        {label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Textarea nhập nội dung chia sẻ */}
                            <textarea
                                placeholder={`Chia sẻ bài viết của ${post.author_name}...`}
                                value={timelineContent}
                                onChange={(e) => setTimelineContent(e.target.value)}
                                style={{
                                    width: '100%', border: 'none', outline: 'none', fontSize: '16px',
                                    resize: 'none', height: '120px', fontFamily: 'inherit', color: '#1a1a2e', lineHeight: '1.5'
                                }}
                                autoFocus
                            />

                            {/* Preview bài viết gốc */}
                            <div style={{
                                background: '#f5f7fa', borderRadius: '16px', padding: '16px', margin: '16px 0',
                                border: '1px solid #e9ecef', position: 'relative'
                            }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <img src={post.author_avatar || `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${post.author_name?.[0] || 'U'}`}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{post.author_name}</div>
                                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>{new Date(post.created_at).toLocaleDateString('vi-VN')}</div>
                                        <div style={{ fontSize: '13px', color: '#2c3e50' }}>{post.content?.substring(0, 100)}...</div>
                                    </div>
                                </div>
                                <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: '#6c757d' }}>
                                    Bài viết gốc
                                </div>
                            </div>

                            {/* Upload ảnh */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f0f2f5', borderRadius: '20px', cursor: 'pointer' }}>
                                    <FaImage /> Thêm ảnh
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                </label>
                                {uploadingImages && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>Đang upload...</span>}
                            </div>

                            {/* Hiển thị ảnh đã chọn */}
                            {timelineImages.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                    {timelineImages.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={url} alt={`upload_${idx}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px' }} />
                                            <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Button */}
                    <div style={{ padding: '20px 24px', borderTop: '1px solid #eff2f5', background: 'linear-gradient(135deg, #fff 0%, #fafbfc 100%)' }}>
                        <button className="send-btn" onClick={handleShare} disabled={(shareType === 'messenger' ? selectedFriends.size === 0 : (!timelineContent.trim() && timelineImages.length === 0)) || loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '50px', border: 'none',
                                background: ((shareType === 'messenger' ? selectedFriends.size > 0 : (timelineContent.trim() || timelineImages.length > 0))) 
                                    ? 'linear-gradient(135deg, #007bff, #00b4d8)' : '#e9ecef',
                                color: ((shareType === 'messenger' ? selectedFriends.size > 0 : (timelineContent.trim() || timelineImages.length > 0))) ? 'white' : '#adb5bd',
                                fontSize: '16px', fontWeight: 600, cursor: ((shareType === 'messenger' ? selectedFriends.size > 0 : (timelineContent.trim() || timelineImages.length > 0))) ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                            }}>
                            {loading ? (
                                <><div style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Đang xử lý...</>
                            ) : (
                                <>{shareType === 'messenger' ? <>📤 Gửi ngay ({selectedFriends.size})</> : <>🌍 Chia sẻ lên tường</>}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShareModal;