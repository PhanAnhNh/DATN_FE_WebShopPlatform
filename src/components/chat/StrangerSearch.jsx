// components/Chat/StrangerSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUser, FaComment, FaUserPlus, FaCheck } from 'react-icons/fa';
import api from '../../api/api';
import Toast from '../common/Toast';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

const StrangerSearch = ({ onSelectStranger, onStartChat }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [friendStatuses, setFriendStatuses] = useState({});
    const [sendingRequest, setSendingRequest] = useState({});
    const [toast, setToast] = useState(null);
    const [avatarErrors, setAvatarErrors] = useState({});
    const searchTimeoutRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleAvatarError = (userId) => {
        setAvatarErrors(prev => ({ ...prev, [userId]: true }));
    };

    const getAvatarUrl = (user) => {
        if (avatarErrors[user._id]) return DEFAULT_AVATAR;
        if (user.avatar_url && user.avatar_url.trim() !== '') {
            return user.avatar_url;
        }
        return DEFAULT_AVATAR;
    };

    // Tìm kiếm người dùng
    const searchUsers = async (keyword) => {
        if (!keyword.trim() || keyword.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/api/v1/users/search?keyword=${encodeURIComponent(keyword)}&limit=20`);
            const users = response.data || [];
            
            // Lọc bỏ chính mình
            const currentUserId = getCurrentUserId();
            const filteredUsers = users.filter(user => user._id !== currentUserId);
            
            setSearchResults(filteredUsers);
            
            // Kiểm tra trạng thái bạn bè cho từng user
            if (filteredUsers.length > 0) {
                await checkFriendshipStatuses(filteredUsers);
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm người dùng:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const getCurrentUserId = () => {
        try {
            const userData = localStorage.getItem("user_data");
            if (userData) {
                const user = JSON.parse(userData);
                return user.id || user._id;
            }
        } catch (error) {
            console.error(error);
        }
        return localStorage.getItem("user_id");
    };

    const checkFriendshipStatuses = async (users) => {
        const statuses = {};
        for (const user of users) {
            try {
                const response = await api.get(`/api/v1/friends/check/${user._id}`);
                statuses[user._id] = response.data;
            } catch (error) {
                console.error(`Error checking friendship with ${user._id}:`, error);
                statuses[user._id] = { status: 'not_friends', can_send_request: true };
            }
        }
        setFriendStatuses(statuses);
    };

    const checkFriendshipStatus = async (userId) => {
        try {
            const response = await api.get(`/api/v1/friends/check/${userId}`);
            setFriendStatuses(prev => ({ ...prev, [userId]: response.data }));
            return response.data;
        } catch (error) {
            console.error("Error checking friendship:", error);
            return { status: 'not_friends', can_send_request: true };
        }
    };

    const sendFriendRequest = async (userId, userName) => {
        setSendingRequest(prev => ({ ...prev, [userId]: true }));
        try {
            await api.post('/api/v1/friends/request', { friend_id: userId });
            showToast(`Đã gửi lời mời kết bạn đến ${userName}`, 'success');
            
            // Cập nhật trạng thái
            setFriendStatuses(prev => ({
                ...prev,
                [userId]: { status: 'request_sent', can_send_request: false }
            }));
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Không thể gửi lời mời kết bạn';
            showToast(errorMsg, 'error');
        } finally {
            setSendingRequest(prev => ({ ...prev, [userId]: false }));
        }
    };

    const startChat = (user) => {
        const chatUser = {
            user_id: user._id,
            full_name: user.full_name || user.username,
            username: user.username,
            avatar_url: user.avatar_url,
            _id: user._id
        };
        
        if (onStartChat) {
            onStartChat(chatUser);
        }
        if (onSelectStranger) {
            onSelectStranger(chatUser);
        }
    };

    // Debounce search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            searchUsers(searchKeyword);
        }, 500);
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchKeyword]);

    const getFriendshipText = (status) => {
        switch (status?.status) {
            case 'friends':
                return { text: 'Bạn bè', color: '#2e7d32', icon: <FaCheck size={12} /> };
            case 'request_sent':
                return { text: 'Đã gửi lời mời', color: '#ff9800', icon: null };
            case 'request_received':
                return { text: 'Đã nhận lời mời', color: '#2196f3', icon: null };
            case 'blocked_by_you':
                return { text: 'Đã chặn', color: '#f44336', icon: null };
            case 'blocked_by_them':
                return { text: 'Bị chặn', color: '#f44336', icon: null };
            default:
                return { text: 'Kết bạn', color: '#2e7d32', icon: null };
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thanh tìm kiếm */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f0f2f5',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    gap: '8px'
                }}>
                    <FaSearch size={14} color="#65676b" />
                    <input 
                        type="text"
                        placeholder="Tìm kiếm người dùng theo tên..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: '14px',
                            width: '100%'
                        }}
                        autoFocus
                    />
                </div>
                {searchKeyword.length > 0 && searchKeyword.length < 2 && (
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
                        Nhập ít nhất 2 ký tự để tìm kiếm
                    </div>
                )}
            </div>

            {/* Kết quả tìm kiếm */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isSearching ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        <div className="searching-spinner"></div>
                        Đang tìm kiếm...
                        <style>{`
                            .searching-spinner {
                                width: 30px;
                                height: 30px;
                                border: 3px solid #f0f2f5;
                                border-top: 3px solid #2e7d32;
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                                margin: 0 auto 10px;
                            }
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : searchResults.length === 0 && searchKeyword.length >= 2 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                        <FaUser size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <div>Không tìm thấy người dùng nào</div>
                        <div style={{ fontSize: '12px', marginTop: '8px' }}>
                            Thử tìm kiếm với tên khác
                        </div>
                    </div>
                ) : searchResults.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                        <FaSearch size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <div>Tìm kiếm người dùng để bắt đầu trò chuyện</div>
                        <div style={{ fontSize: '12px', marginTop: '8px' }}>
                            Bạn có thể nhắn tin với bất kỳ ai
                        </div>
                    </div>
                ) : (
                    searchResults.map((user) => {
                        const friendship = friendStatuses[user._id];
                        const friendshipInfo = getFriendshipText(friendship);
                        const isFriend = friendship?.status === 'friends';
                        
                        return (
                            <div
                                key={user._id}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    borderBottom: '1px solid #f0f0f0',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                {/* Avatar */}
                                <div style={{ flexShrink: 0 }}>
                                    <img
                                        src={getAvatarUrl(user)}
                                        alt={user.full_name || user.username}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                        onError={() => handleAvatarError(user._id)}
                                    />
                                </div>
                                
                                {/* Thông tin */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        fontSize: '15px',
                                        marginBottom: '4px'
                                    }}>
                                        {user.full_name || user.username}
                                    </div>
                                    {user.username && user.full_name && (
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            @{user.username}
                                        </div>
                                    )}
                                    {user.bio && (
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginTop: '4px'
                                        }}>
                                            {user.bio}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Nút hành động */}
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    {/* Nút nhắn tin - luôn hiển thị */}
                                    <button
                                        onClick={() => startChat(user)}
                                        style={{
                                            background: '#2e7d32',
                                            border: 'none',
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        <FaComment size={12} />
                                        Nhắn tin
                                    </button>
                                    
                                    {/* Nút kết bạn - chỉ hiển thị nếu chưa là bạn bè */}
                                    {!isFriend && friendship?.can_send_request !== false && (
                                        <button
                                            onClick={() => sendFriendRequest(user._id, user.full_name || user.username)}
                                            disabled={sendingRequest[user._id]}
                                            style={{
                                                background: '#e8f5e9',
                                                border: `1px solid ${friendshipInfo.color}`,
                                                borderRadius: '20px',
                                                padding: '6px 12px',
                                                cursor: sendingRequest[user._id] ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                color: friendshipInfo.color,
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                opacity: sendingRequest[user._id] ? 0.6 : 1
                                            }}
                                        >
                                            {sendingRequest[user._id] ? (
                                                'Đang gửi...'
                                            ) : (
                                                <>
                                                    <FaUserPlus size={12} />
                                                    {friendshipInfo.text}
                                                </>
                                            )}
                                        </button>
                                    )}
                                    
                                    {/* Hiển thị trạng thái đã là bạn bè */}
                                    {isFriend && (
                                        <div style={{
                                            background: '#e8f5e9',
                                            border: `1px solid ${friendshipInfo.color}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: friendshipInfo.color,
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            <FaCheck size={12} />
                                            {friendshipInfo.text}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    duration={3000}
                />
            )}
        </div>
    );
};

export default StrangerSearch;