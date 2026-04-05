// pages/user/PostDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import Layout from '../../components/layout/Layout';

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

    if (loading) return <Layout><div>Đang tải...</div></Layout>;
    if (!post) return <Layout><div>Không tìm thấy bài viết</div></Layout>;

    return (
        <Layout>
            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ marginBottom: '16px', cursor: 'pointer' }}>
                    ← Quay lại
                </button>
                <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {post.author_avatar ? <img src={post.author_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{post.author_name}</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>{new Date(post.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{post.content}</p>
                    {post.images?.map((img, idx) => (
                        <img key={idx} src={img} alt="" style={{ width: '100%', borderRadius: '8px', marginTop: '12px' }} />
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default PostDetailPage;