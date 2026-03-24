// components/common/FriendButton.jsx
import { useState, useEffect } from 'react';
import api from '../../api/api';

function FriendButton({ userId, currentUserId, onStatusChange }) {
    const [status, setStatus] = useState('loading');
    const [requestId, setRequestId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Định nghĩa buttonStyles ở đầu component
    const buttonStyles = {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s'
    };

    // components/common/FriendButton.jsx
// Thêm console.log để debug
useEffect(() => {
    console.log('FriendButton - userId:', userId);
    console.log('FriendButton - currentUserId:', currentUserId);
    if (userId && currentUserId) {
        checkFriendship();
    } else {
        console.log('Missing userId or currentUserId');
    }
}, [userId, currentUserId]);

const checkFriendship = async () => {
    try {
        console.log(`Calling API: /api/v1/friends/check/${userId}`);
        const res = await api.get(`/api/v1/friends/check/${userId}`);
        console.log('API response:', res.data);
        setStatus(res.data.status);
        if (res.data.request_id) {
            setRequestId(res.data.request_id);
        }
    } catch (error) {
        console.error('Lỗi kiểm tra trạng thái:', error);
        console.error('Error details:', error.response?.status, error.response?.data);
        setStatus('error');
    }
};

    const sendRequest = async () => {
        setIsLoading(true);
        try {
            await api.post('/api/v1/friends/request', { friend_id: userId });
            setStatus('request_sent');
            if (onStatusChange) onStatusChange('request_sent');
            alert('Đã gửi lời mời kết bạn!');
        } catch (error) {
            alert(error.response?.data?.detail || 'Không thể gửi lời mời');
        } finally {
            setIsLoading(false);
        }
    };

    const acceptRequest = async () => {
        setIsLoading(true);
        try {
            await api.put(`/api/v1/friends/request/${requestId}/accept`);
            setStatus('friends');
            if (onStatusChange) onStatusChange('friends');
            alert('Đã chấp nhận lời mời kết bạn!');
        } catch (error) {
            alert('Không thể chấp nhận lời mời');
        } finally {
            setIsLoading(false);
        }
    };

    const rejectRequest = async () => {
        setIsLoading(true);
        try {
            await api.put(`/api/v1/friends/request/${requestId}/reject`);
            setStatus('not_friends');
            if (onStatusChange) onStatusChange('not_friends');
            alert('Đã từ chối lời mời');
        } catch (error) {
            alert('Không thể từ chối lời mời');
        } finally {
            setIsLoading(false);
        }
    };

    const unfriend = async () => {
        if (window.confirm('Bạn có chắc muốn hủy kết bạn với người này không?')) {
            setIsLoading(true);
            try {
                await api.delete(`/api/v1/friends/${userId}`);
                setStatus('not_friends');
                if (onStatusChange) onStatusChange('not_friends');
                alert('Đã hủy kết bạn');
            } catch (error) {
                console.error('Lỗi hủy kết bạn:', error);
                alert('Không thể hủy kết bạn. Vui lòng thử lại!');
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (status === 'loading') {
        return (
            <button disabled style={buttonStyles}>
                Đang tải...
            </button>
        );
    }

    switch (status) {
        case 'friends':
            return (
                <button 
                    onClick={unfriend}
                    disabled={isLoading}
                    style={{ ...buttonStyles, background: '#e4e6eb', color: '#050505' }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#f0f2f5';
                        e.target.textContent = '❌ Hủy kết bạn';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#e4e6eb';
                        e.target.textContent = '✅ Bạn bè';
                    }}
                >
                    ✅ Bạn bè
                </button>
            );
        
        case 'request_sent':
            return (
                <button 
                    disabled
                    style={{ ...buttonStyles, background: '#e4e6eb', color: '#65676B' }}
                >
                    ⏳ Đã gửi lời mời
                </button>
            );
        
        case 'request_received':
            return (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={acceptRequest}
                        disabled={isLoading}
                        style={{ ...buttonStyles, background: '#0866ff', color: 'white' }}
                    >
                        Chấp nhận
                    </button>
                    <button 
                        onClick={rejectRequest}
                        disabled={isLoading}
                        style={{ ...buttonStyles, background: '#e4e6eb', color: '#65676B' }}
                    >
                        Từ chối
                    </button>
                </div>
            );
        
        case 'not_friends':
            return (
                <button 
                    onClick={sendRequest}
                    disabled={isLoading}
                    style={{ ...buttonStyles, background: '#0866ff', color: 'white' }}
                >
                    + Kết bạn
                </button>
            );
        
        case 'blocked_by_you':
            return (
                <button 
                    disabled
                    style={{ ...buttonStyles, background: '#dc3545', color: 'white' }}
                >
                    🚫 Đã chặn
                </button>
            );
        
        case 'blocked_by_them':
            return (
                <button 
                    disabled
                    style={{ ...buttonStyles, background: '#e4e6eb', color: '#65676B' }}
                >
                    🔒 Đã bị chặn
                </button>
            );
        
        default:
            return null;
    }
}

export default FriendButton;