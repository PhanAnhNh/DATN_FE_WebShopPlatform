// components/Chat/ChatWindow.jsx - Phiên bản có thể đóng modal
import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import api from '../../api/api';
import socket from '../../socket';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

const ChatWindow = ({ friend, onClose, onCloseModal }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
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
        if (directId) return directId;
        
        return null;
    };
    
    const currentUserId = getCurrentUserId();
    
    useEffect(() => {
        console.log("Current User ID:", currentUserId);
    }, []);

    // Socket connection
    useEffect(() => {
        if (!friend?.user_id || !currentUserId) {
            return;
        }

        console.log("Setting up socket connection...");
        
        if (!socket.connected) {
            socket.connect();
        }
        
        socket.emit('join', currentUserId);

        const handleNewMessage = (msg) => {
            if (msg.sender_id === friend.user_id || msg.receiver_id === friend.user_id) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_sent', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_sent');
        };
    }, [friend?.user_id, currentUserId]);

    // Fetch messages
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

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !friend?.user_id) return;

        if (!currentUserId) {
            alert("Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!");
            return;
        }

        const content = newMessage.trim();
        const tempId = 'temp-' + Date.now();

        const tempMsg = {
            id: tempId,
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
            await api.post('/api/v1/chat/send', {
                receiver_id: friend.user_id,
                content: content,
                message_type: "text"
            });

            if (socket.connected) {
                socket.emit('send_chat_message', {
                    sender_id: currentUserId,
                    receiver_id: friend.user_id,
                    content: content
                });
            }

        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
            alert(err.response?.data?.detail || "Không thể gửi tin nhắn. Vui lòng thử lại!");
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const getAvatarUrl = () => {
        if (avatarError) return DEFAULT_AVATAR;
        if (friend.avatar_url && friend.avatar_url.trim() !== '') {
            return friend.avatar_url;
        }
        return DEFAULT_AVATAR;
    };

    // Xử lý đóng: nếu có onCloseModal thì đóng modal, không thì chỉ quay lại danh sách
    const handleClose = () => {
        if (onCloseModal) {
            onCloseModal(); // Đóng toàn bộ modal
        } else if (onClose) {
            onClose(); // Chỉ quay lại danh sách bạn bè
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8f9fa'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src={getAvatarUrl()}
                        alt={friend.full_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={() => setAvatarError(true)}
                    />
                    <div>
                        <div style={{ fontWeight: '600' }}>{friend.full_name || friend.username}</div>
                        <div style={{ fontSize: '12px', color: '#2e7d32' }}>Đang hoạt động</div>
                    </div>
                </div>
                <FaTimes size={20} style={{ cursor: 'pointer', color: '#65676b' }} onClick={handleClose} />
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                background: '#f0f2f5',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#65676b', marginTop: '20px' }}>
                        Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <div
                                key={msg.id || index}
                                style={{
                                    display: 'flex',
                                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '70%',
                                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div style={{
                                    background: isMe ? '#2e7d32' : 'white',
                                    color: isMe ? 'white' : '#333',
                                    padding: '10px 14px',
                                    borderRadius: '18px',
                                    borderBottomRightRadius: isMe ? '4px' : '18px',
                                    borderBottomLeftRadius: isMe ? '18px' : '4px',
                                    fontSize: '15px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.content}
                                    <div style={{
                                        fontSize: '11px',
                                        opacity: 0.7,
                                        textAlign: isMe ? 'right' : 'left',
                                        marginTop: '4px'
                                    }}>
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Đang gửi...'}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #ddd',
                background: 'white'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Aa"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '30px',
                            outline: 'none',
                            fontSize: '15px',
                            backgroundColor: loading ? '#f5f5f5' : 'white'
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !newMessage.trim()}
                        style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: (newMessage.trim() && !loading) ? '#2e7d32' : '#ddd',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (newMessage.trim() && !loading) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;