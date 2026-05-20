// components/layout/Layout.jsx
import { useState, useEffect } from "react";
import Header from "./header";
import SidebarLeft from "./SidebarLeft";
import '../../css/home_page.css';

function Layout({ children, userProfile = null }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const headerHeight = 60; // Chiều cao header cố định

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
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

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#f3f4f6"
        }}>
            {/* Header */}
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, width: "100%" }}>
                <Header 
                    onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                    mobileMenuOpen={mobileMenuOpen}
                />
            </div>

            {/* Spacer - tạo khoảng trống bằng chiều cao header */}
            <div style={{ height: `${headerHeight}px` }} />

            {/* Overlay khi mở menu mobile */}
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

            {/* Chứa nội dung chính */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
                padding: isMobile ? "12px" : "20px",
                gap: isMobile ? "0" : "24px",
                position: "relative"
            }}>
                {/* Sidebar - Desktop */}
                <div 
                    className={`sidebar-left-component ${mobileMenuOpen ? 'mobile-open' : ''}`}
                    style={{
                        width: isMobile ? "300px" : "320px",
                        flexShrink: 0,
                        position: isMobile ? "fixed" : "sticky",
                        top: `${headerHeight}px`,
                        left: isMobile ? (mobileMenuOpen ? "0" : "-300px") : "auto",
                        height: isMobile 
                            ? `calc(100vh - ${headerHeight}px)` 
                            : `calc(100vh - ${headerHeight + 20}px)`,
                        overflowY: "auto",
                        backgroundColor: "#f3f4f6",
                        zIndex: 999,
                        transition: "left 0.3s ease",
                        boxShadow: mobileMenuOpen ? "2px 0 10px rgba(0,0,0,0.1)" : "none"
                    }}
                >
                    <SidebarLeft 
                        userProfile={userProfile} 
                        onClose={() => setMobileMenuOpen(false)}
                    />
                </div>

                {/* Cột giữa - Responsive */}
                <div style={{ 
                    flex: 1, 
                    maxWidth: isMobile ? "100%" : "680px",
                    width: "100%"
                }}>
                    {children}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .sidebar-left-component {
                        position: fixed !important;
                        left: -300px;
                    
                        height: 100vh !important;
                        background: #f3f4f6 !important;
                        z-index: 999 !important;
                        transition: left 0.3s ease !important;
                    }
                    
                    .sidebar-left-component.mobile-open {
                        left: 0 !important;
                    }
                    
                    .mobile-overlay {
                        display: none;
                    }
                    
                    .mobile-overlay.active {
                        display: block !important;
                    }
                }
                
                @media (min-width: 769px) {
                    .sidebar-left-component {
                        position: sticky !important;
                        left: auto !important;
                    }
                    
                    .mobile-overlay {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default Layout;