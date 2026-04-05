// components/share/SharedPostCard.jsx
import React from 'react';

const SharedPostCard = ({ sharedPost, onClick }) => {
    if (!sharedPost) return null;
    
    return (
        <div 
            onClick={onClick}
            style={{
                background: '#f0f2f5',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '12px',
                border: '1px solid #e4e6eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e4e6eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f0f2f5'}
        >
            {/* Header - thông tin người đăng bài gốc */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <img 
                    src={sharedPost.author_avatar || `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${sharedPost.author_name?.[0] || 'U'}`}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    alt=""
                    onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${sharedPost.author_name?.[0] || 'U'}`;
                    }}
                />
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>
                        {sharedPost.author_name || 'Người dùng'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#65676b' }}>
                        {sharedPost.created_at ? new Date(sharedPost.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'}
                    </div>
                </div>
            </div>

            {/* Nội dung bài gốc */}
            {sharedPost.content && (
                <div style={{ 
                    fontSize: '13px', 
                    color: '#1a1a2e', 
                    lineHeight: '1.4',
                    marginBottom: '10px'
                }}>
                    {sharedPost.content.length > 200 
                        ? `${sharedPost.content.substring(0, 200)}...` 
                        : sharedPost.content}
                </div>
            )}

            {/* Hình ảnh bài gốc */}
            {sharedPost.images && sharedPost.images.length > 0 && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: sharedPost.images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                    gap: '4px',
                    marginBottom: '8px'
                }}>
                    {sharedPost.images.slice(0, 4).map((img, idx) => (
                        <img 
                            key={idx}
                            src={img} 
                            alt=""
                            style={{ 
                                width: '100%', 
                                height: '120px', 
                                objectFit: 'cover', 
                                borderRadius: '8px' 
                            }}
                        />
                    ))}
                    {sharedPost.images.length > 4 && (
                        <div style={{
                            position: 'relative',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            +{sharedPost.images.length - 4}
                        </div>
                    )}
                </div>
            )}

            {/* Link bài viết gốc */}
            <div style={{ 
                fontSize: '11px', 
                color: '#65676b', 
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderTop: '1px solid #e4e6eb',
                paddingTop: '8px'
            }}>
                <span>↗️</span> Xem bài viết gốc
            </div>
        </div>
    );
};

export default SharedPostCard;