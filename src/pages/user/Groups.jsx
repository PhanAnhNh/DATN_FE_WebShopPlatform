import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/layoutUser/Layout';
import CreateGroupModal from '../../components/groups/CreateGroupModal';
import groupService from '../../api/groupApi';
import Toast from '../../components/common/Toast';

function Groups() {
    const navigate = useNavigate();
    const [myGroups, setMyGroups] = useState([]);
    const [publicGroups, setPublicGroups] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('my');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        loadGroups();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const loadGroups = async () => {
        setLoading(true);
        try {
            const [myRes, publicRes] = await Promise.all([
                groupService.getMyGroups(),
                groupService.getPublicGroups(20)
            ]);
            console.log('My groups:', myRes);
            console.log('Public groups:', publicRes);
            setMyGroups(myRes);
            setPublicGroups(publicRes);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (groupId, e) => {
        e.stopPropagation();
        try {
            await groupService.joinGroup(groupId);
            showToast('Đã tham gia nhóm');
            loadGroups();
        } catch (error) {
            showToast('Không thể tham gia nhóm', 'error');
        }
    };

    const handleLeave = async (groupId, e) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn rời nhóm không?')) return;
        try {
            await groupService.leaveGroup(groupId);
            showToast('Đã rời nhóm');
            loadGroups();
        } catch (error) {
            showToast('Không thể rời nhóm', 'error');
        }
    };

    const handleGroupClick = (groupId) => {
        navigate(`/groups/${groupId}`);
    };

    const getAvatarUrl = (group) => {
        // Kiểm tra nhiều trường có thể chứa ảnh đại diện
        return group.avatar_url || group.avatar || group.avatarUrl || group.avatarURL || null;
    };

    const GroupListItem = ({ group, isMyGroup }) => {
        const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
        const isMember = group.members?.some(m => m.userId === currentUser._id);
        const avatarUrl = getAvatarUrl(group);
        
        return (
            <div 
                onClick={() => handleGroupClick(group._id)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    border: '1px solid #e4e6eb'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: '#e8f5e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        overflow: 'hidden',
                        flexShrink: 0
                    }}>
                        {avatarUrl ? (
                            <img 
                                src={avatarUrl} 
                                alt={group.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    console.log('Failed to load avatar:', avatarUrl);
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '👥';
                                    e.target.parentElement.style.fontSize = '28px';
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '28px' }}>👥</span>
                        )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <h3 style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            fontWeight: 600,
                            color: '#1a1a1a',
                            marginBottom: '4px'
                        }}>
                            {group.name}
                        </h3>
                        <div style={{ 
                            display: 'flex', 
                            gap: '16px', 
                            fontSize: '13px', 
                            color: '#65676B',
                            marginBottom: '4px',
                            flexWrap: 'wrap'
                        }}>
                            <span>👥 {group.members?.length || group.member_count || 0} thành viên</span>
                            {group.privacy === 'public' ? (
                                <span>🌍 Công khai</span>
                            ) : (
                                <span>🔒 Riêng tư</span>
                            )}
                            {group.category && (
                                <span>📁 {group.category}</span>
                            )}
                        </div>
                        {group.description && (
                            <p style={{ 
                                margin: 0, 
                                fontSize: '13px', 
                                color: '#65676B',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical'
                            }}>
                                {group.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div onClick={(e) => e.stopPropagation()}>
                    {isMyGroup ? (
                        <button
                            onClick={(e) => handleLeave(group._id, e)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f0f2f5',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#e41e3f',
                                fontWeight: 500,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f0f2f5';
                            }}
                        >
                            Rời nhóm
                        </button>
                    ) : (
                        !isMember && (
                            <button
                                onClick={(e) => handleJoin(group._id, e)}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#2e7d32',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1b5e20';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2e7d32';
                                }}
                            >
                                Tham gia
                            </button>
                        )
                    )}
                    
                    {!isMyGroup && isMember && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGroupClick(group._id);
                            }}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: '#e8f5e9',
                                border: '1px solid #2e7d32',
                                borderRadius: '8px',
                                color: '#2e7d32',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#c8e6c9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#e8f5e9';
                            }}
                        >
                            Xem nhóm
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', color: '#1a1a1a' }}>Nhóm</h1>
                        <p style={{ margin: '8px 0 0', color: '#65676B', fontSize: '14px' }}>
                            Kết nối và chia sẻ với cộng đồng của bạn
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '10px 24px',
                            background: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1b5e20';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2e7d32';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>➕</span>
                        Tạo nhóm mới
                    </button>
                </div>
                
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    borderBottom: '2px solid #e4e6eb',
                    paddingBottom: '0'
                }}>
                    <button
                        onClick={() => setActiveTab('my')}
                        style={{
                            padding: '12px 0',
                            paddingRight: '16px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'my' ? '600' : '500',
                            color: activeTab === 'my' ? '#2e7d32' : '#65676B',
                            borderBottom: activeTab === 'my' ? '2px solid #2e7d32' : 'none',
                            marginBottom: '-2px',
                            fontSize: '15px',
                            transition: 'all 0.2s'
                        }}
                    >
                        Nhóm của tôi
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            backgroundColor: activeTab === 'my' ? '#e8f5e9' : '#f0f2f5',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500
                        }}>
                            {myGroups.length}
                        </span>
                    </button>
                    
                </div>
                
                {/* Groups List */}
                {loading ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '80px 20px',
                        backgroundColor: 'white',
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #e4e6eb',
                            borderTop: '3px solid #2e7d32',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <p style={{ color: '#65676B' }}>Đang tải danh sách nhóm...</p>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <div>
                        {(activeTab === 'my' ? myGroups : publicGroups).map(group => (
                            <GroupListItem
                                key={group._id}
                                group={group}
                                isMyGroup={activeTab === 'my'}
                            />
                        ))}
                    </div>
                )}
                
                {activeTab === 'my' && myGroups.length === 0 && !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e4e6eb'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
                        <h3 style={{ margin: '0 0 8px', color: '#1a1a1a' }}>Bạn chưa tham gia nhóm nào</h3>
                        <p style={{ margin: '0 0 20px', color: '#65676B' }}>
                            Hãy tạo nhóm mới hoặc khám phá các nhóm công khai
                        </p>
                        <button
                            onClick={() => setActiveTab('public')}
                            style={{
                                padding: '10px 28px',
                                background: '#2e7d32',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1b5e20';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2e7d32';
                            }}
                        >
                            Khám phá nhóm
                        </button>
                    </div>
                )}

                {activeTab === 'public' && publicGroups.length === 0 && !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e4e6eb'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                        <h3 style={{ margin: 0, color: '#1a1a1a' }}>Không tìm thấy nhóm nào</h3>
                        <p style={{ color: '#65676B' }}>Hãy tạo nhóm mới để bắt đầu</p>
                    </div>
                )}
            </div>
            
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadGroups();
                        setShowCreateModal(false);
                    }}
                />
            )}
            
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: 'success' })}
                />
            )}
        </Layout>
    );
}

export default Groups;