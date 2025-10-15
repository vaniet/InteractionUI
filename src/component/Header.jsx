import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();

    // 调试信息
    console.log('Header - Current user:', user);
    console.log('Header - User role:', user?.role);

    // 不需要显示Header的页面
    const hideHeaderPages = ['/', '/login', '/register'];
    const shouldHideHeader = hideHeaderPages.includes(location.pathname);

    if (shouldHideHeader) {
        return null;
    }

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            minWidth: '800px'
        }}>
            {/* 左侧 - 首页按钮 */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => navigate('/mainpage')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#1890ff',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(24, 144, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>🏠</span>
                    首页
                </button>
                <button
                    onClick={() => navigate('/showcase')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#692748',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(105, 39, 72, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>🎁</span>
                    我的展示柜
                </button>
            </div>

            {/* 中间 - 管理员功能按钮 */}
            {user && user.role === 'manager' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/createseries')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#722ed1',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(114, 46, 209, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>➕</span>
                        创建盲盒
                    </button>
                    <button
                        onClick={() => navigate('/editseries')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fa8c16',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(250, 140, 22, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>⚙️</span>
                        管理盲盒
                    </button>
                    <button
                        onClick={() => navigate('/manageorders')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#13c2c2',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(19, 194, 194, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>📦</span>
                        订单管理
                    </button>
                </div>
            )}

            {/* 右侧 - 个人信息和订单按钮 */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => navigate('/playershow')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff6b6b',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 107, 107, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>🎉</span>
                    玩家秀
                </button>
                <button
                    onClick={() => navigate('/orders')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffb600',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 182, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>📦</span>
                    我的订单
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#52c41a',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(82, 196, 26, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>👤</span>
                    个人信息
                </button>
            </div>
        </header>
    );
};

export default Header; 