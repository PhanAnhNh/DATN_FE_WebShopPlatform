// components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaArrowLeft } from 'react-icons/fa';
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
        return directId || null;
    };
    
    const currentUserId = getCurrentUserId();
    
    useEffect(() => {
        if (!friend?.user_id || !currentUserId) return;
        if (!socket.connected) socket.connect();
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
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        } finally {
            setLoading(false);
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
            overflow: 'hidden' // Quan trọng: Ngăn toàn bộ ChatWindow phình to
        }}>
            {/* Header - Giữ nguyên không cho co lại */}
            <div style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8f9fa',
                flexShrink: 0 // Ngăn Header bị đẩy mất
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaArrowLeft 
            size={16} 
            style={{ cursor: 'pointer', color: '#65676b' }} 
            onClick={onClose} // onClose ở đây sẽ gọi setSelectedFriend(null) từ cha
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

            {/* Messages Area - Vùng tự cuộn */}
            <div style={{
                flex: 1, // Chiếm toàn bộ diện tích còn lại
                padding: '12px',
                overflowY: 'auto', // Tự tạo thanh cuộn khi tin nhắn dài
                background: '#f0f2f5',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#65676b', fontSize: '13px', marginTop: '20px' }}>
                        Bắt đầu trò chuyện cùng {friend.full_name}
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <div key={msg.id || index} style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}>
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
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Luôn nằm ở đáy */}
            <div style={{
                padding: '10px',
                borderTop: '1px solid #ddd',
                background: 'white',
                flexShrink: 0 // Ngăn Input bị biến mất
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
                        disabled={!newMessage.trim()}
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