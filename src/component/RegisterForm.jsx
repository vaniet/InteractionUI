import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const passwordValid = (pwd) => {
  if (pwd.length < 8) return false;
  let types = 0;
  if (/[0-9]/.test(pwd)) types++;
  if (/[a-zA-Z]/.test(pwd)) types++;
  if (/[^a-zA-Z0-9]/.test(pwd)) types++;
  return types >= 2;
};

const RegisterForm = () => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [fields, setFields] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const validate = (name, value, allFields = fields) => {
    switch (name) {
      case 'username':
        if (!value.trim()) return '用户名不能为空';
        return '';
      case 'password':
        if (!value) return '密码不能为空';
        if (!passwordValid(value)) return '密码至少8位且包含数字、字母、特殊字符至少两种组合';
        return '';
      case 'confirmPassword':
        if (!value) return '请再次输入密码';
        if (value !== allFields.password) return '两次输入的密码不一致';
        return '';
      case 'phone':
        if (!value.trim()) return '手机号不能为空';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value, { ...fields, [name]: value }) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    // 校验所有字段
    const newErrors = {};
    Object.keys(fields).forEach((key) => {
      const err = validate(key, fields[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 && Object.values(newErrors).some(Boolean)) return;
    setLoading(true);
    try {
      let avatarPath = 'null';
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('type', 'avatar');
        formData.append('name', fields.username);
        const uploadRes = await fetch('http://localhost:7001/upload/', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('头像上传失败');
        const uploadData = await uploadRes.json();
        avatarPath = uploadData.url;
      }
      const registerRes = await fetch('http://localhost:7001/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fields.username,
          phone: fields.phone,
          password: fields.password,
          avatar: avatarPath,
          role: 'customer'
        })
      });
      const resJson = await registerRes.json();
      if (resJson.code !== 200) {
        throw new Error(resJson.message || '注册失败');
      }
      setSuccess('注册成功！请前往登录');
      setTimeout(() => {
        setSuccess('');
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || '注册失败' }));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarUrl(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="main-container">
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {/* 用户名 */}
        <div className="form-group">
          <label>用户名</label>
          {errors.username && <div className="error-message">{errors.username}</div>}
          <input type="text" name="username" className="input-field" placeholder="请输入用户名" value={fields.username} onChange={handleChange} />
        </div>

        {/* 密码 */}
        <div className="form-group">
          <label>密码</label>
          {errors.password && <div className="error-message">{errors.password}</div>}
          <input type="password" name="password" className="input-field" placeholder="请输入密码" value={fields.password} onChange={handleChange} />
        </div>

        {/* 确认密码 */}
        <div className="form-group">
          <label>确认密码</label>
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          <input type="password" name="confirmPassword" className="input-field" placeholder="请再次输入密码" value={fields.confirmPassword} onChange={handleChange} />
        </div>

        {/* 手机号 */}
        <div className="form-group">
          <label>手机号</label>
          {errors.phone && <div className="error-message">{errors.phone}</div>}
          <input type="tel" name="phone" className="input-field" placeholder="请输入手机号" value={fields.phone} onChange={handleChange} />
        </div>

        {/* 上传头像 */}
        <div className="form-group">
          <label>上传头像</label>
          <div
            className="upload-image-box"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="头像预览" />
            ) : (
              <span className="upload-plus">+</span>
            )}
            <input
              type="file"
              name="avatar"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
        </div>

        {errors.submit && <div className="error-message">{errors.submit}</div>}
        {success && <div style={{ color: 'green', fontSize: 14, marginTop: 8 }}>{success}</div>}

        <button type="submit" className="button" disabled={loading || Object.values(errors).some(Boolean)}>{loading ? '注册中...' : '注册'}</button>
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <span
            style={{ color: '#1890ff', textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}
            onClick={() => navigate('/login')}
          >
            去登录
          </span>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;