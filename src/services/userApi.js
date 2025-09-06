import axios from 'axios';

const API_BASE_URL = 'http://localhost:7001';

// 创建axios实例
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器：自动添加token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('API request interceptor - token:', token); // 调试信息
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API request interceptor - headers:', config.headers); // 调试信息
    }
    return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // token过期或无效，清除本地存储
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const userApi = {
    // 获取当前用户信息
    getCurrentUser: async () => {
        const response = await api.post('/users/currentuser');
        return response.data;
    },

    // 用户登录
    login: async (loginData) => {
        const response = await api.post('/users/login', loginData);
        return response.data;
    },

    // 用户注册
    register: async (userData) => {
        const response = await api.post('/users/register', userData);
        return response.data;
    },
}; 