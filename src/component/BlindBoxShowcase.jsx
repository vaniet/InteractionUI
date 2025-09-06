import React, { useState, useEffect } from 'react';
import './BlindBoxShowcase.css';

const BlindBoxShowcase = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchases, setPurchases] = useState([]);
    const [purchaseDetails, setPurchaseDetails] = useState([]);

    useEffect(() => {
        fetchMyPurchases();
    }, []);

    const fetchMyPurchases = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:7001/purchase/my-purchases', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (data.code === 200) {
                setPurchases(data.data.purchaseIds || []);
                await fetchPurchaseDetails(data.data.purchaseIds || []);
            } else {
                setError(data.message || '获取购买记录失败');
            }
        } catch (err) {
            setError('网络错误，无法获取购买记录');
        } finally {
            setLoading(false);
        }
    };

    const fetchPurchaseDetails = async (purchaseIds) => {
        const details = [];
        for (const purchaseId of purchaseIds) {
            try {
                const res = await fetch(`http://localhost:7001/purchase/${purchaseId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await res.json();
                if (data.code === 200) {
                    details.push(data.data);
                }
            } catch (err) {
                console.error(`获取购买详情失败: ${purchaseId}`, err);
            }
        }
        setPurchaseDetails(details);
    };

    const formatTime = (timeString) => {
        const date = new Date(timeString);
        return date.toLocaleDateString();
    };

    return (
        <div className="fullscreen-gradient-bg" style={{
            padding: '20px',
            paddingTop: '80px',
            minHeight: '100vh',
            overflow: 'auto'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                marginBottom: '40px'
            }}>
                <div className="blind-box-showcase-header">
                    <h1 className="blind-box-showcase-title">🎁 我的盲盒展示柜</h1>
                    <div className="blind-box-showcase-subtitle">
                        展示你的收藏成果，回顾每一次惊喜
                    </div>
                </div>

                {loading && (
                    <div className="blind-box-showcase-loading">
                        <div className="blind-box-showcase-spinner"></div>
                        加载中...
                    </div>
                )}

                {error && (
                    <div className="blind-box-showcase-error">
                        {error}
                    </div>
                )}

                {!loading && !error && purchaseDetails.length > 0 && (
                    <>
                        <div className="blind-box-showcase-grid">
                            {purchaseDetails.map((purchase, index) => (
                                <div key={purchase.id} className="blind-box-card">
                                    <div className="blind-box-header">
                                        <div className="blind-box-series-info">
                                            <img
                                                src={`http://localhost:7001/${purchase.series.cover}`}
                                                alt={purchase.series.name}
                                                className="blind-box-series-cover"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/40x40/692748/ffffff?text=S';
                                                }}
                                            />
                                            <div className="blind-box-series-text">
                                                <div className="blind-box-series-name">
                                                    {purchase.series.name}
                                                </div>
                                                <div className="blind-box-style-name">
                                                    {purchase.style.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="blind-box-purchase-time">
                                            {formatTime(purchase.createdAt)}
                                        </div>
                                    </div>

                                    <div className="blind-box-cover-container">
                                        {purchase.style.cover ? (
                                            <img
                                                src={`http://localhost:7001/${purchase.style.cover}`}
                                                alt={purchase.style.name}
                                                className="blind-box-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="blind-box-cover-placeholder"
                                            style={{ display: purchase.style.cover ? 'none' : 'flex' }}
                                        >
                                            暂无封面
                                        </div>
                                    </div>

                                    <div className="blind-box-description">
                                        {purchase.style.description || purchase.style.name}
                                    </div>

                                    {purchase.style.isHidden && (
                                        <div className="blind-box-hidden-badge">
                                            🎭 隐藏款
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="blind-box-showcase-stats">
                            <div className="blind-box-stat-item">
                                <div className="blind-box-stat-number">{purchaseDetails.length}</div>
                                <div className="blind-box-stat-label">总收藏</div>
                            </div>
                            <div className="blind-box-stat-item">
                                <div className="blind-box-stat-number">
                                    {purchaseDetails.filter(p => p.style.isHidden).length}
                                </div>
                                <div className="blind-box-stat-label">隐藏款</div>
                            </div>
                            <div className="blind-box-stat-item">
                                <div className="blind-box-stat-number">
                                    {new Set(purchaseDetails.map(p => p.series.id)).size}
                                </div>
                                <div className="blind-box-stat-label">系列数</div>
                            </div>
                        </div>
                    </>
                )}

                {!loading && !error && purchaseDetails.length === 0 && (
                    <div className="blind-box-showcase-empty">
                        <div className="blind-box-showcase-empty-icon">🎁</div>
                        <div className="blind-box-showcase-empty-title">还没有购买记录</div>
                        <div className="blind-box-showcase-empty-subtitle">
                            快去购买你的第一个盲盒吧！
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlindBoxShowcase; 