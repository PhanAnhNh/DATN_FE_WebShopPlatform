import React, { useState, useEffect } from 'react';
import { FaTimes, FaFilter, FaSearch, FaUserPlus, FaComment } from 'react-icons/fa';
import FriendList from './FriendList';
import ChatWindow from './ChatWindow';
import StrangerSearch from './StrangerSearch';
import api from '../../api/api';
import socket from '../../utils/socket'; 

const ChatModal = ({ isOpen, onClose }) => {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friends, setFriends] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [onlyUnread, setOnlyUnread] = useState(false);
    const [activeTab, setActiveTab] = useState('friends'); // 'friends' hoặc 'search'
    const [showSearch, setShowSearch] = useState(false);

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
        } catch (err) { 
            console.error(err); 
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

    const fetchRecentChats = async () => {
        try {
            const res = await api.get('/api/v1/chat/recent');
            setRecentChats(res.data);
        } catch (err) { 
            console.error(err); 
        }
    };

    const handleSelectStranger = (stranger) => {
        setSelectedFriend(stranger);
        setActiveTab('friends'); // Chuyển về tab bạn bè sau khi chọn
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
                        {selectedFriend ? "Trò chuyện" : (activeTab === 'friends' ? "Tin nhắn" : "Tìm kiếm người dùng")}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {!selectedFriend && activeTab === 'friends' && (
                            <FaFilter 
                                size={14} 
                                style={{ cursor: 'pointer', color: onlyUnread ? '#ffeb3b' : 'white' }} 
                                onClick={() => setOnlyUnread(!onlyUnread)}
                            />
                        )}
                        {!selectedFriend && (
                            <FaSearch 
                                size={14} 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => {
                                    setActiveTab(activeTab === 'friends' ? 'search' : 'friends');
                                    setShowSearch(!showSearch);
                                }}
                            />
                        )}
                        <FaTimes style={{ cursor: 'pointer' }} onClick={onClose} />
                    </div>
                </div>

                {/* Tabs khi chưa chọn chat */}
                {!selectedFriend && (
                    <div style={{ 
                        display: 'flex', 
                        borderBottom: '1px solid #eee',
                        backgroundColor: '#f8f9fa',
                        flexShrink: 0
                    }}>
                        <button
                            onClick={() => setActiveTab('friends')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'friends' ? '#2e7d32' : '#666',
                                fontWeight: activeTab === 'friends' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'friends' ? '2px solid #2e7d32' : 'none',
                                fontSize: '14px'
                            }}
                        >
                            💬 Bạn bè
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'search' ? '#2e7d32' : '#666',
                                fontWeight: activeTab === 'search' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'search' ? '2px solid #2e7d32' : 'none',
                                fontSize: '14px'
                            }}
                        >
                            💬 Người lạ
                        </button>
                    </div>
                )}

                {/* Nội dung linh hoạt */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedFriend ? (
                        <ChatWindow 
                            friend={selectedFriend} 
                            onClose={() => {
                                setSelectedFriend(null);
                                fetchRecentChats(); // Refresh sau khi đóng
                            }} 
                            onCloseModal={onClose}
                        />
                    ) : (
                        <>
                            {activeTab === 'friends' ? (
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    <FriendList 
                                        friends={friends} 
                                        recentChats={recentChats}
                                        onSelectFriend={setSelectedFriend} 
                                        filterUnread={onlyUnread}
                                        onConversationDeleted={() => {
                                            fetchRecentChats();
                                            fetchFriends();
                                        }}
                                    />
                                </div>
                            ) : (
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    <StrangerSearch 
                                        onSelectStranger={handleSelectStranger}
                                        onStartChat={(user) => {
                                            setSelectedFriend(user);
                                            setActiveTab('friends');
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatModal;