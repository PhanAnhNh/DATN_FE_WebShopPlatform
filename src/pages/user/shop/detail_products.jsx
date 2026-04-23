import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import api from "../../../api/api";
import { 
  FaStar, 
  FaStarHalfAlt,
  FaRegStar,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaShoppingCart,
  FaBox,
  FaTag,
  FaStore,
  FaQrcode,
  FaDownload,
  FaShareAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaTruck,
  FaShieldAlt,
  FaClock,
  FaUser,
  FaHeart,
  FaRegHeart,
  FaTimes,
  FaCertificate,
  FaCheckCircle,
  FaLeaf,
  FaIndustry,
  FaShippingFast,
  FaWarehouse,
  FaCogs,
  FaThumbsUp,
  FaEdit,
  FaTrash,
  FaCamera,
  FaSpinner
} from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";

const ProductDetailPage = () => {
    const { product_id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [shop, setShop] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [traceability, setTraceability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [activeTab, setActiveTab] = useState("description"); 
    const [addingToCart, setAddingToCart] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    // Review states
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [userReview, setUserReview] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [reviewFormData, setReviewFormData] = useState({
        rating: 5,
        comment: '',
        images: []
    });
    const [selectedRatingFilter, setSelectedRatingFilter] = useState(null);
    const [reviewPagination, setReviewPagination] = useState({ skip: 0, limit: 10, total: 0 });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);

    const token = localStorage.getItem('user_token');

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToast({ show: true, message, type, id });
        setTimeout(() => {
            setToast(prev => {
                if (prev.id === id) {
                    return { show: false, message: '', type: 'success', id: null };
                }
                return prev;
            });
        }, 2500);
    };
    
    useEffect(() => {
        if (product_id && product_id !== 'undefined') {
            fetchProductDetail();
            fetchTraceability();
            checkFavoriteStatus();
            getFavoriteCount();
            fetchReviews();
            fetchReviewStats();
            if (token) {
                fetchUserReview();
            }
        }
    }, [product_id]);

    useEffect(() => {
        fetchReviews();
    }, [selectedRatingFilter, reviewPagination.skip]);

    const fetchTraceability = async () => {
        if (!product_id || product_id === 'undefined') {
            console.log("Invalid product_id for traceability:", product_id);
            setTraceability(null);
            return;
        }
        
        try {
            console.log("Fetching traceability for product_id:", product_id);
            const response = await api.get(`/api/v1/traceability/products/${product_id}`);
            console.log("Traceability response:", response.data);
            
            const data = response.data;
            const hasTraceability = data.has_traceability === true || 
                                   (data.trace_events && Array.isArray(data.trace_events) && data.trace_events.length > 0);
            
            setTraceability({
                ...data,
                has_traceability: hasTraceability,
                trace_events: data.trace_events || []
            });
        } catch (error) {
            console.error("Error fetching traceability:", error);
            setTraceability(null);
        }
    };

    const fetchProductDetail = async () => {
        setLoading(true);
        try {
            const productRes = await api.get(`/api/v1/products/${product_id}`);
            console.log("Product data:", productRes.data);
            
            setProduct(productRes.data);
            
            if (productRes.data.shop_id) {
                const shopRes = await api.get(`/api/v1/shops/${productRes.data.shop_id}`);
                setShop(shopRes.data);
                
                try {
                    const shopProductsRes = await api.get(`/api/v1/shops/${productRes.data.shop_id}/products`);
                    const otherProducts = (shopProductsRes.data || [])
                        .filter(p => {
                            const productId = p.id || p._id;
                            return productId !== product_id && productId !== (productRes.data.id || productRes.data._id);
                        })
                        .map(p => ({
                            ...p,
                            id: p.id || p._id
                        }))
                        .slice(0, 4);
                    setRelatedProducts(otherProducts);
                    console.log("Related products:", otherProducts);
                } catch (relatedError) {
                    console.error("Error fetching related products:", relatedError);
                    setRelatedProducts([]);
                }
            }
            
            if (productRes.data.variants && productRes.data.variants.length > 0) {
                setSelectedVariant(productRes.data.variants[0]);
            }
        } catch (error) {
            console.error("Error fetching product detail:", error);
            setProduct(null);
            setRelatedProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const checkFavoriteStatus = async () => {
        try {
            const token = localStorage.getItem('user_token');
            if (!token) return;
            
            const response = await api.get(`/api/v1/favorites/check/${product_id}`);
            setIsFavorite(response.data.is_favorite);
        } catch (error) {
            console.error("Error checking favorite status:", error);
            setIsFavorite(false);
        }
    };

    const getFavoriteCount = async () => {
        try {
            const response = await api.get(`/api/v1/favorites/count/${product_id}`);
            setFavoriteCount(response.data.favorite_count);
        } catch (error) {
            console.error("Error getting favorite count:", error);
            setFavoriteCount(0);
        }
    };

    const handleToggleFavorite = async () => {
        const token = localStorage.getItem('user_token');
        
        if (!token) {
            if (window.confirm('Bạn cần đăng nhập để sử dụng tính năng này. Đăng nhập ngay?')) {
                navigate('/login');
            }
            return;
        }
        
        setFavoriteLoading(true);
        
        try {
            if (isFavorite) {
                await api.delete(`/api/v1/favorites/${product_id}`);
                setIsFavorite(false);
                setFavoriteCount(prev => Math.max(0, prev - 1));
                showToast('Đã xóa khỏi danh sách yêu thích', 'success');
            } else {
                await api.post(`/api/v1/favorites/${product_id}`);
                setIsFavorite(true);
                setFavoriteCount(prev => prev + 1);
                showToast('Đã thêm vào danh sách yêu thích', 'success');
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            if (error.response) {
                showToast(error.response.data.detail || 'Có lỗi xảy ra', 'error');
            } else {
                showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
            }
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Review Functions
    const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
            let url = `/api/v1/reviews/product/${product_id}?skip=${reviewPagination.skip}&limit=${reviewPagination.limit}`;
            if (selectedRatingFilter) {
                url += `&rating=${selectedRatingFilter}`;
            }
            const response = await api.get(url);
            setReviews(response.data.reviews || []);
            setReviewPagination(prev => ({
                ...prev,
                total: response.data.total || 0
            }));
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const fetchReviewStats = async () => {
        try {
            const response = await api.get(`/api/v1/reviews/product/${product_id}/stats`);
            setReviewStats(response.data);
        } catch (error) {
            console.error('Error fetching review stats:', error);
        }
    };

    const fetchUserReview = async () => {
        try {
            const response = await api.get(`/api/v1/reviews/product/${product_id}/user-review`);
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
            showToast('Vui lòng đăng nhập để đánh giá sản phẩm', 'error');
            return;
        }

        setSubmittingReview(true);
        try {
            if (editingReview) {
                await api.put(`/api/v1/reviews/${editingReview.id}`, reviewFormData);
                showToast('Cập nhật đánh giá thành công!', 'success');
            } else {
                await api.post(`/api/v1/reviews/product/${product_id}`, reviewFormData);
                showToast('Đánh giá thành công!', 'success');
            }
            
            resetReviewForm();
            fetchReviews();
            fetchReviewStats();
            fetchUserReview();
            fetchProductDetail(); // Cập nhật lại product để lấy rating mới
            
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast(error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
        
        try {
            await api.delete(`/api/v1/reviews/${reviewId}`);
            showToast('Xóa đánh giá thành công!', 'success');
            fetchReviews();
            fetchReviewStats();
            fetchUserReview();
            fetchProductDetail();
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast('Không thể xóa đánh giá', 'error');
        }
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setReviewFormData({
            rating: review.rating,
            comment: review.comment || '',
            images: review.images || []
        });
        setShowReviewForm(true);
    };

    const handleMarkHelpful = async (reviewId) => {
        try {
            await api.post(`/api/v1/reviews/${reviewId}/helpful`);
            fetchReviews();
        } catch (error) {
            console.error('Error marking helpful:', error);
        }
    };

    const resetReviewForm = () => {
        setReviewFormData({ rating: 5, comment: '', images: [] });
        setEditingReview(null);
        setShowReviewForm(false);
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
                setReviewFormData(prev => ({
                    ...prev,
                    images: [...prev.images, response.data.url]
                }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Không thể tải ảnh lên', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index) => {
        setReviewFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Không rõ";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const renderStars = (rating, interactive = false, onRatingChange = null, size = "default") => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const starSize = size === "large" ? 24 : 16;
        
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    className={interactive ? 'star-interactive' : ''}
                    style={{
                        color: i <= fullStars ? "#ffc107" : (i === fullStars + 1 && hasHalfStar && !interactive ? "#ffc107" : "#e4e5e9"),
                        cursor: interactive ? 'pointer' : 'default',
                        fontSize: interactive ? '24px' : `${starSize}px`,
                        marginRight: '4px'
                    }}
                    onClick={() => interactive && onRatingChange && onRatingChange(i)}
                />
            );
        }
        if (hasHalfStar && !interactive) {
            stars[fullStars] = <FaStarHalfAlt key="half" style={{ color: "#ffc107", fontSize: `${starSize}px`, marginRight: '4px' }} />;
        }
        return stars;
    };

    const renderRatingDistribution = () => {
        if (!reviewStats) return null;
        const total = reviewStats.total_reviews || 1;
        
        return [5, 4, 3, 2, 1].map(rating => {
            const count = reviewStats.rating_distribution?.[rating] || 0;
            const percentage = (count / total) * 100;
            return (
                <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '45px', fontSize: '14px' }}>{rating} <FaStar size={12} color="#ffc107" style={{ marginLeft: '4px' }} /></span>
                    <div style={{ flex: 1, height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: '#ffc107', borderRadius: '4px' }} />
                    </div>
                    <span style={{ width: '45px', fontSize: '12px', color: '#666' }}>{count}</span>
                </div>
            );
        });
    };

    const handleAddToCart = async () => {
        setAddingToCart(true);
        try {
            const shopId = product.shop_id;
            
            await api.post('/api/v1/cart/add', null, {
                params: {
                    product_id: product.id,
                    quantity: quantity,
                    variant_id: selectedVariant?.id || null,
                    shop_id: shopId
                }
            });
            
            const itemName = selectedVariant 
                ? `${product.name} - ${selectedVariant.name}` 
                : product.name;
            
            showToast(`Đã thêm ${quantity} ${itemName} vào giỏ hàng!`, 'success');
            window.dispatchEvent(new Event('cartUpdated'));
            
        } catch (error) {
            console.error("Error adding to cart:", error);
            if (error.response) {
                showToast(error.response.data.detail || "Có lỗi xảy ra", "error");
            } else {
                showToast("Có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại!", "error");
            }
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = () => {
        handleAddToCart();
        setTimeout(() =>{
            navigate('/cart');
        }, 500)
    };

    const handleShopClick = () => {
        navigate(`/shop/${shop?.id}`);
    };

    const handleProductClick = (productId) => {
        if (productId && productId !== 'undefined') {
            navigate(`/product/${productId}`);
        }
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `qr-${product?.name || 'product'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const getStageIcon = (stage) => {
        const icons = {
            cultivation: <FaLeaf />,
            production: <FaIndustry />,
            processing: <FaCogs />,
            transportation: <FaShippingFast />,
            distribution: <FaWarehouse />,
            certification: <FaCertificate />
        };
        return icons[stage] || <FaCheckCircle />;
    };

    const getStageName = (stage) => {
        const names = {
            cultivation: "Nuôi trồng",
            production: "Sản xuất",
            processing: "Chế biến",
            transportation: "Vận chuyển",
            distribution: "Phân phối",
            certification: "Kiểm định"
        };
        return names[stage] || stage;
    };

    if (loading) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ width: "50px", height: "50px", border: "3px solid #f3f3f3", borderTop: "3px solid #4CAF50", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                    <p>Đang tải thông tin sản phẩm...</p>
                </div>
            </ShopDetailLayout>
        );
    }

    if (!product) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h2>Không tìm thấy sản phẩm</h2>
                    <button onClick={() => navigate('/shop')} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}>Quay lại</button>
                </div>
            </ShopDetailLayout>
        );
    }

    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
    const hasTraceability = traceability && traceability.trace_events && traceability.trace_events.length > 0;

    return (
        <ShopDetailLayout>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
                {/* Toast Notification */}
                {toast.show && (
                    <div style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10000,
                        animation: "toastFadeInOut 2.5s ease forwards",
                        pointerEvents: "none"
                    }}>
                        <div style={{
                            background: "white",
                            borderRadius: "20px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                            padding: "32px 48px",
                            minWidth: "320px",
                            maxWidth: "450px",
                            textAlign: "center",
                            backdropFilter: "blur(10px)",
                            backgroundColor: "rgba(255,255,255,0.98)"
                        }}>
                            <div style={{
                                width: "80px",
                                height: "80px",
                                margin: "0 auto 20px",
                                background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 20px rgba(46,125,50,0.3)"
                            }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2e7d32", marginBottom: "8px" }}>Thành công!</div>
                            <div style={{ fontSize: "16px", color: "#666", lineHeight: "1.5" }}>{toast.message}</div>
                            <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg, #2e7d32, #4caf50, #2e7d32)", margin: "20px auto 0", borderRadius: "3px" }} />
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                <div style={{ marginBottom: "24px", fontSize: "14px", color: "#666" }}>
                    <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate('/')}>Trang chủ</span>
                    <span style={{ margin: "0 8px" }}>›</span>
                    <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate('/shop')}>Cửa hàng</span>
                    <span style={{ margin: "0 8px" }}>›</span>
                    <span style={{ color: "#333" }}>{product.name}</span>
                </div>

                {/* Product Main Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "48px" }}>
                    {/* Left - Image */}
                    <div>
                        <div style={{
                            background: "white",
                            borderRadius: "24px",
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            position: "relative"
                        }}>
                            <img 
                                src={product.image_url || "https://via.placeholder.com/600"} 
                                alt={product.name}
                                style={{ width: "100%", height: "auto", objectFit: "cover" }}
                            />
                            <button 
                                onClick={() => setShowQRModal(true)}
                                style={{
                                    position: "absolute",
                                    bottom: "16px",
                                    right: "16px",
                                    background: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "48px",
                                    height: "48px",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <FaQrcode size={24} color="#2e7d32" />
                            </button>
                        </div>
                    </div>

                    {/* Right - Info */}
                    <div>
                        <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#333" }}>{product.name}</h1>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", gap: "2px" }}>{renderStars(product.average_rating || 0)}</div>
                            <span style={{ color: "#666" }}>({reviewStats?.total_reviews || 0} đánh giá)</span>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#d32f2f" }}>{formatCurrency(currentPrice)}</span>
                            {selectedVariant && product.price !== selectedVariant.price && (
                                <span style={{ fontSize: "18px", color: "#999", textDecoration: "line-through", marginLeft: "12px" }}>
                                    {formatCurrency(product.price)}
                                </span>
                            )}
                        </div>

                        {product.variants && product.variants.length > 0 && (
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Đơn vị:</label>
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                    {product.variants.map(variant => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            style={{
                                                padding: "10px 20px",
                                                border: selectedVariant?.id === variant.id ? "2px solid #2e7d32" : "1px solid #ddd",
                                                background: selectedVariant?.id === variant.id ? "#e8f5e9" : "white",
                                                borderRadius: "40px",
                                                cursor: "pointer",
                                                fontWeight: selectedVariant?.id === variant.id ? "600" : "400",
                                                color: selectedVariant?.id === variant.id ? "#2e7d32" : "#333"
                                            }}
                                        >
                                            {variant.name} - {formatCurrency(variant.price)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Số lượng:</label>
                            <style>{`
                                .hide-arrows::-webkit-inner-spin-button, 
                                .hide-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                                .hide-arrows { -moz-appearance: textfield; }
                            `}</style>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>-</button>
                                <input type="number" className="hide-arrows" value={quantity} onChange={(e) => setQuantity(Math.min(currentStock, Math.max(1, parseInt(e.target.value) || 1)))} style={{ width: "60px", textAlign: "center", padding: "8px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px", fontWeight: "500" }} />
                                <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>+</button>
                                <span style={{ color: "#666", fontSize: "14px" }}>{currentStock} sản phẩm có sẵn</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
                            <button onClick={handleAddToCart} disabled={addingToCart || currentStock === 0} style={{ flex: 1, padding: "14px", background: currentStock === 0 ? "#ccc" : (addingToCart ? "#f5f5f5" : "#f5f5f5"), color: currentStock === 0 ? "#999" : (addingToCart ? "#999" : "#2e7d32"), border: currentStock === 0 ? "1px solid #ccc" : "2px solid #2e7d32", borderRadius: "40px", fontWeight: "600", cursor: (addingToCart || currentStock === 0) ? "not-allowed" : "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: addingToCart ? 0.7 : 1 }}
                                onMouseEnter={(e) => { if (!addingToCart && currentStock > 0) { e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.color = "white"; } }}
                                onMouseLeave={(e) => { if (!addingToCart && currentStock > 0) { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.color = "#2e7d32"; } }}>
                                {addingToCart ? (<> <div style={{ width: "18px", height: "18px", border: "2px solid #2e7d32", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang thêm...</>) : (<> <FaShoppingCart /> {currentStock === 0 ? "Hết hàng" : "Thêm vào giỏ"} </>)}
                            </button>
                            <button onClick={handleBuyNow} disabled={currentStock === 0} style={{ flex: 1, padding: "14px", background: currentStock === 0 ? "#ccc" : "#2e7d32", color: currentStock === 0 ? "#999" : "white", border: "none", borderRadius: "40px", fontWeight: "600", cursor: currentStock === 0 ? "not-allowed" : "pointer", transition: "all 0.3s", opacity: currentStock === 0 ? 0.6 : 1 }}
                                onMouseEnter={(e) => { if (currentStock > 0) { e.currentTarget.style.background = "#1b5e20"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                                onMouseLeave={(e) => { if (currentStock > 0) { e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.transform = "translateY(0)"; } }}>Mua ngay</button>
                            
                            <button 
                                onClick={handleToggleFavorite} 
                                disabled={favoriteLoading}
                                style={{
                                    width: "52px",
                                    padding: "14px",
                                    background: "white",
                                    border: "1px solid #ddd",
                                    borderRadius: "40px",
                                    cursor: favoriteLoading ? "not-allowed" : "pointer",
                                    transition: "all 0.3s",
                                    opacity: favoriteLoading ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => { if (!favoriteLoading) e.currentTarget.style.borderColor = "#ff4444"; }}
                                onMouseLeave={(e) => { if (!favoriteLoading) e.currentTarget.style.borderColor = "#ddd"; }}
                            >
                                {favoriteLoading ? (
                                    <div style={{ width: "20px", height: "20px", border: "2px solid #ff4444", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                                ) : (
                                    isFavorite ? <FaHeart color="#ff4444" size={20} /> : <FaRegHeart size={20} />
                                )}
                            </button>    
                            
                            <div style={{ position: "relative" }}>
                                <button onClick={() => setShowShareMenu(!showShareMenu)} style={{ width: "52px", padding: "14px", background: "white", border: "1px solid #ddd", borderRadius: "40px", cursor: "pointer" }}><FaShareAlt /></button>
                                {showShareMenu && (
                                    <div style={{ position: "absolute", top: "55px", right: 0, background: "white", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "8px", zIndex: 10, minWidth: "160px" }}>
                                        <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaFacebook color="#1877f2" size={18} /> Facebook</button>
                                        <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaTwitter color="#1da1f2" size={18} /> Twitter</button>
                                        <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaInstagram color="#e4405f" size={18} /> Instagram</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ background: "#f8f9fa", borderRadius: "16px", padding: "20px", marginTop: "24px" }}>
                            <h4 style={{ marginBottom: "16px", fontSize: "16px" }}>Thông tin nổi bật</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><FaTruck color="#2e7d32" /> Giao hàng toàn quốc</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><FaShieldAlt color="#2e7d32" /> Đảm bảo chất lượng</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><FaClock color="#2e7d32" /> Giao hàng trong 2-3 ngày</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div style={{ marginBottom: "48px" }}>
                    <div style={{ display: "flex", gap: "32px", borderBottom: "2px solid #eee", marginBottom: "24px", flexWrap: "wrap" }}>
                        {[
                            { id: "description", label: "Mô tả sản phẩm" },
                            { id: "specifications", label: "Thông tin chi tiết" },
                            { id: "reviews", label: `Đánh giá (${reviewStats?.total_reviews || 0})` },
                            { id: "traceability", label: "Truy xuất nguồn gốc" },
                            { id: "shop", label: "Thông tin shop" }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "12px 0", background: "none", border: "none", fontSize: "16px", fontWeight: activeTab === tab.id ? "600" : "400", color: activeTab === tab.id ? "#2e7d32" : "#666", borderBottom: activeTab === tab.id ? "3px solid #2e7d32" : "none", cursor: "pointer" }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ background: "white", borderRadius: "20px", padding: "32px" }}>
                        {activeTab === "description" && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Mô tả sản phẩm</h3>
                                <p style={{ lineHeight: "1.8", color: "#555" }}>{product.description || "Chưa có mô tả sản phẩm"}</p>
                            </div>
                        )}

                        {activeTab === "specifications" && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Thông số kỹ thuật</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Xuất xứ:</span>
                                        <span style={{ fontWeight: "500" }}>{product.origin || "Chưa cập nhật"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Đơn vị tính:</span>
                                        <span style={{ fontWeight: "500" }}>{selectedVariant?.name || "Sản phẩm"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Ngày đăng:</span>
                                        <span style={{ fontWeight: "500" }}>{formatDate(product.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div>
                                {/* Rating Summary */}
                                {reviewStats && reviewStats.total_reviews > 0 && (
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
                                                {reviewStats.average_rating || 0}
                                            </div>
                                            <div style={{ margin: '8px 0' }}>
                                                {renderStars(Math.round(reviewStats.average_rating || 0))}
                                            </div>
                                            <div style={{ color: '#666', fontSize: '14px' }}>
                                                {reviewStats.total_reviews} đánh giá
                                            </div>
                                        </div>
                                        <div>
                                            {renderRatingDistribution()}
                                        </div>
                                    </div>
                                )}

                                {/* User Review Action */}
                                {token && !userReview && !showReviewForm && (
                                    <button
                                        onClick={() => setShowReviewForm(true)}
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

                                {userReview && !showReviewForm && (
                                    <div style={{
                                        background: '#e8f5e9',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '16px'
                                    }}>
                                        <div>
                                            <strong>Đánh giá của bạn:</strong>
                                            <div style={{ marginTop: '8px' }}>{renderStars(userReview.rating)}</div>
                                            {userReview.comment && <p style={{ marginTop: '8px', color: '#555' }}>{userReview.comment}</p>}
                                        </div>
                                        <div>
                                            <button onClick={() => handleEditReview(userReview)} style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer', background: 'none', border: '1px solid #ddd', borderRadius: '4px' }}>
                                                <FaEdit /> Sửa
                                            </button>
                                            <button onClick={() => handleDeleteReview(userReview.id)} style={{ padding: '6px 12px', cursor: 'pointer', color: '#d32f2f', background: 'none', border: '1px solid #ddd', borderRadius: '4px' }}>
                                                <FaTrash /> Xóa
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Review Form */}
                                {showReviewForm && (
                                    <form onSubmit={handleSubmitReview} style={{
                                        background: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        marginBottom: '32px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0 }}>{editingReview ? 'Sửa đánh giá' : 'Viết đánh giá'}</h4>
                                            <button type="button" onClick={resetReviewForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
                                                <FaTimes />
                                            </button>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Đánh giá của bạn *</label>
                                            <div>{renderStars(reviewFormData.rating, true, (rating) => setReviewFormData({ ...reviewFormData, rating }), "large")}</div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nhận xét</label>
                                            <textarea
                                                value={reviewFormData.comment}
                                                onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
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
                                                {reviewFormData.images.map((img, index) => (
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
                                                disabled={submittingReview}
                                                style={{
                                                    padding: '10px 24px',
                                                    background: '#2e7d32',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                                                    opacity: submittingReview ? 0.6 : 1
                                                }}
                                            >
                                                {submittingReview ? 'Đang xử lý...' : (editingReview ? 'Cập nhật' : 'Gửi đánh giá')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={resetReviewForm}
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
                                {loadingReviews ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="spinner" />
                                        <p>Đang tải đánh giá...</p>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px', background: '#f8f9fa', borderRadius: '16px' }}>
                                        <p style={{ color: '#999' }}>Chưa có đánh giá nào cho sản phẩm này</p>
                                        {token && !userReview && !showReviewForm && (
                                            <button onClick={() => setShowReviewForm(true)} style={{ marginTop: '16px', color: '#2e7d32', background: 'none', border: 'none', cursor: 'pointer' }}>
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
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                                    <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '200px' }}>
                                                        <div style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: '50%',
                                                            background: '#e0e0e0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            flexShrink: 0
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
                                                                        <img key={idx} src={img} alt={`review ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
                                                                            onClick={() => window.open(img, '_blank')} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999', flexWrap: 'wrap' }}>
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
                                                    {token && userReview && review.user_id === userReview.user_id && (
                                                        <div>
                                                            <button onClick={() => handleEditReview(review)} style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px 8px' }}>
                                                                <FaEdit />
                                                            </button>
                                                            <button onClick={() => handleDeleteReview(review.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: '4px 8px' }}>
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
                                {reviewPagination.total > reviewPagination.limit && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                                        <button
                                            onClick={() => setReviewPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
                                            disabled={reviewPagination.skip === 0}
                                            style={{ padding: '8px 16px', cursor: reviewPagination.skip === 0 ? 'not-allowed' : 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
                                        >
                                            Trước
                                        </button>
                                        <span style={{ padding: '8px 16px' }}>
                                            {Math.floor(reviewPagination.skip / reviewPagination.limit) + 1} / {Math.ceil(reviewPagination.total / reviewPagination.limit)}
                                        </span>
                                        <button
                                            onClick={() => setReviewPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
                                            disabled={reviewPagination.skip + reviewPagination.limit >= reviewPagination.total}
                                            style={{ padding: '8px 16px', cursor: reviewPagination.skip + reviewPagination.limit >= reviewPagination.total ? 'not-allowed' : 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
                                        >
                                            Sau
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "traceability" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                    <h3 style={{ margin: 0, fontSize: "18px" }}>Hành trình sản phẩm</h3>
                                    {hasTraceability && (
                                        <button onClick={() => setShowQRModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontSize: "13px" }}>
                                            <FaQrcode /> Xem mã QR
                                        </button>
                                    )}
                                </div>

                                {!hasTraceability ? (
                                    <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8f9fa", borderRadius: "16px" }}>
                                        <FaQrcode size={64} color="#ccc" style={{ marginBottom: "16px" }} />
                                        <h4 style={{ color: "#666", marginBottom: "8px" }}>Chưa có thông tin truy xuất nguồn gốc</h4>
                                        <p style={{ color: "#999", fontSize: "14px" }}>Sản phẩm này đang được cập nhật thông tin</p>
                                        {product.origin && (
                                            <div style={{ marginTop: "20px", padding: "12px 20px", background: "#e8f5e9", borderRadius: "12px", display: "inline-block" }}>
                                                <FaMapMarkerAlt color="#2e7d32" style={{ marginRight: "8px" }} />
                                                <span style={{ color: "#2e7d32", fontSize: "14px" }}>Xuất xứ: {product.origin}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {/* Thông tin xuất xứ và kiểm định */}
                                        <div style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", borderRadius: "16px", padding: "20px", marginBottom: "32px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                                <FaCertificate size={28} color="#2e7d32" />
                                                <h4 style={{ margin: 0, color: "#1b5e20" }}>Thông tin sản phẩm</h4>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                                                {product.origin && (
                                                    <div><strong>Xuất xứ:</strong> {product.origin}</div>
                                                )}
                                                {traceability?.created_at && (
                                                    <div><strong>Ngày đăng ký:</strong> {formatDate(traceability.created_at)}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        {traceability?.trace_events && traceability.trace_events.length > 0 ? (
                                            <div className="trace-timeline" style={{ position: "relative", paddingLeft: "30px" }}>
                                                <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, #4caf50, #ff9800, #2196f3)" }} />
                                                {traceability.trace_events.map((event, index) => (
                                                    <div key={index} style={{ position: "relative", marginBottom: "32px" }}>
                                                        <div style={{ position: "absolute", left: "-30px", top: 0, width: "32px", height: "32px", borderRadius: "50%", background: "#4caf50", display: "flex", alignItems: "center", justifyContent: "center", color: "white", zIndex: 1 }}>
                                                            {getStageIcon(event.stage)}
                                                        </div>
                                                        <div style={{ background: "white", borderRadius: "16px", padding: "20px", marginLeft: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                                                                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: "#4caf50", color: "white", fontSize: "12px", fontWeight: "500" }}>{getStageName(event.stage)}</span>
                                                                {event.date && <span style={{ fontSize: "12px", color: "#999" }}><FaCalendarAlt style={{ marginRight: "4px" }} />{new Date(event.date).toLocaleDateString('vi-VN')}</span>}
                                                            </div>
                                                            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>{event.title}</h4>
                                                            <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "12px", fontSize: "14px" }}>{event.description}</p>
                                                            {event.location && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888" }}>
                                                                    <FaMapMarkerAlt size={12} /> {event.location}
                                                                </div>
                                                            )}
                                                            {event.responsible_party && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888", marginTop: "8px" }}>
                                                                    <FaUser size={12} /> {event.responsible_party}
                                                                </div>
                                                            )}
                                                            {event.images && event.images.length > 0 && (
                                                                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                                                                    {event.images.map((img, imgIdx) => (
                                                                        <img key={imgIdx} src={img} alt={`Hình ảnh ${imgIdx + 1}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }} 
                                                                            onClick={() => window.open(img, '_blank')} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "16px" }}>
                                                <p style={{ color: "#999" }}>Đang cập nhật hành trình sản phẩm...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "shop" && shop && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Thông tin cửa hàng</h3>
                                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: "16px" }}>
                                            <h4 style={{ fontSize: "20px", color: "#2e7d32", cursor: "pointer" }} onClick={handleShopClick}>{shop.name}</h4>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                                <div style={{ display: "flex", gap: "2px" }}>{renderStars(shop.rating || 4.5)}</div>
                                                <span>({shop.followers_count || 0} người theo dõi)</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#555" }}><FaMapMarkerAlt color="#2e7d32" /> {shop.address || "Chưa cập nhật"}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#555" }}><FaPhone color="#2e7d32" /> {shop.phone || "Chưa cập nhật"}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#555" }}><FaEnvelope color="#2e7d32" /> {shop.email || "Chưa cập nhật"}</div>
                                        </div>
                                        <button onClick={handleShopClick} style={{ marginTop: "20px", padding: "10px 24px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>Xem cửa hàng</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600" }}>Sản phẩm tương tự</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                            {relatedProducts.map(relatedProduct => (
                                <div 
                                    key={relatedProduct.id} 
                                    onClick={() => handleProductClick(relatedProduct.id)} 
                                    style={{ background: "white", borderRadius: "16px", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "transform 0.3s" }} 
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} 
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    <img 
                                        src={relatedProduct.image_url || "https://via.placeholder.com/300"} 
                                        alt={relatedProduct.name} 
                                        style={{ width: "100%", height: "180px", objectFit: "cover" }} 
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                                    />
                                    <div style={{ padding: "12px" }}>
                                        <h4 style={{ fontSize: "14px", marginBottom: "8px", fontWeight: "600", color: "#333" }}>{relatedProduct.name}</h4>
                                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>{renderStars(relatedProduct.average_rating || 0)}</div>
                                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#d32f2f" }}>{formatCurrency(relatedProduct.price)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowQRModal(false)}>
                    <div style={{ background: "white", borderRadius: "24px", padding: "32px", maxWidth: "400px", width: "90%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: "20px" }}>QR Code truy xuất nguồn gốc</h3>
                        <QRCodeCanvas id="qr-code-canvas" value={`${window.location.origin}/product/${product.id}/trace`} size={200} level="H" includeMargin={true} style={{ margin: "0 auto 20px" }} />
                        <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>Quét mã QR để xem thông tin truy xuất nguồn gốc sản phẩm</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={handleDownloadQR} style={{ padding: "10px 20px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><FaDownload /> Tải QR</button>
                            <button onClick={() => setShowQRModal(false)} style={{ padding: "10px 20px", background: "#f5f5f5", border: "none", borderRadius: "30px", cursor: "pointer" }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes toastFadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); visibility: hidden; }
                }
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button { opacity: 1; }
                .hide-arrows::-webkit-inner-spin-button, 
                .hide-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                .hide-arrows { -moz-appearance: textfield; }
                .star-interactive {
                    transition: transform 0.2s ease;
                }
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
            `}</style>
        </ShopDetailLayout>
    );
};

export default ProductDetailPage;