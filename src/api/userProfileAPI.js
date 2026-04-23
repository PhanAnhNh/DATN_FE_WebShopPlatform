import api from '../api/api';

// User API
export const fetchUserProfileAPI = async (userId) => {
    const response = await api.get(`/api/v1/users/${userId}`);
    return response.data;
};

export const updateUserAPI = async (userId, data) => {
    const response = await api.put(`/api/v1/users/${userId}`, data);
    return response.data;
};

// Posts API
export const fetchUserPostsAPI = async (userId) => {
    const response = await api.get(`/api/v1/posts/user/${userId}`);
    return response.data;
};

export const fetchPostDetailsAPI = async (postId) => {
    const response = await api.get(`/api/v1/posts/${postId}`);
    return response.data;
};

export const updatePostAPI = async (postId, data) => {
    const response = await api.put(`/api/v1/posts/${postId}`, data);
    return response.data;
};

export const deletePostAPI = async (postId) => {
    const response = await api.delete(`/api/v1/posts/${postId}`);
    return response.data;
};

// Follow API
export const checkFollowStatusAPI = async (userId) => {
    const response = await api.get(`/api/v1/follows/check/${userId}`);
    return response.data.isFollowing;
};

export const followUserAPI = async (userId) => {
    const response = await api.post(`/api/v1/follow/${userId}`);
    return response.data;
};

export const unfollowUserAPI = async (userId) => {
    const response = await api.delete(`/api/v1/follow/${userId}`);
    return response.data;
};

// Friends API
export const fetchUserFriendsAPI = async (page, limit) => {
    const skip = (page - 1) * limit;
    const response = await api.get(`/api/v1/friends/list?limit=${limit}&skip=${skip}`);
    return response.data;
};

// Likes API
export const toggleLikeAPI = async (postId) => {
    const response = await api.post(`/api/v1/likes/${postId}`);
    return response.data;
};

export const checkLikeStatusAPI = async (postId) => {
    const response = await api.get(`/api/v1/likes/check/${postId}`);
    return { id: postId, isLiked: response.data.liked };
};

// Saves API
export const savePostAPI = async (postId) => {
    const response = await api.post('/api/v1/saves/', { post_id: postId });
    return response.data;
};

export const unsavePostAPI = async (postId) => {
    const response = await api.delete(`/api/v1/saves/${postId}`);
    return response.data;
};

export const checkSavedStatusAPI = async (posts) => {
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
    return savedMap;
};

// Comments API
export const fetchCommentsAPI = async (postId) => {
    const response = await api.get(`/api/v1/comments/${postId}`);
    return response.data;
};

export const fetchCommentsWithPaginationAPI = async (postId, page, limit) => {
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
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedComments = parentComments.slice(start, end);
    
    return {
        parents: paginatedComments,
        repliesMap: repliesMap,
        total: parentComments.length
    };
};

export const createCommentAPI = async (postId, content, parentId = null) => {
    const commentData = {
        post_id: postId,
        content: content
    };
    if (parentId) {
        commentData.parent_id = parentId;
    }
    const response = await api.post("/api/v1/comments/", commentData);
    return response.data;
};

export const updateCommentAPI = async (commentId, content) => {
    const response = await api.put(`/api/v1/comments/${commentId}`, { content });
    return response.data;
};

export const deleteCommentAPI = async (commentId) => {
    const response = await api.delete(`/api/v1/comments/${commentId}`);
    return response.data;
};

// Upload API
export const uploadImageToR2 = async (file) => {
    if (!file) return null;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
        const response = await api.post('/api/v1/upload/image', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
            return response.data.image_url;
        }
        return null;
    } catch (error) {
        console.error('Error uploading to R2:', error);
        return null;
    }
};

export const uploadMultipleImagesToR2 = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    
    const response = await api.post('/api/v1/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data.urls;
};