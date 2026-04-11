import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import Layout from "../../components/layout/Layout";
import ShareModal from "./ShareModal";
import SharedPostCard from "./SharedPostCard";
import ReportModal from "../admin/reportModal";

function Home() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category") || "general";
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReportPost, setSelectedReportPost] = useState(null);
    
    const [posts, setPosts] = useState([]);

    // Thay thế useState likedPosts:
    const [likedPosts, setLikedPosts] = useState({});

    // loading ban đầu có thể set true (sẽ được useEffect xử lý)
    const [loading, setLoading] = useState(true);
    
    
    const [currentUser, setCurrentUser] = useState(() => {
        const storedUserData = localStorage.getItem("user_data");
        const storedUserLegacy = localStorage.getItem("user");
        if (storedUserData) {
            return JSON.parse(storedUserData);
        } else if (storedUserLegacy) {
            return JSON.parse(storedUserLegacy);
        }
        return null;
    });
    
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [newPostContent, setNewPostContent] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCommentMenu, setActiveCommentMenu] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [modalComments, setModalComments] = useState([]);
    const [modalCommentInput, setModalCommentInput] = useState("");
    const [modalLiked, setModalLiked] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const [commentLimit] = useState(5);
    const [totalComments, setTotalComments] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyInput, setReplyInput] = useState("");
    const [sharePost, setSharePost] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const clearCache = () => {
        sessionStorage.removeItem(`home_posts_${category}`);
        sessionStorage.removeItem(`home_cache_time_${category}`);
        sessionStorage.removeItem(`home_liked_${category}`);
    };

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
    const [savedPosts, setSavedPosts] = useState({});
    const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' });
    const [lastLoadedCategory, setLastLoadedCategory] = useState(category);
    const showToast = (message, type = 'success') => {
        setToastConfig({ show: true, message, type });
        setTimeout(() => setToastConfig({ show: false, message: '', type: 'success' }), 3000);
    };

    // Lưu cache khi posts thay đổi
    useEffect(() => {
        if (posts.length > 0) {
            sessionStorage.setItem(`home_posts_${category}`, JSON.stringify(posts));
            sessionStorage.setItem(`home_cache_time_${category}`, Date.now().toString());
        }
    }, [posts, category]);

    // Lưu liked posts cache
    useEffect(() => {
        if (Object.keys(likedPosts).length > 0) {
            sessionStorage.setItem(`home_liked_${category}`, JSON.stringify(likedPosts));
        }
    }, [likedPosts, category]);

    // Sửa useEffect loadPosts
    useEffect(() => {
        const loadPosts = async () => {
            setLoading(true);
            
            // QUAN TRỌNG: Force clear cache khi category thay đổi
            // Xóa cache của category hiện tại để đảm bảo load dữ liệu mới
            sessionStorage.removeItem(`home_posts_${category}`);
            sessionStorage.removeItem(`home_cache_time_${category}`);
            sessionStorage.removeItem(`home_liked_${category}`);
            
            const cachedPosts = sessionStorage.getItem(`home_posts_${category}`);
            const cacheTime = sessionStorage.getItem(`home_cache_time_${category}`);
            
            // KHÔNG dùng cache nữa khi category thay đổi
            // Hoặc chỉ dùng cache trong 1 phút
            const isCacheValid = cachedPosts && cacheTime && (Date.now() - parseInt(cacheTime) < 60000);
            
            if (isCacheValid && category === lastLoadedCategory) {
                try {
                    const parsedPosts = JSON.parse(cachedPosts);
                    setPosts(parsedPosts);
                    const cachedLiked = sessionStorage.getItem(`home_liked_${category}`);
                    if (cachedLiked) setLikedPosts(JSON.parse(cachedLiked));
                    setLoading(false);
                    return;
                } catch(e) { console.error("Lỗi parse cache", e); }
            }
            
            // Gọi API mới
            await fetchFeedAndLikes();
            setLastLoadedCategory(category); // Lưu category đã load
            setLoading(false);
        };
        
        loadPosts();
    }, [category]);


    const fetchFeedAndLikes = async () => {
        try {
            let url = "/api/v1/posts/feed";
            if (category !== "general") url += `?category=${category}`;

            const token = localStorage.getItem("user_token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const res = await api.get(url);
            const fetchedPosts = res.data;
            setPosts(fetchedPosts);

            // Lưu cache
            sessionStorage.setItem(`home_posts_${category}`, JSON.stringify(fetchedPosts));
            sessionStorage.setItem(`home_cache_time_${category}`, Date.now().toString());

            // Like checks
            const likeChecks = fetchedPosts.map(post =>
                api.get(`/api/v1/likes/check/${post._id}`)
                    .then(res => ({ id: post._id, isLiked: res.data.liked }))
                    .catch(() => ({ id: post._id, isLiked: false }))
            );
            const likeResults = await Promise.all(likeChecks);
            const likeMap = {};
            likeResults.forEach(result => { likeMap[result.id] = result.isLiked; });
            setLikedPosts(likeMap);
            sessionStorage.setItem(`home_liked_${category}`, JSON.stringify(likeMap));

        } catch (err) {
            console.error("Lỗi khi tải Feed:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("user_token");
                localStorage.removeItem("user_data");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!currentUser) return;
            
            const savedChecks = posts.map(post => 
                api.get(`/api/v1/saves/check/${post._id}`)
                    .then(res => ({ id: post._id, isSaved: res.data.is_saved }))
                    .catch(() => ({ id: post._id, isSaved: false }))
            );
            
            const savedResults = await Promise.all(savedChecks);
            const savedMap = {};
            savedResults.forEach(result => {
                savedMap[result.id] = result.isSaved;
            });
            setSavedPosts(savedMap);
        };
        
        if (posts.length > 0 && currentUser) {
            checkSavedStatus();
        }
    }, [posts, currentUser]);

    const handleOpenShare = (post) => {
        setSharePost(post);
        setShowShareModal(true);
    };

    const goToForum = () => {
        navigate('/');
    };

    const goToShop = () => {
        navigate('/use/shop');
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

    const handleOpenReport = (post) => {
        setSelectedReportPost(post);
        setShowReportModal(true);
        setActivePostMenu(null);
    };

    const handleReportSuccess = () => {
        showToast("Đã gửi báo cáo thành công. Cảm ơn bạn đã đóng góp!", "success");
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

    const openPostModal = async (post) => {
        try {
            const res = await api.get(`/api/v1/posts/${post._id}`);
            const updatedPost = res.data;
            
            setSelectedPost(updatedPost);
            setIsPostModalOpen(true);
            setModalCommentInput("");
            setCommentPage(1);
            setReplyingTo(null);
            
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === post._id ? updatedPost : p
            ));
            
            try {
                const likeRes = await api.get(`/api/v1/likes/check/${post._id}`);
                setModalLiked(likeRes.data.liked);
            } catch(e) { setModalLiked(false); }
            
            await fetchModalComments(post._id, 1);
            
        } catch (error) {
            console.error("Lỗi khi mở bài viết:", error);
            setSelectedPost(post);
            setIsPostModalOpen(true);
        }
    };

    const fetchModalComments = async (postId, page) => {
        try {
            const commentsRes = await api.get(`/api/v1/comments/${postId}`);
            const allComments = commentsRes.data;
            
            const parentComments = allComments.filter(c => !c.parent_id);
            const childComments = allComments.filter(c => c.parent_id);
            
            const repliesMap = {};
            childComments.forEach(reply => {
                const parentId = reply.parent_id;
                if (!repliesMap[parentId]) {
                    repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(reply);
            });
            
            const commentsWithReplies = parentComments.map(parent => ({
                ...parent,
                replies: repliesMap[parent._id] || []
            }));
            
            const start = (page - 1) * commentLimit;
            const end = start + commentLimit;
            const paginatedComments = commentsWithReplies.slice(start, end);
            
            setModalComments(paginatedComments);
            setTotalComments(commentsWithReplies.length);
            
        } catch(e) { 
            console.error("Lỗi tải bình luận:", e);
            setModalComments([]);
            setTotalComments(0);
        }
    };

    const loadMoreComments = async () => {
        const nextPage = commentPage + 1;
        try {
            const commentsRes = await api.get(`/api/v1/comments/${selectedPost._id}`);
            const allComments = commentsRes.data;
            
            const parentComments = allComments.filter(c => !c.parent_id);
            const childComments = allComments.filter(c => c.parent_id);
            
            const repliesMap = {};
            childComments.forEach(reply => {
                const parentId = reply.parent_id;
                if (!repliesMap[parentId]) {
                    repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(reply);
            });
            
            const commentsWithReplies = parentComments.map(parent => ({
                ...parent,
                replies: repliesMap[parent._id] || []
            }));
            
            const start = (nextPage - 1) * commentLimit;
            const end = start + commentLimit;
            const newComments = commentsWithReplies.slice(start, end);
            
            setModalComments(prev => [...prev, ...newComments]);
            setCommentPage(nextPage);
            setTotalComments(commentsWithReplies.length);
            
        } catch(e) {
            console.error("Lỗi tải thêm bình luận:", e);
        }
    };

    const handleModalComment = async (parentId = null) => {
        const content = parentId ? replyInput : modalCommentInput;
        if (!content.trim() || !selectedPost) return;
        
        try {
            const commentData = {
                post_id: selectedPost._id,
                content: content
            };
            if (parentId) {
                commentData.parent_id = parentId;
            }
            
            await api.post("/api/v1/comments/", commentData);
            
            await fetchModalComments(selectedPost._id, 1);
            setModalCommentInput("");
            setReplyInput("");
            setReplyingTo(null);
            setCommentPage(1);
            
            setSelectedPost(prev => ({
                ...prev,
                stats: { ...prev.stats, comment_count: (prev.stats?.comment_count || 0) + 1 }
            }));
        } catch(err) {
            console.error(err);
            alert("Không thể đăng bình luận");
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
            
            clearCache();
            
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
                clearCache();
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
    
    const handleSavePost = async (postId) => {
        const isCurrentlySaved = savedPosts[postId];
        
        setSavedPosts(prev => ({ ...prev, [postId]: !isCurrentlySaved }));
        
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                const currentSaved = p.stats?.saved_count || 0;
                return {
                    ...p,
                    stats: {
                        ...p.stats,
                        saved_count: isCurrentlySaved ? Math.max(0, currentSaved - 1) : currentSaved + 1
                    }
                };
            }
            return p;
        }));
        
        try {
            if (isCurrentlySaved) {
                await api.delete(`/api/v1/saves/${postId}`);
                showToast("Đã bỏ lưu bài viết", "success");
            } else {
                await api.post('/api/v1/saves/', { post_id: postId });
                showToast("Đã lưu bài viết", "success");
            }
        } catch (error) {
            console.error("Lỗi khi lưu/bỏ lưu bài viết:", error);
            setSavedPosts(prev => ({ ...prev, [postId]: isCurrentlySaved }));
            setPosts(prevPosts => prevPosts.map(p => {
                if (p._id === postId) {
                    const currentSaved = p.stats?.saved_count || 0;
                    return {
                        ...p,
                        stats: {
                            ...p.stats,
                            saved_count: isCurrentlySaved ? currentSaved + 1 : Math.max(0, currentSaved - 1)
                        }
                    };
                }
                return p;
            }));
            showToast("Không thể thực hiện. Vui lòng thử lại!", "error");
        }
    };

    // Loading state
    if (loading && posts.length === 0) {
        return (
            <Layout>
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ 
                        width: "40px", 
                        height: "40px", 
                        border: "3px solid #f3f3f3", 
                        borderTop: "3px solid #2e7d32", 
                        borderRadius: "50%", 
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 20px"
                    }}></div>
                    <p>Đang tải bài viết...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ display: "flex", flex: 1, gap: "10px" }}>
                    <div 
                        onClick={goToForum}
                        style={{ 
                            flex: 1, 
                            background: location.pathname === "/" ? "white" : "#f0f2f5", 
                            padding: "12px", 
                            textAlign: "center", 
                            borderRadius: "10px", 
                            fontWeight: "bold", 
                            color: location.pathname === "/" ? "#2e7d32" : "#666", 
                            borderBottom: location.pathname === "/" ? "3px solid #2e7d32" : "none",
                            boxShadow: location.pathname === "/" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                            background: location.pathname === "/user/shop" ? "white" : "#f0f2f5", 
                            padding: "12px", 
                            textAlign: "center", 
                            borderRadius: "10px", 
                            fontWeight: "bold", 
                            color: location.pathname === "/user/shop" ? "#2e7d32" : "#666", 
                            borderBottom: location.pathname === "/user/shop" ? "3px solid #2e7d32" : "none",
                            boxShadow: location.pathname === "/user/shop" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        Cửa Hàng
                    </div>
                </div>

                {/* Dark mode toggle - keep as is */}
                <div style={{ background: "white", padding: "10px 15px", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", border: "1px solid #eee" }}>
                    <span style={{ fontWeight: "bold", fontSize: "12px", color: "#333" }}>Chế độ tối</span>
                    <div style={{ width: "38px", height: "24px", background: "#333", borderRadius: "15px", position: "relative" }}>
                        <div style={{ width: "18px", height: "18px", background: "white", borderRadius: "50%", position: "absolute", top: "3px", right: "3px" }}></div>
                    </div>
                </div>
            </div>

            {posts.map((post) => (
                <div key={post._id} id={`post-${post._id}`} style={{ background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", position: "relative" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <div style={{ width: "40px", height: "40px", background: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {post.author_avatar ? <img src={post.author_avatar} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : "👤"}
                            </div>
                            <div>
                                <h4 
                                    style={{ 
                                        margin: 0, 
                                        fontSize: "16px", 
                                        cursor: "pointer",
                                        color: "#2e7d32",
                                        transition: "color 0.2s"
                                    }}
                                    onClick={() => goToUserProfile(post.author_id)}
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
                                                    onClick={() => handleSavePost(post._id)}
                                                    style={{
                                                        ...menuButtonStyle,
                                                        color: savedPosts[post._id] ? "#2e7d32" : "#555",
                                                        fontWeight: savedPosts[post._id] ? "bold" : "normal"
                                                    }}
                                                    onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                    onMouseOut={(e) => e.target.style.background = "white"}
                                                >
                                                    {savedPosts[post._id] ? "📌 Đã lưu" : "🔖 Lưu bài viết"}
                                                </button>
                                                <button 
                                                    onClick={() => alert("Đã ẩn bài viết này")}
                                                    style={menuButtonStyle}
                                                    onMouseOver={(e) => e.target.style.background = "#f0f2f5"}
                                                    onMouseOut={(e) => e.target.style.background = "white"}
                                                >
                                                    👁️‍🗨️ Ẩn bài viết
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenReport(post)}
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

                    <div onClick={() => openPostModal(post)} style={{ marginBottom: "15px", fontSize: "15px", cursor: "pointer" }}>
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
                    
                    {post.post_type === 'share' && post.shared_post && (
                        <SharedPostCard 
                            sharedPost={post.shared_post}
                            onClick={() => openPostModal(post.shared_post)}
                        />
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
                            onClick={() => openPostModal(post)}
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: showComments[post._id] ? "#2e7d32" : "#555" }}
                        >
                            💬 Đánh giá
                        </div>
                        <div 
                            onClick={() => handleOpenShare(post)}
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center" }}
                        >
                            ↗️ Chia sẻ
                        </div>
                    </div>    
                </div>
            ))}
            
            {/* Modal tạo bài viết */}
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
                        <div style={{ position: "relative", padding: "15px", borderBottom: "1px solid #e4e6eb", textAlign: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{editingPost ? "Sửa bài viết" : "Tạo bài viết mới"}</h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{ position: "absolute", top: "10px", right: "15px", width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#e4e6eb", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#606770" }}
                            >
                                ✕
                            </button>
                        </div>

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

                        <div style={{ padding: "0 15px", flex: 1, overflowY: "auto" }}>
                            <textarea
                                placeholder="Bạn đang nghĩ gì?"
                                value={newPost.content}
                                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                autoFocus
                                rows="4"
                                style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: "16px", fontFamily: "inherit" }}
                            />
                            
                            <input
                                type="text"
                                placeholder="Thêm tag (cách nhau bằng dấu phẩy, VD: cafe, bạn bè)"
                                value={newPost.tags.join(', ')}
                                onChange={handleTagsChange}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "10px", fontSize: "14px" }}
                            />
                            
                            <input
                                type="text"
                                placeholder="Thêm địa điểm"
                                value={newPost.location}
                                onChange={(e) => setNewPost(prev => ({ ...prev, location: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "10px", fontSize: "14px" }}
                            />
                            
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
                            
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#f0f2f5", borderRadius: "8px", cursor: "pointer" }}>
                                    <span>📷</span> Thêm ảnh
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                                </label>
                                {uploadingImages && <span style={{ marginLeft: "10px", fontSize: "12px", color: "#666" }}>Đang upload...</span>}
                            </div>
                            
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
            
            {/* Modal xem chi tiết bài viết */}
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
                        
                        <div style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #e4e6eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexShrink: 0
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

                        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "15px" }}>
                                <div style={{ 
                                    width: "48px", 
                                    height: "48px", 
                                    background: "#e4e6eb", 
                                    borderRadius: "50%", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    overflow: "hidden",
                                    flexShrink: 0
                                }}>
                                    {selectedPost.author_avatar ? (
                                        <img src={selectedPost.author_avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                                    ) : (
                                        <span style={{ fontSize: "24px" }}>👤</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{selectedPost.author_name}</h4>
                                    <span style={{ fontSize: "12px", color: "#888" }}>{new Date(selectedPost.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                {selectedPost.content && <p style={{ margin: "5px 0", fontSize: "15px", whiteSpace: "pre-wrap" }}>{selectedPost.content}</p>}
                                {selectedPost.location && (
                                    <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                                        📍 <strong>Vị trí:</strong> {selectedPost.location}
                                    </p>
                                )}
                                {selectedPost.tags && selectedPost.tags.length > 0 && (
                                    <p style={{ margin: "5px 0", color: "#2e7d32", fontSize: "14px", fontWeight: "500" }}>
                                        {selectedPost.tags.map(tag => `#${tag}`).join(" ")}
                                    </p>
                                )}
                            </div>

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

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "14px", color: "#65676B" }}>
                                <div>👍 {selectedPost.stats?.like_count || 0} lượt thích</div>
                                <div>{selectedPost.stats?.comment_count || 0} bình luận</div>
                            </div>

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
                                <div style={{ flex: 1, textAlign: "center", cursor: "pointer", color: "#555", fontWeight: "500", padding: "6px 0", borderRadius: "6px" }}
                                    onClick={async () => {
                                        alert("Tính năng chia sẻ đang phát triển");
                                    }}
                                >↗️ Chia sẻ</div>
                            </div>

                            <div style={{ marginTop: "15px" }}>
                                <h4 style={{ fontSize: "15px", marginBottom: "12px" }}>Bình luận</h4>
                                
                                {replyingTo && (
                                    <div style={{ 
                                        background: "#f0f2f5", 
                                        padding: "12px", 
                                        borderRadius: "12px", 
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        flexWrap: "wrap"
                                    }}>
                                        <span style={{ fontSize: "14px", color: "#65676B" }}>
                                            Trả lời <strong>{replyingTo.author_name}</strong>:
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Viết câu trả lời..."
                                            value={replyInput}
                                            onChange={(e) => setReplyInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleModalComment(replyingTo._id)}
                                            style={{
                                                flex: 1,
                                                minWidth: "200px",
                                                padding: "8px 12px",
                                                borderRadius: "20px",
                                                border: "1px solid #ddd",
                                                background: "white",
                                                outline: "none",
                                                fontSize: "14px"
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleModalComment(replyingTo._id)}
                                            style={{ border: "none", background: "#2e7d32", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                                        >
                                            Trả lời
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            style={{ border: "none", background: "#e4e6eb", color: "#333", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {modalComments.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#888", padding: "20px 0" }}>Chưa có bình luận nào.</div>
                                ) : (
                                    <>
                                        {modalComments.map(cmt => (
                                            <div key={cmt._id} style={{ marginBottom: "20px" }}>
                                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                    <div style={{ 
                                                        width: "40px", 
                                                        height: "40px", 
                                                        background: "#2e7d32", 
                                                        borderRadius: "50%", 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        justifyContent: "center", 
                                                        color: "white", 
                                                        fontSize: "16px", 
                                                        fontWeight: "bold", 
                                                        flexShrink: 0 
                                                    }}>
                                                        {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ background: "#f0f2f5", padding: "10px 14px", borderRadius: "18px" }}>
                                                            <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px", color: "#1c1e21" }}>
                                                                {cmt.author_name}
                                                            </strong>
                                                            <span style={{ fontSize: "14px", color: "#1c1e21", wordBreak: "break-word" }}>
                                                                {cmt.content}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: "flex", gap: "16px", marginTop: "6px", marginLeft: "8px", fontSize: "12px", color: "#65676B" }}>
                                                            <span>{new Date(cmt.created_at).toLocaleString()}</span>
                                                            <button 
                                                                onClick={() => setReplyingTo(cmt)}
                                                                style={{ border: "none", background: "transparent", color: "#2e7d32", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                                                            >
                                                                Trả lời
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {cmt.replies && cmt.replies.length > 0 && (
                                                    <div style={{ marginLeft: "52px", marginTop: "12px", paddingLeft: "12px", borderLeft: "2px solid #e4e6eb" }}>
                                                        {cmt.replies.map(reply => (
                                                            <div key={reply._id} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                                                                <div style={{ 
                                                                    width: "32px", 
                                                                    height: "32px", 
                                                                    background: "#e4e6eb", 
                                                                    borderRadius: "50%", 
                                                                    display: "flex", 
                                                                    alignItems: "center", 
                                                                    justifyContent: "center", 
                                                                    fontSize: "12px", 
                                                                    fontWeight: "bold",
                                                                    flexShrink: 0,
                                                                    color: "#333"
                                                                }}>
                                                                    {reply.author_name ? reply.author_name.charAt(0).toUpperCase() : "U"}
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "16px" }}>
                                                                        <strong style={{ fontSize: "12px", display: "block", marginBottom: "2px", color: "#1c1e21" }}>
                                                                            {reply.author_name}
                                                                        </strong>
                                                                        <span style={{ fontSize: "13px", color: "#1c1e21", wordBreak: "break-word" }}>
                                                                            {reply.content}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ marginTop: "4px", marginLeft: "8px", fontSize: "11px", color: "#65676B" }}>
                                                                        {new Date(reply.created_at).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {modalComments.length < totalComments && totalComments > commentLimit && (
                                            <div style={{ textAlign: "center", marginTop: "16px" }}>
                                                <button
                                                    onClick={loadMoreComments}
                                                    style={{
                                                        padding: "8px 24px",
                                                        background: "transparent",
                                                        border: "1px solid #2e7d32",
                                                        borderRadius: "20px",
                                                        cursor: "pointer",
                                                        fontSize: "13px",
                                                        fontWeight: "500",
                                                        color: "#2e7d32",
                                                        transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = "#2e7d32";
                                                        e.target.style.color = "white";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = "transparent";
                                                        e.target.style.color = "#2e7d32";
                                                    }}
                                                >
                                                    Xem thêm {totalComments - modalComments.length} bình luận
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: "12px 16px", borderTop: "1px solid #e4e6eb", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ 
                                width: "32px", 
                                height: "32px", 
                                background: "#ddd", 
                                borderRadius: "50%", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                flexShrink: 0 
                            }}>
                                {currentUser?.avatar_url ? (
                                    <img src={currentUser.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}/>
                                ) : "👤"}
                            </div>
                            <input
                                type="text"
                                placeholder={replyingTo ? `Trả lời ${replyingTo.author_name}...` : "Viết bình luận..."}
                                value={modalCommentInput}
                                onChange={(e) => setModalCommentInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && modalCommentInput.trim()) {
                                        handleModalComment();
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: "10px 14px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background: "#f0f2f5",
                                    outline: "none",
                                    fontSize: "14px"
                                }}
                            />
                            <button
                                onClick={() => handleModalComment()}
                                style={{ border: "none", background: "transparent", color: "#1877F2", fontWeight: "bold", cursor: "pointer" }}
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShareModal && sharePost && (
                <ShareModal
                    post={sharePost}
                    onClose={() => {
                        setShowShareModal(false);
                        setSharePost(null);
                    }}
                    onShareSuccess={() => {
                        setPosts(prevPosts => prevPosts.map(p => 
                            p._id === sharePost._id 
                                ? { ...p, stats: { ...p.stats, share_count: (p.stats?.share_count || 0) + 1 } }
                                : p
                        ));
                    }}
                />
            )}

            {showReportModal && selectedReportPost && (
                <ReportModal
                    post={selectedReportPost}
                    onClose={() => {
                        setShowReportModal(false);
                        setSelectedReportPost(null);
                    }}
                    onReportSuccess={handleReportSuccess}
                />
            )}
        </Layout>
    );
}

export default Home;