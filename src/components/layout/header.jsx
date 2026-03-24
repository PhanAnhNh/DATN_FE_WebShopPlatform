// components/layout/header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaBell, FaUser, FaBook, FaCog, FaSignOutAlt } from 'react-icons/fa';
import api from "../../api/api";
import NotificationBell from "../../pages/user/NotificationBell";


function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    
    const menuRef = useRef(null);
    const navigate = useNavigate();

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
            fetchCartCount(); // Bây giờ fetchCartCount đã được định nghĩa
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
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <input
                    placeholder="Tìm kiếm bài viết, sản phẩm"
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        padding: "12px 20px",
                        borderRadius: "20px",
                        border: "1px solid #ddd",
                        backgroundColor: "#f0f2f5",
                        outline: "none",
                        transition: "all 0.3s"
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#2e7d32";
                        e.target.style.backgroundColor = "white";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#ddd";
                        e.target.style.backgroundColor = "#f0f2f5";
                    }}
                />
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

                            {/* Cài đặt */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                onClick={() => {
                                    navigate("/settings");
                                    setIsMenuOpen(false);
                                }}
                            >
                                <FaCog size={18} color="#2e7d32" />
                                <span>Cài đặt</span>
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
        </div>
    );
}

export default Header;