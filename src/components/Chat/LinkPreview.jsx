// components/Chat/LinkPreview.jsx
import React, { useState, useEffect } from 'react';
import { FaImage, FaExternalLinkAlt } from 'react-icons/fa';

const LinkPreview = ({ url, content }) => {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Extract post ID from URL
        const postIdMatch = url.match(/\/post\/([a-f0-9]+)/i);
        if (postIdMatch) {
            fetchPostPreview(postIdMatch[1]);
        } else {
            setLoading(false);
        }
    }, [url]);

    const fetchPostPreview = async (postId) => {
        try {
            const api = (await import('../../api/api')).default;
            const response = await api.get(`/api/v1/posts/${postId}`);
            const post = response.data;
            
            setPreviewData({
                title: post.content?.substring(0, 100) || 'Bài viết',
                description: post.content?.substring(0, 200) || '',
                image: post.images?.[0] || null,
                author: post.author_name,
                url: url
            });
        } catch (error) {
            console.error('Error fetching post preview:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                background: '#f0f2f5',
                borderRadius: '12px',
                marginTop: '8px'
            }}>
                <div style={{ width: '60px', height: '60px', background: '#e4e6eb', borderRadius: '8px', animation: 'pulse 1s infinite' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ height: '14px', background: '#e4e6eb', borderRadius: '4px', marginBottom: '8px', width: '70%', animation: 'pulse 1s infinite' }} />
                    <div style={{ height: '12px', background: '#e4e6eb', borderRadius: '4px', width: '90%', animation: 'pulse 1s infinite' }} />
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 0.8; }
                    }
                `}</style>
            </div>
        );
    }

    if (!previewData) return null;

    return (
        <a 
            href={previewData.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
            onClick={(e) => {
                e.preventDefault();
                window.open(previewData.url, '_blank');
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e4e6eb',
                marginTop: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                maxWidth: '200px'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
                {previewData.image && (
                    <div style={{
                        height: '160px',
                        overflow: 'hidden',
                        background: '#f0f2f5'
                    }}>
                        <img 
                            src={previewData.image} 
                            alt="Preview"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                )}
                <div style={{ padding: '12px' }}>
                    <div style={{
                        fontSize: '11px',
                        color: '#65676b',
                        marginBottom: '4px',
                        textTransform: 'uppercase'
                    }}>
                        {previewData.author || 'Đặc Sản Quê Tôi'}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a2e',
                        marginBottom: '6px',
                        lineHeight: '1.3'
                    }}>
                        {previewData.title}
                    </div>
                    {previewData.description && (
                        <div style={{
                            fontSize: '12px',
                            color: '#65676b',
                            lineHeight: '1.4',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {previewData.description}
                        </div>
                    )}
                    <div style={{
                        fontSize: '11px',
                        color: '#8a8d91',
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <FaExternalLinkAlt size={10} />
                        {new URL(previewData.url).hostname}
                    </div>
                </div>
            </div>
        </a>
    );
};

export default LinkPreview;