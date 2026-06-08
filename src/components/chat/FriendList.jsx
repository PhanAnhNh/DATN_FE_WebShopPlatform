// components/Chat/FriendList.jsx
import React, { useState } from 'react';
import { FaSearch, FaTrash, FaEllipsisV } from 'react-icons/fa';
import api from '../../api/api';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

const FriendList = ({ friends, recentChats, onSelectFriend, filterUnread, onConversationDeleted }) => {
    const [avatarErrors, setAvatarErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [menuOpenFor, setMenuOpenFor] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        userToDelete: null
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

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

    const handleDeleteConversation = async (user) => {
        setDeletingId(user.user_id);
        try {
            await api.delete(`/api/v1/chat/conversation/${user.user_id}`);
            
            if (onConversationDeleted) {
                onConversationDeleted(user.user_id);
            }
            
            showToast('Đã xóa hội thoại', 'success');
            
        } catch (err) {
            console.error("Error deleting conversation:", err);
            showToast(err.response?.data?.message || 'Không thể xóa hội thoại', 'error');
        } finally {
            setDeletingId(null);
            setMenuOpenFor(null);
            setConfirmDialog({ isOpen: false, userToDelete: null });
        }
    };

    const openConfirmDialog = (user, e) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            userToDelete: user
        });
        setMenuOpenFor(null);
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
    
    let displayList = Array.from(uniqueFriends.values());

    // 1. Lọc theo tin nhắn chưa đọc (nếu bật filter)
    if (filterUnread) {
        displayList = displayList.filter(user => user.unread_count > 0);
    }

    // 2. Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        displayList = displayList.filter(user => 
            (user.full_name && user.full_name.toLowerCase().includes(term)) ||
            (user.username && user.username.toLowerCase().includes(term))
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Thanh tìm kiếm trong danh sách bạn bè */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee' }}>
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
                        placeholder="Tìm kiếm trong danh sách chat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: '14px',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            {/* Danh sách cuộn */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {displayList.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#65676b' }}>
                        {searchTerm ? "Không tìm thấy kết quả" : (filterUnread ? "Không có tin nhắn chưa đọc" : "Chưa có bạn bè nào")}
                    </div>
                ) : (
                    displayList.map((user) => (
                        <div
                            key={user.user_id}
                            style={{
                                position: 'relative',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f8f8f8',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f2f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {/* Avatar - cố định kích thước */}
                            <div style={{ flexShrink: 0 }}>
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
                            </div>
                            
                            {/* Nội dung chính - chiếm phần còn lại */}
                            <div 
                                style={{ 
                                    flex: 1, 
                                    minWidth: 0,
                                    cursor: 'pointer'
                                }}
                                onClick={() => onSelectFriend(user)}
                            >
                                <div style={{ 
                                    fontWeight: '600', 
                                    fontSize: '15px',
                                    marginBottom: '4px'
                                }}>
                                    {user.full_name || user.username || 'Người dùng'}
                                </div>
                                {user.last_message && (
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#65676b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        width: '100%'
                                    }}>
                                        {user.last_message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Badge và nút menu - cố định bên phải */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                flexShrink: 0
                            }}>
                                {user.unread_count > 0 && (
                                    <div style={{
                                        background: '#e41e3f',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        minWidth: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 4px'
                                    }}>
                                        {user.unread_count > 99 ? '99+' : user.unread_count}
                                    </div>
                                )}
                                
                                {/* Nút menu xóa */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenFor(menuOpenFor === user.user_id ? null : user.user_id);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#888',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '32px',
                                            height: '32px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e4e6e9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <FaEllipsisV size={14} />
                                    </button>
                                    
                                    {menuOpenFor === user.user_id && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: '0',
                                            background: 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                            zIndex: 10,
                                            minWidth: '150px',
                                            marginTop: '5px'
                                        }}>
                                            <button
                                                onClick={(e) => openConfirmDialog(user, e)}
                                                disabled={deletingId === user.user_id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 12px',
                                                    border: 'none',
                                                    background: 'white',
                                                    cursor: deletingId === user.user_id ? 'not-allowed' : 'pointer',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    borderRadius: '8px',
                                                    color: '#dc3545'
                                                }}
                                            >
                                                <FaTrash size={12} />
                                                {deletingId === user.user_id ? 'Đang xóa...' : 'Xóa hội thoại'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ConfirmDialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, userToDelete: null })}
                onConfirm={() => confirmDialog.userToDelete && handleDeleteConversation(confirmDialog.userToDelete)}
                title="Xóa hội thoại"
                message={`Bạn có chắc chắn muốn xóa toàn bộ tin nhắn với ${confirmDialog.userToDelete?.full_name || confirmDialog.userToDelete?.username || 'người dùng'}?`}
                type="warning"
            />

            {/* Toast Component */}
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

export default FriendList;