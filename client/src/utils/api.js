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
        if (error.response?.status === 401) {
            // token过期或无效，清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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

    // 获取用户统计
    getStats: async () => {
        const response = await api.get('/users/stats');
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
    admin: adminAPI
};

// 也可以直接导出原始对象
export { api as axiosInstance };
export default unifiedApi;
