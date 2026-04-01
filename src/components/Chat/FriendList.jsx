// components/Chat/FriendList.jsx
import React, { useState } from 'react';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

const FriendList = ({ friends, recentChats, onSelectFriend }) => {
    const [avatarErrors, setAvatarErrors] = useState({});

    const handleAvatarError = (userId) => {
        setAvatarErrors(prev => ({ ...prev, [userId]: true }));
    };

    const getAvatarUrl = (user) => {
        if (avatarErrors[user.user_id]) return DEFAULT_AVATAR;
        if (user.avatar_url && user.avatar_url.trim() !== '') {
            return user.avatar_url;
        }
        return DEFAULT_AVATAR;
    };

    // Kết hợp danh sách, ưu tiên recent chats
    const uniqueFriends = new Map();
    
    recentChats.forEach(chat => {
        if (chat.user_id) {
            uniqueFriends.set(chat.user_id, { ...chat, isRecent: true });
        }
    });
    
    friends.forEach(friend => {
        if (friend.user_id && !uniqueFriends.has(friend.user_id)) {
            uniqueFriends.set(friend.user_id, { ...friend, isRecent: false });
        }
    });
    
    const displayList = Array.from(uniqueFriends.values());

    if (displayList.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#65676b' }}>
                Chưa có bạn bè hoặc tin nhắn nào
            </div>
        );
    }

    return (
        <div style={{ maxHeight: 'calc(600px - 60px)', overflowY: 'auto' }}>
            {displayList.map((user) => (
                <div
                    key={user.user_id}
                    onClick={() => onSelectFriend(user)}
                    style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f2f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <img
                        src={getAvatarUrl(user)}
                        alt={user.full_name}
                        style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                        }}
                        onError={() => handleAvatarError(user.user_id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>
                            {user.full_name || user.username || 'Người dùng'}
                        </div>
                        {user.last_message && (
                            <div style={{
                                fontSize: '13px',
                                color: '#65676b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user.last_message}
                            </div>
                        )}
                    </div>
                    {user.unread_count > 0 && (
                        <div style={{
                            background: '#e41e3f',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px'
                        }}>
                            {user.unread_count > 99 ? '99+' : user.unread_count}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FriendList;