import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Layout from "../../components/layout/Layout";

function SavedPosts() {
    const navigate = useNavigate();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [likedPosts, setLikedPosts] = useState({});
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [modalComments, setModalComments] = useState([]);
    const [modalCommentInput, setModalCommentInput] = useState("");
    const [modalLiked, setModalLiked] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Lấy thông tin user từ localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // Lấy danh sách bài viết đã lưu
    const fetchSavedPosts = async (skip = 0, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const res = await api.get(`/api/v1/saves/my-posts?skip=${skip}&limit=10`);
            const posts = res.data;

            if (posts.length < 10) {
                setHasMore(false);
            }

            if (isLoadMore) {
                setSavedPosts(prev => [...prev, ...posts]);
            } else {
                setSavedPosts(posts);
            }

            // Kiểm tra like status cho từng bài viết
            if (posts.length > 0) {
                const likeChecks = posts.map(post => 
                    api.get(`/api/v1/likes/check/${post.post_id}`)
                        .then(res => ({ id: post.post_id, isLiked: res.data.liked }))
                        .catch(() => ({ id: post.post_id, isLiked: false }))
                );

                const likeResults = await Promise.all(likeChecks);
                const likeMap = {};
                likeResults.forEach(result => {
                    likeMap[result.id] = result.isLiked;
                });
                setLikedPosts(prev => ({ ...prev, ...likeMap }));
            }

        } catch (error) {
            console.error("Lỗi khi tải bài viết đã lưu:", error);
            if (error.response?.status === 401) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchSavedPosts();
    }, []);

    // Xử lý unlike bài viết (bỏ lưu)
    const handleUnsavePost = async (postId, savedId) => {
        try {
            await api.delete(`/api/v1/saves/${postId}`);
            // Xóa bài viết khỏi danh sách
            setSavedPosts(prev => prev.filter(post => post.post_id !== postId));
            
            // Hiển thị thông báo (tùy chọn)
            // toast.success("Đã bỏ lưu bài viết");
        } catch (error) {
            console.error("Lỗi khi bỏ lưu bài viết:", error);
            alert("Không thể bỏ lưu bài viết. Vui lòng thử lại!");
        }
    };

    // Xử lý like bài viết
    const handleToggleLike = async (postId) => {
        const isCurrentlyLiked = likedPosts[postId];
        
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        
        setSavedPosts(prevPosts => prevPosts.map(p => {
            if (p.post_id === postId && p.post) {
                const currentLikes = p.post.stats?.like_count || 0;
                return {
                    ...p,
                    post: {
                        ...p.post,
                        stats: {
                            ...p.post.stats,
                            like_count: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
                        }
                    }
                };
            }
            return p;
        }));

        try {
            await api.post(`/api/v1/likes/${postId}`);
        } catch (error) {
            console.error("Lỗi khi like bài viết:", error);
            // Rollback
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
            setSavedPosts(prevPosts => prevPosts.map(p => {
                if (p.post_id === postId && p.post) {
                    const currentLikes = p.post.stats?.like_count || 0;
                    return {
                        ...p,
                        post: {
                            ...p.post,
                            stats: {
                                ...p.post.stats,
                                like_count: isCurrentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                            }
                        }
                    };
                }
                return p;
            }));
        }
    };

    // Mở modal chi tiết bài viết
    const openPostModal = async (post) => {
        try {
            const res = await api.get(`/api/v1/posts/${post.post_id}`);
            const updatedPost = res.data;
            
            setSelectedPost(updatedPost);
            setIsPostModalOpen(true);
            setModalCommentInput("");
            
            // Kiểm tra like
            try {
                const likeRes = await api.get(`/api/v1/likes/check/${post.post_id}`);
                setModalLiked(likeRes.data.liked);
            } catch(e) { setModalLiked(false); }
            
            // Tải bình luận
            try {
                const commentsRes = await api.get(`/api/v1/comments/${post.post_id}`);
                setModalComments(commentsRes.data);
            } catch(e) { setModalComments([]); }
            
        } catch (error) {
            console.error("Lỗi khi mở bài viết:", error);
            setSelectedPost(post.post);
            setIsPostModalOpen(true);
        }
    };

    // Đăng bình luận trong modal
    const handleModalComment = async () => {
        if (!modalCommentInput.trim() || !selectedPost) return;
        
        try {
            await api.post("/api/v1/comments/", {
                post_id: selectedPost._id,
                content: modalCommentInput
            });
            
            const commentsRes = await api.get(`/api/v1/comments/${selectedPost._id}`);
            setModalComments(commentsRes.data);
            setModalCommentInput("");
            
            // Cập nhật số comment trong selectedPost
            setSelectedPost(prev => ({
                ...prev,
                stats: { ...prev.stats, comment_count: (prev.stats?.comment_count || 0) + 1 }
            }));
        } catch(err) {
            console.error(err);
            alert("Không thể đăng bình luận");
        }
    };

    // Load more posts
    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSavedPosts(nextPage * 10, true);
        }
    };

    // Xử lý click outside menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-trigger') && !event.target.closest('.popup-menu')) {
                setActivePostMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const menuButtonStyle = {
        padding: "12px 15px",
        border: "none",
        background: "white",
        textAlign: "left",
        cursor: "pointer",
        fontSize: "14px",
        borderBottom: "1px solid #eee",
        fontWeight: "500",
        transition: "background 0.2s"
    };

    const goToUserProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <div style={{ fontSize: "18px", color: "#666" }}>Đang tải bài viết đã lưu...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ 
                    background: "white", 
                    borderRadius: "12px", 
                    padding: "20px", 
                    marginBottom: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    textAlign: "center"
                }}>
                    <h2 style={{ margin: 0, color: "#2e7d32" }}>📌 Bài viết đã lưu</h2>
                    <p style={{ margin: "5px 0 0", color: "#666", fontSize: "14px" }}>
                        {savedPosts.length} bài viết
                    </p>
                </div>

                {/* Danh sách bài viết đã lưu */}
                {savedPosts.length === 0 ? (
                    <div style={{ 
                        background: "white", 
                        borderRadius: "12px", 
                        padding: "40px", 
                        textAlign: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "10px" }}>📭</div>
                        <h3 style={{ color: "#333", marginBottom: "10px" }}>Chưa có bài viết nào được lưu</h3>
                        <p style={{ color: "#666", marginBottom: "20px" }}>
                            Khám phá các bài viết thú vị và lưu lại để xem sau nhé!
                        </p>
                        <button 
                            onClick={() => navigate("/")}
                            style={{
                                padding: "10px 20px",
                                background: "#2e7d32",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500"
                            }}
                        >
                            Khám phá ngay
                        </button>
                    </div>
                ) : (
                    <>
                        {savedPosts.map((saved) => {
                            const post = saved.post;
                            if (!post) return null;
                            
                            return (
                                <div 
                                    key={saved._id} 
                                    style={{ 
                                        background: "white", 
                                        borderRadius: "12px", 
                                        padding: "20px", 
                                        marginBottom: "20px", 
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
                                    }}
                                >
                                    {/* Header bài viết */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", position: "relative" }}>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <div style={{ 
                                                width: "40px", 
                                                height: "40px", 
                                                background: "#ddd", 
                                                borderRadius: "50%", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center", 
                                                overflow: "hidden" 
                                            }}>
                                                {post.author_avatar ? 
                                                    <img src={post.author_avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> 
                                                    : "👤"
                                                }
                                            </div>
                                            <div>
                                                <h4 
                                                    style={{ 
                                                        margin: 0, 
                                                        fontSize: "16px", 
                                                        cursor: "pointer",
                                                        color: "#2e7d32"
                                                    }}
                                                    onClick={() => goToUserProfile(post.author_id)}
                                                >
                                                    {post.author_name}
                                                </h4>
                                                <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#888" }}>
                                                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span style={{ color: "#2e7d32" }}>📌 Đã lưu {new Date(saved.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <span 
                                            className="menu-trigger"
                                            onClick={() => setActivePostMenu(activePostMenu === saved._id ? null : saved._id)}
                                            style={{ fontWeight: "bold", color: "#888", cursor: "pointer", padding: "0 5px", fontSize: "18px" }}
                                        >
                                            •••
                                        </span>

                                        {activePostMenu === saved._id && (
                                            <div 
                                                className="popup-menu"
                                                style={{
                                                    position: "absolute",
                                                    top: "25px", 
                                                    right: "0",
                                                    background: "white",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                                    width: "170px",
                                                    zIndex: 10,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                <button 
                                                    onClick={() => handleUnsavePost(post._id, saved._id)}
                                                    style={{ ...menuButtonStyle, color: "#dc3545" }}
                                                >
                                                    🗑️ Bỏ lưu bài viết
                                                </button>
                                                {saved.note && (
                                                    <div style={{ ...menuButtonStyle, color: "#666", borderBottom: "none" }}>
                                                        📝 Ghi chú: {saved.note}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Nội dung bài viết */}
                                    <div onClick={() => openPostModal(saved)} style={{ marginBottom: "15px", fontSize: "15px", cursor: "pointer" }}>
                                        {post.content && <p style={{ margin: "5px 0" }}>{post.content}</p>}
                                        {post.location && (
                                            <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                                                📍 <b>Vị trí:</b> {post.location}
                                            </p>
                                        )}
                                        {post.tags && post.tags.length > 0 && (
                                            <p style={{ margin: "5px 0", color: "#2e7d32", fontSize: "14px", fontWeight: "500" }}>
                                                {post.tags.map(tag => `#${tag}`).join(" ")}
                                            </p>
                                        )}
                                    </div>

                                    {/* Ảnh bài viết */}
                                    {post.images && post.images.length > 0 && (
                                        <div style={{ 
                                            display: "grid", 
                                            gridTemplateColumns: post.images.length > 1 ? "repeat(2, 1fr)" : "1fr",
                                            gap: "10px",
                                            marginBottom: "15px"
                                        }}>
                                            {post.images.slice(0, 4).map((imgUrl, index) => (
                                                <img 
                                                    key={index}
                                                    src={imgUrl} 
                                                    alt={`post_img_${index}`} 
                                                    style={{ 
                                                        width: "100%", 
                                                        borderRadius: "8px", 
                                                        objectFit: "cover", 
                                                        maxHeight: "300px"
                                                    }} 
                                                />
                                            ))}
                                            {post.images.length > 4 && (
                                                <div style={{ 
                                                    position: "relative",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: "rgba(0,0,0,0.5)",
                                                    borderRadius: "8px",
                                                    minHeight: "150px"
                                                }}>
                                                    <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>
                                                        +{post.images.length - 4}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Thống kê tương tác */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "14px", color: "#65676B" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                            <span style={{ color: likedPosts[post._id] ? "#1877F2" : "inherit" }}>👍</span>
                                            <span>{post.stats?.like_count || 0}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <span>{post.stats?.comment_count || 0} bình luận</span>
                                            <span>{post.stats?.share_count || 0} chia sẻ</span>
                                            <span>📌 {post.stats?.saved_count || 0} lưu</span>
                                        </div>
                                    </div>

                                    {/* Thanh tương tác */}
                                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "10px 0", color: "#555", fontWeight: "500", fontSize: "14px" }}>
                                        <div 
                                            onClick={() => handleToggleLike(post._id)} 
                                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: likedPosts[post._id] ? "#1877F2" : "#555" }}
                                        >
                                            👍 Thích
                                        </div>
                                        <div 
                                            onClick={() => openPostModal(saved)} 
                                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center" }}
                                        >
                                            💬 Bình luận
                                        </div>
                                        <div 
                                            onClick={() => handleUnsavePost(post._id, saved._id)}
                                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: "#2e7d32" }}
                                        >
                                            📌 Đã lưu
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Nút Load more */}
                        {hasMore && (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    style={{
                                        padding: "10px 24px",
                                        background: loadingMore ? "#ccc" : "#2e7d32",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: loadingMore ? "not-allowed" : "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500"
                                    }}
                                >
                                    {loadingMore ? "Đang tải..." : "Tải thêm"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal chi tiết bài viết */}
            {isPostModalOpen && selectedPost && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2000,
                    overflowY: "auto"
                }} onClick={() => setIsPostModalOpen(false)}>
                    <div style={{
                        background: "white",
                        width: "700px",
                        maxWidth: "90%",
                        maxHeight: "90vh",
                        borderRadius: "16px",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        position: "relative"
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header modal */}
                        <div style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #e4e6eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>Chi tiết bài viết</h3>
                            <button
                                onClick={() => setIsPostModalOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >✕</button>
                        </div>

                        {/* Nội dung bài viết */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                            {/* Thông tin người đăng */}
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
                                <div style={{ width: "40px", height: "40px", background: "#ddd", borderRadius: "50%", overflow: "hidden" }}>
                                    {selectedPost.author_avatar ? <img src={selectedPost.author_avatar} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : "👤"}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "16px" }}>{selectedPost.author_name}</h4>
                                    <span style={{ fontSize: "12px", color: "#888" }}>{new Date(selectedPost.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Nội dung */}
                            <div style={{ marginBottom: "15px" }}>
                                {selectedPost.content && <p style={{ margin: "5px 0", fontSize: "15px" }}>{selectedPost.content}</p>}
                                {selectedPost.location && <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>📍 {selectedPost.location}</p>}
                                {selectedPost.tags && selectedPost.tags.length > 0 && (
                                    <p style={{ margin: "5px 0", color: "#2e7d32", fontSize: "14px", fontWeight: "500" }}>
                                        {selectedPost.tags.map(tag => `#${tag}`).join(" ")}
                                    </p>
                                )}
                            </div>

                            {/* Ảnh */}
                            {selectedPost.images && selectedPost.images.length > 0 && (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: selectedPost.images.length > 1 ? "repeat(2, 1fr)" : "1fr",
                                    gap: "10px",
                                    marginBottom: "15px"
                                }}>
                                    {selectedPost.images.map((img, idx) => (
                                        <img key={idx} src={img} alt="post" style={{ width: "100%", borderRadius: "8px", objectFit: "cover" }} />
                                    ))}
                                </div>
                            )}

                            {/* Thống kê */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "14px", color: "#65676B" }}>
                                <div>👍 {selectedPost.stats?.like_count || 0} lượt thích</div>
                                <div>{selectedPost.stats?.comment_count || 0} bình luận</div>
                            </div>

                            {/* Thanh tương tác */}
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "8px 0", marginBottom: "15px" }}>
                                <div
                                    onClick={async () => {
                                        const newLiked = !modalLiked;
                                        setModalLiked(newLiked);
                                        setSelectedPost(prev => ({
                                            ...prev,
                                            stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? 1 : -1) }
                                        }));
                                        try {
                                            await api.post(`/api/v1/likes/${selectedPost._id}`);
                                        } catch(e) {
                                            setModalLiked(!newLiked);
                                            setSelectedPost(prev => ({
                                                ...prev,
                                                stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? -1 : 1) }
                                            }));
                                        }
                                    }}
                                    style={{ flex: 1, textAlign: "center", cursor: "pointer", color: modalLiked ? "#1877F2" : "#555", fontWeight: "500", padding: "6px 0", borderRadius: "6px" }}
                                >
                                    👍 Thích
                                </div>
                                <div style={{ flex: 1, textAlign: "center", color: "#555", fontWeight: "500", padding: "6px 0" }}>💬 Bình luận</div>
                                <div style={{ flex: 1, textAlign: "center", color: "#555", fontWeight: "500", padding: "6px 0" }}>↗️ Chia sẻ</div>
                            </div>

                            {/* Danh sách bình luận */}
                            <div style={{ marginTop: "15px" }}>
                                <h4 style={{ fontSize: "15px", marginBottom: "12px" }}>Bình luận</h4>
                                {modalComments.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#888", padding: "20px 0" }}>Chưa có bình luận nào.</div>
                                ) : (
                                    modalComments.map(cmt => (
                                        <div key={cmt._id} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                                            <div style={{ width: "32px", height: "32px", background: "#2e7d32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                                                {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                            </div>
                                            <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "18px", maxWidth: "80%" }}>
                                                <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>{cmt.author_name}</strong>
                                                <span style={{ fontSize: "14px" }}>{cmt.content}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Input bình luận */}
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #e4e6eb", display: "flex", gap: "10px", alignItems: "center" }}>
                            <div style={{ width: "32px", height: "32px", background: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>👤</div>
                            <input
                                type="text"
                                placeholder="Viết bình luận..."
                                value={modalCommentInput}
                                onChange={(e) => setModalCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleModalComment()}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background: "#f0f2f5",
                                    outline: "none",
                                    fontSize: "14px"
                                }}
                            />
                            <button
                                onClick={handleModalComment}
                                style={{ border: "none", background: "transparent", color: "#1877F2", fontWeight: "bold", cursor: "pointer" }}
                            >Gửi</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default SavedPosts;