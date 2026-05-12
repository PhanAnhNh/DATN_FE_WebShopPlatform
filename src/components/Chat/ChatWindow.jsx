// components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTrash, FaEdit, FaCheck, FaTimes, FaEllipsisV, FaArrowLeft } from 'react-icons/fa';
import api from '../../api/api';
import socket from '../../socket';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

const ChatWindow = ({ friend, onClose, onCloseModal }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [menuOpenFor, setMenuOpenFor] = useState(null);
    const messagesEndRef = useRef(null);
    const [avatarError, setAvatarError] = useState(false);

    const getCurrentUserId = () => {
        try {
            const userData = localStorage.getItem("user_data");
            if (userData) {
                const user = JSON.parse(userData);
                return user.id || user._id;
            }
        } catch (error) {
            console.error("Error parsing user_data:", error);
        }
        const directId = localStorage.getItem("user_id");
        return directId || null;
    };
    
    const currentUserId = getCurrentUserId();

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        if (!friend?.user_id || !currentUserId) return;
        

        const handleNewMessage = (msg) => {
            const isCurrentChat =
                (msg.sender_id === currentUserId &&
                msg.receiver_id === friend.user_id) ||

                (msg.sender_id === friend.user_id &&
                msg.receiver_id === currentUserId);

            if (!isCurrentChat) return;

            setMessages(prev => {
                const exists = prev.some(m =>
                    (
                        (m.id || m._id) === (msg.id || msg._id)
                    ) ||

                    (
                        m.sender_id === msg.sender_id &&
                        m.receiver_id === msg.receiver_id &&
                        m.content === msg.content &&
                        Math.abs(
                            new Date(m.created_at) - new Date(msg.created_at)
                        ) < 5000
                    )
                );

                if (exists) return prev;

                return [...prev, msg];
            });

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth"
                });
            }, 100);
        };

        const handleMessageEdited = (data) => {
            setMessages(prev => prev.map(msg => 
                msg.id === data.id || msg._id === data.id 
                    ? { ...msg, content: data.content, is_edited: true }
                    : msg
            ));
        };

        const handleMessageDeleted = (data) => {
            setMessages(prev => prev.filter(msg => (msg.id !== data.id && msg._id !== data.id)));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [friend?.user_id, currentUserId]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!friend?.user_id || !currentUserId) return;
            try {
                const res = await api.get(`/api/v1/chat/conversation/${friend.user_id}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };
        fetchMessages();
    }, [friend?.user_id, currentUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !friend?.user_id || !currentUserId) return;

        const content = newMessage.trim();
        const tempId = 'temp-' + Date.now();
        const tempMsg = {
            id: tempId,
            _id: tempId,
            sender_id: currentUserId,
            receiver_id: friend.user_id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');
        setLoading(true);

        try {
            const response = await api.post('/api/v1/chat/send', null, {
                params: {
                    receiver_id: friend.user_id,
                    content: content,
                    message_type: "text"
                }
            });
            
            // Replace temp message with real one
            const realMsg = response.data.data;

            setMessages(prev => {

                // replace temp message
                const updated = prev.map(msg => {

                    if (msg.id === tempId) {
                        return {
                            id: realMsg._id,
                            _id: realMsg._id,
                            sender_id: realMsg.sender_id,
                            receiver_id: realMsg.receiver_id,
                            content: realMsg.content,
                            created_at: realMsg.created_at,
                            is_read: false
                        };
                    }

                    return msg;
                });

                // remove duplicate ids
                const uniqueMessages = updated.filter((msg, index, self) => {

                    const currentId = msg.id || msg._id;

                    return index === self.findIndex(
                        m => (m.id || m._id) === currentId
                    );
                });

                return uniqueMessages;
            });
            
            
        } catch (err) {
            console.error("Error sending message:", err);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            alert("Không thể gửi tin nhắn. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const handleEditMessage = async (message) => {
        if (!editContent.trim()) return;
        
        try {
            await api.put(`/api/v1/chat/${message.id || message._id}?content=${encodeURIComponent(editContent)}`);
            
            // Update local state
            setMessages(prev => prev.map(msg => 
                (msg.id === message.id || msg._id === message._id)
                    ? { ...msg, content: editContent, is_edited: true }
                    : msg
            ));
            
            setEditingMessage(null);
            setEditContent('');
            setMenuOpenFor(null);
        } catch (err) {
            console.error("Error editing message:", err);
            alert("Không thể sửa tin nhắn");
        }
    };

    const handleDeleteMessage = async (message) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
            try {
                await api.delete(`/api/v1/chat/${message.id || message._id}`);
                setMessages(prev => prev.filter(msg => (msg.id !== message.id && msg._id !== message._id)));
                setMenuOpenFor(null);
            } catch (err) {
                console.error("Error deleting message:", err);
                alert("Không thể xóa tin nhắn");
            }
        }
    };

    const handleClose = () => {
        if (onCloseModal) onCloseModal();
        else if (onClose) onClose();
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8f9fa',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaArrowLeft 
                        size={16} 
                        style={{ cursor: 'pointer', color: '#65676b' }} 
                        onClick={onClose}
                    />
                    <img
                        src={avatarError ? DEFAULT_AVATAR : (friend.avatar_url || DEFAULT_AVATAR)}
                        alt=""
                        style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={() => setAvatarError(true)}
                    />
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{friend.full_name || friend.username}</div>
                        <div style={{ fontSize: '11px', color: '#2e7d32' }}>Đang hoạt động</div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                background: '#F8F9FA',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#65676b', fontSize: '13px', marginTop: '20px' }}>
                        Bắt đầu trò chuyện cùng {friend.full_name}
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        const isEditing = editingMessage && (editingMessage.id === msg.id || editingMessage._id === msg._id);
                        const showMenu = menuOpenFor === (msg.id || msg._id);
                        
                        return (
                            <div key={msg.id || msg._id} style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                position: 'relative'
                            }}>
                                {isEditing ? (
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '15px',
                                        padding: '8px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}>
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEditMessage(editingMessage)}
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                padding: '6px 10px',
                                                border: '1px solid #2e7d32',
                                                borderRadius: '20px',
                                                outline: 'none',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEditMessage(editingMessage)} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px' }}>Lưu</button>
                                            <button onClick={() => { setEditingMessage(null); setEditContent(''); }} style={{ background: '#ccc', border: 'none', padding: '4px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px' }}>Hủy</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                background: isMe ? '#2e7d32' : 'white',
                                                color: isMe ? 'white' : '#333',
                                                padding: '8px 12px',
                                                borderRadius: '15px',
                                                fontSize: '14px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                wordBreak: 'break-word'
                                            }}>
                                                {msg.content}
                                                {msg.is_edited && (
                                                    <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '6px' }}>(đã sửa)</span>
                                                )}
                                            </div>
                                            
                                            {/* Time stamp */}
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#888',
                                                marginTop: '4px',
                                                textAlign: isMe ? 'right' : 'left'
                                            }}>
                                                {formatTime(msg.created_at)}
                                            </div>
                                        </div>
                                        
                                        {/* Menu button for own messages */}
                                        {isMe && (
                                            <div style={{ position: 'absolute', top: '0', right: '-30px' }}>
                                                <button
                                                    onClick={() => setMenuOpenFor(showMenu ? null : (msg.id || msg._id))}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#888',
                                                        padding: '4px'
                                                    }}
                                                >
                                                    <FaEllipsisV size={12} />
                                                </button>
                                                
                                                {showMenu && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '20px',
                                                        right: '0',
                                                        background: 'white',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                        zIndex: 10,
                                                        minWidth: '100px'
                                                    }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingMessage(msg);
                                                                setEditContent(msg.content);
                                                                setMenuOpenFor(null);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'white',
                                                                cursor: 'pointer',
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                borderBottom: '1px solid #eee'
                                                            }}
                                                        >
                                                            <FaEdit size={12} /> Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'white',
                                                                cursor: 'pointer',
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                color: '#dc3545'
                                                            }}
                                                        >
                                                            <FaTrash size={12} /> Xóa
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '10px',
                borderTop: '1px solid #ddd',
                background: 'white',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Aa"
                        style={{
                            flex: 1,
                            padding: '8px 15px',
                            border: '1px solid #ddd',
                            borderRadius: '20px',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || loading}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: newMessage.trim() ? '#2e7d32' : '#ccc',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <FaPaperPlane size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;