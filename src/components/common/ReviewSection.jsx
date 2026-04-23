import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaUser, FaTrash, FaEdit, FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';
import api from '../../api/api';
import './ReviewSection.css';

const ReviewSection = ({ productId, productName, onReviewChange }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userReview, setUserReview] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
        images: []
    });
    const [selectedRatingFilter, setSelectedRatingFilter] = useState(null);
    const [pagination, setPagination] = useState({ skip: 0, limit: 10, total: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [message, setMessage] = useState(null);

    const token = localStorage.getItem('user_token');

    useEffect(() => {
        fetchReviews();
        fetchStats();
        if (token) {
            fetchUserReview();
        }
    }, [productId, selectedRatingFilter, pagination.skip]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let url = `/api/v1/reviews/product/${productId}?skip=${pagination.skip}&limit=${pagination.limit}`;
            if (selectedRatingFilter) {
                url += `&rating=${selectedRatingFilter}`;
            }
            const response = await api.get(url);
            setReviews(response.data.reviews || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.total || 0
            }));
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(`/api/v1/reviews/product/${productId}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUserReview = async () => {
        try {
            const response = await api.get(`/api/v1/reviews/product/${productId}/user-review`);
            if (response.data) {
                setUserReview(response.data);
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error fetching user review:', error);
            }
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!token) {
            setMessage({ type: 'error', text: 'Vui lòng đăng nhập để đánh giá sản phẩm' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        setSubmitting(true);
        try {
            if (editingReview) {
                await api.put(`/api/v1/reviews/${editingReview.id}`, formData);
                setMessage({ type: 'success', text: 'Cập nhật đánh giá thành công!' });
            } else {
                await api.post(`/api/v1/reviews/product/${productId}`, formData);
                setMessage({ type: 'success', text: 'Đánh giá thành công!' });
            }
            
            resetForm();
            fetchReviews();
            fetchStats();
            fetchUserReview();
            if (onReviewChange) onReviewChange();
            
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error submitting review:', error);
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
        
        try {
            await api.delete(`/api/v1/reviews/${reviewId}`);
            setMessage({ type: 'success', text: 'Xóa đánh giá thành công!' });
            fetchReviews();
            fetchStats();
            fetchUserReview();
            if (onReviewChange) onReviewChange();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting review:', error);
            setMessage({ type: 'error', text: 'Không thể xóa đánh giá' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setFormData({
            rating: review.rating,
            comment: review.comment || '',
            images: review.images || []
        });
        setShowForm(true);
    };

    const handleMarkHelpful = async (reviewId) => {
        try {
            await api.post(`/api/v1/reviews/${reviewId}/helpful`);
            fetchReviews();
        } catch (error) {
            console.error('Error marking helpful:', error);
        }
    };

    const resetForm = () => {
        setFormData({ rating: 5, comment: '', images: [] });
        setEditingReview(null);
        setShowForm(false);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        setUploadingImage(true);
        try {
            for (const file of files) {
                const formDataImg = new FormData();
                formDataImg.append('file', file);
                const response = await api.post('/api/v1/upload/image', formDataImg, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, response.data.url]
                }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setMessage({ type: 'error', text: 'Không thể tải ảnh lên' });
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const renderStars = (rating, interactive = false, onRatingChange = null) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    className={interactive ? 'star-interactive' : ''}
                    style={{
                        color: i <= rating ? '#ffc107' : '#e4e5e9',
                        cursor: interactive ? 'pointer' : 'default',
                        fontSize: interactive ? '24px' : '16px',
                        marginRight: '4px'
                    }}
                    onClick={() => interactive && onRatingChange && onRatingChange(i)}
                />
            );
        }
        return stars;
    };

    const renderRatingDistribution = () => {
        if (!stats) return null;
        const total = stats.total_reviews || 1;
        
        return [5, 4, 3, 2, 1].map(rating => {
            const count = stats.rating_distribution?.[rating] || 0;
            const percentage = (count / total) * 100;
            return (
                <div key={rating} className="rating-bar-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '30px' }}>{rating} sao</span>
                    <div style={{ flex: 1, height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: '#ffc107', borderRadius: '4px' }} />
                    </div>
                    <span style={{ width: '50px', fontSize: '12px', color: '#666' }}>{count}</span>
                </div>
            );
        });
    };

    return (
        <div className="review-section" style={{ marginTop: '40px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600' }}>
                Đánh giá sản phẩm ({stats?.total_reviews || 0})
            </h3>

            {message && (
                <div style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message.text}
                </div>
            )}

            {/* Rating Summary */}
            {stats && stats.total_reviews > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '32px',
                    background: '#f8f9fa',
                    padding: '24px',
                    borderRadius: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffc107' }}>
                            {stats.average_rating || 0}
                        </div>
                        <div style={{ margin: '8px 0' }}>
                            {renderStars(Math.round(stats.average_rating || 0))}
                        </div>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                            {stats.total_reviews} đánh giá
                        </div>
                    </div>
                    <div>
                        {renderRatingDistribution()}
                    </div>
                </div>
            )}

            {/* User Review Action */}
            {token && !userReview && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        padding: '12px 24px',
                        background: '#2e7d32',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '24px',
                        fontWeight: '500'
                    }}
                >
                    Viết đánh giá
                </button>
            )}

            {userReview && !showForm && (
                <div style={{
                    background: '#e8f5e9',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <strong>Đánh giá của bạn:</strong>
                        <div style={{ marginTop: '8px' }}>{renderStars(userReview.rating)}</div>
                        {userReview.comment && <p style={{ marginTop: '8px', color: '#555' }}>{userReview.comment}</p>}
                    </div>
                    <div>
                        <button onClick={() => handleEditReview(userReview)} style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                            <FaEdit /> Sửa
                        </button>
                        <button onClick={() => handleDeleteReview(userReview.id)} style={{ padding: '6px 12px', cursor: 'pointer', color: '#d32f2f' }}>
                            <FaTrash /> Xóa
                        </button>
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmitReview} style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0 }}>{editingReview ? 'Sửa đánh giá' : 'Viết đánh giá'}</h4>
                        <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
                            <FaTimes />
                        </button>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Đánh giá của bạn *</label>
                        <div>{renderStars(formData.rating, true, (rating) => setFormData({ ...formData, rating }))}</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nhận xét</label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            rows="4"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                resize: 'vertical',
                                fontSize: '14px'
                            }}
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Hình ảnh</label>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            {formData.images.map((img, index) => (
                                <div key={index} style={{ position: 'relative' }}>
                                    <img src={img} alt={`review ${index}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            background: '#d32f2f',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <label style={{
                                width: '80px',
                                height: '80px',
                                border: '2px dashed #ddd',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: '#fafafa'
                            }}>
                                {uploadingImage ? <FaSpinner className="spin" /> : <FaCamera size={24} color="#999" />}
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '10px 24px',
                                background: '#2e7d32',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.6 : 1
                            }}
                        >
                            {submitting ? 'Đang xử lý...' : (editingReview ? 'Cập nhật' : 'Gửi đánh giá')}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{
                                padding: '10px 24px',
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            )}

            {/* Rating Filter */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button
                    onClick={() => setSelectedRatingFilter(null)}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: selectedRatingFilter === null ? '2px solid #2e7d32' : '1px solid #ddd',
                        background: selectedRatingFilter === null ? '#e8f5e9' : 'white',
                        cursor: 'pointer'
                    }}
                >
                    Tất cả
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                    <button
                        key={rating}
                        onClick={() => setSelectedRatingFilter(rating === selectedRatingFilter ? null : rating)}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: selectedRatingFilter === rating ? '2px solid #2e7d32' : '1px solid #ddd',
                            background: selectedRatingFilter === rating ? '#e8f5e9' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        {rating} <FaStar size={12} color="#ffc107" />
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" />
                    <p>Đang tải đánh giá...</p>
                </div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#f8f9fa', borderRadius: '16px' }}>
                    <p style={{ color: '#999' }}>Chưa có đánh giá nào cho sản phẩm này</p>
                    {token && !userReview && !showForm && (
                        <button onClick={() => setShowForm(true)} style={{ marginTop: '16px', color: '#2e7d32', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Hãy là người đầu tiên đánh giá!
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.map(review => (
                        <div key={review.id} style={{
                            background: 'white',
                            border: '1px solid #f0f0f0',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: '#e0e0e0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {review.user_avatar ? (
                                            <img src={review.user_avatar} alt={review.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <FaUser size={24} color="#999" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{review.user_name}</div>
                                        <div style={{ marginBottom: '8px' }}>{renderStars(review.rating)}</div>
                                        {review.comment && <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '12px' }}>{review.comment}</p>}
                                        {review.images && review.images.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                {review.images.map((img, idx) => (
                                                    <img key={idx} src={img} alt={`review ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} />
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                                            <span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                            <button
                                                onClick={() => handleMarkHelpful(review.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <FaThumbsUp /> Hữu ích ({review.helpful_count || 0})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {token && review.user_id === userReview?.user_id && (
                                    <div>
                                        <button onClick={() => handleEditReview(review)} style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteReview(review.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.total > pagination.limit && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
                        disabled={pagination.skip === 0}
                        style={{ padding: '8px 16px', cursor: pagination.skip === 0 ? 'not-allowed' : 'pointer' }}
                    >
                        Trước
                    </button>
                    <span style={{ padding: '8px 16px' }}>
                        {Math.floor(pagination.skip / pagination.limit) + 1} / {Math.ceil(pagination.total / pagination.limit)}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
                        disabled={pagination.skip + pagination.limit >= pagination.total}
                        style={{ padding: '8px 16px', cursor: pagination.skip + pagination.limit >= pagination.total ? 'not-allowed' : 'pointer' }}
                    >
                        Sau
                    </button>
                </div>
            )}

            <style>{`
                .star-interactive:hover {
                    transform: scale(1.1);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #2e7d32;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ReviewSection;