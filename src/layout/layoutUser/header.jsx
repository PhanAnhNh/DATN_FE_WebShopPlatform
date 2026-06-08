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
    const [activeSearchTab, setActiveSearchTab] = useState('all'); // 'all', 'posts', 'users', 'groups'
    
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

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

    // Tìm kiếm người dùng
    const searchUsers = async (keyword) => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return [];

            // Thử gọi API tìm kiếm người dùng
            const response = await api.get(`/api/v1/users/search?keyword=${encodeURIComponent(keyword)}`);
            return response.data || [];
        } catch (error) {
            console.error("Lỗi tìm kiếm người dùng (API chưa có):", error);
            // Trả về mảng rỗng thay vì fallback gây lỗi
            return [];
        }
    };

    // Tìm kiếm nhóm
    const searchGroups = async (keyword) => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) return [];

            // Thử gọi API tìm kiếm nhóm
            const response = await api.get(`/api/v1/groups/search?keyword=${encodeURIComponent(keyword)}`);
            return response.data || [];
        } catch (error) {
            console.error("Lỗi tìm kiếm nhóm (API chưa có):", error);
            // Fallback: lấy danh sách nhóm công khai và lọc theo keyword
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

    // Search function
    const handleSearch = async (keyword) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            setUserSearchResults([]);
            setGroupSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            // Tìm kiếm đồng thời bài viết, người dùng và nhóm
            const [posts, users, groups] = await Promise.all([
                searchPosts(keyword),
                searchUsers(keyword),
                searchGroups(keyword)
            ]);
            
            setSearchResults(posts);
            setUserSearchResults(users);
            setGroupSearchResults(groups);
            setShowSearchResults(true);
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            setSearchResults([]);
            setUserSearchResults([]);
            setGroupSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchKeyword) {
                handleSearch(searchKeyword);
            } else {
                setSearchResults([]);
                setUserSearchResults([]);
                setGroupSearchResults([]);
                setShowSearchResults(false);
            }
        }, 500);

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

    // Initial fetch
    useEffect(() => {
        if (isLoggedIn) {
            fetchCartCount();
            fetchFavoriteCount();
            
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

    const handleAvatarClick = () => {
        const token = localStorage.getItem("user_token");
        
        if (token) {
            setIsMenuOpen(!isMenuOpen);
        } else {
            navigate("/login");
        }
    };

    const handleLogout = () => {
    // Xóa tất cả dữ liệu liên quan đến user
    localStorage.removeItem("user_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");
    
    // Xóa cache trong sessionStorage
    sessionStorage.removeItem("sidebar_user");
    sessionStorage.removeItem("sidebar_user_cache_time");
    sessionStorage.removeItem("home_posts_general");
    sessionStorage.removeItem("home_posts_agriculture");
    sessionStorage.removeItem("home_posts_seafood");
    sessionStorage.removeItem("home_posts_specialty");
    
    // Cập nhật state
    setIsMenuOpen(false);
    setCartCount(0);
    setFavoriteCount(0);
    setIsLoggedIn(false);
    
    // Dispatch event để các component khác biết
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // Chuyển hướng về trang chủ (không phải login)
    navigate("/");
    // Reload page để reset toàn bộ state
    window.location.reload();
};

    const handleCartClick = () => {
        navigate("/cart");
    };

    const handlePostClick = (post) => {
        setShowSearchResults(false);
        setSearchKeyword("");
        if (post.author_id) {
            navigate(`/profile/${post.author_id}`);
        } else {
            if (location.pathname === "/") {
                const element = document.getElementById(`post-${post._id}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                    element.style.backgroundColor = "#fff3cd";
                    setTimeout(() => {
                        element.style.backgroundColor = "";
                    }, 2000);
                }
            } else {
                navigate(`/?postId=${post._id}`);
            }
        }
    };

    const handleUserClick = (user) => {
        setShowSearchResults(false);
        setSearchKeyword("");
        navigate(`/profile/${user._id || user.id}`);
    };

    const handleGroupClick = (group) => {
        setShowSearchResults(false);
        setSearchKeyword("");
        navigate(`/groups/${group._id}`);
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

    // Lọc kết quả theo tab
    const getFilteredResults = () => {
        switch(activeSearchTab) {
            case 'posts':
                return searchResults;
            case 'users':
                return userSearchResults;
            case 'groups':
                return groupSearchResults;
            default:
                return [...searchResults, ...userSearchResults, ...groupSearchResults];
        }
    };

    const totalResults = searchResults.length + userSearchResults.length + groupSearchResults.length;

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
                        <img src="/logoda.png" alt="Logo" style={{ width: "57px", height: "45px" }} />
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
                                placeholder={isMobile ? "Tìm kiếm..." : "Tìm kiếm bài viết, người dùng, nhóm..."}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
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
                                    if (searchKeyword && totalResults > 0) {
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
                                onClick={() => handleSearch(searchKeyword)}
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
                                    {isSearching ? (
                                        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                                            Đang tìm kiếm...
                                        </div>
                                    ) : totalResults === 0 ? (
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
                                                flexWrap: "wrap"
                                            }}>
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
                                            
                                            {/* Kết quả tìm kiếm theo tab */}
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
                                                                borderBottom: "1px solid #eee"
                                                            }}>
                                                                👥 Nhóm
                                                            </div>
                                                        )}
                                                        {groupSearchResults.map((group) => (
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
                                                                borderTop: activeSearchTab === 'all' && groupSearchResults.length > 0 ? "1px solid #eee" : "none"
                                                            }}>
                                                                👤 Người dùng
                                                            </div>
                                                        )}
                                                        {userSearchResults.map((user) => (
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
                                                                borderTop: (activeSearchTab === 'all' && (userSearchResults.length > 0 || groupSearchResults.length > 0)) ? "1px solid #eee" : "none"
                                                            }}>
                                                                📝 Bài viết
                                                            </div>
                                                        )}
                                                        {searchResults.map((post) => (
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
            <ChatModal 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />
        </>
    );
}

export default Header;