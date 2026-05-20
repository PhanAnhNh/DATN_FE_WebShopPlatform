// src/pages/Groups.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../../layout/layoutUser/Layout';
import GroupCard from '../../components/groups/GroupCard';
import CreateGroupModal from '../../components/groups/CreateGroupModal';
import groupService from '../../api/groupApi';
import Toast from '../../components/common/Toast';

function Groups() {
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
            setMyGroups(myRes);
            setPublicGroups(publicRes);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (groupId) => {
        try {
            await groupService.joinGroup(groupId);
            showToast('Đã tham gia nhóm');
            loadGroups();
        } catch (error) {
            showToast('Không thể tham gia nhóm', 'error');
        }
    };

    const handleLeave = async (groupId) => {
        if (!window.confirm('Bạn có chắc chắn muốn rời nhóm không?')) return;
        try {
            await groupService.leaveGroup(groupId);
            showToast('Đã rời nhóm');
            loadGroups();
        } catch (error) {
            showToast('Không thể rời nhóm', 'error');
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h1 style={{ margin: 0 }}>Nhóm</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '10px 20px',
                            background: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ➕ Tạo nhóm mới
                    </button>
                </div>
                
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    borderBottom: '1px solid #e4e6eb'
                }}>
                    <button
                        onClick={() => setActiveTab('my')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'my' ? '600' : '400',
                            color: activeTab === 'my' ? '#2e7d32' : '#65676B',
                            borderBottom: activeTab === 'my' ? '3px solid #2e7d32' : 'none'
                        }}
                    >
                        Nhóm của tôi
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'public' ? '600' : '400',
                            color: activeTab === 'public' ? '#2e7d32' : '#65676B',
                            borderBottom: activeTab === 'public' ? '3px solid #2e7d32' : 'none'
                        }}
                    >
                        Nhóm công khai
                    </button>
                </div>
                
                {/* Groups Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>Đang tải...</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px'
                    }}>
                        {(activeTab === 'my' ? myGroups : publicGroups).map(group => (
                            <GroupCard
                                key={group._id}
                                group={group}
                                currentUserId={JSON.parse(localStorage.getItem('user_data') || '{}')._id}
                                onJoin={handleJoin}
                                onLeave={handleLeave}
                            />
                        ))}
                    </div>
                )}
                
                {activeTab === 'my' && myGroups.length === 0 && !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px',
                        background: 'white',
                        borderRadius: '12px'
                    }}>
                        <span style={{ fontSize: '48px' }}>👥</span>
                        <h3>Bạn chưa tham gia nhóm nào</h3>
                        <p>Hãy tạo nhóm mới hoặc khám phá các nhóm công khai</p>
                        <button
                            onClick={() => setActiveTab('public')}
                            style={{
                                padding: '10px 24px',
                                background: '#2e7d32',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginTop: '12px'
                            }}
                        >
                            Khám phá nhóm
                        </button>
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