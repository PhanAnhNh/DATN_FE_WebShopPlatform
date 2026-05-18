// src/components/groups/GroupCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function GroupCard({ group, currentUserId, onJoin, onLeave }) {
    const navigate = useNavigate();
    
    const isMember = group.user_role === 'admin' || group.user_role === 'member';
    const isPending = group.user_role === 'pending';
    
    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
        }}
        onClick={() => navigate(`/groups/${group._id}`)}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }}
        >
            {/* Ảnh bìa */}
            <div style={{
                height: '120px',
                background: group.cover_url ? `url(${group.cover_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
            }}>
                {/* Ảnh đại diện */}
                <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '16px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '3px solid white',
                    background: group.avatar_url ? `url(${group.avatar_url})` : '#ccc',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                }}>
                    {!group.avatar_url && '👥'}
                </div>
            </div>
            
            <div style={{ padding: '40px 16px 16px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{group.name}</h3>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#65676B', lineHeight: '1.4' }}>
                    {group.description?.substring(0, 100)}{group.description?.length > 100 ? '...' : ''}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#65676B' }}>
                        👥 {group.member_count} thành viên
                    </span>
                    <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: group.privacy === 'public' ? '#e8f5e9' : '#fff3e0',
                        color: group.privacy === 'public' ? '#2e7d32' : '#e65100'
                    }}>
                        {group.privacy === 'public' ? '🌍 Công khai' : '🔒 Riêng tư'}
                    </span>
                </div>
                
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isMember) {
                            onLeave?.(group._id);
                        } else if (!isPending) {
                            onJoin?.(group._id);
                        }
                    }}
                    disabled={isPending}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isMember ? '#e4e6eb' : (isPending ? '#f5f5f5' : '#2e7d32'),
                        color: isMember ? '#050505' : (isPending ? '#888' : 'white'),
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {isMember ? '✅ Đã tham gia' : (isPending ? '⏳ Đang chờ duyệt' : '➕ Tham gia nhóm')}
                </button>
            </div>
        </div>
    );
}

export default GroupCard;