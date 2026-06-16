import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaShoppingCart, FaBell, FaUser, FaBook, FaSignOutAlt, FaComment, FaSearch, FaBars, FaUsers } from 'react-icons/fa';
import api from "../../api/api";
import NotificationBell from "../../pages/user/NotificationBell";
import ChatModal from "../../components/chat/ChatModal";
import { GrFavorite } from "react-icons/gr";
import '../../css/home_page.css';

function Header({ onMenuToggle, mobileMenuOpen }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [groupSearchResults, setGroupSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user_token"));
    const [activeSearchTab, setActiveSearchTab] = useState('all');
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    // State cho tính năng gợi ý tags
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [isLoadingTags, setIsLoadingTags] = useState(false);

    // State cho modal xem chi tiết bài viết
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [modalComments, setModalComments] = useState([]);
    const [modalCommentInput, setModalCommentInput] = useState("");
    const [modalLiked, setModalLiked] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const [commentLimit] = useState(4);
    const [totalComments, setTotalComments] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalCommentFilter, setModalCommentFilter] = useState("relevant");
    const [modalOriginalComments, setModalOriginalComments] = useState([]);
    const [activeCommentMenu, setActiveCommentMenu] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyInput, setReplyInput] = useState("");
    const [expandedReplies, setExpandedReplies] = useState({});
    const [allRepliesData, setAllRepliesData] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [lightboxImages, setLightboxImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Lấy thông tin user hiện tại
    useEffect(() => {
        const userData = localStorage.getItem("user_data");
        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (e) {
                console.error("Error parsing user data:", e);
            }
        }
    }, []);

    // Theo dõi trạng thái đăng nhập
    useEffect(() => {
        const checkLoginStatus = () => {
            const token = localStorage.getItem("user_token");
            setIsLoggedIn(!!token);
            
            if (!token) {
                setCartCount(0);
                setFavoriteCount(0);
                setIsMenuOpen(false);
            }
        };
        
        checkLoginStatus();
        
        const handleStorageChange = (e) => {
            if (e.key === 'user_token') {
                checkLoginStatus();
                window.location.reload();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        const handleLogoutEvent = () => {
            checkLoginStatus();
            navigate("/login");
        };
        
        window.addEventListener('userLoggedOut', handleLogoutEvent);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLoggedOut', handleLogoutEvent);
        };
    }, [navigate]);

    // Theo dõi kích thước màn hình
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch cart count
    const fetchCartCount = async () => {
        const token = localStorage.getItem("user_token");
        if (!token) {
            setCartCount(0);
            return;
        }
        
        try {
            const response = await api.get('/api/v1/cart/count');
            setCartCount(response.data.count);
        } catch (error) {
            console.error("Error fetching cart count:", error);
            setCartCount(0);
        }
    };

    // Fetch favorite count
    const fetchFavoriteCount = async () => {
        const token = localStorage.getItem("user_token");
        if (!token) {
            setFavoriteCount(0);
            return;
        }
        
        try {
            const response = await api.get('/api/v1/favorites/my-favorites?limit=1');
            setFavoriteCount(response.data.total || 0);
        } catch (error) {
            console.error("Error fetching favorite count:", error);
            setFavoriteCount(0);
        }
    };

    // ========== FUNCTIONS TÌM KIẾM ==========
    
    // Tìm kiếm bài viết
    const searchPosts = async (keyword) => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return [];

            const response = await api.get(`/api/v1/posts/search?keyword=${encodeURIComponent(keyword)}`);
            return response.data || [];
        } catch (error) {
            console.error("Lỗi tìm kiếm bài viết:", error);
            return [];
        }
    };

    // Tìm kiếm theo hashtag
    const searchByHashtag = async (keyword) => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return [];

            let hashtag = keyword.startsWith('#') ? keyword.substring(1) : keyword;
            hashtag = hashtag.trim().toLowerCase();
            
            if (!hashtag || hashtag.length === 0) {
                return [];
            }
            
            hashtag = hashtag.replace(/[^a-zA-Z0-9_]/g, '');
            
            if (!hashtag || hashtag.length === 0) {
                return [];
            }
            
            const response = await api.get(`/api/v1/posts/search/by-hashtag`, {
                params: {
                    hashtag: hashtag,
                    limit: 20
                }
            });
            
            return response.data || [];
        } catch (error) {
            console.error("Lỗi tìm kiếm hashtag:", error);
            return [];
        }
    };

    // Tìm kiếm người dùng
    const searchUsers = async (keyword) => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return [];

            const response = await api.get(`/api/v1/users/search?keyword=${encodeURIComponent(keyword)}`);
            return response.data || [];
        } catch (error) {
            console.error("Lỗi tìm kiếm người dùng:", error);
            return [];
        }
    };

    // Tìm kiếm nhóm
    const searchGroups = async (keyword) => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return [];

            const response = await api.get(`/api/v1/groups/search?keyword=${encodeURIComponent(keyword)}`);
            return response.data || [];
        } catch (error) {
            console.error("Lỗi tìm kiếm nhóm:", error);
            try {
                const response = await api.get('/api/v1/groups/public?limit=50');
                const groups = response.data || [];
                return groups.filter(group => 
                    group.name?.toLowerCase().includes(keyword.toLowerCase()) ||
                    group.description?.toLowerCase().includes(keyword.toLowerCase())
                );
            } catch (err) {
                console.error("Fallback group search failed:", err);
                return [];
            }
        }
    };

    // ========== FUNCTIONS GỢI Ý TAGS ==========
    
    const fetchTagSuggestions = async (prefix = '') => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return;
            
            setIsLoadingTags(true);
            const response = await api.get('/api/v1/posts/suggest-tags', {
                params: {
                    prefix: prefix.trim(),
                    limit: 10
                }
            });
            
            setSuggestedTags(response.data || []);
            if (response.data && response.data.length > 0) {
                setShowSearchResults(true);
            }
        } catch (error) {
            console.error("Error fetching tag suggestions:", error);
            setSuggestedTags([]);
        } finally {
            setIsLoadingTags(false);
        }
    };

    const handleTagClick = (tag) => {
        setSearchKeyword(`#${tag}`);
        // Tìm kiếm bài viết với tag này
        handleSearch(`#${tag}`);
    };

    // ========== FUNCTIONS XỬ LÝ TÌM KIẾM CHÍNH ==========
    
    const handleSearch = async (keyword) => {
        if (!keyword || !keyword.trim()) {
            setSearchResults([]);
            setUserSearchResults([]);
            setGroupSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            if (keyword.trim().startsWith('#')) {
                const hashtag = keyword.trim().substring(1);
                
                if (!hashtag || hashtag.length === 0) {
                    setSearchResults([]);
                    setUserSearchResults([]);
                    setGroupSearchResults([]);
                    setActiveSearchTab('tags');
                    setShowSearchResults(true);
                    setIsSearching(false);
                    return;
                }
                
                const posts = await searchByHashtag(hashtag);
                setSearchResults(posts);
                setUserSearchResults([]);
                setGroupSearchResults([]);
                setActiveSearchTab('posts');
                setShowSearchResults(true);
            } else {
                const [posts, users, groups] = await Promise.all([
                    searchPosts(keyword),
                    searchUsers(keyword),
                    searchGroups(keyword)
                ]);
                
                setSearchResults(posts);
                setUserSearchResults(users);
                setGroupSearchResults(groups);
                setActiveSearchTab('all');
                setShowSearchResults(true);
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            setSearchResults([]);
            setUserSearchResults([]);
            setGroupSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Xử lý khi nhập vào ô tìm kiếm
    const handleSearchInputChange = (value) => {
        setSearchKeyword(value);
        
        if (value.trim().startsWith('#')) {
            const tagPrefix = value.trim().substring(1);
            setShowSearchResults(true);
            setActiveSearchTab('tags');
            setSearchResults([]);
            setUserSearchResults([]);
            setGroupSearchResults([]);
            fetchTagSuggestions(tagPrefix);
        } else {
            setSuggestedTags([]);
        }
    };

    // Debounce search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchKeyword && searchKeyword.trim()) {
                if (searchKeyword.trim().startsWith('#')) {
                    const tagPrefix = searchKeyword.trim().substring(1);
                    if (tagPrefix.length > 0) {
                        fetchTagSuggestions(tagPrefix);
                    }
                } else {
                    handleSearch(searchKeyword);
                }
            } else {
                setSearchResults([]);
                setUserSearchResults([]);
                setGroupSearchResults([]);
                setShowSearchResults(false);
            }
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [searchKeyword]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch trending hashtags
    const fetchTrendingHashtags = async () => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return;
            
            const response = await api.get('/api/v1/posts/trending-hashtags?limit=10&days=7');
            setTrendingHashtags(response.data);
        } catch (error) {
            console.error("Error fetching trending hashtags:", error);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (isLoggedIn) {
            fetchCartCount();
            fetchFavoriteCount();
            fetchTrendingHashtags();
            const interval = setInterval(() => {
                fetchCartCount();
                fetchFavoriteCount();
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    // Listen for custom events
    useEffect(() => {
        const handleCartUpdate = () => {
            if (isLoggedIn) fetchCartCount(); 
        };
        
        const handleFavoriteUpdate = () => {
            if (isLoggedIn) fetchFavoriteCount();
        };
        
        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('favoriteUpdated', handleFavoriteUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
        };
    }, [isLoggedIn]);

    // ========== FUNCTIONS CHO MODAL CHI TIẾT BÀI VIẾT ==========
    
    const fetchModalComments = async (postId, page) => {
        try {
            const token = localStorage.getItem("user_token");
            const commentsRes = await api.get(`/api/v1/comments/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allComments = commentsRes.data;
            
            setModalOriginalComments(allComments);
            
            let filteredComments = [...allComments];
            
            if (modalCommentFilter !== "all") {
                filteredComments = filteredComments.filter(c => !c.is_hidden_by_ai);
            }
            
            if (modalCommentFilter === "newest") {
                filteredComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (modalCommentFilter === "relevant") {
                filteredComments.sort((a, b) => {
                    const aLikes = a.like_count || 0;
                    const bLikes = b.like_count || 0;
                    return bLikes - aLikes;
                });
            }
            
            const parentComments = filteredComments.filter(c => !c.parent_id);
            const childComments = filteredComments.filter(c => c.parent_id);
            
            const repliesMap = {};
            childComments.forEach(reply => {
                const parentId = reply.parent_id;
                if (!repliesMap[parentId]) {
                    repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(reply);
            });
            
            setAllRepliesData(repliesMap);
            
            const start = (page - 1) * commentLimit;
            const end = start + commentLimit;
            const paginatedComments = parentComments.slice(start, end);
            
            setModalComments(paginatedComments);
            setTotalComments(parentComments.length);
            
        } catch(e) { 
            setModalComments([]);
            setTotalComments(0);
        }
    };

    const handleModalCommentFilter = async (filter) => {
        setModalCommentFilter(filter);
        setCommentPage(1);
        
        if (selectedPost) {
            let filteredComments = [...modalOriginalComments];
            
            if (filter !== "all") {
                const isPostOwner = currentUser && selectedPost && 
                    String(currentUser._id || currentUser.id) === String(selectedPost.author_id);
                const isAdmin = currentUser && currentUser.role === "admin";
                const canSeeHidden = isPostOwner || isAdmin;
                
                if (!canSeeHidden) {
                    filteredComments = filteredComments.filter(c => !c.is_hidden_by_ai);
                }
            }
            
            if (filter === "newest") {
                filteredComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (filter === "relevant") {
                filteredComments.sort((a, b) => {
                    if (a.is_hidden_by_ai !== b.is_hidden_by_ai) {
                        return a.is_hidden_by_ai ? 1 : -1;
                    }
                    const aLikes = a.like_count || 0;
                    const bLikes = b.like_count || 0;
                    return bLikes - aLikes;
                });
            }
            
            const parentComments = filteredComments.filter(c => !c.parent_id);
            const childComments = filteredComments.filter(c => c.parent_id);
            
            const repliesMap = {};
            childComments.forEach(reply => {
                const parentId = reply.parent_id;
                if (!repliesMap[parentId]) {
                    repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(reply);
            });
            
            setAllRepliesData(repliesMap);
            
            const start = 0;
            const end = commentLimit;
            const paginatedComments = parentComments.slice(start, end);
            
            setModalComments(paginatedComments);
            setTotalComments(parentComments.length);
        }
    };

    const handleModalComment = async (parentId = null) => {
        const content = parentId ? replyInput : modalCommentInput;
        if (!content.trim() || !selectedPost) return;
        
        try {
            const commentData = {
                post_id: selectedPost._id,
                content: content
            };
            if (parentId) {
                commentData.parent_id = parentId;
            }
            
            await api.post("/api/v1/comments/", commentData);
            
            await fetchModalComments(selectedPost._id, 1);
            setModalCommentInput("");
            setReplyInput("");
            setReplyingTo(null);
            setCommentPage(1);
            
            setSelectedPost(prev => ({
                ...prev,
                stats: { ...prev.stats, comment_count: (prev.stats?.comment_count || 0) + 1 }
            }));
        } catch(err) {
            console.error("Không thể đăng bình luận", err);
        }
    };

    const handleEditModalComment = (comment) => {
        setEditingCommentId(comment._id);
        setEditCommentContent(comment.content);
        setActiveCommentMenu(null);
    };

    const handleSaveModalComment = async (postId, commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            await api.put(`/api/v1/comments/${commentId}`, { content: editCommentContent });
            await fetchModalComments(postId, 1);
            setCommentPage(1);
            setEditingCommentId(null);
            setEditCommentContent("");
        } catch (error) {
            console.error("Không thể sửa bình luận", error);
        }
    };

    const handleDeleteModalComment = (postId, commentId) => {
        showConfirm("Bạn có chắc chắn muốn xóa bình luận này không?", async () => {
            try {
                await api.delete(`/api/v1/comments/${commentId}`);
                await fetchModalComments(postId, 1);
                setCommentPage(1);
                setSelectedPost(prev => ({
                    ...prev,
                    stats: { ...prev.stats, comment_count: Math.max(0, (prev.stats?.comment_count || 1) - 1) }
                }));
                setActiveCommentMenu(null);
            } catch (error) {
                console.error("Không thể xóa bình luận", error);
            }
        });
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const getRepliesForComment = (commentId) => {
        return allRepliesData[commentId] || [];
    };

    const showConfirm = (message, onConfirm) => {
        setConfirmMessage(message);
        setConfirmAction(() => onConfirm);
        setShowConfirmModal(true);
    };

    // Mở modal xem chi tiết bài viết
    const openPostModal = async (post) => {
        try {
            // Lấy chi tiết bài viết
            const res = await api.get(`/api/v1/posts/${post._id}`);
            const updatedPost = res.data;
            
            setSelectedPost(updatedPost);
            setIsPostModalOpen(true);
            setModalCommentInput("");
            setCommentPage(1);
            setReplyingTo(null);
            
            // Kiểm tra like
            try {
                const likeRes = await api.get(`/api/v1/likes/check/${post._id}`);
                setModalLiked(likeRes.data.liked);
            } catch(e) { setModalLiked(false); }
            
            // Lấy comments
            await fetchModalComments(post._id, 1);
            
        } catch (error) {
            console.error("Error opening post modal:", error);
            setSelectedPost(post);
            setIsPostModalOpen(true);
        }
    };

    // Đóng modal chi tiết bài viết
    const closePostModal = () => {
        setIsPostModalOpen(false);
        setSelectedPost(null);
        setModalComments([]);
        setModalCommentInput("");
        setReplyingTo(null);
        setActiveCommentMenu(null);
        setEditingCommentId(null);
    };

    // ========== LIGHTBOX FUNCTIONS ==========
    const openLightbox = (images, startIndex) => {
        setLightboxImages(images);
        setCurrentImageIndex(startIndex);
        setIsLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setLightboxImages([]);
        setCurrentImageIndex(0);
        document.body.style.overflow = 'unset';
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % lightboxImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    };

    // Xử lý phím mũi tên cho lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLightboxOpen) return;
            if (e.key === 'ArrowLeft') {
                setCurrentImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
            } else if (e.key === 'ArrowRight') {
                setCurrentImageIndex((prev) => (prev + 1) % lightboxImages.length);
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, lightboxImages.length]);

    // ========== HANDLERS CHO CLICK ==========
    
    // Click vào bài viết -> mở modal chi tiết
    const handlePostClick = (post) => {
        setShowSearchResults(false);
        setSearchKeyword("");
        openPostModal(post);
    };

    // Click vào tag -> tìm kiếm và mở modal chi tiết bài viết đầu tiên
    const handleTagSearchAndOpen = async (tag) => {
        setSearchKeyword(`#${tag}`);
        setShowSearchResults(false);
        
        // Tìm kiếm bài viết với tag
        const posts = await searchByHashtag(tag);
        if (posts && posts.length > 0) {
            // Mở bài viết đầu tiên
            openPostModal(posts[0]);
        } else {
            // Nếu không có bài viết, hiển thị thông báo
            alert(`Không tìm thấy bài viết nào với tag #${tag}`);
        }
    };

    // Click vào người dùng -> chuyển đến profile
    const handleUserClick = (user) => {
        setShowSearchResults(false);
        setSearchKeyword("");
        navigate(`/profile/${user._id || user.id}`);
    };

    // Click vào nhóm -> chuyển đến trang nhóm
    const handleGroupClick = (group) => {
        setShowSearchResults(false);
        setSearchKeyword("");
        navigate(`/groups/${group._id}`);
    };

    // Click vào "Xem tất cả"
    const handleViewAllPosts = () => {
        setShowSearchResults(false);
        navigate(`/search/posts?keyword=${encodeURIComponent(searchKeyword)}&type=posts`);
    };

    const handleViewAllUsers = () => {
        setShowSearchResults(false);
        navigate(`/search/users?keyword=${encodeURIComponent(searchKeyword)}&type=users`);
    };

    const handleViewAllGroups = () => {
        setShowSearchResults(false);
        navigate(`/search/groups?keyword=${encodeURIComponent(searchKeyword)}&type=groups`);
    };

    // ========== CÁC HÀM CÒN LẠI ==========
    
    const handleAvatarClick = () => {
        const token = localStorage.getItem("user_token");
        if (token) {
            setIsMenuOpen(!isMenuOpen);
        } else {
            navigate("/login");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_data");
        
        sessionStorage.removeItem("sidebar_user");
        sessionStorage.removeItem("sidebar_user_cache_time");
        sessionStorage.removeItem("home_posts_general");
        sessionStorage.removeItem("home_posts_agriculture");
        sessionStorage.removeItem("home_posts_seafood");
        sessionStorage.removeItem("home_posts_specialty");
        
        setIsMenuOpen(false);
        setCartCount(0);
        setFavoriteCount(0);
        setIsLoggedIn(false);
        
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        navigate("/");
        window.location.reload();
    };

    const handleCartClick = () => {
        navigate("/cart");
    };

    const menuItemStyle = {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        padding: "12px 20px",
        cursor: "pointer",
        color: "#333",
        fontSize: "16px",
        transition: "background-color 0.2s",
    };

    const totalResults = searchResults.length + userSearchResults.length + groupSearchResults.length;
    const isHashtagSearch = searchKeyword.trim().startsWith('#');

    // ========== RENDER ==========
    return (
        <>
            <div style={{
                height: "60px",
                background: "white",
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #ddd",
                width: "100%",
                boxSizing: "border-box",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                padding: "0 16px"
            }}>
                {/* Nút hamburger */}
                <div style={{ marginRight: "12px", display: isMobile ? "block" : "none" }}>
                    <button 
                        onClick={onMenuToggle}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "50%",
                            color: "#2e7d32",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px"
                        }}
                    >
                        <FaBars size={20} />
                    </button>
                </div>

                {/* Logo */}
                <div style={{ 
                    cursor: "pointer", 
                    flexShrink: 0,
                    display: isMobile ? "none" : "block"
                }} 
                onClick={() => navigate("/")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img src="/logoda.png" alt="Logo" style={{ width: "49px", height: "45px" }} />
                        <h2 style={{ color: "#2e7d32", margin: 0, fontSize: "20px" }}>
                            Đặc Sản Quê Tôi
                        </h2>
                    </div>
                </div>

                {/* Search Bar */}
                {isLoggedIn && (
                    <div style={{ 
                        flex: 1, 
                        display: "flex", 
                        justifyContent: "center", 
                        position: "relative",
                        paddingLeft: isMobile ? "0" : "20px",
                        marginRight: isMobile ? "8px" : "0"
                    }} ref={searchRef}>
                        <div className="search-bar" style={{ 
                            position: "relative", 
                            width: isMobile ? "100%" : "500px",
                            maxWidth: isMobile ? "100%" : "500px"
                        }}>
                            <input
                                placeholder={isMobile ? "Tìm kiếm..." : "Tìm kiếm bài viết, người dùng, nhóm, #hashtag..."}
                                value={searchKeyword}
                                onChange={(e) => handleSearchInputChange(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: isMobile ? "8px 36px 8px 12px" : "10px 40px 10px 16px",
                                    borderRadius: "20px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f0f2f5",
                                    outline: "none",
                                    transition: "all 0.3s",
                                    fontSize: isMobile ? "13px" : "14px"
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#2e7d32";
                                    e.target.style.backgroundColor = "white";
                                    if (searchKeyword && (totalResults > 0 || suggestedTags.length > 0 || isHashtagSearch)) {
                                        setShowSearchResults(true);
                                    }
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#ddd";
                                    e.target.style.backgroundColor = "#f0f2f5";
                                }}
                            />
                            <FaSearch 
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#999",
                                    cursor: "pointer",
                                    fontSize: isMobile ? "14px" : "16px"
                                }}
                                onClick={() => {
                                    if (searchKeyword.trim().startsWith('#')) {
                                        const tag = searchKeyword.trim().substring(1);
                                        if (tag) {
                                            handleSearch(searchKeyword);
                                        }
                                    } else {
                                        handleSearch(searchKeyword);
                                    }
                                }}
                            />

                            {showSearchResults && (
                                <div className="result-page" style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    marginTop: "8px",
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                    maxHeight: "500px",
                                    overflowY: "auto",
                                    zIndex: 1001,
                                }}>
                                    {isSearching || isLoadingTags ? (
                                        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                                            Đang tìm kiếm...
                                        </div>
                                    ) : (
                                        <>
                                            {/* Hiển thị gợi ý tags khi tìm kiếm hashtag */}
                                            {isHashtagSearch ? (
                                                <>
                                                    <div style={{
                                                        padding: "8px 15px",
                                                        backgroundColor: "#e8f5e9",
                                                        fontSize: "13px",
                                                        color: "#2e7d32",
                                                        borderBottom: "1px solid #c8e6c9",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}>
                                                        <span>
                                                            🔍 Gợi ý tags {searchKeyword.trim().substring(1) ? `cho "${searchKeyword}"` : 'thịnh hành'}
                                                        </span>
                                                        {searchKeyword.trim().substring(1) && (
                                                            <button
                                                                onClick={() => handleSearch(searchKeyword)}
                                                                style={{
                                                                    background: "#2e7d32",
                                                                    color: "white",
                                                                    border: "none",
                                                                    borderRadius: "15px",
                                                                    padding: "4px 12px",
                                                                    cursor: "pointer",
                                                                    fontSize: "12px"
                                                                }}
                                                            >
                                                                Tìm #{searchKeyword.trim().substring(1)}
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    {suggestedTags.length === 0 ? (
                                                        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                                                            {searchKeyword.trim().substring(1) ? 
                                                                `Không tìm thấy tag nào bắt đầu bằng "${searchKeyword.trim().substring(1)}"` :
                                                                "Không có tags thịnh hành"
                                                            }
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: "10px 15px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                            {suggestedTags.map((tagData) => (
                                                                <div
                                                                    key={tagData.tag}
                                                                    onClick={() => handleTagSearchAndOpen(tagData.tag)}
                                                                    style={{
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "6px",
                                                                        padding: "8px 14px",
                                                                        backgroundColor: "#e8f5e9",
                                                                        borderRadius: "20px",
                                                                        cursor: "pointer",
                                                                        transition: "all 0.2s",
                                                                        border: "1px solid #c8e6c9"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.backgroundColor = "#c8e6c9";
                                                                        e.currentTarget.style.transform = "scale(1.05)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.backgroundColor = "#e8f5e9";
                                                                        e.currentTarget.style.transform = "scale(1)";
                                                                    }}
                                                                >
                                                                    <span style={{ color: "#2e7d32", fontWeight: "bold" }}>
                                                                        #{tagData.tag}
                                                                    </span>
                                                                    <span style={{ 
                                                                        fontSize: "11px", 
                                                                        color: "#666",
                                                                        backgroundColor: "rgba(0,0,0,0.05)",
                                                                        padding: "0 8px",
                                                                        borderRadius: "10px"
                                                                    }}>
                                                                        {tagData.count} bài
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                /* ========== HIỂN THỊ KẾT QUẢ TÌM KIẾM THÔNG THƯỜNG ========== */
                                                <>
                                                    {totalResults === 0 ? (
                                                        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                                                            Không tìm thấy kết quả nào cho "{searchKeyword}"
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ 
                                                                padding: "10px 15px", 
                                                                borderBottom: "1px solid #eee",
                                                                fontSize: "12px",
                                                                color: "#666",
                                                                fontWeight: "bold"
                                                            }}>
                                                                Tìm thấy {totalResults} kết quả cho "{searchKeyword}"
                                                            </div>
                                                            
                                                            {/* Tabs */}
                                                            <div style={{ 
                                                                display: "flex", 
                                                                borderBottom: "1px solid #eee",
                                                                padding: "0 10px",
                                                                flexWrap: "wrap",
                                                                justifyContent: "space-between",
                                                                alignItems: "center"
                                                            }}>
                                                                <div style={{ display: "flex", gap: "10px" }}>
                                                                    <button
                                                                        onClick={() => setActiveSearchTab('all')}
                                                                        style={{
                                                                            padding: "10px 15px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            cursor: "pointer",
                                                                            color: activeSearchTab === 'all' ? "#2e7d32" : "#666",
                                                                            fontWeight: activeSearchTab === 'all' ? "bold" : "normal",
                                                                            borderBottom: activeSearchTab === 'all' ? "2px solid #2e7d32" : "none"
                                                                        }}
                                                                    >
                                                                        Tất cả ({totalResults})
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setActiveSearchTab('posts')}
                                                                        style={{
                                                                            padding: "10px 15px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            cursor: "pointer",
                                                                            color: activeSearchTab === 'posts' ? "#2e7d32" : "#666",
                                                                            fontWeight: activeSearchTab === 'posts' ? "bold" : "normal",
                                                                            borderBottom: activeSearchTab === 'posts' ? "2px solid #2e7d32" : "none"
                                                                        }}
                                                                    >
                                                                        Bài viết ({searchResults.length})
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setActiveSearchTab('users')}
                                                                        style={{
                                                                            padding: "10px 15px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            cursor: "pointer",
                                                                            color: activeSearchTab === 'users' ? "#2e7d32" : "#666",
                                                                            fontWeight: activeSearchTab === 'users' ? "bold" : "normal",
                                                                            borderBottom: activeSearchTab === 'users' ? "2px solid #2e7d32" : "none"
                                                                        }}
                                                                    >
                                                                        Người dùng ({userSearchResults.length})
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setActiveSearchTab('groups')}
                                                                        style={{
                                                                            padding: "10px 15px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            cursor: "pointer",
                                                                            color: activeSearchTab === 'groups' ? "#2e7d32" : "#666",
                                                                            fontWeight: activeSearchTab === 'groups' ? "bold" : "normal",
                                                                            borderBottom: activeSearchTab === 'groups' ? "2px solid #2e7d32" : "none"
                                                                        }}
                                                                    >
                                                                        Nhóm ({groupSearchResults.length})
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Kết quả tìm kiếm */}
                                                            <div>
                                                                {/* Kết quả nhóm */}
                                                                {(activeSearchTab === 'all' || activeSearchTab === 'groups') && groupSearchResults.length > 0 && (
                                                                    <div>
                                                                        {activeSearchTab === 'all' && (
                                                                            <div style={{ 
                                                                                padding: "8px 15px", 
                                                                                backgroundColor: "#f8f9fa",
                                                                                fontSize: "13px",
                                                                                fontWeight: "bold",
                                                                                color: "#2e7d32",
                                                                                borderBottom: "1px solid #eee",
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center"
                                                                            }}>
                                                                                <span>👥 Nhóm</span>
                                                                                {groupSearchResults.length > 5 && (
                                                                                    <button
                                                                                        onClick={handleViewAllGroups}
                                                                                        style={{
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            color: "#2e7d32",
                                                                                            cursor: "pointer",
                                                                                            fontSize: "12px"
                                                                                        }}
                                                                                    >
                                                                                        Xem tất cả ({groupSearchResults.length}) →
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {groupSearchResults.slice(0, 5).map((group) => (
                                                                            <div
                                                                                key={group._id}
                                                                                onClick={() => handleGroupClick(group)}
                                                                                style={{
                                                                                    padding: "12px 15px",
                                                                                    borderBottom: "1px solid #f0f0f0",
                                                                                    cursor: "pointer",
                                                                                    transition: "background-color 0.2s"
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                                                                            >
                                                                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                                                    <div style={{ 
                                                                                        width: "45px", 
                                                                                        height: "45px", 
                                                                                        background: "#e8f5e9", 
                                                                                        borderRadius: "12px", 
                                                                                        display: "flex", 
                                                                                        alignItems: "center", 
                                                                                        justifyContent: "center",
                                                                                        flexShrink: 0,
                                                                                        overflow: "hidden"
                                                                                    }}>
                                                                                        {group.avatar_url || group.avatar ? (
                                                                                            <img src={group.avatar_url || group.avatar} alt="group avatar" style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "cover" }}/>
                                                                                        ) : (
                                                                                            <FaUsers size={20} color="#2e7d32" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <div style={{ fontWeight: "bold", fontSize: "15px", color: "#333", marginBottom: "4px" }}>
                                                                                            {group.name}
                                                                                        </div>
                                                                                        {group.description && (
                                                                                            <div style={{ 
                                                                                                fontSize: "12px", 
                                                                                                color: "#666",
                                                                                                overflow: "hidden",
                                                                                                textOverflow: "ellipsis",
                                                                                                whiteSpace: "nowrap"
                                                                                            }}>
                                                                                                {group.description}
                                                                                            </div>
                                                                                        )}
                                                                                        <div style={{ 
                                                                                            display: "flex", 
                                                                                            gap: "12px",
                                                                                            fontSize: "11px", 
                                                                                            color: "#999",
                                                                                            marginTop: "4px"
                                                                                        }}>
                                                                                            <span>👥 {group.members?.length || group.member_count || 0} thành viên</span>
                                                                                            <span>{group.privacy === 'public' ? '🌍 Công khai' : '🔒 Riêng tư'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Kết quả người dùng */}
                                                                {(activeSearchTab === 'all' || activeSearchTab === 'users') && userSearchResults.length > 0 && (
                                                                    <div>
                                                                        {activeSearchTab === 'all' && (
                                                                            <div style={{ 
                                                                                padding: "8px 15px", 
                                                                                backgroundColor: "#f8f9fa",
                                                                                fontSize: "13px",
                                                                                fontWeight: "bold",
                                                                                color: "#2e7d32",
                                                                                borderBottom: "1px solid #eee",
                                                                                borderTop: activeSearchTab === 'all' && groupSearchResults.length > 0 ? "1px solid #eee" : "none",
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center"
                                                                            }}>
                                                                                <span>👤 Người dùng</span>
                                                                                {userSearchResults.length > 5 && (
                                                                                    <button
                                                                                        onClick={handleViewAllUsers}
                                                                                        style={{
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            color: "#2e7d32",
                                                                                            cursor: "pointer",
                                                                                            fontSize: "12px"
                                                                                        }}
                                                                                    >
                                                                                        Xem tất cả ({userSearchResults.length}) →
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {userSearchResults.slice(0, 5).map((user) => (
                                                                            <div
                                                                                key={user._id || user.id}
                                                                                onClick={() => handleUserClick(user)}
                                                                                style={{
                                                                                    padding: "12px 15px",
                                                                                    borderBottom: "1px solid #f0f0f0",
                                                                                    cursor: "pointer",
                                                                                    transition: "background-color 0.2s"
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                                                                            >
                                                                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                                                    <div style={{ 
                                                                                        width: "45px", 
                                                                                        height: "45px", 
                                                                                        background: "#e4e6eb", 
                                                                                        borderRadius: "50%", 
                                                                                        display: "flex", 
                                                                                        alignItems: "center", 
                                                                                        justifyContent: "center",
                                                                                        flexShrink: 0,
                                                                                        overflow: "hidden"
                                                                                    }}>
                                                                                        {user.avatar_url ? (
                                                                                            <img src={user.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}/>
                                                                                        ) : (
                                                                                            <FaUser size={20} color="#2e7d32" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <div style={{ fontWeight: "bold", fontSize: "15px", color: "#333", marginBottom: "4px" }}>
                                                                                            {user.full_name || user.username}
                                                                                        </div>
                                                                                        {user.full_name && user.username && (
                                                                                            <div style={{ 
                                                                                                fontSize: "12px", 
                                                                                                color: "#888",
                                                                                                marginBottom: "4px"
                                                                                            }}>
                                                                                                @{user.username}
                                                                                            </div>
                                                                                        )}
                                                                                        {user.bio && (
                                                                                            <div style={{ 
                                                                                                fontSize: "12px", 
                                                                                                color: "#666",
                                                                                                overflow: "hidden",
                                                                                                textOverflow: "ellipsis",
                                                                                                whiteSpace: "nowrap"
                                                                                            }}>
                                                                                                {user.bio}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Kết quả bài viết */}
                                                                {(activeSearchTab === 'all' || activeSearchTab === 'posts') && searchResults.length > 0 && (
                                                                    <div>
                                                                        {activeSearchTab === 'all' && (
                                                                            <div style={{ 
                                                                                padding: "8px 15px", 
                                                                                backgroundColor: "#f8f9fa",
                                                                                fontSize: "13px",
                                                                                fontWeight: "bold",
                                                                                color: "#2e7d32",
                                                                                borderBottom: "1px solid #eee",
                                                                                borderTop: (activeSearchTab === 'all' && (userSearchResults.length > 0 || groupSearchResults.length > 0)) ? "1px solid #eee" : "none",
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center"
                                                                            }}>
                                                                                <span>📝 Bài viết</span>
                                                                                {searchResults.length > 5 && (
                                                                                    <button
                                                                                        onClick={handleViewAllPosts}
                                                                                        style={{
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            color: "#2e7d32",
                                                                                            cursor: "pointer",
                                                                                            fontSize: "12px"
                                                                                        }}
                                                                                    >
                                                                                        Xem tất cả ({searchResults.length}) →
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {searchResults.slice(0, 5).map((post) => (
                                                                            <div
                                                                                key={post._id}
                                                                                onClick={() => handlePostClick(post)}
                                                                                style={{
                                                                                    padding: "12px 15px",
                                                                                    borderBottom: "1px solid #f0f0f0",
                                                                                    cursor: "pointer",
                                                                                    transition: "background-color 0.2s"
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                                                                            >
                                                                                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                                                                    <div style={{ 
                                                                                        width: "40px", 
                                                                                        height: "40px", 
                                                                                        background: "#e4e6eb", 
                                                                                        borderRadius: "50%", 
                                                                                        display: "flex", 
                                                                                        alignItems: "center", 
                                                                                        justifyContent: "center",
                                                                                        flexShrink: 0
                                                                                    }}>
                                                                                        {post.author_avatar ? (
                                                                                            <img src={post.author_avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}/>
                                                                                        ) : (
                                                                                            <FaUser size={16} color="#2e7d32" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333", marginBottom: "4px" }}>
                                                                                            {post.author_name}
                                                                                        </div>
                                                                                        <div style={{ 
                                                                                            fontSize: "13px", 
                                                                                            color: "#666",
                                                                                            overflow: "hidden",
                                                                                            textOverflow: "ellipsis",
                                                                                            whiteSpace: "nowrap"
                                                                                        }}>
                                                                                            {post.content || "Không có nội dung"}
                                                                                        </div>
                                                                                        {post.tags && post.tags.length > 0 && (
                                                                                            <div style={{ 
                                                                                                display: "flex", 
                                                                                                gap: "6px", 
                                                                                                marginTop: "6px",
                                                                                                flexWrap: "wrap"
                                                                                            }}>
                                                                                                {post.tags.slice(0, 3).map(tag => (
                                                                                                    <span key={tag} style={{
                                                                                                        fontSize: "10px",
                                                                                                        color: "#2e7d32",
                                                                                                        background: "#e8f5e9",
                                                                                                        padding: "2px 6px",
                                                                                                        borderRadius: "10px"
                                                                                                    }}>
                                                                                                        #{tag}
                                                                                                    </span>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                        <div style={{ 
                                                                                            fontSize: "11px", 
                                                                                            color: "#999",
                                                                                            marginTop: "4px"
                                                                                        }}>
                                                                                            {new Date(post.created_at).toLocaleDateString()} • {post.stats?.like_count || 0} thích
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Icons */}
                <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", alignItems: "center", flexShrink: 0 }}>
                    {isLoggedIn && (
                        <div 
                            style={{ position: "relative", cursor: "pointer" }}
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            <span style={{
                                display: "flex",
                                border: "1px solid #ddd",
                                padding: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#f0f2f5",
                                transition: "all 0.3s"
                            }}>
                                <FaComment size={18} color="#2e7d32" />
                            </span>
                            
                            {unreadCount > 0 && (
                                <span style={{
                                    position: "absolute", top: "-5px", right: "-5px",
                                    background: "#ff4444", color: "white",
                                    borderRadius: "50%", width: "16px", height: "16px",
                                    fontSize: "9px", display: "flex",
                                    alignItems: "center", justifyContent: "center"
                                }}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </div>
                    )}
                    
                    {isLoggedIn && (
                        <div style={{ position: "relative", cursor: "pointer" }} onClick={handleCartClick}>
                            <span style={{ 
                                display: "flex", 
                                border: "1px solid #ddd", 
                                padding: "8px", 
                                borderRadius: "50%", 
                                backgroundColor: "#f0f2f5",
                                transition: "all 0.3s"
                            }}>
                                <FaShoppingCart size={18} color="#2e7d32" />
                            </span>
                            {cartCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-5px",
                                    right: "-5px",
                                    background: "#ff4444",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: "18px",
                                    height: "18px",
                                    fontSize: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold"
                                }}>
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </div>
                    )}

                    {isLoggedIn && (
                        <div style={{ 
                            cursor: "pointer", 
                            display: "flex", 
                            border: "1px solid #ddd", 
                            borderRadius: "50%", 
                            backgroundColor: "#f0f2f5",
                            transition: "all 0.3s",
                            width: "35px",
                            height: "35px",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <div className="notification-wrapper">
                                <NotificationBell userType="user" />
                            </div>
                        </div>
                    )}

                    {/* Avatar and Dropdown Menu */}
                    <div style={{ position: "relative" }} ref={menuRef}>
                        <span 
                            onClick={handleAvatarClick}
                            style={{ 
                                cursor: "pointer", 
                                display: "flex", 
                                border: "1px solid #ddd", 
                                padding: "8px", 
                                borderRadius: "50%", 
                                backgroundColor: "#f0f2f5",
                                transition: "all 0.3s"
                            }}
                        >
                            <FaUser size={18} color="#2e7d32" />
                        </span>

                        {isLoggedIn && isMenuOpen && (
                            <div style={{
                                position: "absolute",
                                top: "45px",
                                right: "0",
                                width: isMobile ? "240px" : "260px",
                                backgroundColor: "white",
                                borderRadius: "12px",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                padding: "10px 0",
                                zIndex: 1000,
                                display: "flex",
                                flexDirection: "column",
                                fontFamily: "Arial, sans-serif"
                            }}>
                                <div  
                                    style={{...menuItemStyle, alignItems: "flex-start"}}
                                    onClick={() => {
                                        navigate("/profile");
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <div style={{ 
                                        width: "35px", height: "35px", borderRadius: "50%", 
                                        backgroundColor: "#e4e6eb", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px" 
                                    }}>
                                        <FaUser size={16} color="#2e7d32" />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingTop: "5px" }}>
                                        <span style={{ fontWeight: "bold" }}>Xem trang cá nhân</span>
                                        <span style={{ fontSize: "14px", color: "#65676B" }}>Tài khoản của tôi</span>
                                    </div>
                                </div>

                                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "5px 20px" }} />

                                <div 
                                    style={menuItemStyle}
                                    onClick={() => {
                                        navigate("/history/orders");
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <FaBook size={18} color="#2e7d32" />
                                    <span>Lịch sử mua</span>
                                </div>

                                <div 
                                    style={menuItemStyle}
                                    onClick={() => {
                                        navigate("/products/favorites");
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <GrFavorite size={18} color="#2e7d32" />
                                    <span>Sản phẩm yêu thích</span>
                                    {favoriteCount > 0 && (
                                        <span style={{
                                            marginLeft: "auto",
                                            background: "#ff4444",
                                            color: "white",
                                            borderRadius: "12px",
                                            padding: "2px 6px",
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}>
                                            {favoriteCount}
                                        </span>
                                    )}
                                </div>

                                <div 
                                    style={menuItemStyle}
                                    onClick={() => {
                                        navigate("/cart");
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <FaShoppingCart size={18} color="#2e7d32" />
                                    <span>Giỏ hàng của tôi</span>
                                    {cartCount > 0 && (
                                        <span style={{
                                            marginLeft: "auto",
                                            background: "#ff4444",
                                            color: "white",
                                            borderRadius: "12px",
                                            padding: "2px 6px",
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}>
                                            {cartCount}
                                        </span>
                                    )}
                                </div>

                                <div 
                                    style={menuItemStyle}
                                    onClick={handleLogout}
                                >
                                    <FaSignOutAlt size={18} color="#ff4444" />
                                    <span>Đăng xuất</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== MODAL CHI TIẾT BÀI VIẾT ==================== */}
            {isPostModalOpen && selectedPost && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2000,
                    overflowY: "auto"
                }} onClick={closePostModal}>
                    <div style={{
                        background: "white",
                        width: "700px",
                        maxWidth: "90%",
                        maxHeight: "90vh",
                        borderRadius: "16px",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        position: "relative"
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header modal */}
                        <div style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #e4e6eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexShrink: 0
                        }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>Chi tiết bài viết</h3>
                            <button
                                onClick={closePostModal}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >✕</button>
                        </div>

                        {/* Nội dung modal */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                            {/* Author info */}
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "15px" }}>
                                <div style={{ 
                                    width: "48px", 
                                    height: "48px", 
                                    background: "#e4e6eb", 
                                    borderRadius: "50%", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    overflow: "hidden",
                                    flexShrink: 0
                                }}>
                                    {selectedPost.author_avatar ? (
                                        <img src={selectedPost.author_avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                                    ) : (
                                        <span style={{ fontSize: "24px" }}>👤</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{selectedPost.author_name}</h4>
                                    <span style={{ fontSize: "12px", color: "#888" }}>{new Date(selectedPost.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ marginBottom: "15px" }}>
                                {selectedPost.content && (
                                    <div style={{ 
                                        marginBottom: '16px', 
                                        fontSize: '15px', 
                                        lineHeight: '1.5', 
                                        color: '#1c1e21',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedPost.content}
                                    </div>
                                )}
                                {selectedPost.location && (
                                    <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                                        📍 <strong>Vị trí:</strong> {selectedPost.location}
                                    </p>
                                )}
                                {selectedPost.tags && selectedPost.tags.length > 0 && (
                                    <p style={{ margin: "5px 0", color: "#2e7d32", fontSize: "14px", fontWeight: "500" }}>
                                        {selectedPost.tags.map(tag => `#${tag}`).join(" ")}
                                    </p>
                                )}
                            </div>

                            {/* Images */}
                            {selectedPost.images && selectedPost.images.length > 0 && (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: selectedPost.images.length > 1 ? "repeat(2, 1fr)" : "1fr",
                                    gap: "10px",
                                    marginBottom: "15px"
                                }}>
                                    {selectedPost.images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={img} 
                                            alt="post" 
                                            style={{ 
                                                width: "100%", 
                                                borderRadius: "8px", 
                                                objectFit: "cover",
                                                cursor: "pointer",
                                                transition: "transform 0.2s"
                                            }}
                                            onClick={() => openLightbox(selectedPost.images, idx)}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "14px", color: "#65676B" }}>
                                <div>👍 {selectedPost.stats?.like_count || 0} lượt thích</div>
                                <div>{selectedPost.stats?.comment_count || 0} bình luận</div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "8px 0", marginBottom: "15px" }}>
                                <div
                                    onClick={async () => {
                                        const newLiked = !modalLiked;
                                        setModalLiked(newLiked);
                                        setSelectedPost(prev => ({
                                            ...prev,
                                            stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? 1 : -1) }
                                        }));
                                        try {
                                            await api.post(`/api/v1/likes/${selectedPost._id}`);
                                        } catch(e) {
                                            setModalLiked(!newLiked);
                                            setSelectedPost(prev => ({
                                                ...prev,
                                                stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? -1 : 1) }
                                            }));
                                        }
                                    }}
                                    style={{ flex: 1, textAlign: "center", cursor: "pointer", color: modalLiked ? "#1877F2" : "#555", fontWeight: "500", padding: "6px 0", borderRadius: "6px" }}
                                >
                                    👍 Thích
                                </div>
                                <div style={{ flex: 1, textAlign: "center", color: "#555", fontWeight: "500", padding: "6px 0" }}>💬 Bình luận</div>
                                <div style={{ flex: 1, textAlign: "center", cursor: "pointer", color: "#555", fontWeight: "500", padding: "6px 0", borderRadius: "6px" }}
                                    onClick={() => {
                                        // Share functionality
                                        const shareUrl = `${window.location.origin}/?postId=${selectedPost._id}`;
                                        navigator.clipboard?.writeText(shareUrl);
                                        alert("Đã sao chép link bài viết!");
                                    }}
                                >↗️ Chia sẻ</div>
                            </div>

                            {/* Comments section */}
                            <div style={{ marginTop: "15px" }}>
                                <div style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center", 
                                    marginBottom: "16px",
                                    flexWrap: "wrap",
                                    gap: "10px"
                                }}>
                                    <h4 style={{ fontSize: "16px", margin: 0, fontWeight: "600" }}>Bình luận</h4>
                                    <select
                                        value={modalCommentFilter}
                                        onChange={(e) => handleModalCommentFilter(e.target.value)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            border: "1px solid #ddd",
                                            background: "white",
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            outline: "none",
                                            backgroundColor: "#f8f9fa"
                                        }}
                                    >
                                        <option value="relevant">✨ Phù hợp nhất</option>
                                        <option value="newest">🕐 Mới nhất</option>
                                        <option value="all">📋 Tất cả bình luận</option>
                                    </select>
                                </div>
                                
                                {replyingTo && (
                                    <div style={{ 
                                        background: "#e8f5e9", 
                                        padding: "12px", 
                                        borderRadius: "12px", 
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        flexWrap: "wrap"
                                    }}>
                                        <span style={{ fontSize: "14px", color: "#2e7d32" }}>
                                            💬 Trả lời <strong>{replyingTo.author_name}</strong>:
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Viết câu trả lời..."
                                            value={replyInput}
                                            onChange={(e) => setReplyInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleModalComment(replyingTo._id)}
                                            style={{
                                                flex: 1,
                                                minWidth: "200px",
                                                padding: "8px 12px",
                                                borderRadius: "20px",
                                                border: "1px solid #c8e6c9",
                                                background: "white",
                                                outline: "none",
                                                fontSize: "14px"
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleModalComment(replyingTo._id)}
                                            style={{ border: "none", background: "#2e7d32", color: "white", padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
                                        >
                                            Gửi
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            style={{ border: "none", background: "#e0e0e0", color: "#333", padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {modalComments.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#888", padding: "40px 20px", background: "#fafafa", borderRadius: "12px" }}>
                                        <span style={{ fontSize: "32px" }}>💬</span>
                                        <p style={{ marginTop: "8px" }}>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                                    </div>
                                ) : (
                                    modalComments.map(cmt => {
                                        const isCommentOwner = currentUser && String(currentUser._id || currentUser.id) === String(cmt.author_id);
                                        const isAdmin = currentUser && currentUser.role === "admin";
                                        const showMenu = isCommentOwner || isAdmin;
                                        const replies = getRepliesForComment(cmt._id);
                                        const isExpanded = expandedReplies[cmt._id] || false;
                                        
                                        return (
                                            <div key={cmt._id} style={{ marginBottom: "20px", transition: "all 0.2s" }}>
                                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                    <div style={{ 
                                                        width: "40px", 
                                                        height: "40px", 
                                                        background: "#e8f5e9", 
                                                        borderRadius: "50%", 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        justifyContent: "center", 
                                                        color: "#2e7d32", 
                                                        fontSize: "16px", 
                                                        fontWeight: "bold", 
                                                        flexShrink: 0,
                                                        border: "1px solid #c8e6c9"
                                                    }}>
                                                        {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        {editingCommentId === cmt._id ? (
                                                            <div style={{ background: "#f0f2f5", padding: "12px 16px", borderRadius: "20px" }}>
                                                                <input
                                                                    type="text"
                                                                    value={editCommentContent}
                                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                                    style={{
                                                                        width: "100%",
                                                                        padding: "10px 14px",
                                                                        borderRadius: "12px",
                                                                        border: "1px solid #2e7d32",
                                                                        outline: "none",
                                                                        fontSize: "14px",
                                                                        background: "white"
                                                                    }}
                                                                    autoFocus
                                                                    onKeyDown={(e) => e.key === "Enter" && handleSaveModalComment(selectedPost._id, cmt._id)}
                                                                />
                                                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                                                    <button
                                                                        onClick={() => handleSaveModalComment(selectedPost._id, cmt._id)}
                                                                        style={{
                                                                            padding: "6px 16px",
                                                                            background: "#2e7d32",
                                                                            color: "white",
                                                                            border: "none",
                                                                            borderRadius: "20px",
                                                                            cursor: "pointer",
                                                                            fontSize: "13px",
                                                                            fontWeight: "500"
                                                                        }}
                                                                    >
                                                                        Lưu
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingCommentId(null);
                                                                            setEditCommentContent("");
                                                                        }}
                                                                        style={{
                                                                            padding: "6px 16px",
                                                                            background: "#e4e6eb",
                                                                            color: "#333",
                                                                            border: "none",
                                                                            borderRadius: "20px",
                                                                            cursor: "pointer",
                                                                            fontSize: "13px"
                                                                        }}
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div style={{ 
                                                                    background: "#f0f2f5", 
                                                                    padding: "10px 14px", 
                                                                    borderRadius: "18px"
                                                                }}>
                                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                                                                        <strong style={{ fontSize: "14px", color: "#1c1e21" }}>
                                                                            {cmt.author_name}
                                                                        </strong>
                                                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                                            {showMenu && (
                                                                                <div style={{ position: "relative" }}>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveCommentMenu(activeCommentMenu === cmt._id ? null : cmt._id);
                                                                                        }}
                                                                                        style={{
                                                                                            background: "transparent",
                                                                                            border: "none",
                                                                                            cursor: "pointer",
                                                                                            color: "#65676B",
                                                                                            fontSize: "18px",
                                                                                            padding: "0 8px",
                                                                                            fontWeight: "bold"
                                                                                        }}
                                                                                    >
                                                                                        •••
                                                                                    </button>
                                                                                    {activeCommentMenu === cmt._id && (
                                                                                        <div style={{
                                                                                            position: "absolute",
                                                                                            top: "24px",
                                                                                            right: "0",
                                                                                            background: "white",
                                                                                            border: "1px solid #ddd",
                                                                                            borderRadius: "10px",
                                                                                            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                                                                                            width: "130px",
                                                                                            zIndex: 20,
                                                                                            overflow: "hidden"
                                                                                        }}>
                                                                                            <button
                                                                                                onClick={() => handleEditModalComment(cmt)}
                                                                                                style={{
                                                                                                    padding: "10px 14px",
                                                                                                    border: "none",
                                                                                                    background: "white",
                                                                                                    textAlign: "left",
                                                                                                    cursor: "pointer",
                                                                                                    fontSize: "13px",
                                                                                                    width: "100%",
                                                                                                    borderBottom: "1px solid #eee",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    gap: "8px"
                                                                                                }}
                                                                                            >
                                                                                                ✏️ Sửa
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDeleteModalComment(selectedPost._id, cmt._id)}
                                                                                                style={{
                                                                                                    padding: "10px 14px",
                                                                                                    border: "none",
                                                                                                    background: "white",
                                                                                                    textAlign: "left",
                                                                                                    cursor: "pointer",
                                                                                                    fontSize: "13px",
                                                                                                    color: "#dc3545",
                                                                                                    width: "100%",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    gap: "8px"
                                                                                                }}
                                                                                            >
                                                                                                🗑️ Xóa
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span style={{ fontSize: "14px", color: "#1c1e21", wordBreak: "break-word", lineHeight: "1.5" }}>
                                                                        {cmt.content}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div style={{ display: "flex", gap: "16px", marginTop: "8px", marginLeft: "12px", fontSize: "12px", color: "#65676B" }}>
                                                                    <span>{new Date(cmt.created_at).toLocaleString()}</span>
                                                                    <button 
                                                                        onClick={() => setReplyingTo(cmt)}
                                                                        style={{ border: "none", background: "transparent", color: "#2e7d32", cursor: "pointer", fontSize: "12px", fontWeight: "500", padding: "0" }}
                                                                    >
                                                                        Trả lời
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Replies */}
                                                {replies && replies.length > 0 && (
                                                    <div style={{ marginLeft: "52px", marginTop: "8px" }}>
                                                        {!isExpanded ? (
                                                            <button
                                                                onClick={() => toggleReplies(cmt._id)}
                                                                style={{
                                                                    background: "transparent",
                                                                    border: "none",
                                                                    color: "#2e7d32",
                                                                    fontSize: "12px",
                                                                    fontWeight: "500",
                                                                    cursor: "pointer",
                                                                    padding: "4px 8px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    borderRadius: "16px"
                                                                }}
                                                            >
                                                                💬 Xem {replies.length} câu trả lời
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => toggleReplies(cmt._id)}
                                                                    style={{
                                                                        background: "transparent",
                                                                        border: "none",
                                                                        color: "#65676B",
                                                                        fontSize: "12px",
                                                                        cursor: "pointer",
                                                                        padding: "4px 8px",
                                                                        marginBottom: "8px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "6px"
                                                                    }}
                                                                >
                                                                    🔽 Ẩn câu trả lời
                                                                </button>
                                                                <div style={{ paddingLeft: "16px", borderLeft: "2px solid #e8f5e9" }}>
                                                                    {replies.map(reply => {
                                                                        const isReplyOwner = currentUser && String(currentUser._id || currentUser.id) === String(reply.author_id);
                                                                        const showReplyMenu = isReplyOwner || isAdmin;
                                                                        
                                                                        return (
                                                                            <div key={reply._id} style={{ display: "flex", gap: "10px", marginBottom: "14px", alignItems: "flex-start" }}>
                                                                                <div style={{ 
                                                                                    width: "32px", 
                                                                                    height: "32px", 
                                                                                    background: "#e8f5e9", 
                                                                                    borderRadius: "50%", 
                                                                                    display: "flex", 
                                                                                    alignItems: "center", 
                                                                                    justifyContent: "center", 
                                                                                    fontSize: "12px", 
                                                                                    fontWeight: "bold",
                                                                                    flexShrink: 0,
                                                                                    color: "#2e7d32",
                                                                                    border: "1px solid #c8e6c9"
                                                                                }}>
                                                                                    {reply.author_name ? reply.author_name.charAt(0).toUpperCase() : "U"}
                                                                                </div>
                                                                                <div style={{ flex: 1 }}>
                                                                                    {editingCommentId === reply._id ? (
                                                                                        <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "16px" }}>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={editCommentContent}
                                                                                                onChange={(e) => setEditCommentContent(e.target.value)}
                                                                                                style={{
                                                                                                    width: "100%",
                                                                                                    padding: "6px 12px",
                                                                                                    borderRadius: "8px",
                                                                                                    border: "1px solid #2e7d32",
                                                                                                    outline: "none",
                                                                                                    fontSize: "13px",
                                                                                                    background: "white"
                                                                                                }}
                                                                                                autoFocus
                                                                                                onKeyDown={(e) => e.key === "Enter" && handleSaveModalComment(selectedPost._id, reply._id)}
                                                                                            />
                                                                                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                                                                                <button onClick={() => handleSaveModalComment(selectedPost._id, reply._id)} style={{ padding: "3px 12px", background: "#2e7d32", color: "white", border: "none", borderRadius: "16px", cursor: "pointer", fontSize: "11px" }}>Lưu</button>
                                                                                                <button onClick={() => { setEditingCommentId(null); setEditCommentContent(""); }} style={{ padding: "3px 12px", background: "#e4e6eb", border: "none", borderRadius: "16px", cursor: "pointer", fontSize: "11px" }}>Hủy</button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div style={{ 
                                                                                                background: "#f0f2f5", 
                                                                                                padding: "8px 12px", 
                                                                                                borderRadius: "16px"
                                                                                            }}>
                                                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                                    <strong style={{ fontSize: "12px", display: "block", marginBottom: "4px", color: "#1c1e21" }}>
                                                                                                        {reply.author_name}
                                                                                                    </strong>
                                                                                                    {showReplyMenu && (
                                                                                                        <div style={{ position: "relative" }}>
                                                                                                            <button
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation();
                                                                                                                    setActiveCommentMenu(activeCommentMenu === reply._id ? null : reply._id);
                                                                                                                }}
                                                                                                                style={{ 
                                                                                                                    background: "transparent", 
                                                                                                                    border: "none", 
                                                                                                                    cursor: "pointer", 
                                                                                                                    color: "#65676B", 
                                                                                                                    fontSize: "16px",
                                                                                                                    padding: "0 4px"
                                                                                                                }}
                                                                                                            >
                                                                                                                •••
                                                                                                            </button>
                                                                                                            {activeCommentMenu === reply._id && (
                                                                                                                <div style={{
                                                                                                                    position: "absolute",
                                                                                                                    top: "20px",
                                                                                                                    right: "0",
                                                                                                                    background: "white",
                                                                                                                    border: "1px solid #ddd",
                                                                                                                    borderRadius: "10px",
                                                                                                                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                                                                                                                    width: "100px",
                                                                                                                    zIndex: 20,
                                                                                                                    overflow: "hidden"
                                                                                                                }}>
                                                                                                                    <button 
                                                                                                                        onClick={() => handleEditModalComment(reply)} 
                                                                                                                        style={{ 
                                                                                                                            padding: "8px 12px", 
                                                                                                                            border: "none", 
                                                                                                                            background: "white", 
                                                                                                                            textAlign: "left", 
                                                                                                                            cursor: "pointer", 
                                                                                                                            fontSize: "12px", 
                                                                                                                            width: "100%",
                                                                                                                            borderBottom: "1px solid #eee"
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        ✏️ Sửa
                                                                                                                    </button>
                                                                                                                    <button 
                                                                                                                        onClick={() => handleDeleteModalComment(selectedPost._id, reply._id)} 
                                                                                                                        style={{ 
                                                                                                                            padding: "8px 12px", 
                                                                                                                            border: "none", 
                                                                                                                            background: "white", 
                                                                                                                            textAlign: "left", 
                                                                                                                            cursor: "pointer", 
                                                                                                                            fontSize: "12px", 
                                                                                                                            color: "#dc3545", 
                                                                                                                            width: "100%" 
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        🗑️ Xóa
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                                <span style={{ fontSize: "13px", color: "#1c1e21", wordBreak: "break-word" }}>
                                                                                                    {reply.content}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div style={{ marginTop: "4px", marginLeft: "8px", fontSize: "11px", color: "#65676B" }}>
                                                                                                {new Date(reply.created_at).toLocaleString()}
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Comment input */}
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #e4e6eb", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ 
                                width: "32px", 
                                height: "32px", 
                                background: "#ddd", 
                                borderRadius: "50%", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                flexShrink: 0 
                            }}>
                                {currentUser?.avatar_url ? (
                                    <img src={currentUser.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}/>
                                ) : "👤"}
                            </div>
                            <input
                                type="text"
                                placeholder={replyingTo ? `Trả lời ${replyingTo.author_name}...` : "Viết bình luận..."}
                                value={modalCommentInput}
                                onChange={(e) => setModalCommentInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && modalCommentInput.trim()) {
                                        handleModalComment();
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: "10px 14px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background: "#f0f2f5",
                                    outline: "none",
                                    fontSize: "14px"
                                }}
                            />
                            <button
                                onClick={() => handleModalComment()}
                                style={{ border: "none", background: "transparent", color: "#1877F2", fontWeight: "bold", cursor: "pointer" }}
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL XÁC NHẬN XÓA ==================== */}
            {showConfirmModal && (
                <div 
                    style={{
                        position: "fixed", 
                        top: 0, left: 0, 
                        width: "100vw", height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        zIndex: 3000
                    }}
                    onClick={() => setShowConfirmModal(false)}
                >
                    <div 
                        style={{
                            background: "white",
                            width: "420px",
                            maxWidth: "90%",
                            borderRadius: "16px",
                            padding: "28px 24px",
                            textAlign: "center",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑️</div>
                        <h3 style={{ margin: "0 0 12px", fontSize: "20px", color: "#333" }}>
                            Xác nhận xóa
                        </h3>
                        <p style={{ 
                            margin: "0 0 28px", 
                            fontSize: "15.5px", 
                            color: "#555", 
                            lineHeight: "1.5" 
                        }}>
                            {confirmMessage}
                        </p>
                        
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: "1px solid #ddd",
                                    background: "#f8f9fa",
                                    color: "#333",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction) confirmAction();
                                    setShowConfirmModal(false);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "#dc3545",
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== LIGHTBOX XEM ẢNH ==================== */}
            {isLightboxOpen && lightboxImages.length > 0 && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "30px",
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            color: "white",
                            fontSize: "30px",
                            cursor: "pointer",
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10001,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}
                    >
                        ✕
                    </button>

                    {lightboxImages.length > 1 && (
                        <button
                            onClick={prevImage}
                            style={{
                                position: "absolute",
                                left: "30px",
                                background: "rgba(0,0,0,0.5)",
                                border: "none",
                                color: "white",
                                fontSize: "20px",
                                cursor: "pointer",
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10001,
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}
                        >
                            ◀
                        </button>
                    )}

                    <img
                        src={lightboxImages[currentImageIndex]}
                        alt={`Lightbox ${currentImageIndex + 1}`}
                        style={{
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            objectFit: "contain",
                            borderRadius: "8px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {lightboxImages.length > 1 && (
                        <button
                            onClick={nextImage}
                            style={{
                                position: "absolute",
                                right: "30px",
                                background: "rgba(0,0,0,0.5)",
                                border: "none",
                                color: "white",
                                fontSize: "20px",
                                cursor: "pointer",
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10001,
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}
                        >
                            ▶
                        </button>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            bottom: "30px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(0,0,0,0.6)",
                            color: "white",
                            padding: "6px 16px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "500",
                            pointerEvents: "none"
                        }}
                    >
                        {currentImageIndex + 1} / {lightboxImages.length}
                    </div>
                </div>
            )}

            <ChatModal 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />
        </>
    );
}

export default Header;