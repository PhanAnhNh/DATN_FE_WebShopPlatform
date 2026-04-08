// pages/user/shop/ShopDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";
import api from "../../../api/api";
import { 
  FaStore, FaUsers, FaCommentDots, FaStar, FaStarHalfAlt,
  FaRegStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt,
  FaHeart, FaRegHeart, FaSearch, FaBox, FaShoppingCart, FaEye,
  FaCheckCircle, FaShareAlt, FaFacebook, FaTwitter, FaInstagram,
  FaTruck, FaShieldAlt, FaClock, FaReply, FaThumbsUp, FaUserCircle, FaEdit
} from 'react-icons/fa';

const ShopDetailPage = () => {
    const { shop_id } = useParams();
    const navigate = useNavigate();
    
    // State với cache initialization
    const [activeTab, setActiveTab] = useState("products");
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [newComment, setNewComment] = useState("");
    const [ratingFilter, setRatingFilter] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const [hoveredReviewId, setHoveredReviewId] = useState(null);
    const [likedReviews, setLikedReviews] = useState({});
    const [newRating, setNewRating] = useState(5);
    const [showRatingSelector, setShowRatingSelector] = useState(false);
    const [isCacheLoaded, setIsCacheLoaded] = useState(false);

    // Lọc sản phẩm theo từ khóa tìm kiếm
    const filteredProducts = products.filter(product => {
        if (!searchTerm.trim()) return true;
        const searchLower = searchTerm.toLowerCase().trim();
        const productName = (product.name || "").toLowerCase();
        return productName.includes(searchLower);
    });

    // Hàm đọc cache
    const loadFromCache = (id) => {
        if (!id) return false;
        
        const cachedShop = sessionStorage.getItem(`shop_data_${id}`);
        const cacheTime = sessionStorage.getItem(`shop_cache_time_${id}`);
        const isCacheValid = cachedShop && cacheTime && (Date.now() - parseInt(cacheTime) < 300000);
        
        if (isCacheValid) {
            try {
                const parsedShop = JSON.parse(cachedShop);
                setShop(parsedShop);
                
                const cachedProducts = sessionStorage.getItem(`shop_products_${id}`);
                if (cachedProducts) {
                    setProducts(JSON.parse(cachedProducts));
                }
                
                const cachedReviews = sessionStorage.getItem(`shop_reviews_${id}`);
                if (cachedReviews) {
                    setReviews(JSON.parse(cachedReviews));
                }
                
                const cachedTab = sessionStorage.getItem(`shop_tab_${id}`);
                if (cachedTab) {
                    setActiveTab(cachedTab);
                }
                
                const cachedFollowing = sessionStorage.getItem(`shop_following_${id}`);
                if (cachedFollowing !== null) {
                    setIsFollowing(cachedFollowing === "true");
                }
                
                const cachedLiked = sessionStorage.getItem(`shop_liked_reviews_${id}`);
                if (cachedLiked) {
                    setLikedReviews(JSON.parse(cachedLiked));
                }
                
                console.log("✅ Loaded from cache for shop:", id);
                return true;
            } catch (e) {
                console.error("Error parsing cache:", e);
            }
        }
        return false;
    };

    // Hàm lưu cache
    const saveToCache = (id) => {
        if (!id) return;
        
        if (shop) {
            sessionStorage.setItem(`shop_data_${id}`, JSON.stringify(shop));
            sessionStorage.setItem(`shop_cache_time_${id}`, Date.now().toString());
        }
        if (products.length > 0) {
            sessionStorage.setItem(`shop_products_${id}`, JSON.stringify(products));
        }
        if (reviews.length > 0) {
            sessionStorage.setItem(`shop_reviews_${id}`, JSON.stringify(reviews));
        }
        sessionStorage.setItem(`shop_tab_${id}`, activeTab);
        sessionStorage.setItem(`shop_following_${id}`, isFollowing);
        sessionStorage.setItem(`shop_liked_reviews_${id}`, JSON.stringify(likedReviews));
    };

    // Effect để lưu cache khi có thay đổi
    useEffect(() => {
        if (shop_id && (shop || products.length > 0 || reviews.length > 0)) {
            saveToCache(shop_id);
        }
    }, [shop, products, reviews, activeTab, isFollowing, likedReviews, shop_id]);

    // Effect chính - load dữ liệu
    useEffect(() => {
        if (!shop_id) return;
        
        console.log("=== Loading shop data for ID:", shop_id);
        
        // Thử đọc cache trước
        const hasCache = loadFromCache(shop_id);
        
        if (hasCache) {
            console.log("Using cached data, skipping API call");
            setLoading(false);
            setIsCacheLoaded(true);
        } else {
            console.log("No valid cache, fetching from API");
            setLoading(true);
            fetchShopData();
        }
        
        // Kiểm tra follow status từ API
        checkFollowStatus();
        
        // Cleanup function
        return () => {
            console.log("Cleaning up for shop:", shop_id);
        };
    }, [shop_id]);

    const checkFollowStatus = async () => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return;
            
            const response = await api.get(`/api/v1/shops/${shop_id}/follow-status`);
            setIsFollowing(response.data.isFollowing);
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    };

    const fetchShopData = async () => {
        setLoading(true);
        try {
            const shopRes = await api.get(`/api/v1/shops/${shop_id}`);
            setShop(shopRes.data);

            try {
                const productsRes = await api.get(`/api/v1/shops/${shop_id}/products`);
                const normalizedProducts = (productsRes.data || []).map(product => ({
                    ...product,
                    id: product.id || product._id || product.product_id || String(product.id || Math.random())
                }));
                setProducts(normalizedProducts);
                
                // Cập nhật số lượng sản phẩm trong shop từ dữ liệu thực tế
                if (shopRes.data && normalizedProducts.length !== shopRes.data.products_count) {
                    setShop(prev => ({
                        ...prev,
                        products_count: normalizedProducts.length
                    }));
                }
            } catch (productsError) {
                console.log("Products API not available, using mock data");
                const mockProducts = [
                    { id: 1, name: "Táo đỏ tươi", price: 60000, image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400", sold_count: 150, rating: 4.8 },
                    { id: 2, name: "Bưởi da xanh", price: 45000, image_url: "https://images.unsplash.com/photo-1579542089558-9e5fc3a01708?w=400", sold_count: 234, rating: 4.9 },
                    { id: 3, name: "Cam sành", price: 35000, image_url: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=400", sold_count: 178, rating: 4.7 },
                    { id: 4, name: "Chuối già", price: 25000, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400", sold_count: 98, rating: 4.6 },
                    { id: 5, name: "Dừa xiêm", price: 11000, image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=400", sold_count: 45, rating: 4.5 },
                    { id: 6, name: "Măng cụt", price: 55000, image_url: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=400", sold_count: 67, rating: 4.9 }
                ];
                setProducts(mockProducts);
                
                // Cập nhật số lượng sản phẩm cho mock data
                if (shopRes.data) {
                    setShop(prev => ({
                        ...prev,
                        products_count: mockProducts.length
                    }));
                }
            }

            try {
                const reviewsRes = await api.get(`/api/v1/shops/${shop_id}/reviews`);
                const normalizedReviews = (reviewsRes.data || []).map(review => ({
                    ...review,
                    id: review.id || review._id || review.review_id || String(review.id || Math.random())
                }));
                setReviews(normalizedReviews);
            } catch (reviewsError) {
                console.log("Reviews API not available, using mock data");
                setReviews([
                    { id: 1, user_name: "Nguyễn Văn An", user_avatar: "https://randomuser.me/api/portraits/men/1.jpg", rating: 5, comment: "Sản phẩm chất lượng, giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ dài dài!", date: "2026-01-20", likes: 12 },
                    { id: 2, user_name: "Lương Văn Linh", user_avatar: "https://randomuser.me/api/portraits/men/2.jpg", rating: 5, comment: "Rất hài lòng với chất lượng sản phẩm. Giá cả hợp lý.", date: "2026-01-18", likes: 8 },
                    { id: 3, user_name: "Phan Anh Nhật", user_avatar: "https://randomuser.me/api/portraits/men/3.jpg", rating: 4, comment: "Sản phẩm tốt, đóng gói kỹ. Sẽ mua lại lần sau.", date: "2026-01-17", likes: 5 }
                ]);
            }
        } catch (error) {
            console.error("Error fetching shop data:", error);
            const mockShop = {
                id: shop_id,
                name: "Đặc Sản Quê Tôi",
                logo_url: "https://via.placeholder.com/120",
                banner_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop",
                description: "Chuyên cung cấp các sản phẩm đặc sản vùng miền chất lượng cao, tươi ngon mỗi ngày. Cam kết nguồn gốc rõ ràng, an toàn vệ sinh thực phẩm.",
                products_count: 6,
                followers_count: 13700,
                rating: 4.9,
                total_reviews: 2000,
                chat_response_rate: 84,
                created_at: "2025-01-01T00:00:00Z",
                address: "Hà Nội, Việt Nam",
                phone: "0987654321",
                email: "dacsanquetoi@gmail.com"
            };
            setShop(mockShop);
            setProducts([
                { id: 1, name: "Táo đỏ tươi", price: 60000, image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400", sold_count: 150, rating: 4.8 },
                { id: 2, name: "Bưởi da xanh", price: 45000, image_url: "https://images.unsplash.com/photo-1579542089558-9e5fc3a01708?w=400", sold_count: 234, rating: 4.9 },
                { id: 3, name: "Cam sành", price: 35000, image_url: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=400", sold_count: 178, rating: 4.7 },
                { id: 4, name: "Chuối già", price: 25000, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400", sold_count: 98, rating: 4.6 },
                { id: 5, name: "Dừa xiêm", price: 11000, image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=400", sold_count: 45, rating: 4.5 },
                { id: 6, name: "Măng cụt", price: 55000, image_url: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=400", sold_count: 67, rating: 4.9 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num?.toString() || "0";
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Không rõ";
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Hôm nay";
        if (diffDays === 1) return "Hôm qua";
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const handleFollow = async () => {
        setFollowLoading(true);
        try {
            const response = await api.post(`/api/v1/shops/${shop_id}/follow`);
            if (response.data.following) {
                setIsFollowing(true);
                setShop({ ...shop, followers_count: (shop?.followers_count || 0) + 1 });
            } else {
                setIsFollowing(false);
                setShop({ ...shop, followers_count: (shop?.followers_count || 0) - 1 });
            }
        } catch (error) {
            console.error("Error following/unfollowing shop:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleSendMessage = () => navigate(`/chat?shop=${shop_id}`);
    const handleProductClick = (productId) => navigate(`/product/${productId}`);
    
    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/api/v1/shops/${shop_id}/reviews`, { 
                comment: newComment, 
                rating: newRating
            });
            setReviews([{
                id: Date.now(),
                user_name: "Bạn",
                user_avatar: null,
                rating: newRating,
                comment: newComment,
                date: new Date().toISOString(),
                likes: 0
            }, ...reviews]);
            setNewComment("");
            setNewRating(5);
        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    const handleLikeReview = (reviewId) => {
        setLikedReviews(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) stars.push(<FaStar key={i} style={{ color: "#ffc107" }} />);
            else if (i === fullStars + 1 && hasHalfStar) stars.push(<FaStarHalfAlt key={i} style={{ color: "#ffc107" }} />);
            else stars.push(<FaRegStar key={i} style={{ color: "#ddd" }} />);
        }
        return stars;
    };

    const filteredReviews = reviews.filter(review => !ratingFilter || review.rating === ratingFilter);
    const ratingDistribution = { 
        5: reviews.filter(r => r.rating === 5).length, 
        4: reviews.filter(r => r.rating === 4).length, 
        3: reviews.filter(r => r.rating === 3).length, 
        2: reviews.filter(r => r.rating === 2).length, 
        1: reviews.filter(r => r.rating === 1).length 
    };
    const ratingOptions = [{ value: 5, label: "5 sao" }, { value: 4, label: "4 sao" }, { value: 3, label: "3 sao" }, { value: 2, label: "2 sao" }, { value: 1, label: "1 sao" }];
    const chatResponseRate = shop?.chat_response_rate !== undefined && shop?.chat_response_rate !== null ? shop.chat_response_rate : 0;

    // Lấy số lượng sản phẩm hiển thị - ưu tiên từ products array nếu có
    const displayProductsCount = products.length > 0 ? products.length : (shop?.products_count || 0);

    // Loading state
    if (loading && !shop && !isCacheLoaded) return (
        <ShopDetailLayout shop={null}>
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ width: "50px", height: "50px", border: "3px solid #f3f3f3", borderTop: "3px solid #4CAF50", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                <p>Đang tải thông tin cửa hàng...</p>
            </div>
        </ShopDetailLayout>
    );

    if (!shop) return (
        <ShopDetailLayout shop={null}>
            <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>Không tìm thấy cửa hàng</h2>
                <button onClick={() => navigate('/shop')} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}>Quay lại</button>
            </div>
        </ShopDetailLayout>
    );

    return (
        <ShopDetailLayout shop={shop}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Hero Section */}
                <div style={{ position: "relative", marginBottom: "60px" }}>
                    <div style={{
                        height: "320px",
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${shop?.banner_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: "24px",
                        position: "relative",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ position: "absolute", bottom: "-50px", left: "40px", display: "flex", alignItems: "flex-end", gap: "28px" }}>
                            <div style={{
                                width: "130px", height: "130px", borderRadius: "50%", 
                                border: "5px solid white",
                                backgroundImage: shop?.logo_url ? `url(${shop.logo_url})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                backgroundSize: "cover", backgroundPosition: "center",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                                transition: "transform 0.3s"
                            }} 
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} />
                            <div style={{ marginBottom: "15px" }}>
                                <h1 style={{ fontSize: "36px", color: "white", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.3)", fontWeight: "700" }}>{shop?.name}</h1>
                                <div style={{ display: "flex", gap: "20px", marginTop: "12px", flexWrap: "wrap" }}>
                                    <span style={{ color: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", gap: "6px", fontSize: "15px", fontWeight: "500", background: "rgba(0,0,0,0.3)", padding: "4px 12px", borderRadius: "30px" }}>
                                        <FaStar style={{ color: "#ffc107" }} /> {shop?.rating}
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.95)", fontSize: "15px", fontWeight: "500", background: "rgba(0,0,0,0.3)", padding: "4px 12px", borderRadius: "30px" }}>
                                        {formatNumber(shop?.total_reviews)} đánh giá
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.95)", fontSize: "15px", fontWeight: "500", background: "rgba(0,0,0,0.3)", padding: "4px 12px", borderRadius: "30px" }}>
                                        <FaCalendarAlt style={{ marginRight: "6px" }} /> Tham gia {formatDate(shop?.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shop Info và Actions */}
                <div style={{ padding: "20px 20px 0 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "30px" }}>
                        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
                            {[
                                { value: displayProductsCount, label: "Sản phẩm", icon: <FaBox /> },
                                { value: formatNumber(shop?.followers_count), label: "Người theo dõi", icon: <FaUsers /> },
                                { value: `${chatResponseRate}%`, label: "Phản hồi chat", icon: <FaCommentDots /> }
                            ].map((stat, idx) => (
                                <div key={idx} style={{ textAlign: "center", transition: "transform 0.3s", cursor: "pointer" }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2e7d32" }}>{stat.value}</div>
                                    <div style={{ color: "#666", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                                        {stat.icon} {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={handleFollow} disabled={followLoading} style={{
                                padding: "12px 28px", borderRadius: "40px", border: "none", fontWeight: "600", fontSize: "14px",
                                background: isFollowing ? "#fff" : "#2e7d32", color: isFollowing ? "#2e7d32" : "white",
                                border: isFollowing ? "2px solid #2e7d32" : "none", cursor: followLoading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                            }}
                            onMouseEnter={(e) => { if (!followLoading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}>
                                {isFollowing ? <FaHeart style={{ color: "#ff4444" }} /> : <FaRegHeart />}
                                {followLoading ? "Đang xử lý..." : (isFollowing ? "Đã theo dõi" : "Theo dõi")}
                            </button>
                            <button onClick={handleSendMessage} style={{
                                padding: "12px 28px", borderRadius: "40px", border: "2px solid #2e7d32",
                                background: "white", color: "#2e7d32", fontWeight: "600", fontSize: "14px",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.color = "white"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#2e7d32"; }}>
                                <FaCommentDots /> Nhắn tin
                            </button>
                            <div style={{ position: "relative" }}>
                                <button onClick={() => setShowShareMenu(!showShareMenu)} style={{
                                    padding: "12px 24px", borderRadius: "40px", border: "1px solid #ddd",
                                    background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                                    transition: "all 0.3s ease"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "#2e7d32"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#ddd"; }}>
                                    <FaShareAlt /> Chia sẻ
                                </button>
                                {showShareMenu && <div style={{ position: "absolute", top: "55px", right: 0, background: "white", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "8px", zIndex: 10, minWidth: "160px" }}>
                                    <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px", transition: "background 0.2s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaFacebook color="#1877f2" size={18} /> Facebook</button>
                                    <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px", transition: "background 0.2s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaTwitter color="#1da1f2" size={18} /> Twitter</button>
                                    <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px", transition: "background 0.2s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaInstagram color="#e4405f" size={18} /> Instagram</button>
                                </div>}
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: "30px" }}>
                        <div style={{ position: "relative", maxWidth: "500px" }}>
                            <FaSearch style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm sản phẩm trong shop..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                style={{
                                    width: "100%", padding: "14px 20px 14px 48px", border: "1px solid #e0e0e0", borderRadius: "40px", fontSize: "14px", outline: "none", transition: "all 0.3s ease", background: "#f8f9fa"
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#2e7d32"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(46,125,50,0.1)"; e.currentTarget.style.background = "white"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f8f9fa"; }} 
                            />
                            {searchTerm && (
                                <div style={{ 
                                    position: "absolute", 
                                    right: "18px", 
                                    top: "50%", 
                                    transform: "translateY(-50%)", 
                                    fontSize: "12px", 
                                    color: "#999",
                                    background: "#f0f0f0",
                                    padding: "2px 8px",
                                    borderRadius: "20px"
                                }}>
                                    {filteredProducts.length} kết quả
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "32px", borderBottom: "2px solid #eee", margin: "0 20px 30px" }}>
                    {[
                        { id: "about", label: "Giới thiệu", icon: <FaStore size={16} /> },
                        { id: "products", label: "Sản phẩm", icon: <FaBox size={16} /> },
                        { id: "qa", label: "Đánh giá & Hỏi đáp", icon: <FaStar size={16} /> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: "12px 0", background: "none", border: "none", fontSize: "16px", fontWeight: activeTab === tab.id ? "600" : "500",
                            color: activeTab === tab.id ? "#2e7d32" : "#666", borderBottom: activeTab === tab.id ? "3px solid #2e7d32" : "none",
                            cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "8px"
                        }}
                        onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#2e7d32"; }}
                        onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#666"; }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: "0 20px" }}>
                    {/* About Tab */}
                    {activeTab === "about" && (
                        <div>
                            <div style={{
                                background: "white", borderRadius: "24px", overflow: "hidden", marginBottom: "24px",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}>
                                <div style={{ background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)", padding: "20px 28px" }}>
                                    <h3 style={{ margin: 0, fontSize: "20px", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FaStore /> Giới thiệu về shop
                                    </h3>
                                </div>
                                <div style={{ padding: "28px" }}>
                                    <p style={{ lineHeight: "1.8", color: "#555", fontSize: "15px" }}>{shop?.description || "Chưa có thông tin giới thiệu"}</p>
                                </div>
                            </div>

                            <div style={{
                                background: "white", borderRadius: "24px", overflow: "hidden",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}>
                                <div style={{ background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)", padding: "20px 28px" }}>
                                    <h3 style={{ margin: 0, fontSize: "20px", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FaMapMarkerAlt /> Thông tin liên hệ
                                    </h3>
                                </div>
                                <div style={{ padding: "28px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "16px" }}>
                                            <div style={{ width: "44px", height: "44px", background: "#e8f5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", fontSize: "20px" }}><FaMapMarkerAlt /></div>
                                            <div><div style={{ fontSize: "12px", color: "#999" }}>Địa chỉ</div><div style={{ fontWeight: "500", color: "#333" }}>{shop?.address || "Chưa cập nhật"}</div></div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "16px" }}>
                                            <div style={{ width: "44px", height: "44px", background: "#e8f5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", fontSize: "20px" }}><FaPhone /></div>
                                            <div><div style={{ fontSize: "12px", color: "#999" }}>Điện thoại</div><div style={{ fontWeight: "500", color: "#333" }}>{shop?.phone || "Chưa cập nhật"}</div></div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "16px" }}>
                                            <div style={{ width: "44px", height: "44px", background: "#e8f5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", fontSize: "20px" }}><FaEnvelope /></div>
                                            <div><div style={{ fontSize: "12px", color: "#999" }}>Email</div><div style={{ fontWeight: "500", color: "#333" }}>{shop?.email || "Chưa cập nhật"}</div></div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "16px" }}>
                                            <div style={{ width: "44px", height: "44px", background: "#e8f5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", fontSize: "20px" }}><FaCalendarAlt /></div>
                                            <div><div style={{ fontSize: "12px", color: "#999" }}>Tham gia</div><div style={{ fontWeight: "500", color: "#333" }}>{formatDate(shop?.created_at)}</div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === "products" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
                                    Danh sách sản phẩm
                                    {searchTerm && <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666", marginLeft: "12px" }}>({filteredProducts.length} kết quả)</span>}
                                </h3>
                                {searchTerm && filteredProducts.length === 0 && (
                                    <button 
                                        onClick={() => setSearchTerm("")}
                                        style={{
                                            padding: "6px 16px",
                                            background: "#f0f0f0",
                                            border: "none",
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            color: "#666"
                                        }}
                                    >
                                        Xóa tìm kiếm
                                    </button>
                                )}
                            </div>
                            
                            {searchTerm && filteredProducts.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px" }}>
                                    <FaSearch style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }} />
                                    <h4 style={{ color: "#666", marginBottom: "8px" }}>Không tìm thấy sản phẩm "{searchTerm}"</h4>
                                    <p style={{ color: "#999", fontSize: "14px" }}>Vui lòng thử lại với từ khóa khác</p>
                                    <button 
                                        onClick={() => setSearchTerm("")}
                                        style={{
                                            marginTop: "16px",
                                            padding: "8px 20px",
                                            background: "#2e7d32",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "20px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Xem tất cả sản phẩm
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                                    {filteredProducts.map(product => {
                                        const isHovered = hoveredProductId === product.id;
                                        return (
                                            <div 
                                                key={product.id} 
                                                onClick={() => handleProductClick(product.id)} 
                                                onMouseEnter={() => setHoveredProductId(product.id)}
                                                onMouseLeave={() => setHoveredProductId(null)}
                                                style={{
                                                    background: "white", 
                                                    borderRadius: "20px", 
                                                    overflow: "hidden", 
                                                    cursor: "pointer",
                                                    transition: "all 0.3s ease-in-out", 
                                                    boxShadow: isHovered ? "0 20px 40px rgba(0,0,0,0.15)" : "0 2px 12px rgba(0,0,0,0.05)",
                                                    transform: isHovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
                                                    willChange: "transform, box-shadow"
                                                }}>
                                                <div style={{ height: "220px", backgroundImage: `url(${product.image_url})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                                                    {product.sold_count > 0 && (
                                                        <span style={{ position: "absolute", top: "12px", right: "12px", background: "#ff4444", color: "white", padding: "4px 10px", borderRadius: "30px", fontSize: "12px", fontWeight: "500" }}>
                                                            🔥 Đã bán {product.sold_count}
                                                        </span>
                                                    )}
                                                    {isHovered && (
                                                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
                                                            <span style={{ background: "white", padding: "10px 24px", borderRadius: "40px", fontSize: "14px", fontWeight: "600", color: "#2e7d32", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                                                                <FaEye style={{ marginRight: "8px" }} /> Xem chi tiết
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ padding: "20px" }}>
                                                    <h4 style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600", color: "#333" }}>{product.name}</h4>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>{renderStars(product.rating || 4.5)}</div>
                                                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#d32f2f", marginBottom: "12px" }}>{formatCurrency(product.price)}</div>
                                                    <button style={{ 
                                                        width: "100%", padding: "12px", background: isHovered ? "#2e7d32" : "#f5f5f5", 
                                                        color: isHovered ? "white" : "#2e7d32", border: "none", borderRadius: "40px", 
                                                        cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", 
                                                        justifyContent: "center", gap: "8px", transition: "all 0.3s ease"
                                                    }}>
                                                        <FaShoppingCart /> Mua ngay
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Q&A Tab */}
                    {activeTab === "qa" && (
                        <div>
                            {/* Rating Summary Card */}
                            <div style={{
                                background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)",
                                borderRadius: "24px", padding: "32px", marginBottom: "32px",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", gap: "48px", flexWrap: "wrap", alignItems: "center" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "64px", fontWeight: "bold", color: "#f5b042", lineHeight: 1 }}>{shop?.rating || 0}</div>
                                        <div style={{ display: "flex", justifyContent: "center", gap: "4px", margin: "12px 0 8px" }}>{renderStars(shop?.rating || 0)}</div>
                                        <div style={{ color: "#666", fontSize: "14px" }}>{formatNumber(shop?.total_reviews)} đánh giá</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {ratingOptions.map(option => {
                                            const total = reviews.length;
                                            const count = ratingDistribution[option.value] || 0;
                                            const percentage = total > 0 ? (count / total) * 100 : 0;
                                            return (
                                                <div key={option.value} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                                                    <span style={{ width: "50px", fontSize: "14px", fontWeight: "500" }}>{option.label}</span>
                                                    <div style={{ flex: 1, height: "8px", background: "#eee", borderRadius: "10px", overflow: "hidden" }}>
                                                        <div style={{ width: `${percentage}%`, height: "100%", background: "#f5b042", borderRadius: "10px", transition: "width 0.5s ease" }} />
                                                    </div>
                                                    <span style={{ width: "40px", color: "#666", fontSize: "13px" }}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Rating Filters */}
                            <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap", borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                                <button onClick={() => setRatingFilter(null)} style={{
                                    padding: "8px 24px", borderRadius: "40px", border: "none",
                                    background: !ratingFilter ? "#2e7d32" : "#f0f0f0",
                                    color: !ratingFilter ? "white" : "#666",
                                    cursor: "pointer", fontWeight: "500", transition: "all 0.2s ease"
                                }}>
                                    Tất cả
                                </button>
                                {ratingOptions.map(option => (
                                    <button key={option.value} onClick={() => setRatingFilter(option.value)} style={{
                                        padding: "8px 24px", borderRadius: "40px", border: "none",
                                        background: ratingFilter === option.value ? "#2e7d32" : "#f0f0f0",
                                        color: ratingFilter === option.value ? "white" : "#666",
                                        cursor: "pointer", fontWeight: "500", transition: "all 0.2s ease"
                                    }}>
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* Comments List */}
                            <div style={{ marginBottom: "32px" }}>
                                <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FaCommentDots /> Bình luận ({filteredReviews.length})
                                </h3>
                                {filteredReviews.length > 0 ? filteredReviews.map(review => {
                                    const isHovered = hoveredReviewId === review.id;
                                    return (
                                        <div key={review.id} 
                                            onMouseEnter={() => setHoveredReviewId(review.id)}
                                            onMouseLeave={() => setHoveredReviewId(null)}
                                            style={{
                                                padding: "24px",
                                                marginBottom: "16px",
                                                background: "white",
                                                borderRadius: "20px",
                                                transition: "all 0.3s ease",
                                                boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.1)" : "0 2px 12px rgba(0,0,0,0.05)",
                                                transform: isHovered ? "translateY(-2px)" : "translateY(0)"
                                            }}>
                                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                                {review.user_avatar ? (
                                                    <img src={review.user_avatar} alt={review.user_name} style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px" }}>
                                                        <FaUserCircle />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                                                        <div>
                                                            <strong style={{ fontSize: "16px", color: "#333" }}>{review.user_name}</strong>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>{renderStars(review.rating)}</div>
                                                        </div>
                                                        <span style={{ color: "#999", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                            <FaClock size={12} /> {formatDate(review.date)}
                                                        </span>
                                                    </div>
                                                    <p style={{ color: "#555", lineHeight: "1.6", marginTop: "8px", fontSize: "15px" }}>{review.comment}</p>
                                                    <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
                                                        <button onClick={() => handleLikeReview(review.id)} style={{
                                                            display: "flex", alignItems: "center", gap: "6px",
                                                            background: "none", border: "none", cursor: "pointer",
                                                            color: likedReviews[review.id] ? "#2e7d32" : "#999",
                                                            fontSize: "13px", transition: "color 0.2s"
                                                        }}>
                                                            <FaThumbsUp /> {likedReviews[review.id] ? (review.likes + 1) : review.likes}
                                                        </button>
                                                        <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: "13px" }}>
                                                            <FaReply /> Trả lời
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px", color: "#666" }}>Chưa có bình luận nào</div>}
                            </div>

                            {/* Add Comment */}
                            <div style={{
                                background: "white",
                                borderRadius: "24px",
                                padding: "28px",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
                            }}>
                                <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FaEdit /> Viết bình luận
                                </h3>
                                
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ fontWeight: "500", marginBottom: "8px", display: "block", color: "#555" }}>Đánh giá của bạn:</label>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setNewRating(star)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontSize: "28px",
                                                    padding: "4px",
                                                    transition: "transform 0.2s"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                            >
                                                {star <= newRating ? (
                                                    <FaStar style={{ color: "#ffc107" }} />
                                                ) : (
                                                    <FaRegStar style={{ color: "#ddd" }} />
                                                )}
                                            </button>
                                        ))}
                                        <span style={{ marginLeft: "8px", color: "#666", fontSize: "14px" }}>
                                            ({newRating} sao)
                                        </span>
                                    </div>
                                </div>
                                
                                <textarea 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder="Chia sẻ cảm nhận của bạn về cửa hàng..." 
                                    rows="4" 
                                    style={{
                                        width: "100%",
                                        padding: "16px",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "16px",
                                        marginBottom: "16px",
                                        fontSize: "14px",
                                        resize: "vertical",
                                        transition: "all 0.3s",
                                        fontFamily: "inherit"
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "#2e7d32"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(46,125,50,0.1)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.boxShadow = "none"; }}
                                />
                                <button 
                                    onClick={handleSubmitComment} 
                                    style={{
                                        padding: "12px 32px",
                                        background: "#2e7d32",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "40px",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        transition: "all 0.3s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(46,125,50,0.3)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                                    <FaCommentDots /> Gửi bình luận
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </ShopDetailLayout>
    );
};

export default ShopDetailPage;