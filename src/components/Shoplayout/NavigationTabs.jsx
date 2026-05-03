import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavigationTabs = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const goToForum = () => {
        navigate('/');
    };

    const goToShop = () => {
        navigate('/use/shop');
    };

    // Kiểm tra active dựa trên pathname
    const isForumActive = location.pathname === "/";
    const isShopActive = location.pathname === "/use/shop";

    return (
        <div style={{ display: "flex", flex: 1, gap: "10px" }}>
            <div 
                onClick={goToForum}
                style={{ 
                    flex: 1, 
                    background: isForumActive ? "white" : "#f0f2f5", 
                    padding: "12px", 
                    textAlign: "center", 
                    borderRadius: "10px", 
                    fontWeight: "bold", 
                    color: isForumActive ? "#2e7d32" : "#666", 
                    borderBottom: isForumActive ? "3px solid #2e7d32" : "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                }}
            >
                Diễn Đàn
            </div>
            
            <div 
                onClick={goToShop}
                style={{ 
                    flex: 1, 
                    background: isShopActive ? "white" : "#f0f2f5", 
                    padding: "12px", 
                    textAlign: "center", 
                    borderRadius: "10px", 
                    fontWeight: "bold", 
                    color: isShopActive ? "#2e7d32" : "#666", 
                    borderBottom: isShopActive ? "3px solid #2e7d32" : "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                }}
            >
                Cửa Hàng
            </div>
        </div>
    );
};

export default NavigationTabs;