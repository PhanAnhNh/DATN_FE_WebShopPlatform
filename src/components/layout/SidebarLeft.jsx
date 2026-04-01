import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";

function SidebarLeft({ userProfile = null }) {
    const [user, setUser] = useState({
        full_name: "",
        username: "",
        avatar_url: "",
        gender: "",
        dob: "",
        email: "",
        phone: "",
        address: ""
    });

    // Trạng thái phục vụ chỉnh sửa
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Xác định logic trang
    const isProfilePage = location.pathname === "/profile"; 
    const isUserProfilePage = location.pathname.startsWith("/profile/");
    const currentCategory = searchParams.get("category") || "general";

    useEffect(() => {
        if (userProfile) {
            setUser(userProfile);
            setEditData(userProfile);
            return;
        }

        const fetchMyProfile = async () => {
            try {
                const res = await api.get("/api/v1/auth/me");
                setUser(res.data);
                setEditData(res.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin cá nhân:", error);
            }
        };

        const token = localStorage.getItem("user_token");
        if (token && !isUserProfilePage) {
            fetchMyProfile();
        }
    }, [userProfile, isUserProfilePage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileClick = () => {
        if (user && (user.id || user._id)) {
            const userId = user.id || user._id;
            navigate(`/profile`);
        } else {
            navigate("/profile");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Thay đổi endpoint tùy theo API thực tế của bạn
            const res = await api.put("/api/v1/auth/update", editData);
            setUser(res.data);
            setIsEditing(false);
            alert("Cập nhật thành công!");
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Không thể lưu thông tin. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const firstLetter = user.full_name 
        ? user.full_name.charAt(0).toUpperCase() 
        : (user.username ? user.username.charAt(0).toUpperCase() : "U");

    const handleCategoryClick = (categoryType) => {
        categoryType === "general" ? navigate("/") : navigate(`/?category=${categoryType}`);
    };

    // Styles nội bộ
    const cardStyle = {
        background: "white",
        borderRadius: "12px",
        padding: "15px",
        marginBottom: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    };

    const inputStyle = {
        width: "100%",
        padding: "8px",
        marginBottom: "10px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        fontSize: "13px",
        boxSizing: "border-box"
    };

    const labelStyle = {
        display: "block",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#65676b",
        marginBottom: "4px"
    };

    const MiniProduct = ({ img, name, price }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "48%" }}>
            <img src={img || "https://placehold.co/100x60"} alt={name} style={{ width: "100%", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
            <span style={{ fontSize: "13px", fontWeight: "500" }}>{name}</span>
            <span style={{ fontSize: "12px", color: "#d32f2f", fontWeight: "bold" }}>{price}</span>
        </div>
    );

    const getMenuItemStyle = (categoryType) => {
    let isActive = false;

    // Trang saved
    if (categoryType === "saved") {
        isActive = location.pathname === "/user/saved-posts";
    } 
    // Trang home + category
    else {
        const isHome = location.pathname === "/";
        isActive = isHome && currentCategory === categoryType;
    }

    return {
        display: "flex",
        gap: "15px",
        alignItems: "center",
        cursor: "pointer",
        padding: "8px 10px",
        borderRadius: "8px",
        color: isActive ? "#2e7d32" : "#050505",
        fontWeight: isActive ? "bold" : "500",
        background: isActive ? "#f0f2f5" : "transparent",
        transition: "background 0.2s"
    };
};

    const shouldShowProfileInfo = isProfilePage || (isUserProfilePage && userProfile);

    return (
        <div style={{ width: "280px", flexShrink: 0, fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}>
            {shouldShowProfileInfo ? (
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h3 style={{ margin: 0, fontSize: "18px" }}>Giới thiệu</h3>
                        {isProfilePage && !isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                style={{ border: "none", background: "#e4e6eb", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                            >
                                Chỉnh sửa tiểu sử
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                                {user.avatar_url ? (
                                     <img 
                                        src={user.avatar_url} 
                                        alt="avatar" 
                                        style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                                        onClick={handleProfileClick}
                                    />
                                ) : (
                                    <div onClick={handleProfileClick} style={{ width: "50px", height: "50px", background: "#2e7d32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "20px" }}>
                                        {firstLetter}
                                    </div>
                                )}
                                <div >
                                    <h4 onClick={handleProfileClick} style={{ margin: 0, fontSize: "16px" }}>{user.full_name || user.username}</h4>
                                    <span style={{ fontSize: "12px", color: "#65676b" }}>@{user.username}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: "14px", lineHeight: "1.8", color: "#050505" }}>
                                {user.gender && <p style={{ margin: "5px 0" }}>🚻 <strong>Giới tính:</strong> {user.gender === 'Male' ? 'Nam' : user.gender === 'Female' ? 'Nữ' : user.gender}</p>}
                                {user.dob && <p style={{ margin: "5px 0" }}>📅 <strong>Ngày sinh:</strong> {new Date(user.dob).toLocaleDateString('vi-VN')}</p>}
                                {user.email && <p style={{ margin: "5px 0" }}>📧 <strong>Email:</strong> {user.email}</p>}
                                {user.phone && <p style={{ margin: "5px 0" }}>📞 <strong>SĐT:</strong> {user.phone}</p>}
                                {user.address && <p style={{ margin: "5px 0" }}>📍 <strong>Đến từ:</strong> {user.address}</p>}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={labelStyle}>Họ và tên</label>
                            <input style={inputStyle} name="full_name" value={editData.full_name || ""} onChange={handleChange} placeholder="Nhập họ tên..." />
                            
                            <label style={labelStyle}>Giới tính</label>
                            <select style={inputStyle} name="gender" value={editData.gender || ""} onChange={handleChange}>
                                <option value="">Chọn giới tính</option>
                                <option value="Male">Nam</option>
                                <option value="Female">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>

                            <label style={labelStyle}>Ngày sinh</label>
                            <input type="date" style={inputStyle} name="dob" value={editData.dob ? editData.dob.split('T')[0] : ""} onChange={handleChange} />

                            <label style={labelStyle}>Số điện thoại</label>
                            <input style={inputStyle} name="phone" value={editData.phone || ""} onChange={handleChange} />

                            <label style={labelStyle}>Địa chỉ</label>
                            <input style={inputStyle} name="address" value={editData.address || ""} onChange={handleChange} />

                            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                <button 
                                    onClick={handleSave} 
                                    disabled={loading}
                                    style={{ flex: 1, background: "#0866ff", color: "white", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    {loading ? "Đang lưu..." : "Lưu"}
                                </button>
                                <button 
                                    onClick={() => { setIsEditing(false); setEditData(user); }} 
                                    style={{ flex: 1, background: "#e4e6eb", color: "#050505", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
            /* Menu Trang Chủ */
                <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        {user.avatar_url ? (
                            <img 
                                src={user.avatar_url} 
                                alt="avatar" 
                                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                                onClick={handleProfileClick}
                            />
                        ) : (
                            <div 
                                onClick={handleProfileClick}
                                style={{ width: "36px", height: "36px", background: "#2e7d32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", cursor: "pointer" }}
                            >
                                {firstLetter}
                            </div>
                        )}
                        <h4 
                            onClick={handleProfileClick}
                            style={{ 
                                margin: 0, 
                                fontSize: "15px", 
                                fontWeight: "600",
                                cursor: "pointer",
                                color: "#2e7d32"
                            }}
                        >
                            {user.full_name || user.username}
                        </h4>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                        <li style={getMenuItemStyle("general")} onClick={() => handleCategoryClick("general")}>
                            <span style={{ fontSize: "20px" }}>🏠</span> <span>Trang Chủ</span>
                        </li>
                        <li style={getMenuItemStyle("agriculture")} onClick={() => handleCategoryClick("agriculture")}>
                            <span style={{ fontSize: "20px" }}>🌾</span> <span>Nông sản</span>
                        </li>
                        <li style={getMenuItemStyle("seafood")} onClick={() => handleCategoryClick("seafood")}>
                            <span style={{ fontSize: "20px" }}>🦐</span> <span>Hải sản</span>
                        </li>
                        <li style={getMenuItemStyle("specialty")} onClick={() => handleCategoryClick("specialty")}>
                            <span style={{ fontSize: "20px" }}>📦</span> <span>Đặc sản</span>
                        </li>
                        <li style={getMenuItemStyle("saved")} onClick={() => navigate("/user/saved-posts")}>
                            <span style={{ fontSize: "20px" }}>📌</span> <span>Đã lưu</span>
                        </li>
                    </ul>
                </div>
            )}
               
            {/* Khối Được quan tâm */}
            <h4 style={{ fontSize: "16px", margin: "15px 0 10px 5px", color: "#65676b", fontWeight: "600" }}>Được quan tâm</h4>
            <div style={cardStyle}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#333" }}>Đặc sản</h4>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
                    <MiniProduct name="Nem chua" price="20.000đ/10c" />
                    <MiniProduct name="Phở gà" price="30.000đ/1tô" />
                </div>
            </div>

            <div style={cardStyle}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#333" }}>Hải sản</h4>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
                    <MiniProduct name="Chè thái nguyên" price="70.000đ/kg" />
                    <MiniProduct name="Tôm hùm" price="600.000/kg" />
                </div>
            </div>
        </div>
    );
}

export default SidebarLeft;