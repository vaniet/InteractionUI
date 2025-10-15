import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreatePlayerShow from './CreatePlayerShow';
import PlayerShowDetail from './PlayerShowDetail';
import './PlayerShow.css';

export default function PlayerShow() {
    const [showcases, setShowcases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 9; // 3列 x 3行
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedShowcaseId, setSelectedShowcaseId] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // 从 URL 初始化当前页
    useEffect(() => {
        const pageParam = searchParams.get('page');
        if (pageParam) {
            const page = parseInt(pageParam, 10);
            if (page > 0) {
                setCurrentPage(page);
            }
        }
    }, [searchParams]);

    // 页码变化时拉取数据
    useEffect(() => {
        fetchShowcases();
    }, [currentPage]);

    const formatTime = (timeString) => {
        const date = new Date(timeString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) {
            return `${minutes}分钟前`;
        } else if (hours < 24) {
            return `${hours}小时前`;
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const fetchShowcases = async () => {
        setLoading(true);
        setError('');
        try {
            const url = `http://localhost:7001/player-shows/list?page=${currentPage}&limit=${pageSize}&orderBy=createdAt&orderDirection=DESC`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 200) {
                const list = Array.isArray(data.data?.list) ? data.data.list : [];
                const reportedTotal = Number(data.data?.total) || list.length;

                // 若后端未正确分页（一次性返回所有数据），则前端按页切片
                const shouldClientPaginate = list.length > pageSize && (reportedTotal === list.length || !Number.isFinite(Number(data.data?.total)));
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const visibleList = shouldClientPaginate ? list.slice(startIndex, endIndex) : list;

                setShowcases(visibleList);
                setTotal(reportedTotal);
            } else {
                setError(data.message || '获取玩家秀失败');
            }
        } catch (err) {
            setError('网络错误，无法获取玩家秀');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (showcaseId) => {
        setSelectedShowcaseId(showcaseId);
        setIsDetailModalOpen(true);
    };

    const handleCreateSuccess = () => {
        // 刷新玩家秀列表
        fetchShowcases();
    };

    // 分页处理：更新页码、同步 URL，并滚动到顶部
    const handlePageChange = (page) => {
        setCurrentPage(page);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', page.toString());
        navigate(`/playershow?${newSearchParams.toString()}`, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="player-show-container">
            <div className="player-show-content">
                <div className="player-show-header">
                    <h1 className="player-show-title">🎉 玩家秀</h1>
                    <div className="player-show-subtitle">
                        分享你的盲盒收获，展示你的收藏成果
                    </div>
                </div>

                {loading && (
                    <div className="player-show-loading">
                        <div className="player-show-spinner"></div>
                        加载中...
                    </div>
                )}

                {error && (
                    <div className="player-show-error">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="player-show-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '24px'
                    }}>
                        {showcases.map(showcase => (
                            <div
                                key={showcase.id}
                                className="player-show-card"
                                onClick={() => handleCardClick(showcase.id)}
                            >
                                {/* 用户信息 */}
                                <div className="player-show-user">
                                    <img
                                        src={`http://localhost:7001/${showcase.user.avatar}`}
                                        alt={showcase.user.username}
                                        className="player-show-avatar"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/48x48/692748/ffffff?text=U';
                                        }}
                                    />
                                    <div className="player-show-user-info">
                                        <div className="player-show-username">
                                            {showcase.user.username}
                                        </div>
                                    </div>
                                </div>

                                {/* 标题 */}
                                <div className="player-show-title-text">
                                    {showcase.title}
                                </div>

                                {/* 图片展示 */}
                                <div className="player-show-image-container">
                                    {showcase.firstImage ? (
                                        <img
                                            src={`http://localhost:7001/${showcase.firstImage}`}
                                            alt={showcase.title}
                                            className="player-show-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="player-show-image-placeholder"
                                        style={{ display: showcase.firstImage ? 'none' : 'flex' }}
                                    >
                                        暂无图片
                                    </div>
                                </div>

                                {/* 创建日期 */}
                                <div style={{
                                    marginTop: '12px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #f0f0f0',
                                    fontSize: '12px',
                                    color: '#999',
                                    textAlign: 'right'
                                }}>
                                    {formatTime(showcase.createdAt)}
                                </div>

                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && showcases.length === 0 && (
                    <div className="player-show-empty">
                        <div className="player-show-empty-icon">🎁</div>
                        <div className="player-show-empty-title">还没有玩家秀</div>
                        <div className="player-show-empty-subtitle">
                            成为第一个分享的玩家吧！
                        </div>
                    </div>
                )}

                {/* 分页信息 */}
                {!loading && !error && total > 0 && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: '32px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        共 {total} 条玩家秀，第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
                    </div>
                )}

                {/* 分页控件 */}
                {!loading && !error && total > pageSize && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '20px',
                        gap: '8px'
                    }}>
                        {/* 上一页 */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                background: currentPage === 1 ? '#f5f5f5' : 'white',
                                color: currentPage === 1 ? '#ccc' : '#333',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== 1) {
                                    e.target.style.borderColor = '#692748';
                                    e.target.style.color = '#692748';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== 1) {
                                    e.target.style.borderColor = '#d9d9d9';
                                    e.target.style.color = '#333';
                                }
                            }}
                        >
                            上一页
                        </button>

                        {/* 页码按钮，最多显示 5 个 */}
                        {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                            const totalPages = Math.ceil(total / pageSize);
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        background: currentPage === pageNum ? '#692748' : 'white',
                                        color: currentPage === pageNum ? 'white' : '#333',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        minWidth: '40px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== pageNum) {
                                            e.target.style.borderColor = '#692748';
                                            e.target.style.color = '#692748';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== pageNum) {
                                            e.target.style.borderColor = '#d9d9d9';
                                            e.target.style.color = '#333';
                                        }
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        {/* 下一页 */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === Math.ceil(total / pageSize)}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                background: currentPage === Math.ceil(total / pageSize) ? '#f5f5f5' : 'white',
                                color: currentPage === Math.ceil(total / pageSize) ? '#ccc' : '#333',
                                cursor: currentPage === Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== Math.ceil(total / pageSize)) {
                                    e.target.style.borderColor = '#692748';
                                    e.target.style.color = '#692748';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== Math.ceil(total / pageSize)) {
                                    e.target.style.borderColor = '#d9d9d9';
                                    e.target.style.color = '#333';
                                }
                            }}
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>

            {/* 悬浮发布按钮 */}
            <div
                className="floating-create-btn"
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                    position: 'fixed',
                    right: '30px',
                    bottom: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #692748, #5a1f3d)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(105, 39, 72, 0.3)',
                    transition: 'all 0.3s ease',
                    zIndex: 999
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 6px 16px rgba(105, 39, 72, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 12px rgba(105, 39, 72, 0.3)';
                }}
            >
                ✏️
            </div>

            {/* 创建玩家秀弹窗 */}
            <CreatePlayerShow
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* 玩家秀详情弹窗 */}
            <PlayerShowDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                showcaseId={selectedShowcaseId}
            />
        </div>
    );
}
