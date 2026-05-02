// components/layout/ShopDetailLayout.jsx
import React, { useState, useEffect } from "react";
import Header from "./header";
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

function ShopDetailLayout({ children, shop }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const headerHeight = 60;

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ngăn scroll body khi menu mobile mở
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Dynamic import SidebarLeft chỉ khi mobile và cần thiết
    const [SidebarLeft, setSidebarLeft] = useState(null);
    
    useEffect(() => {
        if (isMobile) {
            import("./SidebarLeft").then(module => {
                setSidebarLeft(() => module.default);
            });
        }
    }, [isMobile]);

    // Footer Component - chỉ hiển thị trên desktop
    const FooterContent = () => (
        <footer style={{
            background: "#2e7d32",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "40px 20px",
            marginTop: "40px"
        }}>
            <div style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "30px"
            }}>
                {/* Cột 1: Giới thiệu */}
                <div>
                    <h3 style={{ color: "#ffffff", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
                        Đặc Sản Quê Tôi
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: "1.6", fontSize: "14px" }}>
                        Kết nối nông dân - người tiêu dùng, mang đặc sản vùng miền đến gần hơn với mọi nhà.
                    </p>
                </div>

                {/* Cột 2: Liên kết nhanh */}
                <div>
                    <h4 style={{ marginBottom: "15px", color: "#ffffff", fontSize: "16px", fontWeight: "bold" }}>
                        Liên kết nhanh
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/about" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Giới thiệu</a>
                        </li>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/contact" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Liên hệ</a>
                        </li>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/terms" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Điều khoản sử dụng</a>
                        </li>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/privacy" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Chính sách bảo mật</a>
                        </li>
                    </ul>
                </div>

                {/* Cột 3: Hỗ trợ khách hàng */}
                <div>
                    <h4 style={{ marginBottom: "15px", color: "#ffffff", fontSize: "16px", fontWeight: "bold" }}>
                        Hỗ trợ khách hàng
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/faq" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Câu hỏi thường gặp</a>
                        </li>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/shipping" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Phương thức vận chuyển</a>
                        </li>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/returns" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Chính sách đổi trả</a>
                        </li>
                        <li style={{ marginBottom: "10px" }}>
                            <a href="/payment" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px" }}>Hướng dẫn thanh toán</a>
                        </li>
                    </ul>
                </div>

                {/* Cột 4: Kết nối & Thông tin liên hệ */}
                <div>
                    <h4 style={{ marginBottom: "15px", color: "#ffffff", fontSize: "16px", fontWeight: "bold" }}>
                        Kết nối với chúng tôi
                    </h4>
                    <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                        <a href="#" style={{ fontSize: "24px", textDecoration: "none", color: "#ffffff" }}>
                            <FaFacebook />
                        </a>
                        <a href="#" style={{ fontSize: "24px", textDecoration: "none", color: "#ffffff" }}>
                            <FaTwitter />
                        </a>
                        <a href="#" style={{ fontSize: "24px", textDecoration: "none", color: "#ffffff" }}>
                            <FaInstagram />
                        </a>
                    </div>
                    
                    <div>
                        <h4 style={{ marginBottom: "10px", color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}>
                            Thông tin cửa hàng
                        </h4>
                        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", lineHeight: "1.8" }}>
                            <p style={{ margin: "5px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FaMapMarkerAlt /> <span>{shop?.address || "Chưa cập nhật"}</span>
                            </p>
                            <p style={{ margin: "5px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FaPhone /> <span>{shop?.phone || "Chưa cập nhật"}</span>
                            </p>
                            <p style={{ margin: "5px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FaEnvelope /> <span>{shop?.email || "Chưa cập nhật"}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bản quyền */}
            <div style={{
                textAlign: "center",
                paddingTop: "30px",
                marginTop: "30px",
                borderTop: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.8)",
                fontSize: "14px"
            }}>
                © 2024 Đặc Sản Quê Tôi. Tất cả các quyền được bảo lưu.
            </div>
        </footer>
    );

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#f3f4f6"
        }}>
            {/* Header - chỉ hiển thị nút menu khi là mobile */}
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, width: "100%" }}>
                <Header 
                    onMenuToggle={isMobile ? () => setMobileMenuOpen(!mobileMenuOpen) : undefined}
                    mobileMenuOpen={mobileMenuOpen}
                    showMenuButton={isMobile}
                />
            </div>

            {/* Spacer */}
            <div style={{ height: `${headerHeight}px` }} />

            {/* Overlay khi mở menu mobile - CHỈ HIỂN THỊ TRÊN MOBILE */}
            {isMobile && (
                <div 
                    className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 998,
                        display: mobileMenuOpen ? "block" : "none",
                        transition: "all 0.3s ease"
                    }}
                />
            )}

            {/* Nội dung chính */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
                padding: isMobile ? "12px" : "20px",
                position: "relative",
                flex: 1
            }}>
                {/* Sidebar Mobile - chỉ hiển thị khi mobile và menu mở */}
                {isMobile && SidebarLeft && mobileMenuOpen && (
                    <div 
                        className="sidebar-mobile"
                        style={{
                            position: "fixed",
                            top: `${headerHeight}px`,
                            left: 0,
                            width: "280px",
                            height: `calc(100vh - ${headerHeight}px)`,
                            overflowY: "auto",
                            backgroundColor: "#f3f4f6",
                            zIndex: 999,
                            boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
                            animation: "slideIn 0.3s ease"
                        }}
                    >
                        <SidebarLeft onClose={() => setMobileMenuOpen(false)} />
                    </div>
                )}

                {/* Cột giữa - full width trên desktop */}
                <div style={{ 
                    flex: 1, 
                    width: "100%"
                }}>
                    {children}
                </div>
            </div>

            {/* Footer - CHỈ HIỂN THỊ TRÊN DESKTOP, ẨN TRÊN MOBILE */}
            {!isMobile && <FooterContent />}

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                
                @media (max-width: 768px) {
                    .sidebar-mobile {
                        animation: slideIn 0.3s ease;
                    }
                }
            `}</style>
        </div>
    );
}

export default ShopDetailLayout;