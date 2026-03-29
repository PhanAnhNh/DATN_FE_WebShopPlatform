// src/pages/user/Profile.jsx (chỉ phần form tạo bài viết)
import { useEffect, useState } from "react";
import api from "../../api/api";
import Layout from "../../components/layout/Layout";

function Profile() {
    // State cho dữ liệu
    const [currentUser, setCurrentUser] = useState(null);
    const [posts, setPosts] = useState([]);
    
    // State cho tương tác
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [likedPosts, setLikedPosts] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    
    // State cho upload ảnh
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
        const storedUserStr = localStorage.getItem("user");
        if (storedUserStr) {
            const parsedUser = JSON.parse(storedUserStr);
            setCurrentUser(parsedUser);
            const userId = parsedUser.id || parsedUser._id;
            if (userId) {
                fetchUserPostsAndLikes(userId);
            }
        }
    }, []);

    const fetchUserPostsAndLikes = async (userId) => {
        try {
            const res = await api.get(`/api/v1/posts/user/${userId}`);
            const activePosts = res.data.filter(post => post.is_active !== false);
            setPosts(activePosts);
            
            const likeChecks = activePosts.map(post =>
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
            console.error("Lỗi khi tải bài viết cá nhân:", err);
        }
    };

    // Xử lý upload ảnh
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        setUploadingImages(true);
        try {
            // Giả sử bạn có endpoint upload ảnh
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

    // Xóa ảnh
    const removeImage = (indexToRemove) => {
        setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setNewPost(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    // Xử lý tags
    const handleTagsChange = (e) => {
        const tagsString = e.target.value;
        const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
        setNewPost(prev => ({ ...prev, tags: tagsArray }));
    };

    const handleOpenCreateModal = () => {
        setEditingPost(null);
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
        setIsCreateModalOpen(true);
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
                const res = await api.put(`/api/v1/posts/${editingPost._id}`, postData);
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

    // Các hàm khác giữ nguyên
    const handleToggleComments = async (postId) => { /* ... */ };
    const handlePostComment = async (postId) => { /* ... */ };
    const handleToggleLike = async (postId) => { /* ... */ };
    const handleSharePost = async (postId) => { /* ... */ };

    if (!currentUser) return <Layout><div style={{ textAlign: "center", marginTop: "50px" }}>Đang tải dữ liệu người dùng...</div></Layout>;

    return (
        <Layout>
            {/* Header Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ width: "80px", height: "80px", background: "#e4e6eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" }}>
                    {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar" style={{width: "100%", height:"100%", borderRadius:"50%", objectFit:"cover"}}/> : "👤"}
                </div>
                <h2 style={{ margin: 0 }}>{currentUser?.full_name || currentUser?.username || "Tên Người Dùng"}</h2>
            </div>

            {/* Bố cục chính */}
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                {/* Right Content: Feed bài viết */}
                <div style={{ flex: 1 }}>   
                    {/* Form tạo bài viết */}
                    <div style={{ background: "white", borderRadius: "12px", padding: "15px 20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                            <div style={{ width: "40px", height: "40px", background: "#e4e6eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar" style={{width: "100%", height:"100%", objectFit:"cover"}}/> : "👤"}
                            </div>
                            <div 
                                onClick={handleOpenCreateModal}
                                style={{ flex: 1, background: "#f0f2f5", padding: "10px 15px", borderRadius: "20px", color: "#65676B", cursor: "pointer", fontSize: "15px" }}
                                onMouseOver={(e) => e.target.style.background = "#e4e6eb"}
                                onMouseOut={(e) => e.target.style.background = "#f0f2f5"}
                            >
                                {currentUser?.full_name || currentUser?.username} ơi, bạn đang nghĩ gì thế?
                            </div>
                        </div>

                        {/* Các nút tiện ích */}
                        <div style={{ display: "flex", justifyContent: "space-around" }}>
                            <div onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#65676B", fontWeight: "500", padding: "8px", borderRadius: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f0f2f5"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: "20px" }}>📷</span> Ảnh/Video
                            </div>
                            <div onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#65676B", fontWeight: "500", padding: "8px", borderRadius: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f0f2f5"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: "20px" }}>🏷️</span> Gắn thẻ
                            </div>
                            <div onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#65676B", fontWeight: "500", padding: "8px", borderRadius: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f0f2f5"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: "20px" }}>📍</span> Vị trí
                            </div>
                        </div>
                    </div>

                    {/* Danh sách bài viết - giữ nguyên */}
                    {posts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px", background: "white", borderRadius: "12px" }}>Bạn chưa có bài viết nào.</div>
                    ) : (
                        posts.map((post) => (
                            <div key={post._id} style={{ background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                {/* Header bài viết - giữ nguyên */}
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
                                    
                                    <span 
                                        onClick={() => setActivePostMenu(activePostMenu === post._id ? null : post._id)}
                                        style={{ fontWeight: "bold", color: "#888", cursor: "pointer", padding: "0 5px", fontSize: "18px" }}
                                    >
                                        •••
                                    </span>

                                    {activePostMenu === post._id && (
                                        <div style={{
                                            position: "absolute",
                                            top: "25px",
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
                                    {post.content && <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>{post.content}</p>}
                                </div>

                                {/* Hiển thị tags */}
                                {post.tags && post.tags.length > 0 && (
                                    <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                        {post.tags.map((tag, idx) => (
                                            <span key={idx} style={{ background: "#e4e6eb", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", color: "#2e7d32" }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Hiển thị vị trí */}
                                {post.location && (
                                    <div style={{ marginBottom: "10px", fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "4px" }}>
                                        📍 {post.location}
                                    </div>
                                )}

                                {/* Hình ảnh */}
                                {post.images && post.images.length > 0 && (
                                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(post.images.length, 3)}, 1fr)`, gap: "4px", marginBottom: "15px" }}>
                                        {post.images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`post_img_${idx}`} style={{ width: "100%", borderRadius: "8px", objectFit: "cover", aspectRatio: "1/1" }} />
                                        ))}
                                    </div>
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
                                        💬 Bình luận
                                    </div>
                                    <div onClick={() => handleSharePost(post._id)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center" }}>
                                        ↗️ Chia sẻ
                                    </div>
                                </div>

                                {/* Khu vực bình luận - giữ nguyên */}
                                {showComments[post._id] && (
                                    <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                                        {/* ... phần bình luận giữ nguyên ... */}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal tạo/sửa bài viết */}
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

export default Profile;