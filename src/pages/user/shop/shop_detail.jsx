// pages/user/shop/ShopDetailPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";
import api from "../../../api/api";
import io from "socket.io-client";
import socket from "../../../socket"; 
import { 
  FaStore, FaUsers, FaCommentDots, FaStar, FaStarHalfAlt,
  FaRegStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt,
  FaHeart, FaRegHeart, FaSearch, FaBox, FaShoppingCart, FaEye,
  FaCheckCircle, FaShareAlt, FaFacebook, FaTwitter, FaInstagram,
  FaTruck, FaShieldAlt, FaClock, FaReply, FaThumbsUp, FaUserCircle, FaEdit,
  FaFilter, FaSortAmountDown, FaSortAmountUp, FaSortAmountDownAlt,
  FaPaperPlane, FaTimes
} from 'react-icons/fa';
import '../../../css/shop_detail_page.css'; // Import CSS file

const ShopDetailPage = () => {
    const { shop_id } = useParams();
    const navigate = useNavigate();
    
    // State
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
    const [sortOption, setSortOption] = useState("default");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [productReviews, setProductReviews] = useState({});
    const [loadingReviews, setLoadingReviews] = useState(false);
    
    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [newChatMessage, setNewChatMessage] = useState('');
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [actionMenuMessageId, setActionMenuMessageId] = useState(null);
    const token = localStorage.getItem('user_token');

    // Lọc và sắp xếp sản phẩm
    const getFilteredAndSortedProducts = () => {
        let filtered = [...products];
        
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(product => 
                (product.name || "").toLowerCase().includes(searchLower)
            );
        }
        
        switch (sortOption) {
            case "price_asc":
                filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case "price_desc":
                filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case "rating_desc":
                filtered.sort((a, b) => (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0));
                break;
            case "sold_desc":
                filtered.sort((a, b) => (b.sold_count || b.sold_quantity || 0) - (a.sold_count || a.sold_quantity || 0));
                break;
            default:
                filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }
        
        return filtered;
    };
    
    const filteredProducts = getFilteredAndSortedProducts();

    const handleSendMessage = () => {
        setShowChatModal(true);
    };

    const fetchChatMessages = async () => {
        if (!shop_id) return;
        setChatLoading(true);
        try {
            const response = await api.get(`/api/v1/chat/conversation/${shop_id}`);
            const sortedMessages = [...response.data].sort((a, b) => {
                return new Date(a.created_at) - new Date(b.created_at);
            });
            setChatMessages(sortedMessages);
            
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            }, 200);
        } catch (error) {
            console.error("Error fetching chat messages:", error);
        } finally {
            setChatLoading(false);
        }
    };

    const sendChatMessage = async () => {
        if (!newChatMessage.trim()) return;
        
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            alert("Vui lòng đăng nhập để nhắn tin");
            navigate('/login');
            return;
        }
        
        const content = newChatMessage.trim();
        const currentContent = content;
        
        setNewChatMessage('');
        
        try {
            await api.post('/api/v1/chat/send', null, {
                params: {
                    receiver_id: shop_id,
                    content: currentContent,
                    message_type: "text"
                }
            });
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
        }
    }; 

    const handleDeleteMessage = async (message) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
        
        try {
            await api.delete(`/api/v1/chat/${message.id}`);
            setChatMessages(prev => prev.filter(m => m.id !== message.id));
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Không thể xóa tin nhắn");
        }
    };

    const handleStartEdit = (message) => {
        setEditingMessage(message);
        setEditContent(message.content);
    };

    useEffect(() => {
        if (!shop_id) return;
        fetchShopData();
        checkFollowStatus();
    }, [shop_id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const menuButton = document.querySelector('.message-menu-button');
            const menuContent = document.querySelector('.message-menu-content');
            
            if (actionMenuMessageId && 
                menuButton && !menuButton.contains(event.target) &&
                menuContent && !menuContent.contains(event.target)) {
                setActionMenuMessageId(null);
            }
        };
        
        if (actionMenuMessageId) {
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [actionMenuMessageId]);

    useEffect(() => {
        if (showChatModal && shop_id) {
            fetchChatMessages();
            
            const userToken = localStorage.getItem('user_token');
            if (userToken) {
                if (!socket.connected) {
                    socket.connect();
                }
                
                const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
                const currentUserId = userData.id || userData._id;
                
                const handleConnect = () => {
                    console.log('Socket connected');
                    if (currentUserId) {
                        socket.emit('join', { user_id: currentUserId });
                        console.log(`Joined room: user_${currentUserId}`);
                    }
                };
                
                const handleNewMessage = (msg) => {
                    console.log('📨 Received new message:', msg);
                    
                    if (msg.sender_id === shop_id || msg.receiver_id === shop_id) {
                        setChatMessages(prev => {
                            const isDuplicate = prev.some(existingMsg => 
                                existingMsg.id === msg.id || 
                                (existingMsg.content === msg.content && 
                                Math.abs(new Date(existingMsg.created_at) - new Date(msg.created_at)) < 2000)
                            );
                            
                            if (isDuplicate) {
                                console.log('Duplicate message ignored:', msg);
                                return prev;
                            }
                            
                            console.log('New message added to UI:', msg);
                            return [...prev, msg];
                        });
                        
                        setTimeout(() => {
                            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                    }
                };
                
                if (socket.connected) {
                    handleConnect();
                }
                
                socket.on('connect', handleConnect);
                socket.on('new_message', handleNewMessage);
                socket.on('message_edited', handleMessageEdited);
                socket.on('message_deleted', handleMessageDeleted);
                
                return () => {
                    socket.off('connect', handleConnect);
                    socket.off('new_message', handleNewMessage);
                    socket.off('message_edited', handleMessageEdited);
                    socket.off('message_deleted', handleMessageDeleted);
                };
            }
        }
    }, [showChatModal, shop_id]);

    const fetchShopData = async () => {
        setLoading(true);
        try {
            const shopRes = await api.get(`/api/v1/shops/${shop_id}`);
            setShop(shopRes.data);

            let normalizedProducts = [];
            
            try {
                const productsRes = await api.get(`/api/v1/shops/${shop_id}/products`);
                normalizedProducts = (productsRes.data || []).map(product => ({
                    ...product,
                    id: product.id || product._id,
                    rating: product.average_rating || product.rating || 0,
                    sold_count: product.sold_count || product.sold_quantity || 0
                }));
                setProducts(normalizedProducts);
                
                if (shopRes.data && normalizedProducts.length !== shopRes.data.products_count) {
                    setShop(prev => ({
                        ...prev,
                        products_count: normalizedProducts.length
                    }));
                }
            } catch (productsError) {
                console.error("Error fetching products:", productsError);
                setProducts([]);
            }

            try {
                const reviewsRes = await api.get(`/api/v1/shops/${shop_id}/reviews`);
                const normalizedReviews = (reviewsRes.data || []).map(review => ({
                    ...review,
                    id: review.id || review._id,
                    date: review.created_at || review.date,
                    likes: review.helpful_count || review.likes || 0
                }));
                setReviews(normalizedReviews);
            } catch (reviewsError) {
                console.error("Error fetching reviews:", reviewsError);
                setReviews([]);
            }
            
            await fetchProductsRatings(normalizedProducts);
            
        } catch (error) {
            console.error("Error fetching shop data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchProductsRatings = async (productsList) => {
        if (!productsList || productsList.length === 0) return;
        
        setLoadingReviews(true);
        try {
            const ratingsMap = {};
            for (const product of productsList) {
                try {
                    const statsRes = await api.get(`/api/v1/reviews/product/${product.id}/stats`);
                    ratingsMap[product.id] = statsRes.data;
                } catch (err) {
                    ratingsMap[product.id] = { average_rating: 0, total_reviews: 0 };
                }
            }
            setProductReviews(ratingsMap);
        } catch (error) {
            console.error("Error fetching products ratings:", error);
        } finally {
            setLoadingReviews(false);
        }
    };

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

    const handleProductClick = (productId) => navigate(`/product/${productId}`);
    
    const handleSaveEdit = async () => {
        if (!editContent.trim() || !editingMessage) return;
        
        try {
            await api.put(`/api/v1/chat/${editingMessage.id}`, null, {
                params: { content: editContent.trim() }
            });
            setChatMessages(prev => prev.map(m => 
                m.id === editingMessage.id 
                    ? { ...m, content: editContent.trim(), is_edited: true }
                    : m
            ));
            setEditingMessage(null);
            setEditContent('');
        } catch (error) {
            console.error("Error editing message:", error);
            alert("Không thể sửa tin nhắn");
        }
    };

    const handleMessageDeleted = (data) => {
        setChatMessages(prev => prev.filter(m => m.id !== data.id));
    };

    const handleMessageEdited = (data) => {
        setChatMessages(prev => prev.map(m => 
            m.id === data.id 
                ? { ...m, content: data.content, is_edited: true }
                : m
        ));
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        if (!token) {
            alert("Vui lòng đăng nhập để bình luận");
            navigate('/login');
            return;
        }
        
        try {
            const response = await api.post(`/api/v1/shops/${shop_id}/reviews`, { 
                comment: newComment, 
                rating: newRating
            });
            const newReview = {
                id: response.data.id || Date.now(),
                user_name: response.data.user_name || "Bạn",
                user_avatar: response.data.user_avatar || null,
                rating: newRating,
                comment: newComment,
                date: new Date().toISOString(),
                likes: 0
            };
            setReviews([newReview, ...reviews]);
            setNewComment("");
            setNewRating(5);
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert(error.response?.data?.detail || "Có lỗi xảy ra");
        }
    };

    const handleLikeReview = async (reviewId) => {
        if (!token) {
            alert("Vui lòng đăng nhập để thích bình luận");
            navigate('/login');
            return;
        }
        
        try {
            await api.post(`/api/v1/shop-reviews/${reviewId}/like`);
            setLikedReviews(prev => ({
                ...prev,
                [reviewId]: !prev[reviewId]
            }));
            setReviews(prev => prev.map(review => 
                review.id === reviewId 
                    ? { ...review, likes: (review.likes || 0) + (likedReviews[reviewId] ? -1 : 1) }
                    : review
            ));
        } catch (error) {
            console.error("Error liking review:", error);
        }
    };

    const formatNumber = (num) => {
        if (!num) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
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

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) stars.push(<FaStar key={i} className="star-filled" />);
            else if (i === fullStars + 1 && hasHalfStar) stars.push(<FaStarHalfAlt key={i} className="star-half" />);
            else stars.push(<FaRegStar key={i} className="star-empty" />);
        }
        return stars;
    };

    const getSortLabel = () => {
        switch (sortOption) {
            case "price_asc": return "Giá tăng dần";
            case "price_desc": return "Giá giảm dần";
            case "rating_desc": return "Đánh giá cao nhất";
            case "sold_desc": return "Bán chạy nhất";
            default: return "Mới nhất";
        }
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

    const displayProductsCount = products.length > 0 ? products.length : (shop?.products_count || 0);

    if (loading && !shop) return (
        <ShopDetailLayout shop={null}>
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Đang tải thông tin cửa hàng...</p>
            </div>
        </ShopDetailLayout>
    );

    if (!shop) return (
        <ShopDetailLayout shop={null}>
            <div className="not-found-container">
                <h2>Không tìm thấy cửa hàng</h2>
                <button onClick={() => navigate('/shop')} className="back-button">Quay lại</button>
            </div>
        </ShopDetailLayout>
    );

    return (
        <ShopDetailLayout shop={shop}>
            <div className="shop-detail-container">
                {/* Hero Section */}
                <div className="hero-section">
                    <div className="hero-banner" style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${shop?.banner_url || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop"})`
                    }}>
                        <div className="hero-content">
                            <div 
                                className="shop-avatar" 
                                style={{
                                    backgroundImage: shop?.logo_url ? `url(${shop.logo_url})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} 
                            />
                            <div className="shop-info">
                                <h1>{shop?.name}</h1>
                                <div className="shop-stats">
                                    <span className="shop-stat">
                                        <FaStar className="star-icon" /> {shop?.rating || 0}
                                    </span>
                                    <span className="shop-stat">
                                        {formatNumber(shop?.total_reviews)} đánh giá
                                    </span>
                                    <span className="shop-stat">
                                        <FaCalendarAlt /> Tham gia {formatDate(shop?.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shop-info-bar">
                    <div className="stats-group">
                        {[
                            { value: displayProductsCount, label: "Sản phẩm", icon: <FaBox /> },
                            { value: formatNumber(shop?.followers_count), label: "Người theo dõi", icon: <FaUsers /> },       
                        ].map((stat, idx) => (
                            <div key={idx} className="stat-item">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">
                                    {stat.icon} {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="action-buttons">
                        <button 
                            onClick={handleFollow} 
                            disabled={followLoading}
                            className={`follow-button ${isFollowing ? 'following' : ''}`}
                        >
                            {isFollowing ? <FaHeart className="heart-icon" /> : <FaRegHeart />}
                            {followLoading ? "Đang xử lý..." : (isFollowing ? "Đã theo dõi" : "Theo dõi")}
                        </button>
                        <button onClick={handleSendMessage} className="chat-button">
                            <FaCommentDots /> Nhắn tin
                        </button>
                        <div className="share-wrapper">
                            <button onClick={() => setShowShareMenu(!showShareMenu)} className="share-button">
                                <FaShareAlt /> Chia sẻ
                            </button>
                            {showShareMenu && (
                                <div className="share-menu">
                                    <button className="share-option"><FaFacebook /> Facebook</button>
                                    <button className="share-option"><FaTwitter /> Twitter</button>
                                    <button className="share-option"><FaInstagram /> Instagram</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar và Sort */}
                <div className="search-section">
                    <div className="search-wrapper">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm sản phẩm trong shop..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="search-input"
                        />
                        {searchTerm && (
                            <div className="search-result-count">
                                {filteredProducts.length} kết quả
                            </div>
                        )}
                    </div>
                    
                    <div className="sort-wrapper">
                        <button 
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="filter-button"
                        >
                            <FaFilter /> Sắp xếp: {getSortLabel()} 
                            {sortOption === "price_asc" ? <FaSortAmountDown /> : 
                             sortOption === "price_desc" ? <FaSortAmountUp /> : 
                             <FaSortAmountDownAlt />}
                        </button>
                        
                        {showSortMenu && (
                            <div className="sort-menu">
                                {[
                                    { value: "default", label: "Mới nhất", icon: <FaClock size={14} /> },
                                    { value: "price_asc", label: "Giá tăng dần (thấp → cao)", icon: <FaSortAmountDown size={14} /> },
                                    { value: "price_desc", label: "Giá giảm dần (cao → thấp)", icon: <FaSortAmountUp size={14} /> },
                                    { value: "rating_desc", label: "Đánh giá cao nhất", icon: <FaStar size={14} /> },
                                    { value: "sold_desc", label: "Bán chạy nhất", icon: <FaShoppingCart size={14} /> }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSortOption(option.value);
                                            setShowSortMenu(false);
                                        }}
                                        className={`sort-option ${sortOption === option.value ? 'active' : ''}`}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                        {sortOption === option.value && <FaCheckCircle className="check-icon" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    {[
                        { id: "about", label: "Giới thiệu", icon: <FaStore size={16} /> },
                        { id: "products", label: "Sản phẩm", icon: <FaBox size={16} /> },
                        { id: "qa", label: "Đánh giá & Hỏi đáp", icon: <FaStar size={16} /> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* About Tab */}
                    {activeTab === "about" && (
                        <div>
                            <div className="about-card">
                                <div className="about-header">
                                    <h3><FaStore /> Giới thiệu về shop</h3>
                                </div>
                                <div className="about-content">
                                    <p>{shop?.description || "Chưa có thông tin giới thiệu"}</p>
                                </div>
                            </div>

                            <div className="about-card">
                                <div className="about-header">
                                    <h3><FaMapMarkerAlt /> Thông tin liên hệ</h3>
                                </div>
                                <div className="about-content">
                                    <div className="contact-grid">
                                        <div className="contact-item">
                                            <div className="contact-icon"><FaMapMarkerAlt /></div>
                                            <div className="contact-info">
                                                <div className="contact-label">Địa chỉ</div>
                                                <div className="contact-value">{shop?.address || "Chưa cập nhật"}</div>
                                            </div>
                                        </div>
                                        <div className="contact-item">
                                            <div className="contact-icon"><FaPhone /></div>
                                            <div className="contact-info">
                                                <div className="contact-label">Điện thoại</div>
                                                <div className="contact-value">{shop?.phone || "Chưa cập nhật"}</div>
                                            </div>
                                        </div>
                                        <div className="contact-item">
                                            <div className="contact-icon"><FaEnvelope /></div>
                                            <div className="contact-info">
                                                <div className="contact-label">Email</div>
                                                <div className="contact-value">{shop?.email || "Chưa cập nhật"}</div>
                                            </div>
                                        </div>
                                        <div className="contact-item">
                                            <div className="contact-icon"><FaCalendarAlt /></div>
                                            <div className="contact-info">
                                                <div className="contact-label">Tham gia</div>
                                                <div className="contact-value">{formatDate(shop?.created_at)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Tab - Phiên bản cải thiện */}
                    {activeTab === "products" && (
                    <div>
                        <div className="products-header">
                        <h3>
                            Danh sách sản phẩm
                            {searchTerm && <span className="search-info">({filteredProducts.length} kết quả)</span>}
                        </h3>
                        {searchTerm && filteredProducts.length === 0 && (
                            <button onClick={() => setSearchTerm("")} className="clear-search-btn">
                            Xóa tìm kiếm
                            </button>
                        )}
                        </div>
                        
                        {searchTerm && filteredProducts.length === 0 ? (
                        <div className="empty-state">
                            <FaSearch />
                            <h4>Không tìm thấy sản phẩm "{searchTerm}"</h4>
                            <p>Vui lòng thử lại với từ khóa khác</p>
                            <button onClick={() => setSearchTerm("")} className="view-all-btn">
                            Xem tất cả sản phẩm
                            </button>
                        </div>
                        ) : (
                        <div className="products-grid">
                            {filteredProducts.map(product => {
                            const isHovered = hoveredProductId === product.id;
                            const productRating = productReviews[product.id]?.average_rating || product.rating || 0;
                            const productRatingCount = productReviews[product.id]?.total_reviews || 0;
                            const soldCount = product.sold_count || product.sold_quantity || 0;
                            
                            return (
                                <div 
                                key={product.id} 
                                onClick={() => handleProductClick(product.id)} 
                                onMouseEnter={() => setHoveredProductId(product.id)}
                                onMouseLeave={() => setHoveredProductId(null)}
                                className="product-card"
                                >
                                <div className="product-image" style={{ backgroundImage: `url(${product.image_url || "https://via.placeholder.com/300"})` }}>
                                    {soldCount > 0 && (
                                    <span className="product-badge">
                                        🔥 Đã bán {soldCount}
                                    </span>
                                    )}
                                    <div className="product-overlay">
                                    <span className="view-detail">
                                        <FaEye /> Xem chi tiết
                                    </span>
                                    </div>
                                </div>
                                <div className="product-info">
                                    <h4 className="product-name">{product.name}</h4>
                                    <div className="product-price-row">
                                    <span className="product-price">{formatCurrency(product.price)}</span>
                                    {soldCount > 0 && (
                                        <span className="product-sold">Đã bán {soldCount}</span>
                                    )}
                                    </div>
                                    <div className="product-rating">
                                    {renderStars(productRating)}
                                    <span>({productRatingCount})</span>
                                    </div>
                                    <button className="buy-button">
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
                            <div className="rating-summary">
                                <div className="rating-summary-content">
                                    <div className="rating-score-section">
                                        <div className="rating-score">{shop?.rating || 0}</div>
                                        <div className="rating-stars">{renderStars(shop?.rating || 0)}</div>
                                        <div className="rating-total">{formatNumber(shop?.total_reviews)} đánh giá</div>
                                    </div>
                                    <div className="rating-distribution">
                                        {ratingOptions.map(option => {
                                            const total = reviews.length;
                                            const count = ratingDistribution[option.value] || 0;
                                            const percentage = total > 0 ? (count / total) * 100 : 0;
                                            return (
                                                <div key={option.value} className="rating-bar-item">
                                                    <span className="rating-bar-label">{option.label}</span>
                                                    <div className="rating-bar-track">
                                                        <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                    <span className="rating-bar-count">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Rating Filters */}
                            <div className="rating-filters">
                                <button onClick={() => setRatingFilter(null)} className={`filter-chip ${!ratingFilter ? 'active' : ''}`}>
                                    Tất cả
                                </button>
                                {ratingOptions.map(option => (
                                    <button key={option.value} onClick={() => setRatingFilter(option.value)} className={`filter-chip ${ratingFilter === option.value ? 'active' : ''}`}>
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* Comments List */}
                            <div className="comments-section">
                                <h3><FaCommentDots /> Bình luận ({filteredReviews.length})</h3>
                                {filteredReviews.length > 0 ? filteredReviews.map(review => {
                                    const isHovered = hoveredReviewId === review.id;
                                    return (
                                        <div key={review.id} 
                                            onMouseEnter={() => setHoveredReviewId(review.id)}
                                            onMouseLeave={() => setHoveredReviewId(null)}
                                            className={`review-card ${isHovered ? 'hovered' : ''}`}
                                        >
                                            <div className="review-content">
                                                {review.user_avatar ? (
                                                    <img src={review.user_avatar} alt={review.user_name} className="review-avatar" />
                                                ) : (
                                                    <div className="review-avatar-placeholder">
                                                        <FaUserCircle />
                                                    </div>
                                                )}
                                                <div className="review-details">
                                                    <div className="review-header">
                                                        <div>
                                                            <strong className="review-user-name">{review.user_name}</strong>
                                                            <div className="review-rating">{renderStars(review.rating)}</div>
                                                        </div>
                                                        <span className="review-date">
                                                            <FaClock size={12} /> {formatDate(review.date)}
                                                        </span>
                                                    </div>
                                                    <p className="review-comment">{review.comment}</p>
                                                    {review.reply && (
                                                        <div className="review-reply">
                                                            <div className="reply-header">
                                                                <FaReply size={12} />
                                                                <strong>Phản hồi từ shop</strong>
                                                            </div>
                                                            <p>{review.reply}</p>
                                                        </div>
                                                    )}
                                                    <div className="review-actions">
                                                        <button onClick={() => handleLikeReview(review.id)} className="like-button">
                                                            <FaThumbsUp /> {likedReviews[review.id] ? (review.likes + 1) : review.likes}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : <div className="empty-state">Chưa có bình luận nào</div>}
                            </div>

                            {/* Add Comment */}
                            <div className="add-comment-form">
                                <h3><FaEdit /> Viết bình luận</h3>
                                
                                <div className="rating-selector">
                                    <label>Đánh giá của bạn:</label>
                                    <div className="star-selector">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setNewRating(star)}
                                                className="star-btn"
                                            >
                                                {star <= newRating ? (
                                                    <FaStar className="star-filled" />
                                                ) : (
                                                    <FaRegStar className="star-empty" />
                                                )}
                                            </button>
                                        ))}
                                        <span className="rating-value">({newRating} sao)</span>
                                    </div>
                                </div>
                                
                                <textarea 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder="Chia sẻ cảm nhận của bạn về cửa hàng..." 
                                    rows="4" 
                                    className="comment-textarea"
                                />
                                <button onClick={handleSubmitComment} className="submit-comment-btn">
                                    <FaCommentDots /> Gửi bình luận
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Modal */}
            {showChatModal && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal">
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <img 
                                    src={shop?.logo_url || "https://via.placeholder.com/40"} 
                                    alt={shop?.name}
                                    className="chat-avatar"
                                />
                                <div>
                                    <div className="chat-shop-name">{shop?.name}</div>
                                    <div className="chat-status">Đang hoạt động</div>
                                </div>
                            </div>
                            <FaTimes 
                                className="close-chat" 
                                onClick={() => setShowChatModal(false)}
                            />
                        </div>

                        {/* Messages Area */}
                        <div className="chat-messages">
                            {chatLoading ? (
                                <div className="chat-loading">
                                    <div className="loading-spinner small" />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="chat-empty">
                                    Bắt đầu trò chuyện cùng shop
                                </div>
                            ) : (
                                chatMessages.map((msg, index) => {
                                    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
                                    const currentUserId = userData.id || userData._id;
                                    const isMe = msg.sender_id === currentUserId;
                                    const isEditing = editingMessage?.id === msg.id;
                                    const showMenu = actionMenuMessageId === msg.id;
                                    
                                    return (
                                        <div key={msg.id || index} className={`chat-message ${isMe ? 'me' : 'other'}`}>
                                            {isEditing ? (
                                                <div className="message-edit-mode">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                        className="edit-input"
                                                        autoFocus
                                                    />
                                                    <button onClick={handleSaveEdit} className="edit-save">💾</button>
                                                    <button onClick={() => { setEditingMessage(null); setEditContent(''); }} className="edit-cancel">✖</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="message-content">
                                                        {msg.content}
                                                        {msg.is_edited && <span className="edited-badge">(đã sửa)</span>}
                                                    </div>
                                                    
                                                    {isMe && (
                                                        <div className="message-actions">
                                                            <button
                                                                onClick={() => setActionMenuMessageId(showMenu ? null : msg.id)}
                                                                className="message-menu-button"
                                                            >
                                                                ⋯
                                                            </button>
                                                            
                                                            {showMenu && (
                                                                <div className="message-menu-content">
                                                                    <button onClick={() => { handleStartEdit(msg); setActionMenuMessageId(null); }} className="menu-edit">
                                                                        ✏️ Sửa
                                                                    </button>
                                                                    <button onClick={() => { handleDeleteMessage(msg); setActionMenuMessageId(null); }} className="menu-delete">
                                                                        🗑️ Xóa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div className="message-time">
                                                {(() => {
                                                    const date = new Date(msg.created_at);
                                                    date.setHours(date.getHours() + 7);
                                                    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="chat-input-area">
                            <div className="chat-input-wrapper">
                                <input
                                    type="text"
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                    placeholder="Nhập tin nhắn..."
                                    className="chat-input"
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!newChatMessage.trim()}
                                    className="send-button"
                                >
                                    <FaPaperPlane size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ShopDetailLayout>
    );
};

export default ShopDetailPage;