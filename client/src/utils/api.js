import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 创建axios实例
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                // token过期或无效，清除本地存储
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // 避免在登录页重复跳转
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            } else if (error.response.status === 429) {
                // 频率限制，由 UI 层 toast 处理错误信息，这里只需透传 rejection
                // 或者可以在这里弹一个全局 toast，但这取决于 ToastContext 能否在非组件内调用
                // 目前架构下 let error propagate
            }
        }
        return Promise.reject(error);
    }
);

// ========== 用户相关API ==========

export const authAPI = {
    // 注册
    register: async (username, email, password) => {
        const response = await api.post('/users/register', { username, email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // 登录
    login: async (username, password) => {
        const response = await api.post('/users/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // 登出
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // 获取当前用户信息
    getCurrentUser: async () => {
        const response = await api.get('/users/me');
        return response.data.user;
    },

    // 更新用户信息
    updateProfile: async (bio, avatar) => {
        const response = await api.put('/users/profile', { bio, avatar });
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
    },

    // 上传头像
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // 更新本地用户信息中的头像
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.avatar = response.data.avatar;
        localStorage.setItem('user', JSON.stringify(currentUser));
        return response.data;
    },

    // 获取用户统计
    getStats: async () => {
        const response = await api.get('/users/stats');
        return response.data;
    },

    // 获取徽章
    getBadges: async (userId) => {
        const response = await api.get(`/users/${userId}/badges`);
        return response.data;
    },

    // 获取排行榜
    getLeaderboard: async () => {
        const response = await api.get('/users/leaderboard');
        return response.data;
    },

    // 关注/取消关注
    followUser: async (id) => {
        const response = await api.post(`/users/follow/${id}`);
        return response.data;
    },
    unfollowUser: async (id) => {
        const response = await api.delete(`/users/unfollow/${id}`);
        return response.data;
    },
    getFollowStatus: async (id) => {
        const response = await api.get(`/users/${id}/follow-status`);
        return response.data;
    },
    getUserProfile: async (id) => {
        const response = await api.get(`/users/${id}/profile`);
        return response.data;
    },
    getFollowers: async (id) => {
        const response = await api.get(`/users/${id}/followers`);
        return response.data;
    },
    getFollowing: async (id) => {
        const response = await api.get(`/users/${id}/following`);
        return response.data;
    },
};

// ========== 资料相关API ==========

export const materialsAPI = {
    // 上传资料
    upload: async (formData) => {
        const response = await api.post('/materials/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 获取资料列表
    getList: async (params = {}) => {
        const response = await api.get('/materials', { params });
        return response.data;
    },

    // 获取资料详情
    getById: async (id) => {
        const response = await api.get(`/materials/${id}`);
        return response.data;
    },

    // 下载资料
    download: async (id) => {
        const response = await api.get(`/materials/${id}/download`, {
            responseType: 'blob',
        });
        return response;
    },

    // 删除资料
    delete: async (id) => {
        const response = await api.delete(`/materials/${id}`);
        return response.data;
    },

    // 更新资料
    update: async (id, data) => {
        const response = await api.put(`/materials/${id}`, data);
        return response.data;
    },

    // 获取热门推荐
    getTrending: async () => {
        const response = await api.get('/materials/trending');
        return response.data;
    },
};

// ========== 互动相关API ==========

export const interactionsAPI = {
    // 添加收藏
    addFavorite: async (materialId) => {
        const response = await api.post(`/interactions/favorites/${materialId}`);
        return response.data;
    },

    // 取消收藏
    removeFavorite: async (materialId) => {
        const response = await api.delete(`/interactions/favorites/${materialId}`);
        return response.data;
    },

    // 获取收藏列表
    getFavorites: async () => {
        const response = await api.get('/interactions/favorites');
        return response.data.favorites;
    },

    // 评分
    rate: async (materialId, rating) => {
        const response = await api.post(`/interactions/ratings/${materialId}`, { rating });
        return response.data;
    },

    // 添加评论
    addComment: async (materialId, content) => {
        const response = await api.post(`/interactions/comments/${materialId}`, { content });
        return response.data;
    },

    // 获取评论列表
    getComments: async (materialId) => {
        const response = await api.get(`/interactions/comments/${materialId}`);
        return response.data.comments;
    },

    // 删除评论
    deleteComment: async (commentId) => {
        const response = await api.delete(`/interactions/comments/${commentId}`);
        return response.data;
    },

    // 点赞评论
    likeComment: async (commentId) => {
        const response = await api.post(`/interactions/comments/${commentId}/like`);
        return response.data;
    },

    // 取消点赞评论
    unlikeComment: async (commentId) => {
        const response = await api.delete(`/interactions/comments/${commentId}/like`);
        return response.data;
    },

    // 提交举报
    reportContent: async (data) => {
        const response = await api.post('/interactions/reports', data);
        return response.data;
    },

    // 获取下载历史
    getDownloadHistory: async () => {
        const response = await api.get('/interactions/downloads');
        return response.data.downloads;
    },

    // 获取上传记录
    getUploadHistory: async () => {
        const response = await api.get('/interactions/uploads');
        return response.data.uploads;
    },

    // 获取浏览历史
    getViewHistory: async () => {
        const response = await api.get('/interactions/views');
        return response.data.views;
    },
};

// ========== 管理员API ==========

export const adminAPI = {
    // 获取统计
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // 获取用户列表
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    // 获取资料列表
    getMaterials: async () => {
        const response = await api.get('/admin/materials');
        return response.data;
    },

    // 删除资料
    deleteMaterial: async (id) => {
        const response = await api.delete(`/admin/materials/${id}`);
        return response.data;
    },

    // 举报管理
    getReports: async (status = 'pending') => {
        const response = await api.get(`/admin/reports?status=${status}`);
        return response.data;
    },

    updateReportStatus: async (id, status) => {
        const response = await api.post(`/admin/reports/${id}/status`, { status });
        return response.data;
    },

    deleteReportedContent: async (id) => {
        const response = await api.delete(`/admin/reports/${id}/content`);
        return response.data;
    },

    // 封禁/解封用户
    toggleBan: async (id) => {
        const response = await api.post(`/admin/users/${id}/ban`);
        return response.data;
    },

    // 获取设置
    getSettings: async () => {
        const response = await api.get(`/admin/settings`);
        return response.data;
    },

    // 更新设置
    updateSettings: async (settings) => {
        const response = await api.post(`/admin/settings`, settings);
        return response.data;
    }
};

// 整合导出
// ========== 社区相关API ==========

export const communityAPI = {
    getPosts: async () => {
        const response = await api.get('/community/posts');
        return response.data;
    },
    createPost: async (postData) => {
        const response = await api.post('/community/posts', postData);
        return response.data;
    },
    toggleLikePost: async (postId) => {
        const response = await api.post(`/community/posts/${postId}/like`);
        return response.data;
    },
    getComments: async (postId) => {
        const response = await api.get(`/community/posts/${postId}/comments`);
        return response.data;
    },
    createComment: async (postId, content) => {
        const response = await api.post(`/community/posts/${postId}/comments`, { content });
        return response.data;
    },
    getFeed: async () => {
        const response = await api.get('/community/feed');
        return response.data;
    },
    uploadPostImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.post('/community/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deletePost: async (postId) => {
        const response = await api.delete(`/community/posts/${postId}`);
        return response.data;
    },
    deleteComment: async (commentId) => {
        const response = await api.delete(`/community/comments/${commentId}`);
        return response.data;
    },
};

// ========== 悬赏 & 统计 API ==========

export const bountiesAPI = {
    getList: async () => {
        const response = await api.get('/bounties');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/bounties/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/bounties', data);
        return response.data;
    },
    answer: async (id, data) => {
        // support string (old) or object (new {content, images})
        const payload = typeof data === 'string' ? { content: data } : data;
        const response = await api.post(`/bounties/${id}/answer`, payload);
        return response.data;
    },
    acceptAnswer: async (id, answerId) => {
        const response = await api.post(`/bounties/${id}/accept/${answerId}`);
        return response.data;
    },
    cancel: async (id) => {
        const response = await api.delete(`/bounties/${id}`);
        return response.data;
    },
    getAnswerComments: async (answerId) => {
        const response = await api.get(`/bounties/answers/${answerId}/comments`);
        return response.data;
    },
    addAnswerComment: async (answerId, content) => {
        const response = await api.post(`/bounties/answers/${answerId}/comments`, { content });
        return response.data;
    }
};


const unifiedApi = {
    ...api, // 继承 axios 实例的方法 (get, post, etc.)
    ...authAPI,

    // Materials
    uploadMaterial: materialsAPI.upload,
    getMaterials: materialsAPI.getList, // 映射 getList 到 getMaterials
    getMaterialById: materialsAPI.getById,
    downloadMaterial: materialsAPI.download,
    deleteMaterialUser: materialsAPI.delete, // 避免命名冲突

    // Interactions
    ...interactionsAPI,

    // Admin
    admin: adminAPI,

    // Community
    community: communityAPI
};

// 也可以直接导出原始对象
export { api as axiosInstance };
export default unifiedApi;
