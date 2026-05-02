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
    const [newChatMessage, setNewChatMessage] = useState(''); // THÊM STATE NÀY
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
            // Sắp xếp tin nhắn theo thời gian tăng dần (cũ lên đầu, mới xuống cuối)
            const sortedMessages = [...response.data].sort((a, b) => {
                return new Date(a.created_at) - new Date(b.created_at);
            });
            setChatMessages(sortedMessages);
            
            // Scroll xuống cuối sau khi messages được set
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
        
        // Xóa input ngay lập tức
        setNewChatMessage('');
        
        try {
            // Gửi tin nhắn qua API - backend sẽ lưu vào database và emit socket
            await api.post('/api/v1/chat/send', null, {
                params: {
                    receiver_id: shop_id,
                    content: currentContent,
                    message_type: "text"
                }
            });
            // KHÔNG thêm tin nhắn tạm ở đây - đợi socket trả về
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

    // Fetch dữ liệu từ API
    useEffect(() => {
        if (!shop_id) return;
        fetchShopData();
        checkFollowStatus();
    }, [shop_id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Kiểm tra nếu click không phải vào menu button hoặc menu content
            const menuButton = document.querySelector('.message-menu-button');
            const menuContent = document.querySelector('.message-menu-content');
            
            if (actionMenuMessageId && 
                menuButton && !menuButton.contains(event.target) &&
                menuContent && !menuContent.contains(event.target)) {
                setActionMenuMessageId(null);
            }
        };
        
        if (actionMenuMessageId) {
            // Dùng setTimeout để tránh click event ngay lập tức
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [actionMenuMessageId]);

    // Trong ShopDetailPage.jsx, cập nhật useEffect cho socket

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
                        // THAY ĐỔI: Join room với định dạng user_{userId}
                        socket.emit('join', { user_id: currentUserId });
                        console.log(`Joined room: user_${currentUserId}`);
                    }
                };
                
                // Handler nhận tin nhắn mới
                const handleNewMessage = (msg) => {
                    console.log('📨 Received new message:', msg);
                    
                    // Chỉ xử lý tin nhắn liên quan đến shop này
                    if (msg.sender_id === shop_id || msg.receiver_id === shop_id) {
                        setChatMessages(prev => {
                            // Kiểm tra trùng lặp
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
                        
                        // Scroll xuống cuối
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
            if (i <= fullStars) stars.push(<FaStar key={i} style={{ color: "#ffc107" }} />);
            else if (i === fullStars + 1 && hasHalfStar) stars.push(<FaStarHalfAlt key={i} style={{ color: "#ffc107" }} />);
            else stars.push(<FaRegStar key={i} style={{ color: "#ddd" }} />);
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
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${shop?.banner_url || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop"})`,
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
                                        <FaStar style={{ color: "#ffc107" }} /> {shop?.rating || 0}
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
                                padding: "12px 28px",
                                borderRadius: "40px",
                                fontWeight: "600",
                                background: isFollowing ? "#fff" : "#2e7d32",
                                color: isFollowing ? "#2e7d32" : "white",
                                border: isFollowing ? "2px solid #2e7d32" : "none",
                                cursor: followLoading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.3s ease",
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

                    {/* Search Bar và Sort */}
                    <div style={{ marginBottom: "30px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
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
                        
                        <div style={{ position: "relative" }}>
                            <button 
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                style={{
                                    padding: "14px 24px",
                                    borderRadius: "40px",
                                    border: "1px solid #e0e0e0",
                                    background: "white",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    transition: "all 0.3s ease"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2e7d32"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <FaFilter /> Sắp xếp: {getSortLabel()} 
                                {sortOption === "price_asc" ? <FaSortAmountDown /> : 
                                 sortOption === "price_desc" ? <FaSortAmountUp /> : 
                                 <FaSortAmountDownAlt />}
                            </button>
                            
                            {showSortMenu && (
                                <div style={{
                                    position: "absolute",
                                    top: "55px",
                                    right: 0,
                                    background: "white",
                                    borderRadius: "16px",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                                    padding: "8px",
                                    zIndex: 100,
                                    minWidth: "220px",
                                    border: "1px solid #f0f0f0"
                                }}>
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
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "12px 16px",
                                                width: "100%",
                                                border: "none",
                                                background: sortOption === option.value ? "#e8f5e9" : "white",
                                                borderRadius: "12px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                color: sortOption === option.value ? "#2e7d32" : "#333",
                                                fontWeight: sortOption === option.value ? "600" : "400"
                                            }}
                                            onMouseEnter={(e) => { if (sortOption !== option.value) e.currentTarget.style.background = "#f5f5f5"; }}
                                            onMouseLeave={(e) => { if (sortOption !== option.value) e.currentTarget.style.background = "white"; }}
                                        >
                                            {option.icon}
                                            <span style={{ flex: 1, textAlign: "left" }}>{option.label}</span>
                                            {sortOption === option.value && <FaCheckCircle size={14} color="#2e7d32" />}
                                        </button>
                                    ))}
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
                                        const productRating = productReviews[product.id]?.average_rating || product.rating || 0;
                                        const productRatingCount = productReviews[product.id]?.total_reviews || 0;
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
                                                <div style={{ height: "220px", backgroundImage: `url(${product.image_url || "https://via.placeholder.com/300"})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                                                    {(product.sold_count || product.sold_quantity) > 0 && (
                                                        <span style={{ position: "absolute", top: "12px", right: "12px", background: "#ff4444", color: "white", padding: "4px 10px", borderRadius: "30px", fontSize: "12px", fontWeight: "500" }}>
                                                            🔥 Đã bán {product.sold_count || product.sold_quantity}
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
                                                    <h4 style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600", color: "#333", lineHeight: "1.4", minHeight: "50px" }}>{product.name}</h4>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
                                                        {renderStars(productRating)}
                                                        <span style={{ fontSize: "12px", color: "#666", marginLeft: "4px" }}>({productRatingCount})</span>
                                                    </div>
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
                                                    {review.reply && (
                                                        <div style={{
                                                            marginTop: "12px",
                                                            padding: "12px 16px",
                                                            background: "#f8f9fa",
                                                            borderRadius: "12px",
                                                            borderLeft: "3px solid #2e7d32"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                                                <FaReply size={12} color="#2e7d32" />
                                                                <strong style={{ fontSize: "13px", color: "#2e7d32" }}>Phản hồi từ shop</strong>
                                                            </div>
                                                            <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>{review.reply}</p>
                                                        </div>
                                                    )}
                                                    <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
                                                        <button onClick={() => handleLikeReview(review.id)} style={{
                                                            display: "flex", alignItems: "center", gap: "6px",
                                                            background: "none", border: "none", cursor: "pointer",
                                                            color: likedReviews[review.id] ? "#2e7d32" : "#999",
                                                            fontSize: "13px", transition: "color 0.2s"
                                                        }}>
                                                            <FaThumbsUp /> {likedReviews[review.id] ? (review.likes + 1) : review.likes}
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

            {/* Chat Modal */}
            {showChatModal && (
                <div style={{
                    position: 'fixed',
                    right: '20px',
                    bottom: '0',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'flex-end'
                }}>
                    <div style={{
                        width: '380px',
                        height: '500px',
                        background: 'white',
                        borderRadius: '12px 12px 0 0',
                        boxShadow: '0 -5px 25px rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        border: '1px solid #ddd'
                    }}>
                        {/* Chat Header */}
                        <div style={{
                            padding: '12px 16px',
                            background: '#2e7d32',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img 
                                    src={shop?.logo_url || "https://via.placeholder.com/40"} 
                                    alt={shop?.name}
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{shop?.name}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.8 }}>Đang hoạt động</div>
                                </div>
                            </div>
                            <FaTimes 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => setShowChatModal(false)}
                            />
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1,
                            padding: '12px',
                            overflowY: 'auto',
                            background: '#f0f2f5',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            {chatLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <div style={{ width: '30px', height: '30px', border: '2px solid #f3f3f3', borderTop: '2px solid #2e7d32', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#65676b', fontSize: '13px', marginTop: '20px' }}>
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
                                        <div key={msg.id || index} style={{
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            position: 'relative'
                                        }}>
                                            {isEditing ? (
                                                // Chế độ sửa tin nhắn
                                                <div style={{
                                                    background: isMe ? '#2e7d32' : 'white',
                                                    padding: '8px 12px',
                                                    borderRadius: '15px',
                                                    display: 'flex',
                                                    gap: '8px',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                        style={{
                                                            background: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            outline: 'none',
                                                            fontSize: '14px',
                                                            minWidth: '180px',
                                                            color: '#333'
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button 
                                                        onClick={handleSaveEdit} 
                                                        style={{ background: 'none', border: 'none', color: isMe ? 'white' : '#2e7d32', cursor: 'pointer', fontSize: '16px' }}
                                                    >
                                                        💾
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingMessage(null);
                                                            setEditContent('');
                                                        }} 
                                                        style={{ background: 'none', border: 'none', color: isMe ? 'white' : '#999', cursor: 'pointer', fontSize: '16px' }}
                                                    >
                                                        ✖
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{
                                                        background: isMe ? '#2e7d32' : 'white',
                                                        color: isMe ? 'white' : '#333',
                                                        padding: '8px 12px',
                                                        borderRadius: '15px',
                                                        fontSize: '14px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        wordBreak: 'break-word',
                                                        position: 'relative'
                                                    }}>
                                                        {msg.content}
                                                        {msg.is_edited && (
                                                            <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '8px' }}>(đã sửa)</span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Nút 3 chấm - chỉ hiển thị cho tin nhắn của tôi */}
                                                    {isMe && (
                                                        <div style={{ position: 'relative', marginTop: '4px', textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => setActionMenuMessageId(showMenu ? null : msg.id)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: '#999',
                                                                    fontSize: '12px',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '12px',
                                                                    transition: 'background 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                            >
                                                                ⋯
                                                            </button>
                                                            
                                                            {/* Menu dropdown */}
                                                            {showMenu && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    bottom: '100%',
                                                                    right: 0,
                                                                    marginBottom: '4px',
                                                                    background: 'white',
                                                                    borderRadius: '12px',
                                                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                                                    overflow: 'hidden',
                                                                    zIndex: 100,
                                                                    minWidth: '120px'
                                                                }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleStartEdit(msg);
                                                                            setActionMenuMessageId(null);
                                                                        }}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 16px',
                                                                            border: 'none',
                                                                            background: 'white',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px',
                                                                            color: '#333',
                                                                            transition: 'background 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                    >
                                                                        ✏️ Sửa
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDeleteMessage(msg);
                                                                            setActionMenuMessageId(null);
                                                                        }}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 16px',
                                                                            border: 'none',
                                                                            background: 'white',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px',
                                                                            color: '#e41e3f',
                                                                            transition: 'background 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                    >
                                                                        🗑️ Xóa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#999',
                                                marginTop: '4px',
                                                textAlign: isMe ? 'right' : 'left'
                                            }}>
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
                        <div style={{
                            padding: '10px',
                            borderTop: '1px solid #ddd',
                            background: 'white',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                    placeholder="Nhập tin nhắn..."
                                    style={{
                                        flex: 1,
                                        padding: '8px 15px',
                                        border: '1px solid #ddd',
                                        borderRadius: '20px',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!newChatMessage.trim()}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: newChatMessage.trim() ? '#2e7d32' : '#ccc',
                                        cursor: 'pointer',
                                        display: 'flex'
                                    }}
                                >
                                    <FaPaperPlane size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
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