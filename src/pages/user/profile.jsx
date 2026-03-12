import { useEffect, useState } from "react";
import api from "../../api/api";
import Layout from "../../components/layout/Layout";

function Profile() {
    // State cho dữ liệu
    const [currentUser, setCurrentUser] = useState(null);
    const [posts, setPosts] = useState([]);
    
    // State cho tương tác (giữ nguyên từ Home)
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [likedPosts, setLikedPosts] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPostContent, setNewPostContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        // Lấy thông tin user đăng nhập từ localStorage (hoặc thay bằng state management của bạn)
        const storedUserStr = localStorage.getItem("user");
        if (storedUserStr) {
            const parsedUser = JSON.parse(storedUserStr);
            setCurrentUser(parsedUser);
            // Gọi API lấy bài viết CHỈ CỦA USER NÀY
            fetchUserPostsAndLikes(parsedUser.id || parsedUser._id);
        } else {
            // Xử lý nếu chưa đăng nhập (có thể redirect về login)
            console.warn("Chưa có thông tin user đăng nhập");
        }
    }, []);

    const fetchUserPostsAndLikes = async (userId) => {
        try {
            const res = await api.get(`/posts/user/${userId}`);
            
            // 1. LỌC BỎ CÁC BÀI BỊ XÓA (is_active là false) TỪ BE TRẢ VỀ
            const activePosts = res.data.filter(post => post.is_active !== false);
            
            // 2. Chỉ set vào state những bài viết đang active
            setPosts(activePosts);

            // 3. Đổi fetchedPosts thành activePosts ở vòng lặp check like
            // (Để tránh gọi API check like lãng phí cho những bài đã bị xóa)
            const likeChecks = activePosts.map(post =>
                api.get(`/likes/check/${post._id}`)
                    .then(res => ({ id: post._id, isLiked: res.data.liked }))
                    .catch(() => ({ id: post._id, isLiked: false }))
            );

            const likeResults = await Promise.all(likeChecks);
            const likeMap = {};
            likeResults.forEach(result => {
                likeMap[result.id] = result.isLiked;
            });
            setLikedPosts(likeMap);

        } catch (err) {
            console.error("Lỗi khi tải bài viết cá nhân:", err);
        }
    };
    // --- CÁC HÀM XỬ LÝ TƯƠNG TÁC (Giữ nguyên như Home.js) ---
    const handleToggleComments = async (postId) => {
        const isCurrentlyShown = showComments[postId];
        setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyShown }));

        if (!isCurrentlyShown && !postComments[postId]) {
            try {
                const res = await api.get(`/comments/${postId}`);
                setPostComments(prev => ({ ...prev, [postId]: res.data }));
            } catch (error) {
                console.error("Lỗi khi tải bình luận:", error);
            }
        }
    };

    const handlePostComment = async (postId) => {
        const text = commentInputs[postId];
        if (!text || text.trim() === "") return;

        try {
            await api.post("/comments/", { post_id: postId, content: text });
            const res = await api.get(`/comments/${postId}`);
            setPostComments(prev => ({ ...prev, [postId]: res.data }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));
            setPosts(prevPosts => prevPosts.map(p =>
                p._id === postId ? { ...p, stats: { ...p.stats, comment_count: (p.stats.comment_count || 0) + 1 } } : p
            ));
        } catch (error) {
            console.error("Lỗi đăng bình luận:", error);
            alert("Không thể đăng bình luận. Hãy kiểm tra lại kết nối!");
        }
    };

    const handleToggleLike = async (postId) => {
        const isCurrentlyLiked = likedPosts[postId];
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                const currentLikes = p.stats?.like_count || 0;
                return {
                    ...p,
                    stats: { ...p.stats, like_count: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1 }
                };
            }
            return p;
        }));

        try {
            await api.post(`/likes/${postId}`);
        } catch (error) {
            // Hoàn tác nếu lỗi
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
            setPosts(prevPosts => prevPosts.map(p => { /* ... rollback logic ... */ return p; }));
        }
    };

    const handleSharePost = async (postId) => {
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                return { ...p, stats: { ...p.stats, share_count: (p.stats?.share_count || 0) + 1 } };
            }
            return p;
        }));
        try {
            await api.post(`/shares/${postId}`);
        } catch (error) {
            // Hoàn tác nếu lỗi
            setPosts(prevPosts => prevPosts.map(p => { /* ... rollback logic ... */ return p; }));
        }
    };
    // HÀM MỚI: Dùng khi click vào thanh "Bạn đang nghĩ gì?"
    const handleOpenCreateModal = () => {
        setEditingPost(null); // Reset trạng thái edit
        setNewPostContent(""); // Xóa trắng nội dung
        setIsCreateModalOpen(true);
    };

    // SỬA LẠI HÀM NÀY:
    const handleEditPost = (post) => {
        setEditingPost(post); // Đánh dấu là đang sửa bài này
        setNewPostContent(post.content || ""); // Đưa nội dung cũ vào textarea
        setIsCreateModalOpen(true); // Mở modal lên (dùng chung modal tạo bài)
        setActivePostMenu(null); // Đóng menu 3 chấm
    };

    const handleSubmitPost = async () => {
        if (!newPostContent.trim()) return;
        
        setIsSubmitting(true);
        try {
            if (editingPost) {
                // SỬA BÀI VIẾT (Lưu ý: Thay đổi method PUT/PATCH tuỳ vào backend của bạn)
                const res = await api.put(`/posts/${editingPost._id}`, { content: newPostContent });
                
                // Cập nhật lại bài viết trong danh sách UI
                setPosts(posts.map(p => 
                    p._id === editingPost._id ? { ...p, content: newPostContent } : p
                ));
            } else {
                // TẠO BÀI VIẾT MỚI
                const newPostData = { content: newPostContent };
                const res = await api.post("/posts/", newPostData);
                
                // Thêm bài viết mới vào đầu danh sách
                setPosts([res.data, ...posts]);
            }
            
            // Đóng modal và reset nội dung
            setIsCreateModalOpen(false);
            setNewPostContent("");
            setEditingPost(null);
        } catch (error) {
            console.error("Lỗi khi đăng/sửa bài:", error);
            alert("Không thể lưu bài viết. Hãy kiểm tra lại!");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleDeletePost = async (postId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
            try {
                // Gọi API xóa bài viết (thay đổi route tùy theo backend của bạn)
                await api.delete(`/posts/${postId}`);
                
                // Cập nhật lại UI: Lọc bỏ bài viết đã xóa khỏi danh sách
                setPosts(posts.filter(p => p._id !== postId));
                setActivePostMenu(null); // Đóng menu
            } catch (error) {
                console.error("Lỗi khi xóa bài:", error);
                alert("Không thể xóa bài viết. Vui lòng thử lại!");
            }
        }
    };

    if (!currentUser) return <Layout><div style={{ textAlign: "center", marginTop: "50px" }}>Đang tải dữ liệu người dùng...</div></Layout>;

    return (
        <Layout>
            {/* --- HEADER PROFILE: Avatar và Tên (Mô phỏng theo hình) --- */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ width: "80px", height: "80px", background: "#e4e6eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "30px" }}>
                    {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar" style={{width: "100%", height:"100%", borderRadius:"50%", objectFit:"cover"}}/> : "👤"}
                </div>
                <h2 style={{ margin: 0 }}>{currentUser?.full_name || currentUser?.username || "Tên Người Dùng"}</h2>
            </div>

            {/* --- BỐ CỤC CHÍNH: Left Sidebar và Right Content --- */}
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                
                {/* --- RIGHT CONTENT: Feed bài viết cá nhân --- */}
                <div style={{ flex: 1 }}>   
                    <div style={{ background: "white", borderRadius: "12px", padding: "15px 20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                            <div style={{ width: "40px", height: "40px", background: "#e4e6eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar" style={{width: "100%", height:"100%", objectFit:"cover"}}/> : "👤"}
                            </div>
                            
                            {/* Nút bấm giả lập ô input */}
                            <div 
                                onClick={handleOpenCreateModal} // <-- CHỖ NÀY ĐỂ GẮN HÀM MỞ MODAL/CHUYỂN TRANG
                                style={{ flex: 1, background: "#f0f2f5", padding: "10px 15px", borderRadius: "20px", color: "#65676B", cursor: "pointer", fontSize: "15px" }}
                                onMouseOver={(e) => e.target.style.background = "#e4e6eb"}
                                onMouseOut={(e) => e.target.style.background = "#f0f2f5"}
                            >
                                {currentUser?.full_name || currentUser?.username} ơi, bạn đang nghĩ gì thế?
                            </div>
                        </div>

                        {/* Các nút tiện ích (Ảnh/Video, Gắn thẻ...) */}
                        <div style={{ display: "flex", justifyContent: "space-around" }}>
                            <div onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#65676B", fontWeight: "500", padding: "8px", borderRadius: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f0f2f5"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: "20px" }}>📷</span> Ảnh/Video
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#65676B", fontWeight: "500", padding: "8px", borderRadius: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f0f2f5"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: "20px" }}>🏷️</span> Gắn thẻ
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#65676B", fontWeight: "500", padding: "8px", borderRadius: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f0f2f5"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: "20px" }}>📍</span> Vị trí
                            </div>
                        </div>
                    </div>             
                    {/* Danh sách bài viết */}
                    {posts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px", background: "white", borderRadius: "12px" }}>Người dùng này chưa có bài viết nào.</div>
                    ) : (
                        posts.map((post) => (
                            <div key={post._id} style={{ background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                {/* Header bài viết */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", position: "relative" }}>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        <div style={{ width: "40px", height: "40px", background: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                            {post.author_avatar ? <img src={post.author_avatar} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : "👤"}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "16px" }}>{post.author_name}</h4>
                                            <span style={{ fontSize: "12px", color: "#888" }}>{new Date(post.created_at).toLocaleDateString() || "Vừa xong"}</span>
                                        </div>
                                    </div>
                                    
                                    {/* NÚT 3 CHẤM */}
                                    <span 
                                        onClick={() => setActivePostMenu(activePostMenu === post._id ? null : post._id)}
                                        style={{ fontWeight: "bold", color: "#888", cursor: "pointer", padding: "0 5px", fontSize: "18px" }}
                                    >
                                        •••
                                    </span>

                                    {/* THÊM MỚI: MENU DROPDOWN SỬA/XÓA */}
                                    {activePostMenu === post._id && (
                                        <div style={{
                                            position: "absolute",
                                            top: "25px", // Đẩy menu xuống dưới nút 3 chấm một chút
                                            right: "0",
                                            background: "white",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                            width: "150px",
                                            zIndex: 10,
                                            display: "flex",
                                            flexDirection: "column",
                                            overflow: "hidden"
                                        }}>
                                            <button 
                                                onClick={() => handleEditPost(post)}
                                                style={{ padding: "10px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #eee" }}
                                                onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                onMouseOut={(e) => e.target.style.background = "white"}
                                            >
                                                ✏️ Sửa bài viết
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePost(post._id)}
                                                style={{ padding: "10px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#dc3545" }}
                                                onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                onMouseOut={(e) => e.target.style.background = "white"}
                                            >
                                                🗑️ Xóa bài viết
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Nội dung bài viết */}
                                <div style={{ marginBottom: "15px", fontSize: "15px" }}>
                                    {post.title && <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>Tiêu đề: {post.title}</h3>}
                                    {post.content && <p style={{ margin: "5px 0" }}>{post.content}</p>}
                                    {post.price && <p style={{ margin: "5px 0" }}>Giá cả: <strong style={{color:"#333"}}>{post.price}</strong></p>}
                                </div>

                                {/* Hình ảnh */}
                                {post.image && (
                                    <img src={post.image} alt="post_img" style={{ width: "100%", borderRadius: "8px", objectFit: "cover", maxHeight: "400px", marginBottom: "15px" }} />
                                )}

                                {/* Thống kê Like/Comment/Share */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "14px", color: "#65676B" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <span style={{ color: likedPosts[post._id] ? "#1877F2" : "inherit" }}>👍</span>
                                        <span>{post.stats?.like_count || 0}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <span>{post.stats?.comment_count || 0} bình luận</span>
                                        <span>{post.stats?.share_count || 0} chia sẻ</span>
                                    </div>
                                </div>

                                {/* Các nút hành động */}
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "10px 0", color: "#555", fontWeight: "500", fontSize: "14px" }}>
                                    <div onClick={() => handleToggleLike(post._id)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: likedPosts[post._id] ? "#1877F2" : "#555" }}>
                                        👍 Thích
                                    </div>
                                    <div onClick={() => handleToggleComments(post._id)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: showComments[post._id] ? "#2e7d32" : "#555" }}>
                                        💬 Đánh giá
                                    </div>
                                    <div onClick={() => handleSharePost(post._id)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center" }}>
                                        ↗️ Chia sẻ
                                    </div>
                                </div>

                                {/* Khu vực bình luận */}
                                {showComments[post._id] && (
                        <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                            <div>
                                {postComments[post._id] ? (
                                    postComments[post._id].length > 0 ? (
                                        postComments[post._id].map(cmt => (
                                            <div key={cmt._id} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                                                {cmt.author_avatar ? (
                                                    <img src={cmt.author_avatar} alt="avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "32px", height: "32px", background: "#2e7d32", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
                                                        {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                )}
                                                
                                                <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "15px", maxWidth: "80%" }}>
                                                    <strong style={{ fontSize: "13px", display: "block", color: "#1c1e21" }}>{cmt.author_name}</strong>
                                                    <span style={{ fontSize: "14px", color: "#1c1e21" }}>{cmt.content}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: "center", color: "#888", fontSize: "13px", padding: "10px 0" }}>Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                                    )
                                ) : (
                                    <div style={{ textAlign: "center", color: "#888", fontSize: "13px", padding: "10px 0" }}>Đang tải bình luận...</div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
                                <div style={{ width: "35px", height: "35px", background: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>👤</div>
                                
                                <input 
                                    type="text"
                                    placeholder="Viết bình luận..."
                                    value={commentInputs[post._id] || ""}
                                    onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post._id) }}
                                    style={{ flex: 1, background: "#f0f2f5", padding: "10px 15px", borderRadius: "20px", fontSize: "14px", color: "#333", border: "none", outline: "none" }}
                                />
                                <button 
                                    onClick={() => handlePostComment(post._id)}
                                    style={{ background: "none", border: "none", color: "#2e7d32", fontWeight: "bold", cursor: "pointer", fontSize: "14px", padding: "0 10px" }}
                                >
                                    Gửi
                                </button>
                            </div>
                        </div>
                    )}

                            </div>
                        ))
                    )}
                </div>
            </div>
            {isCreateModalOpen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    backgroundColor: "rgba(244, 244, 244, 0.8)", // Nền mờ giống Facebook
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "white", width: "500px", borderRadius: "10px",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column"
                    }}>
                        {/* Header Modal */}
                        <div style={{ position: "relative", padding: "15px", borderBottom: "1px solid #e4e6eb", textAlign: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Tạo bài viết</h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{ position: "absolute", top: "10px", right: "15px", width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#e4e6eb", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#606770" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Thông tin User trong Modal */}
                        <div style={{ padding: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "40px", height: "40px", background: "#e4e6eb", borderRadius: "50%", overflow: "hidden" }}>
                                {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar" style={{width: "100%", height:"100%", objectFit:"cover"}}/> : <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center"}}>👤</div>}
                            </div>
                            <div>
                                <div style={{ fontWeight: "600", fontSize: "15px", color: "#050505" }}>
                                    {currentUser?.full_name || currentUser?.username}
                                </div>
                                <div style={{ background: "#e4e6eb", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", display: "inline-block", marginTop: "2px", fontWeight: "500" }}>
                                    👥 Bạn bè ▼
                                </div>
                            </div>
                        </div>

                        {/* Khung nhập nội dung */}
                        <div style={{ padding: "0 15px", flex: 1 }}>
                            <textarea
                                placeholder="Bạn đang nghĩ gì?"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                autoFocus
                                style={{ width: "100%", minHeight: "150px", border: "none", outline: "none", resize: "none", fontSize: newPostContent.length < 80 ? "24px" : "16px", fontFamily: "inherit" }}
                            />
                        </div>

                        {/* Khu vực thêm tiện ích vào bài viết */}
                        <div style={{ padding: "15px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #ced0d4", borderRadius: "8px", padding: "10px 15px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                <span style={{ fontWeight: "600", color: "#050505", cursor: "pointer" }}>Thêm vào bài viết của bạn</span>
                                <div style={{ display: "flex", gap: "15px", fontSize: "20px", cursor: "pointer" }}>
                                    <span>🖼️</span>
                                    <span>👤</span>
                                    <span>😊</span>
                                    <span>📍</span>
                                </div>
                            </div>
                        </div>

                        {/* Nút Đăng */}
                        <div style={{ padding: "0 15px 15px 15px" }}>
                            <button 
                                onClick={handleSubmitPost}
                                disabled={!newPostContent.trim() || isSubmitting}
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "none", background: newPostContent.trim() ? "#0866ff" : "#e4e6eb", color: newPostContent.trim() ? "white" : "#bcc0c4", fontSize: "15px", fontWeight: "600", cursor: newPostContent.trim() ? "pointer" : "not-allowed" }}
                            >
                                {isSubmitting ? "Đang đăng..." : "Đăng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Profile;