import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import api from "../../api/api";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../hooks/useAuth.js";

function SidebarLeft({ userProfile = null, onClose = null }) {
    const { user: authUser, isAuthenticated, updateAuthState } = useAuth(); // Thêm updateAuthState
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const isProfilePage = location.pathname === "/profile"; 
    const isUserProfilePage = location.pathname.startsWith("/profile/");
    const currentCategory = searchParams.get("category") || "general";

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'success' });
    };

    // Lấy thông tin user từ authUser hoặc userProfile - KHÔNG DÙNG CACHE NỮA
    useEffect(() => {
        if (!isAuthenticated) {
            setUser(null);
            return;
        }
        
        if (userProfile) {
            setUser(userProfile);
            setEditData(userProfile);
        } else if (authUser) {
            setUser(authUser);
            setEditData(authUser);
        }
    }, [authUser, userProfile, isAuthenticated]);

    // Fetch profile nếu chưa có userProfile - BỎ CACHE
    useEffect(() => {
        // Nếu đã có userProfile từ props, không cần fetch
        if (userProfile) {
            setUser(userProfile);
            setEditData(userProfile);
            return;
        }

        // Nếu đã có authUser từ hook, không cần fetch
        if (authUser) {
            return;
        }

        const token = localStorage.getItem("user_token");
        
        // Nếu không có token, không hiển thị thông tin user
        if (!token) {
            setUser(null);
            return;
        }

        // BỎ CACHE - luôn fetch mới để đảm bảo dữ liệu cập nhật
        const fetchMyProfile = async () => {
            try {
                const res = await api.get("/api/v1/auth/me");
                setUser(res.data);
                setEditData(res.data);
                
                // Cập nhật cả auth state để đồng bộ
                const userData = res.data;
                localStorage.setItem("user_data", JSON.stringify(userData));
                localStorage.setItem("user", JSON.stringify(userData));
                
                // Gọi updateAuthState để cập nhật auth hook
                if (updateAuthState) updateAuthState();
                
            } catch (error) {
                console.error("Lỗi khi lấy thông tin cá nhân:", error);
                // Nếu lỗi 401 (unauthorized), không hiển thị user
                if (error.response?.status === 401) {
                    setUser(null);
                } else {
                    showToast("Không thể tải thông tin cá nhân", "error");
                }
            }
        };

        fetchMyProfile();
    }, [userProfile, authUser, isUserProfilePage, updateAuthState]);

    // Lắng nghe sự kiện logout và update profile
    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
            setEditData({});
            setIsEditing(false);
        };
        
        // Lắng nghe sự kiện profile updated
        const handleProfileUpdated = (event) => {
            if (event.detail && event.detail.user) {
                setUser(event.detail.user);
                setEditData(event.detail.user);
                // Xóa cache cũ
                sessionStorage.removeItem("sidebar_user");
                sessionStorage.removeItem("sidebar_user_cache_time");
            }
        };
        
        window.addEventListener('userLoggedOut', handleLogout);
        window.addEventListener('profileUpdated', handleProfileUpdated);
        
        return () => {
            window.removeEventListener('userLoggedOut', handleLogout);
            window.removeEventListener('profileUpdated', handleProfileUpdated);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileClick = () => {
        if (onClose) onClose();
        navigate("/profile");
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.put("/api/v1/auth/update-profile", editData);
            const updatedUser = res.data.user;
            
            setUser(updatedUser);
            setEditData(updatedUser);
            setIsEditing(false);
            
            // Cập nhật localStorage
            localStorage.setItem("user_data", JSON.stringify(updatedUser));
            localStorage.setItem("user", JSON.stringify(updatedUser));
            
            // Cập nhật auth state
            if (updateAuthState) updateAuthState();
            
            // Phát sự kiện để các component khác cập nhật
            window.dispatchEvent(new CustomEvent('profileUpdated', { 
                detail: { user: updatedUser } 
            }));
            
            showToast("Cập nhật thành công!", "success");
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            const errorMessage = error.response?.data?.detail || "Không thể lưu thông tin. Vui lòng thử lại.";
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const firstLetter = user?.full_name 
        ? user.full_name.charAt(0).toUpperCase() 
        : (user?.username ? user.username.charAt(0).toUpperCase() : "U");

    const handleCategoryClick = (categoryType) => {
        if (onClose) onClose();
        
        // Clear cache
        const categories = ["general", "agriculture", "seafood", "specialty"];
        categories.forEach(cat => {
            sessionStorage.removeItem(`home_posts_${cat}`);
            sessionStorage.removeItem(`home_cache_time_${cat}`);
            sessionStorage.removeItem(`home_liked_${cat}`);
        });
        
        if (categoryType === "general") {
            navigate("/");
        } else {
            navigate(`/?category=${categoryType}`);
        }
    };

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

    const getMenuItemStyle = (categoryType) => {
        let isActive = false;

        if (categoryType === "saved") {
            isActive = location.pathname === "/user/saved-posts";
        } else if (categoryType === "groups") {
            isActive = location.pathname === "/groups" || location.pathname.startsWith("/groups/");
        } else {
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

    // Nếu chưa có user và không phải trang profile, hiển thị loading
    if (!user && !userProfile && isAuthenticated) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ 
                    width: "30px", 
                    height: "30px", 
                    border: "3px solid #f3f3f3", 
                    borderTop: "3px solid #2e7d32", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite",
                    margin: "0 auto"
                }}></div>
            </div>
        );
    }

    const sidebarContent = (
        <div style={{ padding: "16px" }}>
            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={closeToast} 
                />
            )}

            {shouldShowProfileInfo ? (
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h3 style={{ margin: 0, fontSize: "18px" }}>Giới thiệu</h3>
                        {isProfilePage && !isEditing && user && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                style={{ border: "none", background: "#e4e6eb", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                            >
                                Chỉnh sửa tiểu sử
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        user && (
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
                                    <div>
                                        <h4 onClick={handleProfileClick} style={{ margin: 0, fontSize: "16px", cursor: "pointer", color: "#2e7d32" }}>{user.full_name || user.username}</h4>
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
                        )
                    ) : (
                        user && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label style={labelStyle}>Họ và tên</label>
                                <input style={inputStyle} name="full_name" value={editData.full_name || ""} onChange={handleChange} placeholder="Nhập họ tên..." />
                                
                                <label style={labelStyle}>Email</label>
                                <input 
                                    style={inputStyle} 
                                    name="email" 
                                    value={editData.email || ""} 
                                    onChange={handleChange} 
                                    placeholder="Nhập email..."
                                    type="email"
                                />

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
                                <input style={inputStyle} name="phone" value={editData.phone || ""} onChange={handleChange} placeholder="Nhập số điện thoại..." />

                                <label style={labelStyle}>Địa chỉ</label>
                                <input style={inputStyle} name="address" value={editData.address || ""} onChange={handleChange} placeholder="Nhập địa chỉ..." />

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
                        )
                    )}
                </div>
            ) : (
                user && (
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
                            
                            <li style={getMenuItemStyle("groups")} onClick={() => {
                                if (onClose) onClose();
                                navigate("/groups");
                            }}>
                                <span style={{ fontSize: "20px" }}>👥</span> <span>Nhóm</span>
                            </li>

                            <li style={getMenuItemStyle("saved")} onClick={() => {
                                if (onClose) onClose();
                                navigate("/user/saved-posts");
                            }}>
                                <span style={{ fontSize: "20px" }}>📌</span> <span>Đã lưu</span>
                            </li>
                        </ul>
                    </div>
                )
            )}
        </div>
    );

    return sidebarContent;
}

export default SidebarLeft;