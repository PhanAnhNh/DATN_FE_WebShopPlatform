// components/layout/Layout.jsx
import Header from "./header";
import SidebarLeft from "./SidebarLeft";

function Layout({ children, userProfile = null }) { // Thêm prop userProfile
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#f3f4f6"
        }}>
            {/* Header dính chặt ở trên cùng */}
            <div style={{ position: "sticky", top: 0, zIndex: 1000, width: "100%" }}>
                <Header />
            </div>

            {/* Chứa nội dung chính */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "100%",
                margin: "0 auto",
                padding: "20px",
                gap: "20px"
            }}>
                {/* Cột trái - Truyền userProfile */}
                <div className="hide-scrollbar" style={{
                    position: "sticky",
                    top: "90px",
                    width: "280px",
                    height: "calc(100vh - 110px)",
                    overflowY: "auto"
                }}>
                    <SidebarLeft userProfile={userProfile} />
                </div>

                {/* Cột giữa */}
                <div style={{ flex: 1, maxWidth: "680px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Layout;