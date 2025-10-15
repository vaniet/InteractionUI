import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '../services/userApi';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 获取当前用户信息
    const getCurrentUser = async () => {
        try {
            setLoading(true);
            const response = await userApi.getCurrentUser();
            console.log('UserContext getCurrentUser response:', response); // 调试信息
            if (response.code === 200) {
                setUser(response.data);
                setError(null);
            } else if (response.code === 401) {
                // 如果是401错误，清除token并跳转到登录页面
                localStorage.removeItem('token');
                setUser(null);
                setError('登录已过期，请重新登录');
                // 延迟跳转，让用户看到错误信息
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setUser(null);
                setError(response.message);
            }
        } catch (err) {
            console.error('UserContext getCurrentUser error:', err); // 调试信息
            setUser(null);
            setError('获取用户信息失败');
        } finally {
            setLoading(false);
        }
    };

    // 用户登录
    const login = async (username, password) => {
        try {
            const response = await userApi.login({ username, password });
            if (response.code === 200) {
                localStorage.setItem('token', response.data.token);
                setUser(response.data.user);
                setError(null);
            } else {
                throw new Error(response.message);
            }
        } catch (err) {
            throw err;
        }
    };

    // 用户登出
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setError(null);
    };

    // 刷新用户信息
    const refreshUser = async () => {
        await getCurrentUser();
    };

    // 组件挂载时获取用户信息
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getCurrentUser();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

// 自定义Hook
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}; 