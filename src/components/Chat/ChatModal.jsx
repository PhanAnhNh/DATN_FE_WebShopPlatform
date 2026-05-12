// components/Chat/ChatModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaFilter } from 'react-icons/fa';
import FriendList from './FriendList';
import ChatWindow from './ChatWindow';
import api from '../../api/api';
import socket from '../../socket'; // ✅ THÊM DÒNG NÀY

const ChatModal = ({ isOpen, onClose }) => {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friends, setFriends] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [onlyUnread, setOnlyUnread] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
            fetchRecentChats();
        }
    }, [isOpen]);

    useEffect(() => {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) return;

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit('join', {
            user_id: currentUserId
        });

        console.log("JOIN SOCKET:", currentUserId);

    }, []);

    useEffect(() => {
        if (!isOpen) return;
        
        const handleNewMessage = () => {
            fetchRecentChats(); // Refresh danh sách khi có tin nhắn mới
        };
        
        socket.on('new_message', handleNewMessage);
        socket.on('message_edited', handleNewMessage);
        socket.on('message_deleted', handleNewMessage);
        
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_edited', handleNewMessage);
            socket.off('message_deleted', handleNewMessage);
        };
    }, [isOpen]);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/api/v1/friends/list');
            setFriends(res.data);
        } catch (err) { console.error(err); }
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

    const fetchRecentChats = async () => {
        try {
            const res = await api.get('/api/v1/chat/recent');
            setRecentChats(res.data);
        } catch (err) { console.error(err); }
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
                width: '380px', 
                height: '500px', 
                background: 'white',
                borderRadius: '12px 12px 0 0', 
                boxShadow: '0 -5px 25px rgba(0,0,0,0.15)',
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #ddd'
            }}>
                {/* Header Modal - Cố định */}
                <div style={{ 
                    padding: '12px 16px', 
                    background: '#2e7d32', 
                    color: 'white', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0 
                }}>
                    <span style={{ fontWeight: 'bold' }}>
                        {selectedFriend ? "Trò chuyện" : "Tin nhắn"}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {!selectedFriend && (
                            <FaFilter 
                                size={14} 
                                style={{ cursor: 'pointer', color: onlyUnread ? '#ffeb3b' : 'white' }} 
                                onClick={() => setOnlyUnread(!onlyUnread)}
                            />
                        )}
                        <FaTimes style={{ cursor: 'pointer' }} onClick={onClose} />
                    </div>
                </div>

                {/* Nội dung linh hoạt */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedFriend ? (
                        <ChatWindow 
                            friend={selectedFriend} 
                            onClose={() => setSelectedFriend(null)} 
                            onCloseModal={onClose}
                        />
                    ) : (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <FriendList 
                                friends={friends} 
                                recentChats={recentChats}
                                onSelectFriend={setSelectedFriend} 
                                filterUnread={onlyUnread}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatModal;