// src/services/groupService.js
import api from '../api/api';

const groupService = {
    // Tạo nhóm
    createGroup: async (groupData) => {
        const response = await api.post('/api/v1/groups/', groupData);
        return response.data;
    },

    // Lấy nhóm của tôi
    getMyGroups: async () => {
        const response = await api.get('/api/v1/groups/my-groups');
        return response.data;
    },

    // Lấy nhóm công khai
    getPublicGroups: async (limit = 20, skip = 0) => {
        const response = await api.get(`/api/v1/groups/public?limit=${limit}&skip=${skip}`);
        return response.data;
    },

    // Lấy chi tiết nhóm
    getGroup: async (groupId) => {
        const response = await api.get(`/api/v1/groups/${groupId}`);
        return response.data;
    },

    // Tham gia nhóm
    joinGroup: async (groupId) => {
        const response = await api.post(`/api/v1/groups/${groupId}/join`);
        return response.data;
    },

    // Rời nhóm
    leaveGroup: async (groupId) => {
        const response = await api.post(`/api/v1/groups/${groupId}/leave`);
        return response.data;
    },

    // Thêm thành viên
    addMember: async (groupId, userId) => {
        const response = await api.post(`/api/v1/groups/${groupId}/members/${userId}`);
        return response.data;
    },

    // Xóa thành viên
    removeMember: async (groupId, userId) => {
        const response = await api.delete(`/api/v1/groups/${groupId}/members/${userId}`);
        return response.data;
    },

    // Duyệt thành viên
    approveMember: async (groupId, userId) => {
        const response = await api.post(`/api/v1/groups/${groupId}/approve/${userId}`);
        return response.data;
    },

    // Cập nhật nhóm
    updateGroup: async (groupId, updateData) => {
        const response = await api.put(`/api/v1/groups/${groupId}`, updateData);
        return response.data;
    },

    // Xóa nhóm
    deleteGroup: async (groupId) => {
        const response = await api.delete(`/api/v1/groups/${groupId}`);
        return response.data;
    },

    // Lấy thành viên nhóm
    getGroupMembers: async (groupId, limit = 20, skip = 0) => {
        const response = await api.get(`/api/v1/groups/${groupId}/members?limit=${limit}&skip=${skip}`);
        return response.data;
    },

    // Lấy bài viết trong nhóm
    getGroupPosts: async (groupId, limit = 10, skip = 0) => {
        const response = await api.get(`/api/v1/groups/${groupId}/posts?limit=${limit}&skip=${skip}`);
        return response.data;
    },

    // Đăng bài trong nhóm
    createGroupPost: async (groupId, postData) => {
        const response = await api.post('/api/v1/posts/', {
            ...postData,
            group_id: groupId,
            is_group_post: true
        });
        return response.data;
    }
};

export default groupService;