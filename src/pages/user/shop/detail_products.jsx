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
import "../../../css/detail_product_page.css";

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
    const [shopId, setShopId] = useState(null);
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
                setShopId(productRes.data.shop_id);
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
    // ✅ Dùng shopId từ state (đã được set trong fetchProductDetail)
    if (shopId) {
        navigate(`/shop/${shopId}`);
    
    } else {
        console.error("No shop ID found", { shop, shopId });
        showToast("Không thể xem cửa hàng", "error");
    }
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

    // ProductDetailPage.js - Phần return đã được sửa

return (
    <ShopDetailLayout>
        <div className="product-detail-container">
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
            <div className="breadcrumb">
                <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate('/')}>Trang chủ</span>
                <span style={{ margin: "0 8px" }}>›</span>
                <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate(`/shop/${shopId}`)}>Cửa hàng</span>
                <span style={{ margin: "0 8px" }}>›</span>
                <span style={{ color: "#333" }}>{product.name}</span>
            </div>

            {/* Product Main Info */}
            <div className="product-main-info">
                {/* Left - Image */}
                <div className="product-image-section">
                    <div className="image-slider-container">
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
                <div className="product-info-section">
                    <h1 className="product-name">{product.name}</h1>
                    
                    <div className="product-rating">
                        <div className="stars">{renderStars(product.average_rating || 0)}</div>
                        <span style={{ color: "#666" }}>({reviewStats?.total_reviews || 0} đánh giá)</span>
                    </div>

                    <div className="product-price">
                        <span className="current-price">{formatCurrency(currentPrice)}</span>
                        {selectedVariant && product.price !== selectedVariant.price && (
                            <span className="old-price">
                                {formatCurrency(product.price)}
                            </span>
                        )}
                    </div>

                    {product.variants && product.variants.length > 0 && (
                        <div className="variant-section">
                            <label className="variant-label">Đơn vị:</label>
                            <div className="variant-options">
                                {product.variants.map(variant => (
                                    <button
                                        key={variant.id}
                                        onClick={() => setSelectedVariant(variant)}
                                        className={`variant-btn ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                                    >
                                        {variant.name} - {formatCurrency(variant.price)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="quantity-section">
                        <label className="quantity-label">Số lượng:</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>-</button>
                            <input type="number" className="hide-arrows" value={quantity} onChange={(e) => setQuantity(Math.min(currentStock, Math.max(1, parseInt(e.target.value) || 1)))} style={{ width: "60px", textAlign: "center", padding: "8px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px", fontWeight: "500" }} />
                            <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>+</button>
                            <span className="stock-info" style={{ color: "#666", fontSize: "14px" }}>{currentStock} sản phẩm có sẵn</span>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="btn-cart" onClick={handleAddToCart} disabled={addingToCart || currentStock === 0}>
                            {addingToCart ? <div className="spinner" style={{width: "16px", height: "16px"}} /> : <FaShoppingCart />}
                            <span className="btn-text">{currentStock === 0 ? "Hết hàng" : "Thêm vào giỏ"}</span>
                        </button>
                        <button className="btn-buy" onClick={handleBuyNow} disabled={currentStock === 0}> 
                            <span className="btn-buy-now">Mua ngay</span>
                        </button>
                        <button className="btn-favorite" onClick={handleToggleFavorite} disabled={favoriteLoading}>
                            {favoriteLoading ? <div className="spinner" style={{width: "16px", height: "16px"}} /> : (isFavorite ? <FaHeart color="#ff4444" /> : <FaRegHeart />)}
                        </button>
                        <button className="btn-share" onClick={() => setShowShareMenu(!showShareMenu)}>
                            <FaShareAlt />
                        </button>
                    </div>
                    <div className="highlight-info">
                        <div className="highlight-title">Thông tin nổi bật</div>
                        <div className="highlight-item"><FaTruck /> Giao hàng toàn quốc</div>
                        <div className="highlight-item"><FaShieldAlt /> Đảm bảo chất lượng</div>
                        <div className="highlight-item"><FaClock /> Giao hàng trong 2-3 ngày</div>
                    </div>
                </div>
            </div>

            {/* Product Details Tabs - ĐÃ BỎ TAB REVIEWS */}
            <div className="product-tabs">
                <div className="tab-header">
                    {[
                        { id: "description", label: "Mô tả sản phẩm" },
                        { id: "specifications", label: "Thông tin chi tiết" },
                        { id: "shop", label: "Thông tin shop" }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === "description" && (
                        <div>
                            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Mô tả sản phẩm</h3>
                            <p style={{ lineHeight: "1.8", color: "#555" }}>{product.description || "Chưa có mô tả sản phẩm"}</p>
                        </div>
                    )}

                    {activeTab === "specifications" && (
                        <div>
                            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Thông số kỹ thuật</h3>
                            <div className="spec-grid">
                                <div className="spec-item">
                                    <span className="spec-label">Xuất xứ:</span>
                                    <span className="spec-value">{product.origin || "Chưa cập nhật"}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Đơn vị tính:</span>
                                    <span className="spec-value">{selectedVariant?.name || "Sản phẩm"}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Ngày đăng:</span>
                                    <span className="spec-value">{formatDate(product.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "shop" && shop && (
                        <div>
                            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Thông tin cửa hàng</h3>
                            <div className="shop-info-card">
                                <div className="shop-header">
                                    <h4 className="shop-name" onClick={handleShopClick} style={{ cursor: "pointer" }}>{shop.name}</h4>
                                    <span className="shop-followers">({shop.followers_count || 0} người theo dõi)</span>
                                </div>
                                <div className="shop-details">
                                    <div className="shop-detail-item"><FaMapMarkerAlt color="#2e7d32" /> {shop.address || "Chưa cập nhật"}</div>
                                    <div className="shop-detail-item"><FaPhone color="#2e7d32" /> {shop.phone || "Chưa cập nhật"}</div>
                                    <div className="shop-detail-item"><FaEnvelope color="#2e7d32" /> {shop.email || "Chưa cập nhật"}</div>
                                </div>
                                <button className="btn-view-shop" onClick={handleShopClick}>Xem cửa hàng</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products - Sản phẩm tương tự */}
            {relatedProducts.length > 0 && (
                <div className="related-products">
                    <h3 className="section-title">Sản phẩm tương tự</h3>
                    <div className="related-grid">
                        {relatedProducts.map(relatedProduct => (
                            <div 
                                key={relatedProduct.id} 
                                onClick={() => handleProductClick(relatedProduct.id)} 
                                className="related-item"
                            >
                                <img 
                                    src={relatedProduct.image_url || "https://via.placeholder.com/300"} 
                                    alt={relatedProduct.name} 
                                    className="related-image" 
                                    onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                                />
                                <div className="related-info">
                                    <h4 className="related-name">{relatedProduct.name}</h4>
                                    <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>{renderStars(relatedProduct.average_rating || 0)}</div>
                                    <div className="related-price">{formatCurrency(relatedProduct.price)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ==================== PHẦN ĐÁNH GIÁ - ĐẶT CUỐI CÙNG ==================== */}
            <div className="reviews-section">
                <div className="reviews-header">
                    <h3 className="section-title">Đánh giá sản phẩm</h3>
                    <div className="reviews-summary-badge">
                        {reviewStats?.total_reviews > 0 ? (
                            <span>{reviewStats.total_reviews} đánh giá • {renderStars(Math.round(reviewStats.average_rating || 0))}</span>
                        ) : (
                            <span>Chưa có đánh giá</span>
                        )}
                    </div>
                </div>

                {/* Rating Summary */}
                {reviewStats && reviewStats.total_reviews > 0 && (
                    <div className="rating-summary">
                        <div className="rating-score-box">
                            <div className="rating-score">{reviewStats.average_rating || 0}</div>
                            <div className="rating-stars">{renderStars(Math.round(reviewStats.average_rating || 0))}</div>
                            <div className="rating-total">{reviewStats.total_reviews} đánh giá</div>
                        </div>
                        <div className="rating-distribution">
                            {renderRatingDistribution()}
                        </div>
                    </div>
                )}

                {/* User Review Action */}
                {token && !userReview && !showReviewForm && (
                    <button className="write-review-btn" onClick={() => setShowReviewForm(true)}>
                        <FaEdit /> Viết đánh giá
                    </button>
                )}

                {userReview && !showReviewForm && (
                    <div className="user-review-card">
                        <div>
                            <strong>Đánh giá của bạn</strong>
                            <div className="user-review-rating">{renderStars(userReview.rating)}</div>
                            {userReview.comment && <p className="user-review-comment">{userReview.comment}</p>}
                        </div>
                        <div className="user-review-actions">
                            <button onClick={() => handleEditReview(userReview)}><FaEdit /> Sửa</button>
                            <button onClick={() => handleDeleteReview(userReview.id)}><FaTrash /> Xóa</button>
                        </div>
                    </div>
                )}

                {/* Review Form */}
                {showReviewForm && (
                    <form className="review-form" onSubmit={handleSubmitReview}>
                        <div className="review-form-header">
                            <h4 className="review-form-title">{editingReview ? 'Sửa đánh giá' : 'Viết đánh giá'}</h4>
                            <button type="button" className="review-form-close" onClick={resetReviewForm}><FaTimes /></button>
                        </div>

                        <div className="review-form-rating">
                            <label>Đánh giá của bạn *</label>
                            <div>{renderStars(reviewFormData.rating, true, (rating) => setReviewFormData({ ...reviewFormData, rating }), "large")}</div>
                        </div>

                        <div className="review-form-comment">
                            <label>Nhận xét</label>
                            <textarea
                                value={reviewFormData.comment}
                                onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                                rows="4"
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                            />
                        </div>

                        <div className="review-form-images">
                            <label>Hình ảnh</label>
                            <div className="images-preview">
                                {reviewFormData.images.map((img, index) => (
                                    <div key={index} className="image-preview-item">
                                        <img src={img} alt={`review ${index}`} />
                                        <button type="button" className="remove-image" onClick={() => removeImage(index)}>×</button>
                                    </div>
                                ))}
                                <label className="upload-image-label">
                                    {uploadingImage ? <FaSpinner className="spinner-small" /> : <FaCamera />}
                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>

                        <div className="review-form-actions">
                            <button type="submit" className="btn-submit" disabled={submittingReview}>
                                {submittingReview ? 'Đang xử lý...' : (editingReview ? 'Cập nhật' : 'Gửi đánh giá')}
                            </button>
                            <button type="button" className="btn-cancel" onClick={resetReviewForm}>Hủy</button>
                        </div>
                    </form>
                )}

                {/* Rating Filter */}
                <div className="rating-filters">
                    <button className={`filter-chip ${selectedRatingFilter === null ? 'active' : ''}`} onClick={() => setSelectedRatingFilter(null)}>
                        Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map(rating => (
                        <button
                            key={rating}
                            className={`filter-chip ${selectedRatingFilter === rating ? 'active' : ''}`}
                            onClick={() => setSelectedRatingFilter(rating === selectedRatingFilter ? null : rating)}
                        >
                            {rating} <FaStar size={12} color="#ffc107" />
                        </button>
                    ))}
                </div>

                {/* Reviews List */}
                {loadingReviews ? (
                    <div className="reviews-loading">
                        <div className="spinner" />
                        <p>Đang tải đánh giá...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="reviews-empty">
                        <p>Chưa có đánh giá nào cho sản phẩm này</p>
                        {token && !userReview && !showReviewForm && (
                            <button onClick={() => setShowReviewForm(true)}>Hãy là người đầu tiên đánh giá!</button>
                        )}
                    </div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <div className="review-avatar">
                                        {review.user_avatar ? (
                                            <img src={review.user_avatar} alt={review.user_name} />
                                        ) : (
                                            <FaUser />
                                        )}
                                    </div>
                                    <div className="review-info">
                                        <div className="review-name">{review.user_name}</div>
                                        <div className="review-stars">{renderStars(review.rating)}</div>
                                        <div className="review-date">{new Date(review.created_at).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                </div>
                                {review.comment && <p className="review-comment">{review.comment}</p>}
                                {review.images && review.images.length > 0 && (
                                    <div className="review-images-grid">
                                        {review.images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`review ${idx}`} className="review-thumb" onClick={() => window.open(img, '_blank')} />
                                        ))}
                                    </div>
                                )}
                                <button className="review-helpful" onClick={() => handleMarkHelpful(review.id)}>
                                    <FaThumbsUp /> Hữu ích ({review.helpful_count || 0})
                                </button>
                                {token && userReview && review.user_id === userReview.user_id && (
                                    <div className="review-actions">
                                        <button onClick={() => handleEditReview(review)}><FaEdit /> Sửa</button>
                                        <button onClick={() => handleDeleteReview(review.id)}><FaTrash /> Xóa</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {reviewPagination.total > reviewPagination.limit && (
                    <div className="reviews-pagination">
                        <button onClick={() => setReviewPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))} disabled={reviewPagination.skip === 0}>
                            Trước
                        </button>
                        <span>{Math.floor(reviewPagination.skip / reviewPagination.limit) + 1} / {Math.ceil(reviewPagination.total / reviewPagination.limit)}</span>
                        <button onClick={() => setReviewPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))} disabled={reviewPagination.skip + reviewPagination.limit >= reviewPagination.total}>
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>QR Code truy xuất nguồn gốc</h3>
                        <QRCodeCanvas id="qr-code-canvas" value={`https://www.dacsanvietplatform.shop/product/${product.id}/trace`} size={200} level="H" includeMargin={true} />
                        <p>Quét mã QR để xem thông tin truy xuất nguồn gốc sản phẩm</p>
                        <div className="modal-actions">
                            <button onClick={handleDownloadQR}><FaDownload /> Tải QR</button>
                            <button onClick={() => setShowQRModal(false)}>Đóng</button>
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
                .star-interactive { transition: transform 0.2s ease; }
                .star-interactive:hover { transform: scale(1.1); }
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #2e7d32;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
        </ShopDetailLayout>
    );
};

export default ProductDetailPage;