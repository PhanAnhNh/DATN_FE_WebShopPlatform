import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { 
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, 
    FaSpinner, FaCamera, FaPencilAlt, FaUserPlus, FaUserCheck,
    FaTh, FaInfoCircle, FaUsers, FaPhotoVideo, FaClock,
    FaTimes, FaSave, FaUpload, FaLink, FaShareAlt
} from 'react-icons/fa';
import FriendButton from '../../components/common/FriendButton';
import ShareModal from "./ShareModal";
import SharedPostCard from "./SharedPostCard";
import ReportModal from '../admin/reportModal';
import Toast from '../../components/common/Toast';
import { 
    uploadImageToR2, 
    fetchUserProfileAPI, 
    fetchUserPostsAPI, 
    checkFollowStatusAPI,
    followUserAPI,
    unfollowUserAPI,
    fetchUserFriendsAPI,
    savePostAPI,
    unsavePostAPI,
    checkSavedStatusAPI,
    deletePostAPI,
    updatePostAPI,
    toggleLikeAPI,
    checkLikeStatusAPI,
    fetchCommentsAPI,
    createCommentAPI,
    updateCommentAPI,
    deleteCommentAPI,
    updateUserAPI,
    fetchPostDetailsAPI,        
    fetchCommentsWithPaginationAPI
} from '../../api/userProfileAPI';
import '../../css/UserProfile.css';

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Comment states
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [likedPosts, setLikedPosts] = useState({});
    const [savedPosts, setSavedPosts] = useState({});
    
    // Edit Post states
    const [editingPost, setEditingPost] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        content: "",
        images: [],
        tags: [],
        location: "",
        visibility: "public",
        post_type: "text",
        product_category: "general",
        allow_comment: true,
        allow_share: true
    });
    const [editImageUrls, setEditImageUrls] = useState([]);
    const [uploadingEditImages, setUploadingEditImages] = useState(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    
    // Modal states
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
    const [activeCommentMenu, setActiveCommentMenu] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");
    const [expandedReplies, setExpandedReplies] = useState({});
    const [allRepliesData, setAllRepliesData] = useState({});
    
    // Share & Report states
    const [sharePost, setSharePost] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReportPost, setSelectedReportPost] = useState(null);
    
    // Toast state
    const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' });
    
    // Confirm modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    
    // Avatar & Cover upload states
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [avatarUploadMethod, setAvatarUploadMethod] = useState('file');
    const [coverUploadMethod, setCoverUploadMethod] = useState('file');
    const [avatarUrlInput, setAvatarUrlInput] = useState('');
    const [coverUrlInput, setCoverUrlInput] = useState('');
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsPage, setFriendsPage] = useState(1);
    const [hasMoreFriends, setHasMoreFriends] = useState(true);
    const [friendRequestStatus, setFriendRequestStatus] = useState({});

    const showToast = (message, type = 'success') => {
        setToastConfig({ show: true, message, type });
        setTimeout(() => setToastConfig({ show: false, message: '', type: 'success' }), 3000);
    };

    const showConfirm = (message, onConfirm) => {
        setConfirmMessage(message);
        setConfirmAction(() => onConfirm);
        setShowConfirmModal(true);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser._id && parsedUser.id) {
                parsedUser._id = parsedUser.id;
            }
            setCurrentUser(parsedUser);
        }
        loadUserProfile();
    }, [userId]);

    useEffect(() => {
        if (user && user._id) {
            loadUserPosts();
            checkFollowStatus();
        }
    }, [user]);

    useEffect(() => {
        if (posts.length > 0 && currentUser) {
            checkSavedStatus();
        }
    }, [posts, currentUser]);

    useEffect(() => {
        if (activeTab === 'friends' && user?._id) {
            setFriends([]);
            setFriendsPage(1);
            loadUserFriends(1, true);
        }
    }, [activeTab, userId]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const data = await fetchUserProfileAPI(userId);
            setUser(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Không thể tải thông tin người dùng');
            if (err.response?.status === 404) {
                setError('Không tìm thấy người dùng');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadUserPosts = async () => {
        try {
            const data = await fetchUserPostsAPI(userId);
            const activePosts = data.filter(post => post.is_active !== false);
            setPosts(activePosts);
            
            const likeChecks = activePosts.map(post => checkLikeStatusAPI(post._id));
            const likeResults = await Promise.all(likeChecks);
            const likeMap = {};
            likeResults.forEach(result => {
                likeMap[result.id] = result.isLiked;
            });
            setLikedPosts(likeMap);
        } catch (err) {
            console.error('Error fetching user posts:', err);
        }
    };

    const checkFollowStatus = async () => {
        if (!currentUser || currentUser._id === userId) return;
        try {
            const isFollowingStatus = await checkFollowStatusAPI(userId);
            setIsFollowing(isFollowingStatus);
        } catch (err) {
            console.error('Error checking follow status:', err);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setFollowingLoading(true);
        try {
            if (isFollowing) {
                await unfollowUserAPI(userId);
                setIsFollowing(false);
                setUser(prev => ({ ...prev, followers_count: (prev.followers_count || 0) - 1 }));
                showToast("Đã hủy theo dõi", "success");
            } else {
                await followUserAPI(userId);
                setIsFollowing(true);
                setUser(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
                showToast("Đã theo dõi", "success");
            }
        } catch (err) {
            console.error('Error following/unfollowing:', err);
            showToast("Không thể thực hiện. Vui lòng thử lại!", "error");
        } finally {
            setFollowingLoading(false);
        }
    };

    const loadUserFriends = async (page = 1, reset = false) => {
        if (friendsLoading) return;
        
        setFriendsLoading(true);
        try {
            const limit = 12;
            const data = await fetchUserFriendsAPI(page, limit);
            
            if (reset) {
                setFriends(data);
            } else {
                setFriends(prev => [...prev, ...data]);
            }
            
            setHasMoreFriends(data.length === limit);
            setFriendsPage(page);
        } catch (err) {
            console.error('Error fetching friends:', err);
            showToast("Không thể tải danh sách bạn bè", "error");
        } finally {
            setFriendsLoading(false);
        }
    };

    const checkSavedStatus = async () => {
        const savedMap = await checkSavedStatusAPI(posts);
        setSavedPosts(savedMap);
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
                await unsavePostAPI(postId);
                showToast("Đã bỏ lưu bài viết", "success");
            } else {
                await savePostAPI(postId);
                showToast("Đã lưu bài viết", "success");
            }
            setActivePostMenu(null);
        } catch (error) {
            console.error("Lỗi khi lưu/bỏ lưu bài viết:", error);
            setSavedPosts(prev => ({ ...prev, [postId]: isCurrentlySaved }));
            showToast("Không thể thực hiện. Vui lòng thử lại!", "error");
        }
    };

    const handleDeletePost = (postId) => {
        showConfirm("Bạn có chắc chắn muốn xóa bài viết này không?", async () => {
            try {
                await deletePostAPI(postId);
                setPosts(posts.filter(p => p._id !== postId));
                setActivePostMenu(null);
                showToast("Đã xóa bài viết thành công", "success");
            } catch (error) {
                console.error("Lỗi khi xóa bài:", error);
                showToast("Không thể xóa bài viết. Vui lòng thử lại!", "error");
            }
        });
    };

    const handleToggleLike = async (postId) => {
        const isCurrentlyLiked = likedPosts[postId];
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p._id === postId) {
                const currentLikes = p.stats?.like_count || 0;
                return { ...p, stats: { ...p.stats, like_count: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1 } };
            }
            return p;
        }));
        try {
            await toggleLikeAPI(postId);
        } catch (error) {
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
            showToast("Không thể thực hiện. Vui lòng thử lại!", "error");
        }
    };

    const handleToggleComments = async (postId) => {
        const isCurrentlyShown = showComments[postId];
        setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyShown }));
        if (!isCurrentlyShown && !postComments[postId]) {
            try {
                const comments = await fetchCommentsAPI(postId);
                setPostComments(prev => ({ ...prev, [postId]: comments }));
            } catch (error) {
                console.error("Lỗi khi tải bình luận:", error);
            }
        }
    };

    const handlePostComment = async (postId) => {
        const text = commentInputs[postId];
        if (!text || text.trim() === "") return;
        try {
            await createCommentAPI(postId, text);
            const comments = await fetchCommentsAPI(postId);
            setPostComments(prev => ({ ...prev, [postId]: comments }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === postId ? { ...p, stats: { ...p.stats, comment_count: (p.stats.comment_count || 0) + 1 } } : p
            ));
            showToast("Đã đăng bình luận", "success");
        } catch (error) {
            console.error("Lỗi đăng bình luận:", error);
            showToast("Không thể đăng bình luận", "error");
        }
    };

    // Modal functions
    const openPostModal = async (post) => {
        try {
            const updatedPost = await fetchPostDetailsAPI(post._id);
            setSelectedPost(updatedPost);
            setIsPostModalOpen(true);
            setModalCommentInput("");
            setCommentPage(1);
            setReplyingTo(null);
            
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === post._id ? updatedPost : p
            ));
            
            try {
                const likeRes = await checkLikeStatusAPI(post._id);
                setModalLiked(likeRes.liked);
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
            const { parents, repliesMap, total } = await fetchCommentsWithPaginationAPI(postId, page, commentLimit);
            setModalComments(parents);
            setAllRepliesData(repliesMap);
            setTotalComments(total);
        } catch(e) { 
            console.error("Lỗi tải bình luận:", e);
            setModalComments([]);
            setTotalComments(0);
        }
    };

    const loadMoreComments = async () => {
        const nextPage = commentPage + 1;
        try {
            const { parents, total } = await fetchCommentsWithPaginationAPI(selectedPost._id, nextPage, commentLimit);
            setModalComments(prev => [...prev, ...parents]);
            setCommentPage(nextPage);
            setTotalComments(total);
        } catch(e) {
            console.error("Lỗi tải thêm bình luận:", e);
        }
    };

    const handleModalComment = async (parentId = null) => {
        const content = parentId ? replyInput : modalCommentInput;
        if (!content.trim() || !selectedPost) return;
        
        try {
            await createCommentAPI(selectedPost._id, content, parentId);
            await fetchModalComments(selectedPost._id, 1);
            setModalCommentInput("");
            setReplyInput("");
            setReplyingTo(null);
            setCommentPage(1);
            
            setSelectedPost(prev => ({
                ...prev,
                stats: { ...prev.stats, comment_count: (prev.stats?.comment_count || 0) + 1 }
            }));
            
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === selectedPost._id 
                    ? { ...p, stats: { ...p.stats, comment_count: (p.stats?.comment_count || 0) + 1 } }
                    : p
            ));
            
            showToast("Đã đăng bình luận", "success");
        } catch(err) {
            console.error(err);
            showToast("Không thể đăng bình luận", "error");
        }
    };

    const handleEditModalComment = (comment) => {
        setEditingCommentId(comment._id);
        setEditCommentContent(comment.content);
        setActiveCommentMenu(null);
    };

    const handleSaveModalComment = async (postId, commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            await updateCommentAPI(commentId, editCommentContent);
            await fetchModalComments(postId, 1);
            setCommentPage(1);
            setEditingCommentId(null);
            setEditCommentContent("");
            showToast("Đã sửa bình luận thành công", "success");
        } catch (error) {
            console.error("Lỗi khi sửa bình luận:", error);
            showToast("Không thể sửa bình luận. Vui lòng thử lại!", "error");
        }
    };

    const handleDeleteModalComment = (postId, commentId) => {
        showConfirm("Bạn có chắc chắn muốn xóa bình luận này không?", async () => {
            try {
                await deleteCommentAPI(commentId);
                await fetchModalComments(postId, 1);
                setCommentPage(1);
                setSelectedPost(prev => ({
                    ...prev,
                    stats: { ...prev.stats, comment_count: Math.max(0, (prev.stats?.comment_count || 1) - 1) }
                }));
                setPosts(prevPosts => prevPosts.map(p =>
                    p._id === postId
                        ? { ...p, stats: { ...p.stats, comment_count: Math.max(0, (p.stats?.comment_count || 1) - 1) } }
                        : p
                ));
                setActiveCommentMenu(null);
                showToast("Đã xóa bình luận thành công", "success");
            } catch (error) {
                console.error("Lỗi khi xóa bình luận:", error);
                showToast("Không thể xóa bình luận!", "error");
            }
        });
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const getRepliesForComment = (commentId) => {
        return allRepliesData[commentId] || [];
    };

    const handleOpenShare = (post) => {
        setSharePost(post);
        setShowShareModal(true);
    };

    const handleOpenReport = (post) => {
        setSelectedReportPost(post);
        setShowReportModal(true);
        setActivePostMenu(null);
    };

    const handleReportSuccess = () => {
        showToast("Đã gửi báo cáo thành công. Cảm ơn bạn đã đóng góp!", "success");
    };

    // Avatar & Cover handlers
    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Vui lòng chọn file ảnh', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Kích thước file không được vượt quá 5MB', 'error');
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarUrlInput('');
        setAvatarUploadMethod('file');
    };

    const handleAvatarUrlChange = (e) => {
        const url = e.target.value;
        setAvatarPreview(url);
        setAvatarFile(null);
        setAvatarUrlInput(url);
        setAvatarUploadMethod('url');
    };

    const handleUpdateAvatar = async () => {
        setUploadingAvatar(true);
        
        try {
            let finalAvatarUrl = null;
            
            if (avatarUploadMethod === 'file' && avatarFile) {
                finalAvatarUrl = await uploadImageToR2(avatarFile);
                if (!finalAvatarUrl) {
                    showToast("Không thể upload ảnh. Vui lòng thử lại!", "error");
                    setUploadingAvatar(false);
                    return;
                }
            } else if (avatarUploadMethod === 'url' && avatarUrlInput) {
                finalAvatarUrl = avatarUrlInput;
            } else {
                showToast("Vui lòng chọn ảnh hoặc nhập URL", "error");
                setUploadingAvatar(false);
                return;
            }
            
            await updateUserAPI(currentUser._id, { avatar_url: finalAvatarUrl });
            
            setUser(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
            const updatedUser = { ...currentUser, avatar_url: finalAvatarUrl };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            showToast("Cập nhật ảnh đại diện thành công!", "success");
            setIsAvatarModalOpen(false);
            resetAvatarState();
        } catch (error) {
            console.error("Lỗi khi cập nhật avatar:", error);
            showToast("Không thể cập nhật ảnh đại diện. Vui lòng thử lại!", "error");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const resetAvatarState = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarUrlInput("");
        setAvatarUploadMethod('file');
    };

    const handleCoverSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Vui lòng chọn file ảnh', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('Kích thước file không được vượt quá 10MB', 'error');
            return;
        }

        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
        setCoverUrlInput('');
        setCoverUploadMethod('file');
    };

    const handleCoverUrlChange = (e) => {
        const url = e.target.value;
        setCoverPreview(url);
        setCoverFile(null);
        setCoverUrlInput(url);
        setCoverUploadMethod('url');
    };

    const handleUpdateCover = async () => {
        setUploadingCover(true);
        
        try {
            let finalCoverUrl = null;
            
            if (coverUploadMethod === 'file' && coverFile) {
                finalCoverUrl = await uploadImageToR2(coverFile);
                if (!finalCoverUrl) {
                    showToast("Không thể upload ảnh. Vui lòng thử lại!", "error");
                    setUploadingCover(false);
                    return;
                }
            } else if (coverUploadMethod === 'url' && coverUrlInput) {
                finalCoverUrl = coverUrlInput;
            } else {
                showToast("Vui lòng chọn ảnh hoặc nhập URL", "error");
                setUploadingCover(false);
                return;
            }
            
            await updateUserAPI(currentUser._id, { cover_url: finalCoverUrl });
            
            setUser(prev => ({ ...prev, cover_url: finalCoverUrl }));
            const updatedUser = { ...currentUser, cover_url: finalCoverUrl };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            showToast("Cập nhật ảnh bìa thành công!", "success");
            setIsCoverModalOpen(false);
            resetCoverState();
        } catch (error) {
            console.error("Lỗi khi cập nhật ảnh bìa:", error);
            showToast("Không thể cập nhật ảnh bìa. Vui lòng thử lại!", "error");
        } finally {
            setUploadingCover(false);
        }
    };

    const resetCoverState = () => {
        setCoverFile(null);
        setCoverPreview(null);
        setCoverUrlInput("");
        setCoverUploadMethod('file');
    };

    // Edit Post handlers
    const handleEditPost = (post) => {
        setEditingPost(post);
        setEditFormData({
            content: post.content || "",
            images: post.images || [],
            tags: post.tags || [],
            location: post.location || "",
            visibility: post.visibility || "public",
            post_type: post.post_type || "text",
            product_category: post.product_category || "general",
            allow_comment: post.allow_comment !== false,
            allow_share: post.allow_share !== false
        });
        setEditImageUrls(post.images || []);
        setIsEditModalOpen(true);
        setActivePostMenu(null);
    };

    const handleEditImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        setUploadingEditImages(true);
        try {
            const urls = await uploadMultipleImagesToR2(files);
            setEditImageUrls(prev => [...prev, ...urls]);
            setEditFormData(prev => ({
                ...prev,
                images: [...prev.images, ...urls]
            }));
        } catch (error) {
            console.error('Lỗi upload ảnh:', error);
            showToast('Không thể upload ảnh. Vui lòng thử lại!', "error");
        } finally {
            setUploadingEditImages(false);
        }
    };

    const removeEditImage = (indexToRemove) => {
        setEditImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setEditFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleEditTagsChange = (e) => {
        const tagsString = e.target.value;
        const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
        setEditFormData(prev => ({ ...prev, tags: tagsArray }));
    };

    const handleSubmitEditPost = async () => {
        if (!editFormData.content.trim() && editFormData.images.length === 0) {
            showToast("Vui lòng nhập nội dung hoặc thêm ảnh", "error");
            return;
        }
        
        setIsSubmittingEdit(true);
        try {
            await updatePostAPI(editingPost._id, editFormData);
            
            setPosts(posts.map(p => 
                p._id === editingPost._id ? { ...p, ...editFormData } : p
            ));
            
            setIsEditModalOpen(false);
            setEditingPost(null);
            setEditFormData({
                content: "",
                images: [],
                tags: [],
                location: "",
                visibility: "public",
                post_type: "text",
                product_category: "general",
                allow_comment: true,
                allow_share: true
            });
            setEditImageUrls([]);
            
            showToast("Cập nhật bài viết thành công!", "success");
        } catch (error) {
            console.error("Lỗi khi cập nhật bài viết:", error);
            showToast("Không thể cập nhật bài viết. Vui lòng thử lại!", "error");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleScroll = (e) => {
        const target = e.target;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            if (!friendsLoading && hasMoreFriends && activeTab === 'friends') {
                loadUserFriends(friendsPage + 1, false);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Component upload modal
    const UploadModal = ({ isOpen, onClose, title, preview, onFileSelect, onUrlChange, urlValue, uploadMethod, setUploadMethod, onSave, isUploading, onReset }) => {
        if (!isOpen) return null;
        
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content upload-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>{title}</h3>
                        <button className="close-btn" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="preview-container">
                            <img src={preview || "https://via.placeholder.com/200"} alt="Preview" />
                        </div>
                        
                        <div className="method-selector">
                            <button
                                type="button"
                                className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                                onClick={() => setUploadMethod('file')}
                            >
                                <FaUpload /> Tải ảnh lên
                            </button>
                            <button
                                type="button"
                                className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                                onClick={() => setUploadMethod('url')}
                            >
                                <FaLink /> Nhập URL
                            </button>
                        </div>

                        {uploadMethod === 'file' && (
                            <div className="file-upload-area">
                                <label className="upload-label">
                                    <FaCamera />
                                    <span>Chọn ảnh từ máy tính</span>
                                    <input type="file" accept="image/*" onChange={onFileSelect} style={{ display: 'none' }} />
                                </label>
                                <p className="hint">Hỗ trợ: JPG, PNG, GIF, WebP (Tối đa 5MB)</p>
                            </div>
                        )}

                        {uploadMethod === 'url' && (
                            <div className="url-input-area">
                                <input
                                    type="text"
                                    placeholder="Nhập URL ảnh..."
                                    value={urlValue}
                                    onChange={onUrlChange}
                                />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button className="btn-save" onClick={onSave} disabled={isUploading}>
                            {isUploading ? <FaSpinner className="spinning" /> : <FaSave />}
                            {isUploading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <Layout userProfile={user}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <FaSpinner className="spinning" size={40} color="#2e7d32" />
                    <p>Đang tải thông tin...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout userProfile={user}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h2 style={{ color: '#dc3545' }}>Lỗi</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Quay lại
                    </button>
                </div>
            </Layout>
        );
    }

    const isOwnProfile = currentUser?._id === userId;

    return (
        <Layout userProfile={user}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Banner và Avatar */}
                <div style={{ position: 'relative', marginBottom: '60px' }}>
                    <div style={{
                        height: '300px',
                        background: user?.cover_url ? `url(${user.cover_url})` : 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '12px 12px 0 0',
                        position: 'relative'
                    }}>
                        {isOwnProfile && (
                            <button 
                                onClick={() => setIsCoverModalOpen(true)}
                                style={{
                                    position: 'absolute',
                                    bottom: '15px',
                                    right: '15px',
                                    background: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '13px'
                                }}
                            >
                                <FaCamera /> Chỉnh sửa ảnh bìa
                            </button>
                        )}
                    </div>

                    <div style={{ position: 'absolute', bottom: '-50px', left: '30px' }}>
                        <div style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            border: '4px solid white',
                            overflow: 'hidden',
                            background: '#e4e6eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FaUser size={60} color="#2e7d32" />
                            )}
                        </div>
                        {isOwnProfile && (
                            <button 
                                onClick={() => setIsAvatarModalOpen(true)}
                                style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    background: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            >
                                <FaCamera size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Thông tin người dùng */}
                <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
                                {user?.full_name || user?.username}
                            </h1>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '8px', color: '#666', fontSize: '14px' }}>
                                <span>📅 Tham gia {formatDate(user?.created_at)}</span>
                                {user?.location && <span>📍 {user.location}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                <span><strong>{user?.followers_count || 0}</strong> người theo dõi</span>
                                <span><strong>{user?.following_count || 0}</strong> đang theo dõi</span>
                                <span><strong>{user?.posts_count || 0}</strong> bài viết</span>
                            </div>
                        </div>
                        
                        {!isOwnProfile && (
                            <button 
                                onClick={handleFollow}
                                disabled={followingLoading}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: isFollowing ? '#e4e6eb' : '#2e7d32',
                                    color: isFollowing ? '#333' : 'white',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                                {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {!isOwnProfile && (
                                <FriendButton 
                                    userId={user?._id} 
                                    currentUserId={currentUser?._id}
                                    onStatusChange={(newStatus) => {
                                        console.log('Friend status changed:', newStatus);
                                        if (newStatus === 'friends') {
                                            setUser(prev => ({ ...prev, friends_count: (prev.friends_count || 0) + 1 }));
                                        } else if (newStatus === 'not_friends') {
                                            setUser(prev => ({ ...prev, friends_count: Math.max(0, (prev.friends_count || 0) - 1) }));
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #ddd', marginTop: '10px' }}>
                    {[
                        { key: 'posts', label: 'Bài viết', icon: FaTh },
                        { key: 'friends', label: 'Bạn bè', icon: FaUsers }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '12px 24px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    color: activeTab === tab.key ? '#2e7d32' : '#65676B',
                                    borderBottom: activeTab === tab.key ? '3px solid #2e7d32' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ padding: '20px 0' }}>
                    {activeTab === 'posts' && (
                        <div>
                            {posts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                                    <FaPhotoVideo size={40} color="#ccc" />
                                    <p style={{ marginTop: '10px', color: '#666' }}>Chưa có bài viết nào</p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post._id} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", position: "relative" }}>
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "#e4e6eb" }}>
                                                    {post.author_avatar ? <img src={post.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaUser size={24} style={{ margin: '8px' }} />}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: "16px", cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate(`/profile/${post.author_id}`)}>
                                                        {post.author_name}
                                                    </h4>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#888" }}>
                                                        <span><FaClock size={10} /> {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                                                        {post.location && <span>📍 {post.location}</span>}
                                                    </div>
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
                                                <div className="popup-menu">
                                                    {(() => {
                                                        const myId = String(currentUser._id || currentUser.id || "");
                                                        const ownerId = String(post.author_id || post.author || post.user_id || "");
                                                        
                                                        if (myId === ownerId) {
                                                            return (
                                                                <>
                                                                    <button onClick={() => handleEditPost(post)}>✏️ Sửa bài viết</button>
                                                                    <button onClick={() => handleDeletePost(post._id)} style={{ color: "#dc3545" }}>🗑️ Xóa bài viết</button>
                                                                </>
                                                            );
                                                        } else {
                                                            return (
                                                                <>
                                                                    <button onClick={() => handleSavePost(post._id)} style={{ color: savedPosts[post._id] ? "#2e7d32" : "#555", fontWeight: savedPosts[post._id] ? "bold" : "normal" }}>
                                                                        {savedPosts[post._id] ? "📌 Đã lưu" : "🔖 Lưu bài viết"}
                                                                    </button>
                                                                    <button onClick={() => showToast("Đã ẩn bài viết này", "info")}>👁️‍🗨️ Ẩn bài viết</button>
                                                                    <button onClick={() => handleOpenReport(post)} style={{ color: "#dc3545" }}>⚠️ Báo cáo vi phạm</button>
                                                                </>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div onClick={() => openPostModal(post)} style={{ marginBottom: '15px', cursor: 'pointer' }}>
                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                                            {post.tags && post.tags.length > 0 && (
                                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    {post.tags.map(tag => <span key={tag} style={{ color: '#2e7d32', fontSize: '12px' }}>#{tag}</span>)}
                                                </div>
                                            )}
                                        </div>

                                        {post.images && post.images.length > 0 && (
                                            <div onClick={() => openPostModal(post)} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(post.images.length, 3)}, 1fr)`, gap: '4px', marginBottom: '15px', cursor: 'pointer' }}>
                                                {post.images.map((img, idx) => (
                                                    <img key={idx} src={img} alt="" style={{ width: '100%', borderRadius: '8px', aspectRatio: '1/1', objectFit: 'cover' }} />
                                                ))}
                                            </div>
                                        )}

                                        {post.post_type === 'share' && post.shared_post && (
                                            <div onClick={() => openPostModal(post.shared_post)} style={{ cursor: 'pointer' }}>
                                                <SharedPostCard 
                                                    sharedPost={post.shared_post}
                                                    onClick={() => openPostModal(post.shared_post)}
                                                />
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
                                            <div onClick={() => handleToggleLike(post._id)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: likedPosts[post._id] ? "#1877F2" : "#555" }}>
                                                👍 Thích
                                            </div>
                                            <div onClick={() => openPostModal(post)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center", color: "#555" }}>
                                                💬 Đánh giá
                                            </div>
                                            <div onClick={() => handleOpenShare(post)} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", flex: 1, justifyContent: "center" }}>
                                                ↗️ Chia sẻ
                                            </div>
                                        </div>    

                                        {showComments[post._id] && (
                                            <div style={{ marginTop: '15px' }}>
                                                {postComments[post._id]?.map(cmt => (
                                                    <div key={cmt._id} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {cmt.author_avatar ? <img src={cmt.author_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <FaUser size={14} />}
                                                        </div>
                                                        <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: '18px', flex: 1 }}>
                                                            <strong style={{ fontSize: '13px' }}>{cmt.author_name}</strong>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{cmt.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Viết bình luận..."
                                                        value={commentInputs[post._id] || ''}
                                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id)}
                                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: 'none', background: '#f0f2f5', outline: 'none' }}
                                                    />
                                                    <button onClick={() => handlePostComment(post._id)} style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer' }}>Gửi</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <div 
                            style={{ 
                                background: 'white', 
                                borderRadius: '12px', 
                                padding: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                maxHeight: '600px',
                                overflowY: 'auto'
                            }}
                            onScroll={handleScroll}
                        >
                            <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaUsers size={20} color="#2e7d32" />
                                Bạn bè ({user?.friends_count || 0})
                            </h3>
                            
                            {friends.length === 0 && !friendsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <FaUsers size={50} color="#ccc" />
                                    <p style={{ marginTop: '15px', color: '#666' }}>
                                        {isOwnProfile 
                                            ? "Bạn chưa có bạn bè nào. Hãy kết bạn với mọi người nhé!"
                                            : `${user?.full_name || user?.username} chưa có bạn bè nào`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {friends.map((friend, index) => (
                                        <div 
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                background: '#f8f9fa',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/profile/${friend.user_id}`)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                        >
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                background: '#e4e6eb',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {friend.avatar_url ? (
                                                    <img 
                                                        src={friend.avatar_url} 
                                                        alt={friend.full_name || friend.username}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <FaUser size={24} color="#2e7d32" />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: '600', 
                                                    fontSize: '14px',
                                                    color: '#333',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {friend.full_name || friend.username}
                                                </div>
                                                {friend.username && friend.full_name && (
                                                    <div style={{ 
                                                        fontSize: '12px', 
                                                        color: '#888',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        @{friend.username}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {friendsLoading && (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <FaSpinner className="spinning" size={24} color="#2e7d32" />
                                    <p style={{ marginTop: '10px', color: '#666' }}>Đang tải...</p>
                                </div>
                            )}
                            
                            {!hasMoreFriends && friends.length > 0 && (
                                <div style={{ textAlign: 'center', padding: '15px', color: '#888', fontSize: '13px' }}>
                                    Đã hiển thị tất cả bạn bè
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <UploadModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                title="Cập nhật ảnh đại diện"
                preview={avatarPreview || user?.avatar_url}
                onFileSelect={handleAvatarSelect}
                onUrlChange={handleAvatarUrlChange}
                urlValue={avatarUrlInput}
                uploadMethod={avatarUploadMethod}
                setUploadMethod={setAvatarUploadMethod}
                onSave={handleUpdateAvatar}
                isUploading={uploadingAvatar}
                onReset={resetAvatarState}
            />

            <UploadModal
                isOpen={isCoverModalOpen}
                onClose={() => setIsCoverModalOpen(false)}
                title="Cập nhật ảnh bìa"
                preview={coverPreview || user?.cover_url}
                onFileSelect={handleCoverSelect}
                onUrlChange={handleCoverUrlChange}
                urlValue={coverUrlInput}
                uploadMethod={coverUploadMethod}
                setUploadMethod={setCoverUploadMethod}
                onSave={handleUpdateCover}
                isUploading={uploadingCover}
                onReset={resetCoverState}
            />

            {/* Edit Post Modal */}
            {isEditModalOpen && editingPost && (
                <div className="edit-post-modal-overlay">
                    <div className="edit-post-modal">
                        <div className="edit-post-modal-header">
                            <h3>Sửa bài viết</h3>
                            <button onClick={() => setIsEditModalOpen(false)}>✕</button>
                        </div>

                        <div className="edit-post-modal-body">
                            <div className="edit-post-user-info">
                                <div className="edit-post-avatar">
                                    {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar"/> : <div>👤</div>}
                                </div>
                                <div>
                                    <div className="edit-post-user-name">{currentUser?.full_name || currentUser?.username}</div>
                                    <select 
                                        value={editFormData.visibility}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, visibility: e.target.value }))}
                                    >
                                        <option value="public">🌍 Công khai</option>
                                        <option value="friends">👥 Bạn bè</option>
                                        <option value="private">🔒 Riêng tư</option>
                                    </select>
                                </div>
                            </div>

                            <textarea
                                placeholder="Bạn đang nghĩ gì?"
                                value={editFormData.content}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                                rows="4"
                            />
                            
                            <input
                                type="text"
                                placeholder="Thêm tag (cách nhau bằng dấu phẩy, VD: cafe, bạn bè)"
                                value={editFormData.tags.join(', ')}
                                onChange={handleEditTagsChange}
                            />
                            
                            <input
                                type="text"
                                placeholder="Thêm địa điểm"
                                value={editFormData.location}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                            
                            <div className="edit-post-selects">
                                <select 
                                    value={editFormData.post_type}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, post_type: e.target.value }))}
                                >
                                    <option value="text">📝 Bài viết thường</option>
                                    <option value="product">🛍️ Giới thiệu sản phẩm</option>
                                    <option value="review">⭐ Đánh giá</option>
                                </select>
                                
                                <select 
                                    value={editFormData.product_category}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, product_category: e.target.value }))}
                                >
                                    <option value="general">🌾 Chung</option>
                                    <option value="agriculture">🌽 Nông sản</option>
                                    <option value="seafood">🦐 Hải sản</option>
                                    <option value="specialty">🍜 Đặc sản</option>
                                </select>
                            </div>
                            
                            <div className="edit-post-image-upload">
                                <label className="upload-image-btn">
                                    <span>📷</span> Thêm ảnh
                                    <input type="file" multiple accept="image/*" onChange={handleEditImageUpload} style={{ display: "none" }} />
                                </label>
                                {uploadingEditImages && <span className="uploading-text">Đang upload...</span>}
                            </div>
                            
                            {editImageUrls.length > 0 && (
                                <div className="edit-post-images-grid">
                                    {editImageUrls.map((url, idx) => (
                                        <div key={idx} className="edit-post-image-container">
                                            <img src={url} alt={`preview_${idx}`} />
                                            <button onClick={() => removeEditImage(idx)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="edit-post-checkboxes">
                                <label>
                                    <input type="checkbox" checked={editFormData.allow_comment} onChange={(e) => setEditFormData(prev => ({ ...prev, allow_comment: e.target.checked }))} />
                                    Cho phép bình luận
                                </label>
                                <label>
                                    <input type="checkbox" checked={editFormData.allow_share} onChange={(e) => setEditFormData(prev => ({ ...prev, allow_share: e.target.checked }))} />
                                    Cho phép chia sẻ
                                </label>
                            </div>
                        </div>

                        <div className="edit-post-modal-footer">
                            <button 
                                onClick={handleSubmitEditPost}
                                disabled={(!editFormData.content.trim() && editImageUrls.length === 0) || isSubmittingEdit}
                                className={(!editFormData.content.trim() && editImageUrls.length === 0) ? "disabled" : "active"}
                            >
                                {isSubmittingEdit ? "Đang cập nhật..." : "Cập nhật"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Detail Modal */}
            {isPostModalOpen && selectedPost && (
                <div className="post-modal-overlay" onClick={() => setIsPostModalOpen(false)}>
                    <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="post-modal-header">
                            <h3>Chi tiết bài viết</h3>
                            <button onClick={() => setIsPostModalOpen(false)}>✕</button>
                        </div>

                        <div className="post-modal-body">
                            {/* Post content - similar structure as before */}
                            <div className="post-modal-author">
                                <div className="post-modal-avatar">
                                    {selectedPost.author_avatar ? <img src={selectedPost.author_avatar} alt="avatar"/> : <span>👤</span>}
                                </div>
                                <div>
                                    <h4>{selectedPost.author_name}</h4>
                                    <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="post-modal-text">
                                {selectedPost.content && <p>{selectedPost.content}</p>}
                                {selectedPost.location && <p>📍 <strong>Vị trí:</strong> {selectedPost.location}</p>}
                                {selectedPost.tags && selectedPost.tags.length > 0 && (
                                    <p>{selectedPost.tags.map(tag => `#${tag}`).join(" ")}</p>
                                )}
                            </div>

                            {selectedPost.images && selectedPost.images.length > 0 && (
                                <div className="post-modal-images">
                                    {selectedPost.images.map((img, idx) => (
                                        <img key={idx} src={img} alt="post" />
                                    ))}
                                </div>
                            )}

                            {selectedPost.post_type === 'share' && selectedPost.shared_post && (
                                <div className="post-modal-shared">
                                    <SharedPostCard 
                                        sharedPost={selectedPost.shared_post}
                                        onClick={() => {
                                            if (selectedPost.shared_post._id) {
                                                openPostModal(selectedPost.shared_post);
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            <div className="post-modal-stats">
                                <div>👍 {selectedPost.stats?.like_count || 0} lượt thích</div>
                                <div>{selectedPost.stats?.comment_count || 0} bình luận</div>
                            </div>

                            <div className="post-modal-actions">
                                <div onClick={async () => {
                                    const newLiked = !modalLiked;
                                    setModalLiked(newLiked);
                                    setSelectedPost(prev => ({
                                        ...prev,
                                        stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? 1 : -1) }
                                    }));
                                    try {
                                        await toggleLikeAPI(selectedPost._id);
                                        setPosts(prevPosts => prevPosts.map(p => 
                                            p._id === selectedPost._id 
                                                ? { ...p, stats: { ...p.stats, like_count: (p.stats?.like_count || 0) + (newLiked ? 1 : -1) } }
                                                : p
                                        ));
                                        setLikedPosts(prev => ({ ...prev, [selectedPost._id]: newLiked }));
                                    } catch(e) {
                                        setModalLiked(!newLiked);
                                        setSelectedPost(prev => ({
                                            ...prev,
                                            stats: { ...prev.stats, like_count: (prev.stats?.like_count || 0) + (newLiked ? -1 : 1) }
                                        }));
                                    }
                                }} className={modalLiked ? "liked" : ""}>👍 Thích</div>
                                <div>💬 Bình luận</div>
                                <div onClick={() => handleOpenShare(selectedPost)}>↗️ Chia sẻ</div>
                            </div>

                            {/* Comments section trong Modal của Home */}
                            <div style={{ marginTop: "15px" }}>
                                <h4 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: "600" }}>Bình luận</h4>
                                
                                {replyingTo && (
                                    <div style={{ 
                                        background: "#f0f2f5", 
                                        padding: "12px", 
                                        borderRadius: "12px", 
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                        borderLeft: "4px solid #2e7d32"
                                    }}>
                                        <span style={{ fontSize: "13px", color: "#555" }}>
                                            Trả lời <strong style={{ color: "#2e7d32" }}>{replyingTo.author_name}</strong>:
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
                                                fontSize: "13px"
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleModalComment(replyingTo._id)}
                                            style={{ border: "none", background: "#2e7d32", color: "white", padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                                        >
                                            Trả lời
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            style={{ border: "none", background: "#e4e6eb", color: "#333", padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {modalComments.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#999", padding: "40px 20px", fontSize: "14px", background: "#fafafa", borderRadius: "16px" }}>
                                        Chưa có bình luận nào.
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                                        {modalComments.map(cmt => {
                                            const isCommentOwner = currentUser && String(currentUser._id || currentUser.id) === String(cmt.author_id);
                                            const replies = getRepliesForComment(cmt._id);
                                            const isExpanded = expandedReplies[cmt._id] || false;
                                            
                                            return (
                                                <div key={cmt._id} style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease" }}>
                                                    {/* BÌNH LUẬN CHA */}
                                                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                        <div style={{ 
                                                            width: "40px", 
                                                            height: "40px", 
                                                            minWidth: "40px",
                                                            background: "linear-gradient(135deg, #2e7d32, #4caf50)", 
                                                            borderRadius: "50%", 
                                                            display: "flex", 
                                                            alignItems: "center", 
                                                            justifyContent: "center", 
                                                            color: "white", 
                                                            fontSize: "16px", 
                                                            fontWeight: "bold", 
                                                            flexShrink: 0,
                                                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                                                        }}>
                                                            {cmt.author_name ? cmt.author_name.charAt(0).toUpperCase() : "U"}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            {editingCommentId === cmt._id ? (
                                                                <div style={{ background: "white", padding: "10px 14px", borderRadius: "18px", border: "1px solid #2e7d32", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                                                    <input
                                                                        type="text"
                                                                        value={editCommentContent}
                                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                                        style={{
                                                                            width: "100%",
                                                                            padding: "8px 12px",
                                                                            borderRadius: "8px",
                                                                            border: "1px solid #ddd",
                                                                            outline: "none",
                                                                            fontSize: "13px"
                                                                        }}
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                handleSaveModalComment(selectedPost._id, cmt._id);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                                                        <button
                                                                            onClick={() => handleSaveModalComment(selectedPost._id, cmt._id)}
                                                                            style={{
                                                                                padding: "4px 12px",
                                                                                background: "#2e7d32",
                                                                                color: "white",
                                                                                border: "none",
                                                                                borderRadius: "20px",
                                                                                cursor: "pointer",
                                                                                fontSize: "11px",
                                                                                fontWeight: "500"
                                                                            }}
                                                                        >
                                                                            Lưu
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingCommentId(null);
                                                                                setEditCommentContent("");
                                                                            }}
                                                                            style={{
                                                                                padding: "4px 12px",
                                                                                background: "#e4e6eb",
                                                                                color: "#333",
                                                                                border: "none",
                                                                                borderRadius: "20px",
                                                                                cursor: "pointer",
                                                                                fontSize: "11px"
                                                                            }}
                                                                        >
                                                                            Hủy
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div style={{ background: "#f0f2f5", padding: "10px 14px", borderRadius: "18px", borderTopLeftRadius: "4px" }}>
                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                            <strong style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a2e" }}>
                                                                                {cmt.author_name}
                                                                            </strong>
                                                                            {isCommentOwner && (
                                                                                <div style={{ position: "relative" }}>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveCommentMenu(activeCommentMenu === cmt._id ? null : cmt._id);
                                                                                        }}
                                                                                        style={{
                                                                                            background: "transparent",
                                                                                            border: "none",
                                                                                            cursor: "pointer",
                                                                                            color: "#65676B",
                                                                                            fontSize: "16px",
                                                                                            padding: "0 6px",
                                                                                            borderRadius: "50%"
                                                                                        }}
                                                                                    >
                                                                                        •••
                                                                                    </button>
                                                                                    {activeCommentMenu === cmt._id && (
                                                                                        <div style={{
                                                                                            position: "absolute",
                                                                                            top: "24px",
                                                                                            right: "0",
                                                                                            background: "white",
                                                                                            border: "1px solid #ddd",
                                                                                            borderRadius: "8px",
                                                                                            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                                                                            width: "120px",
                                                                                            zIndex: 20,
                                                                                            overflow: "hidden"
                                                                                        }}>
                                                                                            <button
                                                                                                onClick={() => handleEditModalComment(cmt)}
                                                                                                style={{
                                                                                                    padding: "10px 12px",
                                                                                                    border: "none",
                                                                                                    background: "white",
                                                                                                    textAlign: "left",
                                                                                                    cursor: "pointer",
                                                                                                    fontSize: "13px",
                                                                                                    width: "100%",
                                                                                                    borderBottom: "1px solid #eee",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    gap: "8px"
                                                                                                }}
                                                                                            >
                                                                                                ✏️ Sửa
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDeleteModalComment(selectedPost._id, cmt._id)}
                                                                                                style={{
                                                                                                    padding: "10px 12px",
                                                                                                    border: "none",
                                                                                                    background: "white",
                                                                                                    textAlign: "left",
                                                                                                    cursor: "pointer",
                                                                                                    fontSize: "13px",
                                                                                                    color: "#dc3545",
                                                                                                    width: "100%",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    gap: "8px"
                                                                                                }}
                                                                                            >
                                                                                                🗑️ Xóa
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontSize: "14px", color: "#2c3e50", wordBreak: "break-word", lineHeight: "1.4" }}>
                                                                            {cmt.content}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: "flex", gap: "12px", marginTop: "6px", marginLeft: "8px", fontSize: "11px", color: "#65676B" }}>
                                                                        <span>{new Date(cmt.created_at).toLocaleString()}</span>
                                                                        <button 
                                                                            onClick={() => setReplyingTo(cmt)}
                                                                            style={{ border: "none", background: "transparent", color: "#2e7d32", cursor: "pointer", fontSize: "11px", fontWeight: "500", padding: "2px 8px", borderRadius: "12px" }}
                                                                        >
                                                                            Trả lời
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* CÂU TRẢ LỜI */}
                                                    {replies && replies.length > 0 && (
                                                        <div style={{ marginLeft: "52px", marginTop: "12px", paddingLeft: "16px", borderLeft: "2px solid #e0e0e0" }}>
                                                            <button
                                                                onClick={() => toggleReplies(cmt._id)}
                                                                style={{
                                                                    background: "transparent",
                                                                    border: "none",
                                                                    color: "#2e7d32",
                                                                    fontSize: "12px",
                                                                    fontWeight: "500",
                                                                    cursor: "pointer",
                                                                    padding: "4px 8px",
                                                                    borderRadius: "12px",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    marginBottom: "8px"
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.background = "#e8f5e9"}
                                                                onMouseLeave={(e) => e.target.style.background = "transparent"}
                                                            >
                                                                {isExpanded ? '🔽 Ẩn câu trả lời' : `💬 Xem ${replies.length} câu trả lời`}
                                                            </button>
                                                            
                                                            {isExpanded && (
                                                                <div style={{ marginTop: "8px" }}>
                                                                    {replies.map(reply => {
                                                                        const isReplyOwner = currentUser && String(currentUser._id || currentUser.id) === String(reply.author_id);
                                                                        
                                                                        return (
                                                                            <div key={reply._id} style={{ display: "flex", gap: "10px", marginBottom: "14px", alignItems: "flex-start", animation: "fadeIn 0.2s ease" }}>
                                                                                <div style={{ 
                                                                                    width: "32px", 
                                                                                    height: "32px", 
                                                                                    minWidth: "32px",
                                                                                    background: "linear-gradient(135deg, #ff9800, #ffc107)", 
                                                                                    borderRadius: "50%", 
                                                                                    display: "flex", 
                                                                                    alignItems: "center", 
                                                                                    justifyContent: "center", 
                                                                                    fontSize: "12px", 
                                                                                    fontWeight: "600",
                                                                                    flexShrink: 0,
                                                                                    color: "white",
                                                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                                                                }}>
                                                                                    {reply.author_name ? reply.author_name.charAt(0).toUpperCase() : "U"}
                                                                                </div>
                                                                                <div style={{ flex: 1 }}>
                                                                                    {editingCommentId === reply._id ? (
                                                                                        <div style={{ background: "white", padding: "8px 12px", borderRadius: "16px", border: "1px solid #2e7d32" }}>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={editCommentContent}
                                                                                                onChange={(e) => setEditCommentContent(e.target.value)}
                                                                                                style={{
                                                                                                    width: "100%",
                                                                                                    padding: "6px 10px",
                                                                                                    borderRadius: "6px",
                                                                                                    border: "1px solid #ddd",
                                                                                                    outline: "none",
                                                                                                    fontSize: "12px"
                                                                                                }}
                                                                                                autoFocus
                                                                                                onKeyDown={(e) => e.key === "Enter" && handleSaveModalComment(selectedPost._id, reply._id)}
                                                                                            />
                                                                                            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                                                                                                <button onClick={() => handleSaveModalComment(selectedPost._id, reply._id)} style={{ padding: "3px 12px", background: "#2e7d32", color: "white", border: "none", borderRadius: "15px", cursor: "pointer", fontSize: "10px", fontWeight: "500" }}>Lưu</button>
                                                                                                <button onClick={() => { setEditingCommentId(null); setEditCommentContent(""); }} style={{ padding: "3px 12px", background: "#e4e6eb", border: "none", borderRadius: "15px", cursor: "pointer", fontSize: "10px" }}>Hủy</button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div style={{ background: "#f8f9fa", padding: "8px 12px", borderRadius: "16px", borderTopLeftRadius: "4px" }}>
                                                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                                    <strong style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e" }}>
                                                                                                        {reply.author_name}
                                                                                                    </strong>
                                                                                                    {isReplyOwner && (
                                                                                                        <div style={{ position: "relative" }}>
                                                                                                            <button
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation();
                                                                                                                    setActiveCommentMenu(activeCommentMenu === reply._id ? null : reply._id);
                                                                                                                }}
                                                                                                                style={{ 
                                                                                                                    background: "transparent", 
                                                                                                                    border: "none", 
                                                                                                                    cursor: "pointer", 
                                                                                                                    color: "#aaa", 
                                                                                                                    fontSize: "14px",
                                                                                                                    padding: "0 4px"
                                                                                                                }}
                                                                                                            >
                                                                                                                •••
                                                                                                            </button>
                                                                                                            {activeCommentMenu === reply._id && (
                                                                                                                <div style={{
                                                                                                                    position: "absolute",
                                                                                                                    top: "20px",
                                                                                                                    right: "0",
                                                                                                                    background: "white",
                                                                                                                    border: "1px solid #ddd",
                                                                                                                    borderRadius: "8px",
                                                                                                                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                                                                                                    width: "100px",
                                                                                                                    zIndex: 20,
                                                                                                                    overflow: "hidden"
                                                                                                                }}>
                                                                                                                    <button 
                                                                                                                        onClick={() => handleEditModalComment(reply)} 
                                                                                                                        style={{ 
                                                                                                                            padding: "8px 12px", 
                                                                                                                            border: "none", 
                                                                                                                            background: "white", 
                                                                                                                            textAlign: "left", 
                                                                                                                            cursor: "pointer", 
                                                                                                                            fontSize: "11px", 
                                                                                                                            width: "100%",
                                                                                                                            borderBottom: "1px solid #eee",
                                                                                                                            display: "flex",
                                                                                                                            alignItems: "center",
                                                                                                                            gap: "6px"
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        ✏️ Sửa
                                                                                                                    </button>
                                                                                                                    <button 
                                                                                                                        onClick={() => handleDeleteModalComment(selectedPost._id, reply._id)} 
                                                                                                                        style={{ 
                                                                                                                            padding: "8px 12px", 
                                                                                                                            border: "none", 
                                                                                                                            background: "white", 
                                                                                                                            textAlign: "left", 
                                                                                                                            cursor: "pointer", 
                                                                                                                            fontSize: "11px", 
                                                                                                                            color: "#dc3545", 
                                                                                                                            width: "100%",
                                                                                                                            display: "flex",
                                                                                                                            alignItems: "center",
                                                                                                                            gap: "6px"
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        🗑️ Xóa
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                                <span style={{ fontSize: "12px", color: "#2c3e50", wordBreak: "break-word", lineHeight: "1.4" }}>
                                                                                                    {reply.content}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div style={{ marginTop: "4px", marginLeft: "8px", fontSize: "10px", color: "#888", display: "flex", gap: "8px", alignItems: "center" }}>
                                                                                                <span>{new Date(reply.created_at).toLocaleString()}</span>
                                                                                                <button 
                                                                                                    onClick={() => setReplyingTo(reply)}
                                                                                                    style={{ border: "none", background: "transparent", color: "#2e7d32", cursor: "pointer", fontSize: "10px", fontWeight: "500", padding: "1px 6px", borderRadius: "10px" }}
                                                                                                >
                                                                                                    Trả lời
                                                                                                </button>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {modalComments.length < totalComments && totalComments > commentLimit && (
                                            <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "10px" }}>
                                                <button
                                                    onClick={loadMoreComments}
                                                    style={{
                                                        padding: "8px 24px",
                                                        background: "transparent",
                                                        border: "1.5px solid #2e7d32",
                                                        borderRadius: "30px",
                                                        cursor: "pointer",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        color: "#2e7d32",
                                                        transition: "all 0.3s ease"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = "#2e7d32";
                                                        e.target.style.color = "white";
                                                        e.target.style.transform = "translateY(-1px)";
                                                        e.target.style.boxShadow = "0 2px 8px rgba(46, 125, 50, 0.3)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = "transparent";
                                                        e.target.style.color = "#2e7d32";
                                                        e.target.style.transform = "translateY(0)";
                                                        e.target.style.boxShadow = "none";
                                                    }}
                                                >
                                                    Xem thêm {totalComments - modalComments.length} bình luận
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <style>{`
                                @keyframes fadeIn {
                                    from {
                                        opacity: 0;
                                        transform: translateY(-10px);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translateY(0);
                                    }
                                }
                            `}</style>
                        </div>

                        <div className="post-modal-footer">
                            <div className="comment-input-avatar">
                                {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="avatar"/> : "👤"}
                            </div>
                            <input
                                type="text"
                                placeholder={replyingTo ? `Trả lời ${replyingTo.author_name}...` : "Viết bình luận..."}
                                value={modalCommentInput}
                                onChange={(e) => setModalCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && modalCommentInput.trim() && handleModalComment()}
                            />
                            <button onClick={() => handleModalComment()}>Gửi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
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

            {/* Report Modal */}
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

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="confirm-icon">🗑️</div>
                        <h3>Xác nhận xóa</h3>
                        <p>{confirmMessage}</p>
                        <div className="confirm-actions">
                            <button onClick={() => setShowConfirmModal(false)}>Hủy</button>
                            <button onClick={() => { if (confirmAction) confirmAction(); setShowConfirmModal(false); }}>Xóa ngay</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toastConfig.show && (
                <Toast
                    message={toastConfig.message}
                    type={toastConfig.type}
                    onClose={() => setToastConfig({ show: false, message: '', type: 'success' })}
                    duration={3000}
                />
            )}
        </Layout>
    );
};

export default UserProfile;