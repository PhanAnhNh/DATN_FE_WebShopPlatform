// pages/user/PostDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // Cài đặt: npm install react-helmet-async
import api from '../../api/api';
import Layout from '../../layout/layoutUser/Layout';

const PostDetailPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/api/v1/posts/${postId}`);
            setPost(res.data);
        } catch (err) {
            console.error("Không tìm thấy bài viết:", err);
        } finally {
            setLoading(false);
        }
    };

    // Tạo URL đầy đủ
    const siteUrl = 'https://www.dacsanvietplatform.shop';
    const postUrl = `${siteUrl}/post/${postId}`;
    const postImage = post?.images?.[0] || `${siteUrl}/og-default.jpg`;
    const postTitle = post?.content?.substring(0, 60) || 'Bài viết từ Đặc Sản Quê Tôi';
    const postDescription = post?.content?.substring(0, 150) || 'Chia sẻ bài viết từ Đặc Sản Quê Tôi';

    if (loading) return <Layout><div>Đang tải...</div></Layout>;
    if (!post) return <Layout><div>Không tìm thấy bài viết</div></Layout>;

    return (
        <>
            {/* Open Graph Meta Tags cho Facebook, Zalo, Messenger */}
            <Helmet>
                <meta property="og:title" content={postTitle} />
                <meta property="og:description" content={postDescription} />
                <meta property="og:image" content={postImage} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:url" content={postUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="Đặc Sản Quê Tôi" />
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={postTitle} />
                <meta name="twitter:description" content={postDescription} />
                <meta name="twitter:image" content={postImage} />
                
                {/* Basic meta */}
                <meta name="description" content={postDescription} />
                <title>{postTitle} | Đặc Sản Quê Tôi</title>
            </Helmet>
            
            <Layout>
                <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            marginBottom: '16px', 
                            cursor: 'pointer',
                            padding: '8px 16px',
                            background: '#f0f2f5',
                            border: 'none',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ← Quay lại
                    </button>
                    
                    <div style={{ 
                        background: 'white', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
                    }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '50%', 
                                background: '#ddd', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {post.author_avatar ? (
                                    <img src={post.author_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : '👤'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{post.author_name}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    {new Date(post.created_at).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        </div>
                        
                        <p style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                            {post.content}
                        </p>
                        
                        {post.tags?.length > 0 && (
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {post.tags.map(tag => (
                                    <span key={tag} style={{ color: '#2e7d32', fontSize: '13px' }}>#{tag}</span>
                                ))}
                            </div>
                        )}
                        
                        {post.location && (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                📍 {post.location}
                            </div>
                        )}
                        
                        {post.images?.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={img} 
                                alt={`post_image_${idx}`} 
                                style={{ 
                                    width: '100%', 
                                    borderRadius: '8px', 
                                    marginTop: '12px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => window.open(img, '_blank')}
                            />
                        ))}
                        
                        <div style={{ 
                            marginTop: '16px', 
                            paddingTop: '12px', 
                            borderTop: '1px solid #eee',
                            display: 'flex',
                            gap: '24px',
                            fontSize: '14px',
                            color: '#65676b'
                        }}>
                            <span>👍 {post.stats?.like_count || 0} thích</span>
                            <span>💬 {post.stats?.comment_count || 0} bình luận</span>
                            <span>↗️ {post.stats?.share_count || 0} chia sẻ</span>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
};

export default PostDetailPage;