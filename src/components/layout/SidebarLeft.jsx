import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";

function SidebarLeft({ userProfile = null }) { // Thêm prop userProfile để nhận thông tin từ UserProfile
    const [user, setUser] = useState({
        full_name: "Khách",
        username: "guest",
        avatar_url: "",
        gender: "",
        dob: "",
        email: "",
        phone: "",
        address: ""
    });

    const location = useLocation();
    const isProfilePage = location.pathname.includes("/profile"); 
    const isUserProfilePage = location.pathname.includes("/profile/"); // Trang profile của người khác
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const currentCategory = searchParams.get("category") || "general";

    useEffect(() => {

        if (userProfile) {
            setUser(userProfile);
            return;
        }

        const fetchMyProfile = async () => {
            try {
                const res = await api.get("/api/v1/auth/me");
                setUser(res.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin cá nhân:", error);
            }
        };

        const token = localStorage.getItem("user_token");
        if (token && !isUserProfilePage) {
            fetchMyProfile();
        } else if (!userProfile && isUserProfilePage) {

        }
    }, [userProfile, isUserProfilePage]);

    const firstLetter = user.full_name 
        ? user.full_name.charAt(0).toUpperCase() 
        : (user.username ? user.username.charAt(0).toUpperCase() : "U");

    const MiniProduct = ({ img, name, price }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "48%" }}>
            <img
                src={img || "https://placehold.co/100x60"}
                alt={name}
                style={{ width: "100%", height: "60px", objectFit: "cover", borderRadius: "4px" }}
            />
            <span style={{ fontSize: "13px", fontWeight: "500" }}>{name}</span>
            <span style={{ fontSize: "12px", color: "#d32f2f", fontWeight: "bold" }}>{price}</span>
        </div>
    );
    
    const handleCategoryClick = (categoryType) => {
        if (categoryType === "general") {
            navigate("/");
        } else {
            navigate(`/?category=${categoryType}`);
        }
    };
    
    const getMenuItemStyle = (categoryType) => {
        const isActive = currentCategory === categoryType && !isProfilePage;
        return {
            display: "flex", 
            gap: "15px", 
            alignItems: "center", 
            cursor: "pointer", 
            padding: "5px 0",
            color: isActive ? "#2e7d32" : "#555",
            fontWeight: isActive ? "bold" : "normal"
        };
    };

    const shouldShowProfileInfo = isProfilePage || (isUserProfilePage && userProfile);

    return (
        <div style={{ width: "280px", flexShrink: 0 }}>
            {/* Hiển thị thông tin profile */}
            {shouldShowProfileInfo ? (
                <div style={{ background: "white", borderRadius: "12px", padding: "15px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="avatar" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "50px", height: "50px", background: "#2e7d32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "20px" }}>
                                {firstLetter}
                            </div>
                        )}
                        <div>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>{user.full_name || user.username}</h3>
                            <span style={{ fontSize: "12px", color: "#666" }}>@{user.username}</span>
                        </div>
                    </div>
                    
                    <h4 style={{ marginTop: 0, marginBottom: "10px", fontSize: "14px", color: "#333" }}>Thông tin cá nhân</h4>
                    <div style={{ fontSize: "13px", lineHeight: "1.8", color: "#333" }}>
                        {user.gender && <p style={{ margin: "5px 0" }}><strong>Giới tính:</strong> {user.gender === 'Male' ? 'Nam' : user.gender === 'Female' ? 'Nữ' : user.gender}</p>}
                        {user.dob && <p style={{ margin: "5px 0" }}><strong>Ngày sinh:</strong> {new Date(user.dob).toLocaleDateString('vi-VN')}</p>}
                        {user.email && <p style={{ margin: "5px 0" }}><strong>Email:</strong> {user.email}</p>}
                        {user.phone && <p style={{ margin: "5px 0" }}><strong>SĐT:</strong> {user.phone}</p>}
                        {user.address && <p style={{ margin: "5px 0" }}><strong>Địa chỉ:</strong> {user.address}</p>}
                    </div>
                </div>
            ) : (
                // Menu Trang Chủ bình thường
                <div style={{ background: "white", borderRadius: "12px", padding: "15px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "40px", height: "40px", background: "#2e7d32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px" }}>
                                {firstLetter}
                            </div>
                        )}
                        <div>
                            <h4 style={{ margin: 0, fontSize: "16px" }}>{user.full_name || user.username}</h4>
                        </div>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "15px" }}>
                        <li style={getMenuItemStyle("general")} onClick={() => handleCategoryClick("general")}>
                            <span style={{ fontSize: "30px" }}>🏠</span> 
                            <span style={{ fontSize: "16px" }}>Trang Chủ</span>
                        </li>
                        <li style={getMenuItemStyle("agriculture")} onClick={() => handleCategoryClick("agriculture")}>
                            <span style={{ fontSize: "30px" }}>🌾</span> 
                            <span style={{ fontSize: "16px" }}>Nông sản</span>
                        </li>
                        <li style={getMenuItemStyle("seafood")} onClick={() => handleCategoryClick("seafood")}>
                            <span style={{ fontSize: "30px" }}>🦐</span> 
                            <span style={{ fontSize: "16px" }}>Hải sản</span>
                        </li>
                        <li style={getMenuItemStyle("specialty")} onClick={() => handleCategoryClick("specialty")}>
                            <span style={{ fontSize: "30px" }}>📦</span> 
                            <span style={{ fontSize: "16px" }}>Đặc sản</span>
                        </li>
                        
                        <li style={getMenuItemStyle("saved")} onClick={() => navigate("/saved")}>
                            <span style={{ fontSize: "30px" }}>📌</span> 
                            <span style={{ fontSize: "16px" }}>Đã lưu</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* Các khối Được quan tâm giữ nguyên */}
            <h4 style={{ fontSize: "16px", marginBottom: "10px", color: "#555", fontWeight: "bold" }}>Được quan tâm</h4>
            <div style={{ background: "white", borderRadius: "12px", padding: "15px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#333" }}>Đặc sản</h4>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
                    <MiniProduct name="Nem chua" price="20.000đ/10c" />
                    <MiniProduct name="Phở gà" price="30.000đ/1tô" />
                </div>
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "15px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#333" }}>Hải sản</h4>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
                    <MiniProduct name="Chè thái nguyên" price="70.000đ/kg" />
                    <MiniProduct name="Tôm hùm" price="600.000/kg" />
                </div>
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "15px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#333" }}>Nông sản</h4>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
                    <MiniProduct name="Táo đỏ tươi" price="60.000/kg" />
                    <MiniProduct name="Chuối thiên nhiên" price="60.000/kg" />
                </div>
            </div>
        </div>
    );
}

export default SidebarLeft;