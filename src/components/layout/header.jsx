import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import thêm useNavigate để chuyển trang

function Header() {
    // State để quản lý việc ẩn/hiện menu dropdown
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Ref dùng để nhận diện click ra ngoài vùng menu
    const menuRef = useRef(null);
    
    // Khởi tạo hàm chuyển hướng
    const navigate = useNavigate();

    // Xử lý sự kiện click ra ngoài để đóng menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // HÀM XỬ LÝ KHI CLICK VÀO AVATAR
    const handleAvatarClick = () => {
        const token = localStorage.getItem("access_token");
        
        if (token) {
            // Đã đăng nhập -> Bật/tắt menu
            setIsMenuOpen(!isMenuOpen);
        } else {
            // Chưa đăng nhập -> Chuyển sang trang Login
            navigate("/login"); 
            // (Nếu không dùng react-router-dom, bạn có thể dùng: window.location.href = "/login";)
        }
    };

    // HÀM XỬ LÝ ĐĂNG XUẤT
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user"); // Xóa luôn thông tin user nếu có lưu
        setIsMenuOpen(false); // Đóng menu
        alert("Đăng xuất thành công!");
        navigate("/"); // Có thể chuyển về trang chủ hoặc trang login tùy ý
    };

    // Style chung cho các mục trong menu (để code gọn hơn)
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
        }}>
            {/* Khối 1: Logo (Bên trái) */}
            <div style={{ width: "280px", cursor: "pointer" }} onClick={() => navigate("/")}>
                <h2 style={{ color: "#2e7d32", margin: 0 }}>Đặc Sản Quê Tôi</h2>
            </div>

            {/* Khối 2: Thanh tìm kiếm (Chính giữa) */}
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
                        outline: "none"
                    }}
                />
            </div>

            {/* Khối 3: Cụm Icon (Bên phải) */}
            <div style={{ width: "280px", display: "flex", gap: "20px", justifyContent: "flex-end", alignItems: "center", fontSize: "20px" }}>
                <span style={{ cursor: "pointer", display: "flex", border: "1px solid #ddd", padding: "10px", borderRadius: "50%", backgroundColor: "#f0f2f5" }}>
                    🔔
                </span>

                {/* Khu vực chứa Avatar và Dropdown Menu */}
                <div style={{ position: "relative" }} ref={menuRef}>
                    
                    {/* Nút Avatar (Đã thay đổi sự kiện onClick) */}
                    <span 
                        onClick={handleAvatarClick}
                        style={{ cursor: "pointer", display: "flex", border: "1px solid #ddd", padding: "10px", borderRadius: "50%", backgroundColor: "#f0f2f5" }}
                    >
                        👤
                    </span>

                    {/* Menu Dropdown - Chỉ hiện khi isMenuOpen = true (nghĩa là phải đăng nhập rồi mới mở được) */}
                    {isMenuOpen && (
                        <div style={{
                            position: "absolute",
                            top: "55px",
                            right: "0",
                            width: "240px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            padding: "10px 0",
                            zIndex: 1000,
                            display: "flex",
                            flexDirection: "column",
                            fontFamily: "Arial, sans-serif"
                        }}>
                            
                            {/* Mục 1: Xem trang cá nhân & Tài khoản */}
                        <div  
                            style={{...menuItemStyle, alignItems: "flex-start"}}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            
                            // THÊM GỌI HÀM NAY ĐỂ CHUYỂN TRANG
                            onClick={() => {
                                navigate("/profile");
                                setIsMenuOpen(false); // Tuỳ chọn: Đóng menu sau khi bấm để UI gọn gàng
                            }}
                        >
                            <div style={{ 
                                width: "35px", height: "35px", borderRadius: "50%", 
                                backgroundColor: "#e4e6eb", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px" 
                            }}>
                                👤
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingTop: "5px" }}>
                                <span style={{ fontWeight: "bold" }}>Xem trang cá nhân</span>
                                <span style={{ fontSize: "14px", color: "#65676B" }}>Tài khoản của tôi</span>
                            </div>
                        </div>

                            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "5px 20px" }} />

                            {/* Mục 2: Lịch sử mua */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <span style={{ fontSize: "20px" }}>📖</span>
                                <span>Lịch sử mua</span>
                            </div>

                            {/* Mục 3: Cài đặt */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <span style={{ fontSize: "20px" }}>⚙️</span>
                                <span>Cài đặt</span>
                            </div>

                            {/* Mục 4: Đăng xuất */}
                            <div 
                                style={menuItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f2f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                onClick={handleLogout}
                            >
                                <span style={{ fontSize: "20px" }}>🚪</span>
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