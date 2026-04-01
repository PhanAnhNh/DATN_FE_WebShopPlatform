// components/Chat/ChatModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import FriendList from './FriendList';
import ChatWindow from './ChatWindow';
import api from '../../api/api';

const ChatModal = ({ isOpen, onClose }) => {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friends, setFriends] = useState([]);
    const [recentChats, setRecentChats] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
            fetchRecentChats();
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/api/v1/friends/list');
            setFriends(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách bạn bè:", err);
        }
    };

    const fetchRecentChats = async () => {
        try {
            const res = await api.get('/api/v1/chat/recent');
            setRecentChats(res.data);
        } catch (err) {
            console.error("Lỗi lấy recent chats:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                width: '900px', height: '600px', background: 'white',
                borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                display: 'flex', overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Nút đóng modal */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f0f2f5',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e4e6eb';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f2f5';
                    }}
                >
                    <FaTimes size={16} color="#65676b" />
                </button>

                {/* Danh sách bên trái */}
                <div style={{ width: '320px', borderRight: '1px solid #ddd', background: '#f8f9fa' }}>
                    <div style={{ padding: '16px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                        Tin nhắn
                    </div>
                    <FriendList 
                        friends={friends} 
                        recentChats={recentChats}
                        onSelectFriend={setSelectedFriend} 
                    />
                </div>

                {/* Khung chat bên phải */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {selectedFriend ? (
                        <ChatWindow 
                            friend={selectedFriend} 
                            onClose={() => setSelectedFriend(null)} 
                        />
                    ) : (
                        <div style={{ 
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#65676b', fontSize: '18px', textAlign: 'center', padding: '40px'
                        }}>
                            Chọn một người bạn để bắt đầu trò chuyện
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatModal;