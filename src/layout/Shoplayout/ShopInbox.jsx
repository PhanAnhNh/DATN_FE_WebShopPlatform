// src/pages/shop/ShopInbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaTimes, FaPaperPlane, FaArrowLeft, FaUserCircle, FaEllipsisV } from 'react-icons/fa';
import { shopApi } from '../../api/api';
import socket from '../../socket';

const ShopInbox = ({ isOpen, onClose }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Lấy đúng ID của SHOP
    const shopInfo = JSON.parse(localStorage.getItem('shop_info') || '{}');
    const shopData = JSON.parse(localStorage.getItem('shop_data') || '{}');
    const shopId = shopInfo._id || shopInfo.id || localStorage.getItem('shop_id');
    const selectedUserRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [actionMenuMessageId, setActionMenuMessageId] = useState(null);
    
    // Hàm format thời gian đúng múi giờ Việt Nam (UTC+7)
    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            // Chuyển từ UTC sang giờ Việt Nam (UTC+7)
            const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
            return vietnamTime.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        } catch (error) {
            return '';
        }
    };

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            const menuButton = event.target.closest('.menu-button');
            const menuContent = event.target.closest('.menu-content');
            
            if (actionMenuMessageId && !menuButton && !menuContent) {
                setActionMenuMessageId(null);
            }
        };
        
        if (actionMenuMessageId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [actionMenuMessageId]);

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.user_id);
        }
    }, [selectedUser]);
    
    useEffect(() => {
        if (isOpen) {
            fetchUnreadCount();
        }
    }, [isOpen]);
    
    const fetchUnreadCount = async () => {
        try {
            const response = await shopApi.get('/api/v1/chat/shop/unread-count');
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        if (!socket || !shopId) return;

        // Shop join vào room của chính mình với định dạng shop_{shopId}
        const handleConnect = () => {
            console.log('Shop socket connected, joining room:', `shop_${shopId}`);
            socket.emit('join', { shop_id: shopId });
        };
        
        if (socket.connected) {
            handleConnect();
        }
        socket.on('connect', handleConnect);
        
        // Handler nhận tin nhắn mới
        const handleNewMessage = (msg) => {
            console.log('📨 Shop received new message:', msg);
            
            // Xác định người gửi (user) - tin nhắn gửi đến shop
            const otherPartyId = msg.sender_id === shopId ? msg.receiver_id : msg.sender_id;
            
            // 1. Cập nhật số lượng tin nhắn chưa đọc
            if (msg.receiver_id === shopId && msg.is_read === false) {
                setUnreadCount(prev => prev + 1);
            }
            
            // 2. Cập nhật danh sách conversations
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.user_id === otherPartyId);
                const newConv = {
                    user_id: otherPartyId,
                    full_name: msg.sender_name || (msg.sender_id === shopId ? 'Cửa hàng' : 'Khách hàng'),
                    last_message: msg.content,
                    last_message_time: msg.created_at,
                    unread_count: (msg.receiver_id === shopId && selectedUserRef.current?.user_id !== otherPartyId) ? 1 : 0
                };
                
                if (existingIndex !== -1) {
                    // Cập nhật conversation cũ
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        last_message: msg.content,
                        last_message_time: msg.created_at,
                        unread_count: (msg.receiver_id === shopId && selectedUserRef.current?.user_id !== otherPartyId) 
                            ? updated[existingIndex].unread_count + 1 
                            : updated[existingIndex].unread_count
                    };
                    // Đưa lên đầu
                    const [moved] = updated.splice(existingIndex, 1);
                    return [moved, ...updated];
                } else {
                    // Thêm conversation mới
                    return [newConv, ...prev];
                }
            });
            
            // 3. Nếu đang chat với người gửi, thêm tin nhắn vào messages
            if (selectedUserRef.current && selectedUserRef.current.user_id === otherPartyId) {
                setMessages(prev => {
                    // Kiểm tra trùng lặp
                    const isDuplicate = prev.some(m => 
                        m.id === msg.id || 
                        (m.content === msg.content && 
                        Math.abs(new Date(m.created_at) - new Date(msg.created_at)) < 2000)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, msg];
                });
                // Nếu đang mở chat, đánh dấu đã đọc ngay
                markAsRead(otherPartyId);
            }
        };

        const handleMessageEdited = (data) => {
            setMessages(prev => prev.map(m => 
                m.id === data.id 
                    ? { ...m, content: data.content, is_edited: true }
                    : m
            ));
            // Cập nhật conversation list
            setConversations(prev => prev.map(conv => 
                conv.user_id === selectedUserRef.current?.user_id
                    ? { ...conv, last_message: data.content }
                    : conv
            ));
        };

        const handleMessageDeleted = (data) => {
            setMessages(prev => prev.filter(m => m.id !== data.id));
        };
        
        socket.on('new_message', handleNewMessage);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);
        
        return () => {
            socket.off('connect', handleConnect);
            socket.off('new_message', handleNewMessage);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
            if (socket.connected) {
                socket.emit('leave', { shop_id: shopId });
            }
        };
    }, [socket, shopId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await shopApi.get('/api/v1/chat/shop/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async (userId) => {
        setLoading(true);
        try {
            const response = await shopApi.get(`/api/v1/chat/shop/conversation/${userId}`);
            // Sắp xếp tin nhắn theo thời gian tăng dần (cũ lên đầu, mới xuống cuối)
            const sortedMessages = [...response.data].sort((a, b) => {
                return new Date(a.created_at) - new Date(b.created_at);
            });
            setMessages(sortedMessages);
            await markAsRead(userId);
            
            // Scroll xuống cuối sau khi messages được set
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            }, 100);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (userId) => {
        try {
            await shopApi.put(`/api/v1/chat/shop/mark-as-read/${userId}`);
            setConversations(prev => prev.map(conv => 
                conv.user_id === userId ? { ...conv, unread_count: 0 } : conv
            ));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    // CHỈ GỬI API, KHÔNG THÊM TIN NHẮN TẠM
    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;
        
        const content = newMessage.trim();
        const currentContent = content;
        
        // Xóa input ngay lập tức
        setNewMessage('');
        
        try {
            await shopApi.post('/api/v1/chat/shop/send', null, {
                params: {
                    receiver_id: selectedUser.user_id,
                    content: currentContent,
                    message_type: "text"
                }
            });
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
        }
    };

    const handleDeleteMessage = async (message) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
        
        try {
            await shopApi.delete(`/api/v1/chat/shop/${message.id}`);
            setMessages(prev => prev.filter(m => m.id !== message.id));
            setActionMenuMessageId(null);
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Không thể xóa tin nhắn");
        }
    };

    const handleStartEdit = (message) => {
        setEditingMessage(message);
        setEditContent(message.content);
        setActionMenuMessageId(null);
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim() || !editingMessage) return;
        
        try {
            await shopApi.put(`/api/v1/chat/shop/${editingMessage.id}`, null, {
                params: { content: editContent.trim() }
            });
            setMessages(prev => prev.map(m => 
                m.id === editingMessage.id 
                    ? { ...m, content: editContent.trim(), is_edited: true }
                    : m
            ));
            setEditingMessage(null);
            setEditContent('');
        } catch (error) {
            console.error("Error editing message:", error);
            alert("Không thể sửa tin nhắn");
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            right: '20px',
            bottom: '0',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'flex-end'
        }}>
            <div style={{
                width: '400px',
                height: '550px',
                background: 'white',
                borderRadius: '12px 12px 0 0',
                boxShadow: '0 -5px 25px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #ddd'
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    background: '#2e7d32',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {selectedUser && (
                            <FaArrowLeft 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => setSelectedUser(null)}
                            />
                        )}
                        <FaEnvelope />
                        <span style={{ fontWeight: 'bold' }}>
                            {selectedUser ? selectedUser.full_name : 'Hộp thư'}
                        </span>
                    </div>
                    <FaTimes style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!selectedUser ? (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {conversations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    Chưa có tin nhắn nào
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.user_id}
                                        onClick={() => setSelectedUser(conv)}
                                        style={{
                                            padding: '12px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0',
                                            background: conv.unread_count > 0 ? '#e8f5e9' : 'white',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        {conv.avatar_url ? (
                                            <img 
                                                src={conv.avatar_url} 
                                                alt={conv.full_name}
                                                style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FaUserCircle size={30} color="#999" />
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '600', fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{conv.full_name}</span>
                                                <span style={{ fontSize: '11px', color: '#999' }}>
                                                    {formatTime(conv.last_message_time)}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#65676b',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {conv.last_message || ''}
                                            </div>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <div style={{
                                                background: '#e41e3f',
                                                color: 'white',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                minWidth: '20px',
                                                height: '20px',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 6px'
                                            }}>
                                                {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            <div style={{
                                flex: 1,
                                padding: '12px',
                                overflowY: 'auto',
                                background: '#f0f2f5',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <div className="spinner" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#65676b', marginTop: '20px' }}>
                                        Bắt đầu trò chuyện với {selectedUser.full_name}
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMe = msg.sender_id === shopId;
                                        const isEditing = editingMessage?.id === msg.id;
                                        const showMenu = actionMenuMessageId === msg.id;
                                        
                                        return (
                                            <div key={msg.id || index} style={{
                                                display: 'flex',
                                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                width: '100%',
                                                position: 'relative'
                                            }}>
                                                <div style={{
                                                    maxWidth: '70%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                                }}>
                                                    {isEditing ? (
                                                        <div style={{
                                                            background: isMe ? '#2e7d32' : 'white',
                                                            padding: '8px 12px',
                                                            borderRadius: '15px',
                                                            display: 'flex',
                                                            gap: '8px',
                                                            alignItems: 'center'
                                                        }}>
                                                            <input
                                                                type="text"
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                                style={{
                                                                    background: 'white',
                                                                    border: 'none',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '8px',
                                                                    outline: 'none',
                                                                    fontSize: '14px',
                                                                    width: '200px'
                                                                }}
                                                                autoFocus
                                                            />
                                                            <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', color: isMe ? 'white' : '#2e7d32', cursor: 'pointer', fontSize: '16px' }}>💾</button>
                                                            <button onClick={() => setEditingMessage(null)} style={{ background: 'none', border: 'none', color: isMe ? 'white' : '#999', cursor: 'pointer', fontSize: '16px' }}>✖</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{
                                                                background: isMe ? '#2e7d32' : 'white',
                                                                color: isMe ? 'white' : '#333',
                                                                padding: '8px 12px',
                                                                borderRadius: '15px',
                                                                fontSize: '14px',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                                wordBreak: 'break-word',
                                                                position: 'relative'
                                                            }}>
                                                                {msg.content}
                                                                {msg.is_edited && (
                                                                    <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '8px' }}>(đã sửa)</span>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Nút 3 chấm - chỉ hiển thị cho tin nhắn của shop */}
                                                            {isMe && (
                                                                <div style={{ position: 'relative', marginTop: '4px', textAlign: 'right' }}>
                                                                    <button
                                                                        className="menu-button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActionMenuMessageId(showMenu ? null : msg.id);
                                                                        }}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            color: '#999',
                                                                            fontSize: '16px',
                                                                            fontWeight: 'bold',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '12px',
                                                                            transition: 'background 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                    >
                                                                        ⋯
                                                                    </button>
                                                                    
                                                                    {/* Menu dropdown */}
                                                                    {showMenu && (
                                                                        <div 
                                                                            className="menu-content"
                                                                            style={{
                                                                                position: 'absolute',
                                                                                bottom: '100%',
                                                                                right: 0,
                                                                                marginBottom: '4px',
                                                                                background: 'white',
                                                                                borderRadius: '12px',
                                                                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                                                                overflow: 'hidden',
                                                                                zIndex: 100,
                                                                                minWidth: '120px'
                                                                            }}
                                                                        >
                                                                            <button
                                                                                onClick={() => handleStartEdit(msg)}
                                                                                style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '8px',
                                                                                    width: '100%',
                                                                                    padding: '10px 16px',
                                                                                    border: 'none',
                                                                                    background: 'white',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '14px',
                                                                                    color: '#333',
                                                                                    transition: 'background 0.2s'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                            >
                                                                                ✏️ Sửa
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteMessage(msg)}
                                                                                style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '8px',
                                                                                    width: '100%',
                                                                                    padding: '10px 16px',
                                                                                    border: 'none',
                                                                                    background: 'white',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '14px',
                                                                                    color: '#e41e3f',
                                                                                    transition: 'background 0.2s'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                            >
                                                                                🗑️ Xóa
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#999',
                                                        marginTop: '4px'
                                                    }}>
                                                        {formatTime(msg.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

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
                                        placeholder="Nhập tin nhắn..."
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
                        </>
                    )}
                </div>
            </div>
            <style>{`
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #2e7d32;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ShopInbox;