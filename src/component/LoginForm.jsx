import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function TopMessage({ message, type, onClose }) {
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 1800);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`top-message top-message-${type}`}>{message}</div>
  );
}

const LoginForm = () => {
  const [fields, setFields] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const navigate = useNavigate();
  const { login } = useUser();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(fields.username, fields.password);
      setMsgType('success');
      setMsg(`登录成功，${fields.username}`);
      setTimeout(() => {
        setMsg('');
        navigate('/mainpage', { replace: true });
      }, 1200);
    } catch (err) {
      setMsgType('error');
      setMsg(`登录失败，${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopMessage message={msg} type={msgType} onClose={() => setMsg('')} />
      <div className="app-content">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', minWidth: '400px',paddingTop: '120px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '32px', color: '#692748', fontSize: '24px', fontWeight: '600' }}>欢迎，请登录</h1>
          <div className="main-container" style={{ maxWidth: '500px', width: '100%' }}>
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  placeholder="请输入用户名"
                  value={fields.username}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="请输入密码"
                  value={fields.password}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className="button" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <span
                  style={{ color: '#1890ff', textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => navigate('/register')}
                >
                  去注册
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
