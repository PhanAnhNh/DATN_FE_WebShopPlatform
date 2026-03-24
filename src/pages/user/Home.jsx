import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import Layout from "../../components/layout/Layout";

function Home() {
    const navigate = useNavigate(); // Thêm useNavigate
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [likedPosts, setLikedPosts] = useState({}); 
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category") || "general";
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [newPostContent, setNewPostContent] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCommentMenu, setActiveCommentMenu] = useState(null); 
    const [editingCommentId, setEditingCommentId] = useState(null); 
    const [editCommentContent, setEditCommentContent] = useState("");

    const [newPost, setNewPost] = useState({
    content: "",
    images: [],
    videos: [],
    tags: [],
    location: "",
    visibility: "public",
    post_type: "text",
    product_category: "general",
    allow_comment: true,
    allow_share: true
});

    const [imageUrls, setImageUrls] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    
    useEffect(() => {
        console.log("=== DEBUG AUTH ===");
        console.log("user_token:", localStorage.getItem("user_token")?.substring(0, 20) + "...");
        console.log("user_data:", localStorage.getItem("user_data"));
        console.log("user:", localStorage.getItem("user"));
        
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-trigger') && !event.target.closest('.popup-menu')) {
                setActivePostMenu(null);
                setActiveCommentMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        
        const storedUserData = localStorage.getItem("user_data");
        const storedUserLegacy = localStorage.getItem("user");
        
        let userData = null;
        if (storedUserData) {
            userData = JSON.parse(storedUserData);
            setCurrentUser(userData);
            console.log("Set currentUser from user_data:", userData);
        } else if (storedUserLegacy) {
            userData = JSON.parse(storedUserLegacy);
            setCurrentUser(userData);
            console.log("Set currentUser from user:", userData);
        }
        
        const fetchFeedAndLikes = async () => {
            try {
                let url = "/api/v1/posts/feed";
                if (category !== "general") {
                    url += `?category=${category}`; 
                }

                const token = localStorage.getItem("user_token");
                if (!token) {
                    console.log("Không tìm thấy token, chuyển hướng đến login");
                    window.location.href = "/login";
                    return;
                }

                const res = await api.get(url);
                console.log("Feed response:", res.data);
                const fetchedPosts = res.data;
                
                setPosts(fetchedPosts);

                const likeChecks = fetchedPosts.map(post => 
                    api.get(`/api/v1/likes/check/${post._id}`)
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
                console.error("Lỗi khi tải Feed:", err);
                if (err.response?.status === 401) {
                    localStorage.removeItem("user_token");
                    localStorage.removeItem("user_data");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                }
            }
        };

        fetchFeedAndLikes();
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [category]);

    // Hàm chuyển trang
    const goToForum = () => {
        navigate('/forum');
    };

    const goToShop = () => {
        navigate('/use/shop');
    };

    const handleToggleComments = async (postId) => {
        const isCurrentlyShown = showComments[postId];
        setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyShown }));

        if (!isCurrentlyShown && !postComments[postId]) {
            try {
                const res = await api.get(`/api/v1/comments/${postId}`);
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
            await api.post("/api/v1/comments/", {
                post_id: postId,
                content: text
            });

            const res = await api.get(`/api/v1/comments/${postId}`);
            setPostComments(prev => ({ ...prev, [postId]: res.data }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));

            setPosts(prevPosts => prevPosts.map(p => 
                p._id === postId 
                    ? { ...p, stats: { ...p.stats, comment_count: (p.stats.comment_count || 0) + 1 } }
                    : p
            ));

        } catch (error) {
            console.error("Lỗi đăng bình luận:", error);
            alert("Không thể đăng bình luận. Hãy kiểm tra lại kết nối!");
        }
    };

    const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingImages(true);
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        
        const response = await api.post('/api/v1/upload/images', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const urls = response.data.urls;
        setImageUrls(prev => [...prev, ...urls]);
        setNewPost(prev => ({
            ...prev,
            images: [...prev.images, ...urls]
        }));
    } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        alert('Không thể upload ảnh. Vui lòng thử lại!');
    } finally {
        setUploadingImages(false);
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
                    stats: { 
                        ...p.stats, 
                        like_count: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1 
                    }
                };
            }
            return p;
        }));

        try {
            await api.post(`/api/v1/likes/${postId}`);
        } catch (error) {
            console.error("Lỗi khi like bài viết:", error);
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
            setPosts(prevPosts => prevPosts.map(p => {
                if (p._id === postId) {
                    const currentLikes = p.stats?.like_count || 0;
                    return {
                        ...p,
                        stats: { 
                            ...p.stats, 
                            like_count: isCurrentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1) 
                        }
                    };
                }
                return p;
            }));
            alert("Không thể thực hiện. Vui lòng thử lại!");
        }
    };

    const handleSharePost = async (postId) => {
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                const currentShares = p.stats?.share_count || 0;
                return {
                    ...p,
                    stats: { 
                        ...p.stats, 
                        share_count: currentShares + 1 
                    }
                };
            }
            return p;
        }));
        try {
            await api.post(`/api/v1/shares/${postId}`);
        } catch (error) {
            console.error("Lỗi khi chia sẻ bài viết:", error);
            setPosts(prevPosts => prevPosts.map(p => {
                if (p._id === postId) {
                    const currentShares = p.stats?.share_count || 0;
                    return {
                        ...p,
                        stats: { 
                            ...p.stats, 
                            share_count: Math.max(0, currentShares - 1) 
                        }
                    };
                }
                return p;
            }));
            alert("Không thể chia sẻ lúc này. Vui lòng thử lại!");
        }
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment._id);      
        setEditCommentContent(comment.content); 
        setActiveCommentMenu(null);            
    };

    const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPost({
        content: post.content || "",
        images: post.images || [],
        videos: post.videos || [],
        tags: post.tags || [],
        location: post.location || "",
        visibility: post.visibility || "public",
        post_type: post.post_type || "text",
        product_category: post.product_category || "general",
        allow_comment: post.allow_comment !== false,
        allow_share: post.allow_share !== false
    });
    setImageUrls(post.images || []);
    setIsCreateModalOpen(true);
    setActivePostMenu(null);
};

    const handleSubmitPost = async () => {
    if (!newPost.content.trim() && newPost.images.length === 0 && newPost.videos.length === 0) {
        alert("Vui lòng nhập nội dung hoặc thêm ảnh/video");
        return;
    }
    
    setIsSubmitting(true);
    try {
        const postData = {
            content: newPost.content,
            images: newPost.images,
            videos: newPost.videos,
            tags: newPost.tags,
            location: newPost.location,
            visibility: newPost.visibility,
            post_type: newPost.post_type,
            product_category: newPost.product_category,
            allow_comment: newPost.allow_comment,
            allow_share: newPost.allow_share
        };
        
        if (editingPost) {
            await api.put(`/api/v1/posts/${editingPost._id}`, postData);
            setPosts(posts.map(p => 
                p._id === editingPost._id ? { ...p, ...postData } : p
            ));
        } else {
            const res = await api.post("/api/v1/posts/", postData);
            setPosts([res.data, ...posts]);
        }
        
        setIsCreateModalOpen(false);
        setNewPost({
            content: "",
            images: [],
            videos: [],
            tags: [],
            location: "",
            visibility: "public",
            post_type: "text",
            product_category: "general",
            allow_comment: true,
            allow_share: true
        });
        setImageUrls([]);
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
                await api.delete(`/api/v1/posts/${postId}`);
                setPosts(posts.filter(p => p._id !== postId));
                setActivePostMenu(null); 
            } catch (error) {
                console.error("Lỗi khi xóa bài:", error);
                alert("Không thể xóa bài viết. Vui lòng thử lại!");
            }
        }
    };

    const handleSaveEditComment = async (postId, commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            await api.put(`/api/v1/comments/${commentId}`, { content: editCommentContent });
            
            setPostComments(prev => ({
                ...prev,
                [postId]: prev[postId].map(cmt => 
                    cmt._id === commentId ? { ...cmt, content: editCommentContent } : cmt
                )
            }));
            
            setEditingCommentId(null);
            setEditCommentContent("");
        } catch (error) {
            console.error("Lỗi khi sửa bình luận:", error);
            alert("Không thể sửa bình luận. Vui lòng thử lại!");
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
            try {
                await api.delete(`/api/v1/comments/${commentId}`);
                
                setPostComments(prev => ({
                    ...prev,
                    [postId]: prev[postId].filter(cmt => cmt._id !== commentId)
                }));

                setPosts(prevPosts => prevPosts.map(p => 
                    p._id === postId 
                        ? { ...p, stats: { ...p.stats, comment_count: Math.max(0, (p.stats?.comment_count || 1) - 1) } }
                        : p
                ));

                setActiveCommentMenu(null);
            } catch (error) {
                console.error("Lỗi khi xóa bình luận:", error);
                alert("Không thể xóa bình luận!");
            }
        }
    };

    const removeImage = (indexToRemove) => {
        setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setNewPost(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleTagsChange = (e) => {
        const tagsString = e.target.value;
        const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
        setNewPost(prev => ({ ...prev, tags: tagsArray }));
    };

    const handleReportHideComment = (action) => {
        alert(`Đã thực hiện: ${action}. (Chức năng này cần API backend hỗ trợ thêm)`);
        setActiveCommentMenu(null);
    };

            // Thêm hàm chuyển đến trang profile của người dùng
        const goToUserProfile = (userId) => {
            navigate(`/profile/${userId}`);
        };

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

    return (
        <Layout>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ display: "flex", flex: 1, gap: "10px" }}>
                    {/* Diễn Đàn - Có thể click */}
                    <div 
                        onClick={goToForum}
                        style={{ 
                            flex: 1, 
                            background: category === "general" ? "white" : "#f0f2f5", 
                            padding: "12px", 
                            textAlign: "center", 
                            borderRadius: "10px", 
                            fontWeight: "bold", 
                            color: category === "general" ? "#2e7d32" : "#666", 
                            borderBottom: category === "general" ? "3px solid #2e7d32" : "none",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)", 
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            if (category !== "general") {
                                e.target.style.background = "#e4e6e9";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (category !== "general") {
                                e.target.style.background = "#f0f2f5";
                            }
                        }}
                    >
                        Diễn Đàn
                    </div>
                    
                    <div 
                        onClick={goToShop}
                        style={{ 
                            flex: 1, 
                            background: "#f0f2f5", 
                            padding: "12px", 
                            textAlign: "center", 
                            borderRadius: "10px", 
                            fontWeight: "bold", 
                            color: "#666", 
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)", 
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#e4e6e9";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "#f0f2f5";
                        }}
                    >
                        Cửa Hàng
                    </div>
                </div>

                <div style={{ background: "white", padding: "10px 15px", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", border: "1px solid #eee" }}>
                    <span style={{ fontWeight: "bold", fontSize: "12px", color: "#333" }}>Chế độ tối</span>
                    <div style={{ width: "38px", height: "24px", background: "#333", borderRadius: "15px", position: "relative" }}>
                        <div style={{ width: "18px", height: "18px", background: "white", borderRadius: "50%", position: "absolute", top: "3px", right: "3px" }}></div>
                    </div>
                </div>
            </div>

            {posts.map((post) => (
                <div key={post._id} style={{ background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    {/* Phần nội dung bài viết giữ nguyên */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", position: "relative" }}>
                        {/* Phần hiển thị thông tin người đăng bài */}
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <div style={{ width: "40px", height: "40px", background: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {post.author_avatar ? <img src={post.author_avatar} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : "👤"}
                            </div>
                            <div>
                                {/* Thêm cursor: pointer và onClick để click vào tên */}
                                <h4 
                                    style={{ 
                                        margin: 0, 
                                        fontSize: "16px", 
                                        cursor: "pointer",
                                        color: "#2e7d32",
                                        transition: "color 0.2s"
                                    }}
                                    onClick={() => goToUserProfile(post.author_id)}
                                    onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                    onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                >
                                    {post.author_name}
                                </h4>
                                <span style={{ fontSize: "12px", color: "#888" }}>{new Date(post.created_at).toLocaleDateString() || "Vừa xong"}</span>
                            </div>
                        </div>
                        
                        <span 
                            className="menu-trigger"
                            onClick={() => setActivePostMenu(activePostMenu === post._id ? null : post._id)}
                            style={{ fontWeight: "bold", color: "#888", cursor: "pointer", padding: "0 5px", fontSize: "18px" }}
                        >
                            •••
                        </span>

                        {activePostMenu === post._id && currentUser && (
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
                                {(() => {
                                    const myId = String(currentUser._id || currentUser.id || "");
                                    const ownerId = String(post.author_id || post.author || post.user_id || "");
                                    
                                    if (myId === ownerId) {
                                        return (
                                            <>
                                                <button 
                                                    onClick={() => handleEditPost(post)}
                                                    style={menuButtonStyle}
                                                    onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                    onMouseOut={(e) => e.target.style.background = "white"}
                                                >
                                                    ✏️ Sửa bài viết
                                                </button>
                                                <button 
                                                    onClick={() => handleDeletePost(post._id)}
                                                    style={{ ...menuButtonStyle, color: "#dc3545" }}
                                                    onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                    onMouseOut={(e) => e.target.style.background = "white"}
                                                >
                                                    🗑️ Xóa bài viết
                                                </button>
                                            </>
                                        );
                                    } else {
                                        return (
                                            <>
                                                <button 
                                                    onClick={() => alert("Đã ẩn bài viết này")}
                                                    style={menuButtonStyle}
                                                    onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                    onMouseOut={(e) => e.target.style.background = "white"}
                                                >
                                                    🙈 Ẩn bài viết
                                                </button>
                                                <button 
                                                    onClick={() => alert("Đã báo cáo bài viết")}
                                                    style={{ ...menuButtonStyle, color: "#dc3545" }}
                                                    onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                    onMouseOut={(e) => e.target.style.background = "white"}
                                                >
                                                    ⚠️ Báo cáo vi phạm
                                                </button>
                                            </>
                                        );
                                    }
                                })()}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: "15px", fontSize: "15px" }}>
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

                    {post.images && post.images.length > 0 && (
                        <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: post.images.length > 1 ? "repeat(2, 1fr)" : "1fr",
                            gap: "10px",
                            marginBottom: "15px"
                        }}>
                            {post.images.map((imgUrl, index) => (
                                <img 
                                    key={index}
                                    src={imgUrl} 
                                    alt={`post_img_${index}`} 
                                    style={{ 
                                        width: "100%", 
                                        borderRadius: "8px", 
                                        objectFit: "cover", 
                                        maxHeight: "400px"
                                    }} 
                                />
                            ))}
                        </div>
                    )}

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

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "10px 0", color: "#555", fontWeight: "500", fontSize: "14px" }}>
                        <div 
                            onClick={() => handleToggleLike(post._id)} 
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: likedPosts[post._id] ? "#1877F2" : "#555" }}
                        >
                            👍 Thích
                        </div>
                        <div 
                            onClick={() => handleToggleComments(post._id)} 
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: showComments[post._id] ? "#2e7d32" : "#555" }}
                        >
                            💬 Đánh giá
                        </div>
                        <div 
                            onClick={() => handleSharePost(post._id)}
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center" }}
                        >
                            ↗️ Chia sẻ
                        </div>
                    </div>

                    {/* Phần bình luận giữ nguyên */}
                    {showComments[post._id] && (
                        <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                            <div>
                                {postComments[post._id] ? (
                                    postComments[post._id].length > 0 ? (
                                        postComments[post._id].map(cmt => {
                                            const isCommentOwner = currentUser && 
                                                String(currentUser._id || currentUser.id) === String(cmt.author_id || cmt.user_id);
                                            return (
                                                <div key={cmt._id} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                                                    {cmt.author_avatar ? (
                                                        <img src={cmt.author_avatar} alt="avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                                                    ) : (
                                                        <div style={{ width: "32px", height: "32px", background: "#2e7d32", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                                                            {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ flex: 1 }}>
                                                        {editingCommentId === cmt._id ? (
                                                            <div style={{ background: "#f0f2f5", padding: "10px", borderRadius: "15px" }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editCommentContent}
                                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditComment(post._id, cmt._id) }}
                                                                    style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: "14px" }}
                                                                    autoFocus
                                                                />
                                                                <div style={{ fontSize: "12px", marginTop: "5px", color: "#0866ff" }}>
                                                                    <span style={{ cursor: "pointer", marginRight: "10px" }} onClick={() => handleSaveEditComment(post._id, cmt._id)}>Lưu</span>
                                                                    <span style={{ cursor: "pointer", color: "#65676B" }} onClick={() => setEditingCommentId(null)}>Hủy</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "5px", position: "relative" }}>
                                                                <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "15px", maxWidth: "85%" }}>
                                                                    <strong style={{ fontSize: "13px", display: "block", color: "#1c1e21" }}>{cmt.author_name}</strong>
                                                                    <span style={{ fontSize: "14px", color: "#1c1e21", wordBreak: "break-word" }}>{cmt.content}</span>
                                                                </div>

                                                                <div style={{ position: "relative" }}>
                                                                    <div 
                                                                        className="menu-trigger"
                                                                        style={{ 
                                                                            cursor: "pointer", 
                                                                            color: "#65676B", 
                                                                            fontSize: "18px", 
                                                                            width: "32px", 
                                                                            height: "32px",
                                                                            display: "flex", 
                                                                            alignItems: "center", 
                                                                            justifyContent: "center",
                                                                            borderRadius: "50%"
                                                                        }}
                                                                        onClick={() => setActiveCommentMenu(activeCommentMenu === cmt._id ? null : cmt._id)}
                                                                    >
                                                                        •••
                                                                    </div>
                                                                    {activeCommentMenu === cmt._id && (
                                                                        <div 
                                                                            className="popup-menu"
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "100%",
                                                                                right: "0",
                                                                                marginTop: "4px",
                                                                                background: "white", 
                                                                                border: "1px solid #ddd", 
                                                                                borderRadius: "8px",
                                                                                boxShadow: "0 2px 12px rgba(0,0,0,0.15)", 
                                                                                minWidth: "200px",
                                                                                zIndex: 100,
                                                                                display: "flex", 
                                                                                flexDirection: "column", 
                                                                                overflow: "hidden"
                                                                            }}>
                                                                            {isCommentOwner ? (
                                                                                <>
                                                                                    <button onClick={() => handleEditComment(cmt)} style={{ padding: "12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #eee", fontWeight: "500" }}>
                                                                                        ✏️ Chỉnh sửa bình luận
                                                                                    </button>
                                                                                    <button onClick={() => handleDeleteComment(post._id, cmt._id)} style={{ padding: "12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#dc3545", fontWeight: "500" }}>
                                                                                        🗑️ Xóa bình luận
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <button onClick={() => handleReportHideComment("Ẩn bình luận")} style={{ padding: "12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #eee", fontWeight: "500" }}>
                                                                                        👁️‍🗨️ Ẩn bình luận
                                                                                    </button>
                                                                                    <button onClick={() => handleReportHideComment("Chặn user")} style={{ padding: "12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #eee", fontWeight: "500" }}>
                                                                                        🚫 Chặn {cmt.author_name}
                                                                                    </button>
                                                                                    <button onClick={() => handleReportHideComment("Báo cáo")} style={{ padding: "12px", border: "none", background: "white", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#dc3545", fontWeight: "500" }}>
                                                                                        ⚠️ Báo cáo bình luận
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
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
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handlePostComment(post._id);
                                    }}
                                    style={{
                                        flex: 1, padding: "10px 15px", borderRadius: "20px",
                                        border: "none", background: "#f0f2f5", outline: "none", fontSize: "14px"
                                    }}
                                />
                                <button 
                                    onClick={() => handlePostComment(post._id)}
                                    style={{
                                        border: "none", background: "transparent", color: "#1877F2",
                                        fontWeight: "bold", cursor: "pointer", padding: "5px 10px"
                                    }}
                                >
                                    Gửi
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {isCreateModalOpen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "white", width: "600px", maxWidth: "90%", maxHeight: "90vh",
                        borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden"
                    }}>
                        {/* Header Modal */}
                        <div style={{ position: "relative", padding: "15px", borderBottom: "1px solid #e4e6eb", textAlign: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{editingPost ? "Sửa bài viết" : "Tạo bài viết mới"}</h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{ position: "absolute", top: "10px", right: "15px", width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#e4e6eb", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#606770" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Thông tin User */}
                        <div style={{ padding: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "40px", height: "40px", background: "#e4e6eb", borderRadius: "50%", overflow: "hidden" }}>
                                {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar" style={{width: "100%", height:"100%", objectFit:"cover"}}/> : <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center"}}>👤</div>}
                            </div>
                            <div>
                                <div style={{ fontWeight: "600", fontSize: "15px", color: "#050505" }}>
                                    {currentUser?.full_name || currentUser?.username}
                                </div>
                                <select 
                                    value={newPost.visibility}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, visibility: e.target.value }))}
                                    style={{ background: "#e4e6eb", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", border: "none", marginTop: "2px", fontWeight: "500" }}
                                >
                                    <option value="public">🌍 Công khai</option>
                                    <option value="friends">👥 Bạn bè</option>
                                    <option value="private">🔒 Riêng tư</option>
                                </select>
                            </div>
                        </div>

                        {/* Nội dung bài viết */}
                        <div style={{ padding: "0 15px", flex: 1, overflowY: "auto" }}>
                            <textarea
                                placeholder="Bạn đang nghĩ gì?"
                                value={newPost.content}
                                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                autoFocus
                                rows="4"
                                style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: "16px", fontFamily: "inherit" }}
                            />
                            
                            {/* Tags */}
                            <input
                                type="text"
                                placeholder="Thêm tag (cách nhau bằng dấu phẩy, VD: cafe, bạn bè)"
                                value={newPost.tags.join(', ')}
                                onChange={handleTagsChange}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "10px", fontSize: "14px" }}
                            />
                            
                            {/* Location */}
                            <input
                                type="text"
                                placeholder="Thêm địa điểm"
                                value={newPost.location}
                                onChange={(e) => setNewPost(prev => ({ ...prev, location: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "10px", fontSize: "14px" }}
                            />
                            
                            {/* Loại bài viết & Danh mục */}
                            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                <select 
                                    value={newPost.post_type}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, post_type: e.target.value }))}
                                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
                                >
                                    <option value="text">📝 Bài viết thường</option>
                                    <option value="product">🛍️ Giới thiệu sản phẩm</option>
                                    <option value="review">⭐ Đánh giá</option>
                                </select>
                                
                                <select 
                                    value={newPost.product_category}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, product_category: e.target.value }))}
                                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
                                >
                                    <option value="general">🌾 Chung</option>
                                    <option value="agriculture">🌽 Nông sản</option>
                                    <option value="seafood">🦐 Hải sản</option>
                                    <option value="specialty">🍜 Đặc sản</option>
                                </select>
                            </div>
                            
                            {/* Upload ảnh */}
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#f0f2f5", borderRadius: "8px", cursor: "pointer" }}>
                                    <span>📷</span> Thêm ảnh
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                                </label>
                                {uploadingImages && <span style={{ marginLeft: "10px", fontSize: "12px", color: "#666" }}>Đang upload...</span>}
                            </div>
                            
                            {/* Hiển thị ảnh đã chọn */}
                            {imageUrls.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "10px" }}>
                                    {imageUrls.map((url, idx) => (
                                        <div key={idx} style={{ position: "relative" }}>
                                            <img src={url} alt={`preview_${idx}`} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "8px" }} />
                                            <button 
                                                onClick={() => removeImage(idx)}
                                                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Tùy chọn */}
                            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                                    <input type="checkbox" checked={newPost.allow_comment} onChange={(e) => setNewPost(prev => ({ ...prev, allow_comment: e.target.checked }))} />
                                    Cho phép bình luận
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                                    <input type="checkbox" checked={newPost.allow_share} onChange={(e) => setNewPost(prev => ({ ...prev, allow_share: e.target.checked }))} />
                                    Cho phép chia sẻ
                                </label>
                            </div>
                        </div>

                        {/* Nút Đăng */}
                        <div style={{ padding: "15px", borderTop: "1px solid #eee" }}>
                            <button 
                                onClick={handleSubmitPost}
                                disabled={(!newPost.content.trim() && imageUrls.length === 0) || isSubmitting}
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "none", background: (newPost.content.trim() || imageUrls.length > 0) ? "#0866ff" : "#e4e6eb", color: (newPost.content.trim() || imageUrls.length > 0) ? "white" : "#bcc0c4", fontSize: "15px", fontWeight: "600", cursor: (newPost.content.trim() || imageUrls.length > 0) ? "pointer" : "not-allowed" }}
                            >
                                {isSubmitting ? "Đang đăng..." : editingPost ? "Cập nhật" : "Đăng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Home;