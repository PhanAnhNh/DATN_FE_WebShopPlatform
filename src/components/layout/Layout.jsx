// Layout.jsx - Sửa lại phần margin
import Header from "./header";
import SidebarLeft from "./SidebarLeft";

function Layout({ children }) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column", // QUAN TRỌNG: Thêm dấu ngoặc kép
            background: "#f3f4f6"
        }}>
            {/* Header dính chặt ở trên cùng */}
            <div style={{ position: "sticky", top: 0, zIndex: 1000, width: "100%" }}>
                <Header />
            </div>

            {/* Chứa nội dung chính (Được căn giữa màn hình với maxWidth) */}
            <div style={{
                display: "flex",
                justifyContent: "center", // Thêm dòng này để căn giữa Cột trái + Cột giữa
                width: "100%",
                maxWidth: "100%", // Đổi từ 1200px xuống 1000px cho vừa khít (280+20+680)
                margin: "0 auto",
                padding: "20px",
                gap: "20px"
            }}>
                {/* Cột trái (Sidebar cố định khi cuộn) */}
                <div className="hide-scrollbar" style={{
                    position: "sticky",
                    top: "90px",
                    width: "280px",
                    height: "calc(100vh - 110px)",
                    overflowY: "auto"
                }}>
                    <SidebarLeft />
                </div>

                {/* Cột giữa (Nội dung động: Feed bài viết) */}
                <div style={{ flex: 1, maxWidth: "680px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Layout;