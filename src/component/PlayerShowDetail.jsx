import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './PlayerShowDetail.css';

const PlayerShowDetail = ({ isOpen, onClose, showcaseId }) => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showcase, setShowcase] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [deletingShowcase, setDeletingShowcase] = useState(false);

    useEffect(() => {
        if (isOpen && showcaseId) {
            fetchShowcaseDetail();
            fetchComments();
        }
    }, [isOpen, showcaseId]);

    const fetchShowcaseDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:7001/player-shows/${showcaseId}`);
            const data = await res.json();

            if (data.code === 200) {
                setShowcase(data.data);
            } else {
                setError(data.message || '获取玩家秀详情失败');
            }
        } catch (err) {
            setError('网络错误，无法获取玩家秀详情');
        } finally {
            setLoading(false);
        }
    };

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

    // 获取评论列表
    const fetchComments = async () => {
        setCommentLoading(true);
        setCommentError('');
        try {
            const params = new URLSearchParams({
                page: 1,
                limit: 20,
                orderBy: 'createdAt',
                orderDirection: 'ASC'
            });
            const res = await fetch(`http://localhost:7001/comments/player-show/${showcaseId}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (data.code === 200) {
                setComments(data.data.list || []);
            } else {
                setCommentError(data.message || '获取评论失败');
            }
        } catch (err) {
            setCommentError('网络错误，无法获取评论');
        } finally {
            setCommentLoading(false);
        }
    };

    // 创建评论
    const handleCreateComment = async (e) => {
        e.preventDefault();
        if (!user) {
            setCommentError('请先登录');
            return;
        }
        if (!newComment.trim()) {
            setCommentError('请输入评论内容');
            return;
        }

        setSubmittingComment(true);
        setCommentError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:7001/comments/player-show/${showcaseId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newComment.trim()
                })
            });
            const data = await res.json();

            if (data.code === 200) {
                setNewComment('');
                fetchComments(); // 刷新评论列表
            } else {
                setCommentError(data.message || '评论创建失败');
            }
        } catch (err) {
            setCommentError('网络错误，无法创建评论');
        } finally {
            setSubmittingComment(false);
        }
    };

    // 删除评论
    const handleDeleteComment = async (commentId) => {
        if (!user) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:7001/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.code === 200) {
                fetchComments(); // 刷新评论列表
            } else {
                setCommentError(data.message || '删除评论失败');
            }
        } catch (err) {
            setCommentError('网络错误，无法删除评论');
        }
    };

    // 删除玩家秀
    const handleDeleteShowcase = async () => {
        if (!user || !showcase) return;

        if (!window.confirm('确定要删除这个玩家秀吗？删除后无法恢复。')) {
            return;
        }

        setDeletingShowcase(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:7001/player-shows/${showcaseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.code === 200) {
                // 删除成功，关闭弹窗并刷新列表
                onClose();
                // 可以在这里添加一个回调函数来刷新父组件的列表
                if (window.location.pathname === '/playershow') {
                    window.location.reload();
                }
            } else {
                setError(data.message || '删除玩家秀失败');
            }
        } catch (err) {
            setError('网络错误，无法删除玩家秀');
        } finally {
            setDeletingShowcase(false);
        }
    };



    if (!isOpen) return null;

    return (
        <>
            {/* 遮罩层 */}
            <div
                className="modal-overlay"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    paddingTop: '80px'
                }}
            >
                {/* 弹窗内容 */}
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: 'calc(90vh - 80px)',
                        overflow: 'auto',
                        position: 'relative'
                    }}
                >
                    {/* 关闭按钮 */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            zIndex: 1001,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                        }}
                    >
                        ×
                    </button>

                    {loading && (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            color: '#666'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #e8e8e8',
                                borderTop: '4px solid #692748',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }}></div>
                            加载中...
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#ff4d4f',
                            fontSize: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && showcase && (
                        <div>
                            {/* 用户信息 */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '24px 24px 16px 24px',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <img
                                    src={`http://localhost:7001/${showcase.user.avatar}`}
                                    alt={showcase.user.username}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        marginRight: '12px'
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/48x48/692748/ffffff?text=U';
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#333' }}>
                                        {showcase.user.username}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#999', marginTop: '2px' }}>
                                        {formatTime(showcase.createdAt)}
                                    </div>
                                </div>
                            </div>

                            {/* 系列信息 */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px 24px',
                                background: '#f8f9fa',
                                margin: '0 24px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#666'
                            }}>
                                <img
                                    src={`http://localhost:7001/${showcase.series.cover}`}
                                    alt={showcase.series.name}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        marginRight: '8px',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/24x24/692748/ffffff?text=S';
                                    }}
                                />
                                {showcase.series.name}
                            </div>

                            {/* 标题 */}
                            <div style={{
                                padding: '20px 24px 16px 24px',
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#333',
                                lineHeight: '1.4'
                            }}>
                                {showcase.title}
                            </div>

                            {/* 内容 */}
                            {showcase.content && (
                                <div style={{
                                    padding: '0 24px 20px 24px',
                                    fontSize: '16px',
                                    color: '#666',
                                    lineHeight: '1.6'
                                }}>
                                    {showcase.content}
                                </div>
                            )}

                            {/* 图片展示 */}
                            {showcase.images && showcase.images.length > 0 && (
                                <div style={{ padding: '0 24px 24px 24px', position: 'relative' }}>
                                    {/* 删除链接 - 图片区域右下角 */}
                                    {user && user.userId === showcase.user.userId && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '16px',
                                            right: '16px',
                                            zIndex: 10
                                        }}>
                                            <span
                                                onClick={handleDeleteShowcase}
                                                style={{
                                                    color: deletingShowcase ? '#ccc' : '#666',
                                                    fontSize: '15px',
                                                    cursor: deletingShowcase ? 'not-allowed' : 'pointer',
                                                    textDecoration: 'underline',
                                                    transition: 'all 0.3s ease',
                                                    userSelect: 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!deletingShowcase) {
                                                        e.target.style.color = '#999';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!deletingShowcase) {
                                                        e.target.style.color = '#666';
                                                    }
                                                }}
                                            >
                                                {deletingShowcase ? '删除中...' : '删除'}
                                            </span>
                                        </div>
                                    )}
                                    {/* 固定规格图片网格 */}
                                    <div className="fixed-size-image-grid">
                                        {showcase.images.map((image, index) => (
                                            <div
                                                key={index}
                                                className="fixed-size-image-item"
                                            >
                                                <img
                                                    src={`http://localhost:7001/${image}`}
                                                    alt={`图片 ${index + 1}`}
                                                    className="fixed-size-image"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 评论区域 */}
                            <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
                                    评论 ({comments.length})
                                </div>

                                {/* 评论输入框 */}
                                {user && (
                                    <form onSubmit={handleCreateComment} style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <img
                                                src={`http://localhost:7001/${user.avatar}`}
                                                alt={user.username}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    flexShrink: 0
                                                }}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/40x40/692748/ffffff?text=U';
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <textarea
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="写下你的评论..."
                                                    style={{
                                                        width: '100%',
                                                        minHeight: '80px',
                                                        padding: '12px',
                                                        border: '1px solid #e8e8e8',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        resize: 'vertical',
                                                        outline: 'none',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor = '#692748';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor = '#e8e8e8';
                                                    }}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                                        {newComment.length}/200
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={submittingComment || !newComment.trim()}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: submittingComment || !newComment.trim() ? '#ccc' : '#692748',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            cursor: submittingComment || !newComment.trim() ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {submittingComment ? '发送中...' : '发送评论'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {commentError && (
                                            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
                                                {commentError}
                                            </div>
                                        )}
                                    </form>
                                )}

                                {/* 评论列表 */}
                                {commentLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                        加载评论中...
                                    </div>
                                ) : comments.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {comments.map(comment => (
                                            <div key={comment.id} style={{
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '16px',
                                                background: '#f8f9fa',
                                                borderRadius: '8px'
                                            }}>
                                                <img
                                                    src={`http://localhost:7001/${comment.user.avatar}`}
                                                    alt={comment.user.username}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        flexShrink: 0
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/40x40/692748/ffffff?text=U';
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                                                            {comment.user.username}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#999' }}>
                                                            {formatTime(comment.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                                                        {comment.content}
                                                    </div>
                                                    {user && user.userId === comment.user.userId && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            style={{
                                                                marginTop: '8px',
                                                                padding: '4px 8px',
                                                                background: 'none',
                                                                border: '1px solid #ff4d4f',
                                                                color: '#ff4d4f',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            删除
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        还没有评论，快来发表第一条评论吧！
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default PlayerShowDetail; 