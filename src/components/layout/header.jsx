// components/layout/header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaShoppingCart, FaBell, FaUser, FaBook, FaCog, FaSignOutAlt, FaComment, FaSearch } from 'react-icons/fa';
import api from "../../api/api";
import NotificationBell from "../../pages/user/NotificationBell";
import ChatModal from "../Chat/ChatModal";

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Định nghĩa hàm fetchCartCount ở ngoài useEffect để có thể tái sử dụng
    const fetchCartCount = async () => {
        try {
            const token = localStorage.getItem("user_token");
            if (!token) {
                setCartCount(0);
                return;
            }
            
            const response = await api.get('/api/v1/cart/count');
            console.log("Cart count response:", response.data);
            setCartCount(response.data.count);
        } catch (error) {
            console.error("Error fetching cart count:", error);
            setCartCount(0);
        }
    };

    // Hàm tìm kiếm
    const handleSearch = async (keyword) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const token = localStorage.getItem("user_token");
            if (!token) {
                console.log("Chưa đăng nhập");
                return;
            }

            const response = await api.get(`/api/v1/posts/search?keyword=${encodeURIComponent(keyword)}`);
            setSearchResults(response.data);
            setShowSearchResults(true);
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce tìm kiếm
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchKeyword) {
                handleSearch(searchKeyword);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchKeyword]);

    // Đóng kết quả tìm kiếm khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect đầu tiên: fetch khi component mount và set interval
    useEffect(() => {
        fetchCartCount();
        
        // Có thể thêm interval để cập nhật số lượng giỏ hàng định kỳ
        const interval = setInterval(fetchCartCount, 30000); // 30 giây
        return () => clearInterval(interval);
    }, []);

    // Effect thứ hai: lắng nghe custom event
    useEffect(() => {
        const handleCartUpdate = () => {
            fetchCartCount(); 
        };
        
        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

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
        setIsMenuOpen(false);
        setCartCount(0);
        navigate("/");
    };

    const handleCartClick = () => {
        navigate("/cart");
    };

    const handleResultClick = (post) => {
    setShowSearchResults(false);
    setSearchKeyword("");
    if (post.author_id) {
        navigate(`/profile/${post.author_id}`);
    } else {
        // Fallback: scroll đến bài viết nếu không có author_id
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

    return (
        <div style={{
            height: "70px",
            background: "white",
            display: "flex",
            alignItems: "center",
            padding: "0 80px",
            borderBottom: "1px solid #ddd",
            width: "100%",
            boxSizing: "border-box",
            position: "sticky",
            top: 0,
            zIndex: 1000
        }}>
            {/* Logo */}
            <div style={{ width: "280px", cursor: "pointer" }} onClick={() => navigate("/")}>
                <h2 style={{ color: "#2e7d32", margin: 0 }}>Đặc Sản Quê Tôi</h2>
            </div>

            {/* Thanh tìm kiếm */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }} ref={searchRef}>
                <div style={{ position: "relative", width: "100%", maxWidth: "500px" }}>
                    <input
                        placeholder="Tìm kiếm bài viết, sản phẩm..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px 40px 12px 20px",
                            borderRadius: "20px",
                            border: "1px solid #ddd",
                            backgroundColor: "#f0f2f5",
                            outline: "none",
                            transition: "all 0.3s"
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "#2e7d32";
                            e.target.style.backgroundColor = "white";
                            if (searchKeyword && searchResults.length > 0) {
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
                            right: "15px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#999",
                            cursor: "pointer"
                        }}
                        onClick={() => handleSearch(searchKeyword)}
                    />

                    
                    {showSearchResults && (
    <div style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: "8px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        maxHeight: "400px",
        overflowY: "auto",
        zIndex: 1001
    }}>
        {isSearching ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                Đang tìm kiếm...
            </div>
        ) : searchResults.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                Không tìm thấy kết quả nào
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
                    Tìm thấy {searchResults.length} kết quả cho "{searchKeyword}"
                </div>
                {searchResults.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => handleResultClick(post)}  // Truyền cả post object
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
                                    <span>👤</span>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Hiển thị tên tác giả với highlight */}
                                <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333", marginBottom: "4px" }}>
                                    {post.author_name_highlighted ? (
                                        <span dangerouslySetInnerHTML={{ __html: post.author_name_highlighted }} />
                                    ) : (
                                        post.author_name
                                    )}
                                </div>
                                
                                {/* Hiển thị nội dung với highlight */}
                                <div style={{ 
                                    fontSize: "13px", 
                                    color: "#666",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}>
                                    {post.content_highlighted ? (
                                        <span dangerouslySetInnerHTML={{ __html: post.content_highlighted }} />
                                    ) : (
                                        post.content || "Không có nội dung"
                                    )}
                                </div>
                                
                                {/* Hiển thị tags matching */}
                                {post.matching_tags && post.matching_tags.length > 0 && (
                                    <div style={{ 
                                        fontSize: "11px", 
                                        color: "#2e7d32",
                                        marginTop: "4px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {post.matching_tags.map(tag => `#${tag}`).join(" ")}
                                    </div>
                                )}
                                
                                <div style={{ 
                                    fontSize: "11px", 
                                    color: "#999",
                                    marginTop: "4px"
                                }}>
                                    {new Date(post.created_at).toLocaleDateString()} • {post.stats?.like_count || 0} thích • {post.stats?.comment_count || 0} bình luận
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        )}
    </div>
)}
                </div>
            </div>

            {/* Cụm Icon */}
            <div style={{ 
                width: "280px", 
                display: "flex", 
                gap: "20px", 
                justifyContent: "flex-end", 
                alignItems: "center", 
                fontSize: "20px" 
            }}>
                {/* Icon Chat */}
                <div 
                    style={{ position: "relative", cursor: "pointer" }}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                >
                    <span style={{
                        display: "flex",
                        border: "1px solid #ddd",
                        padding: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#f0f2f5",
                        transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e8f5e9";
                        e.currentTarget.style.borderColor = "#2e7d32";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f2f5";
                        e.currentTarget.style.borderColor = "#ddd";
                    }}>
                        <FaComment size={18} color="#2e7d32" />
                    </span>
                    
                    {/* Badge unread */}
                    {unreadCount > 0 && (
                        <span style={{
                            position: "absolute", top: "-5px", right: "-5px",
                            background: "#ff4444", color: "white",
                            borderRadius: "50%", width: "18px", height: "18px",
                            fontSize: "10px", display: "flex",
                            alignItems: "center", justifyContent: "center"
                        }}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
                
                {/* Icon Giỏ hàng */}
                <div style={{ position: "relative", cursor: "pointer" }} onClick={handleCartClick}>
                    <span style={{ 
                        display: "flex", 
                        border: "1px solid #ddd", 
                        padding: "10px", 
                        borderRadius: "50%", 
                        backgroundColor: "#f0f2f5",
                        transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e8f5e9";
                        e.currentTarget.style.borderColor = "#2e7d32";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f2f5";
                        e.currentTarget.style.borderColor = "#ddd";
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

                {/* Icon Thông báo */}
                <span style={{ 
                    cursor: "pointer", 
                    display: "flex", 
                    border: "1px solid #ddd", 
                    padding: "2px", 
                    borderRadius: "50%", 
                    backgroundColor: "#f0f2f5",
                    transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8f5e9";
                    e.currentTarget.style.borderColor = "#2e7d32";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f2f5";
                    e.currentTarget.style.borderColor = "#ddd";
                }}>
                    <div className="notification-wrapper">
                        <NotificationBell userType="user" />
                    </div>
                    
                </span>

                {/* Avatar và Dropdown Menu */}
                <div style={{ position: "relative" }} ref={menuRef}>
                    <span 
                        onClick={handleAvatarClick}
                        style={{ 
                            cursor: "pointer", 
                            display: "flex", 
                            border: "1px solid #ddd", 
                            padding: "10px", 
                            borderRadius: "50%", 
                            backgroundColor: "#f0f2f5",
                            transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e8f5e9";
                            e.currentTarget.style.borderColor = "#2e7d32";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f0f2f5";
                            e.currentTarget.style.borderColor = "#ddd";
                        }}
                    >
                        <FaUser size={18} color="#2e7d32" />
                    </span>

                    {/* Menu Dropdown */}
                    {isMenuOpen && (
                        <div style={{
                            position: "absolute",
                            top: "55px",
                            right: "0",
                            width: "260px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            padding: "10px 0",
                            zIndex: 1000,
                            display: "flex",
                            flexDirection: "column",
                            fontFamily: "Arial, sans-serif"
                        }}>
                            {/* Xem trang cá nhân */}
                            <div  
                                style={{...menuItemStyle, alignItems: "flex-start"}}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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

                            {/* Lịch sử mua */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                onClick={() => {
                                    navigate("/history/orders");
                                    setIsMenuOpen(false);
                                }}
                            >
                                <FaBook size={18} color="#2e7d32" />
                                <span>Lịch sử mua</span>
                            </div>

                            {/* Giỏ hàng */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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

                            {/* Đăng xuất */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt size={18} color="#ff4444" />
                                <span>Đăng xuất</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ChatModal 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />
        </div>
    );
}

export default Header;