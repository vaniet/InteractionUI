import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import './editUser.css';

const EditUser = ({ onSuccess, onCancel }) => {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        avatar: '',
        password: ''
    });
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const avatarRef = useRef();

    // 初始化表单数据
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                phone: user.phone || '',
                avatar: user.avatar || '',
                password: ''
            });
            // 重置头像文件状态
            setAvatarFile(null);
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setFormData(prev => ({ ...prev, avatar: ev.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // 密码验证函数（参考RegisterForm.jsx）
    const passwordValid = (pwd) => {
        if (pwd.length < 8) return false;
        let types = 0;
        if (/[0-9]/.test(pwd)) types++;
        if (/[a-zA-Z]/.test(pwd)) types++;
        if (/[^a-zA-Z0-9]/.test(pwd)) types++;
        return types >= 2;
    };

    const validateForm = () => {
        const newErrors = {};

        // 用户名验证
        if (formData.username && formData.username.length < 2) {
            newErrors.username = '用户名至少需要2个字符';
        }

        // 手机号验证（参考RegisterForm.jsx，只验证非空）
        if (formData.phone && !formData.phone.trim()) {
            newErrors.phone = '手机号不能为空';
        }

        // 密码验证（如果填写了密码，参考RegisterForm.jsx的验证逻辑）
        if (formData.password) {
            if (!passwordValid(formData.password)) {
                newErrors.password = '密码至少8位且包含数字、字母、特殊字符至少两种组合';
            }
            if (formData.password !== confirmPassword) {
                newErrors.confirmPassword = '两次输入的密码不一致';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 清除对应字段的错误
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            // 1. 上传头像（如果有新头像）
            let avatarPath = formData.avatar;
            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);
                formData.append('type', 'avatar');
                formData.append('name', user?.username || 'user');

                const uploadRes = await fetch('http://localhost:7001/upload/', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    throw new Error('头像上传失败');
                }

                const uploadData = await uploadRes.json();
                avatarPath = uploadData.url;
            }

            // 构建请求数据，只包含有值的字段
            const requestData = {};
            Object.keys(formData).forEach(key => {
                if (formData[key] && key !== 'avatar') {
                    requestData[key] = formData[key];
                }
            });

            // 如果有新头像路径，添加到请求数据中
            if (avatarPath && avatarPath !== user?.avatar) {
                requestData.avatar = avatarPath;
            }

            // 用户修改自己的信息
            const url = 'http://localhost:7001/users/update';

            const token = localStorage.getItem('token');
            const response = await axios.put(url, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // 检查响应状态
            if (response.data.code === 200) {
                setMessage(response.data.message || '用户信息更新成功！');

                // 调用成功回调
                if (onSuccess) {
                    onSuccess(response.data.data || response.data);
                }
            } else {
                // 处理业务逻辑错误
                setMessage(response.data.message || '更新用户信息失败，请重试');
            }

            // 清空密码字段
            setFormData(prev => ({
                ...prev,
                password: ''
            }));
            setConfirmPassword('');
            setShowPasswordChange(false);

        } catch (error) {
            console.error('更新用户信息失败:', error);
            // 处理网络错误或服务器错误
            if (error.response?.data?.message) {
                setMessage(error.response.data.message);
            } else if (error.response?.data?.code) {
                // 处理有状态码但非200的响应
                setMessage(error.response.data.message || '更新用户信息失败，请重试');
            } else {
                setMessage('网络错误，请检查网络连接后重试');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    if (loading) {
        return (
            <div className="edit-user-container">
                <div className="loading">保存中...</div>
            </div>
        );
    }

    return (
        <div className="edit-user-container" onClick={handleCancel}>
            <div className="edit-user-card" onClick={(e) => e.stopPropagation()}>
                <h2 className="edit-user-title">
                    修改个人信息
                </h2>

                {message && (
                    <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="edit-user-form">
                    <div className="form-group">
                        <label htmlFor="username">用户名</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="请输入用户名"
                            className={errors.username ? 'error' : ''}
                        />
                        {errors.username && <span className="error-text">{errors.username}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">手机号</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="请输入手机号"
                            className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    <div className="form-group avatar-upload-group">
                        <label htmlFor="avatar">头像</label>
                        <div
                            className="upload-image-box"
                            style={{
                                width: '120px',
                                height: '120px',
                                border: '2px dashed #ddd',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                marginBottom: '8px'
                            }}
                            onClick={() => avatarRef.current?.click()}
                        >
                            {formData.avatar ? (
                                <img
                                    src={(formData.avatar && (formData.avatar.startsWith('http') || formData.avatar.startsWith('data:')))
                                        ? formData.avatar
                                        : `http://localhost:7001/${formData.avatar}`}
                                    alt="头像"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '6px'
                                    }}
                                    onError={(e) => {
                                        // 如果图片加载失败，显示默认头像
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <span
                                style={{
                                    fontSize: '24px',
                                    color: '#999',
                                    display: formData.avatar ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                +
                            </span>
                            <input
                                type="file"
                                ref={avatarRef}
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            点击上传头像，支持 JPG、PNG 格式
                        </div>
                    </div>

                    <div className="form-group">
                        {!showPasswordChange ? (
                            <button
                                type="button"
                                onClick={() => setShowPasswordChange(true)}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #1890ff',
                                    borderRadius: '6px',
                                    background: 'white',
                                    color: '#1890ff',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                更改密码
                            </button>
                        ) : (
                            <div>
                                <label htmlFor="password">新密码</label>
                                {errors.password && <span className="error-text" style={{ display: 'block', marginBottom: '4px' }}>{errors.password}</span>}
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="请输入新密码，至少8位且包含数字、字母、特殊字符至少两种组合"
                                    className={errors.password ? 'error' : ''}
                                />

                                <label htmlFor="confirmPassword" style={{ marginTop: '12px', display: 'block' }}>确认新密码</label>
                                {errors.confirmPassword && <span className="error-text" style={{ display: 'block', marginBottom: '4px' }}>{errors.confirmPassword}</span>}
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword) {
                                            setErrors(prev => ({
                                                ...prev,
                                                confirmPassword: ''
                                            }));
                                        }
                                    }}
                                    placeholder="请再次输入新密码"
                                    className={errors.confirmPassword ? 'error' : ''}
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordChange(false);
                                        setFormData(prev => ({ ...prev, password: '' }));
                                        setConfirmPassword('');
                                        setErrors(prev => ({
                                            ...prev,
                                            password: '',
                                            confirmPassword: ''
                                        }));
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #999',
                                        borderRadius: '4px',
                                        background: 'white',
                                        color: '#999',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        marginTop: '8px',
                                        marginLeft: '12px'
                                    }}
                                >
                                    取消修改密码
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;
