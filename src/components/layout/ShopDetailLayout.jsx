// components/layout/ShopDetailLayout.jsx
import React from "react";
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
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#f3f4f6"
        }}>
            {/* Header */}
            <div style={{ position: "sticky", top: 0, zIndex: 1000, width: "100%" }}>
                <Header />
            </div>

            {/* Nội dung chính - không có sidebar */}
            <div style={{
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "20px",
                flex: 1
            }}>
                {children}
            </div>

            {/* Footer */}
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
                                <a href="/about" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }} 
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Giới thiệu
                                </a>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <a href="/contact" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Liên hệ
                                </a>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <a href="/terms" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Điều khoản sử dụng
                                </a>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <a href="/privacy" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Chính sách bảo mật
                                </a>
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
                                <a href="/faq" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Câu hỏi thường gặp
                                </a>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <a href="/shipping" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Phương thức vận chuyển
                                </a>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <a href="/returns" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Chính sách đổi trả
                                </a>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <a href="/payment" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "14px", transition: "color 0.3s" }}
                                   onMouseEnter={(e) => e.target.style.color = "#ffd700"}
                                   onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.9)"}>
                                    Hướng dẫn thanh toán
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 4: Kết nối & Thông tin liên hệ của Shop */}
                    <div>
                        <h4 style={{ marginBottom: "15px", color: "#ffffff", fontSize: "16px", fontWeight: "bold" }}>
                            Kết nối với chúng tôi
                        </h4>
                        <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                            <a href="#" style={{ fontSize: "24px", textDecoration: "none", color: "#ffffff", transition: "color 0.3s" }}
                               onMouseEnter={(e) => e.target.style.color = "#ffd700"}>
                                <FaFacebook />
                            </a>
                            <a href="#" style={{ fontSize: "24px", textDecoration: "none", color: "#ffffff", transition: "color 0.3s" }}
                               onMouseEnter={(e) => e.target.style.color = "#ffd700"}>
                                <FaTwitter />
                            </a>
                            <a href="#" style={{ fontSize: "24px", textDecoration: "none", color: "#ffffff", transition: "color 0.3s" }}
                               onMouseEnter={(e) => e.target.style.color = "#ffd700"}>
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
        </div>
    );
}

export default ShopDetailLayout;