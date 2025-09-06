import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DrawBox from './DrawBox';
import './DrawBox.css';
import HorizontalScrollList from './HorizontalScrollList';
import PaymentConfirmModal from './PaymentConfirmModal';

export default function Series() {
    const { id } = useParams();
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [priceData, setPriceData] = useState(null);
    const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
    const [drawResult, setDrawResult] = useState(null);
    const drawBoxRef = useRef();

    useEffect(() => {
        async function fetchSeries() {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`http://localhost:7001/series/${id}`);
                const data = await res.json();
                if (data.code === 200 && data.data) {
                    setSeries(data.data);
                    // 获取价格信息
                    await fetchPriceInfo(id);
                } else {
                    setError(data.message || '获取系列详情失败');
                }
            } catch (err) {
                setError('网络错误，无法获取系列详情');
            } finally {
                setLoading(false);
            }
        }
        fetchSeries();
    }, [id]);

    // 获取价格信息
    const fetchPriceInfo = async (seriesId) => {
        try {
            const res = await fetch(`http://localhost:7001/price/${seriesId}`);
            const data = await res.json();
            if (data.code === 200) {
                setPriceData(data.data);
            }
        } catch (err) {
            console.log('获取价格信息失败:', err);
        }
    };

    // 处理抽卡完成
    const handleDrawComplete = (result) => {
        setDrawResult(result);
        setShowPaymentConfirm(false);
        console.log('抽卡完成:', result);
    };

    // 显示确认支付弹窗
    const showPaymentModal = () => {
        setShowPaymentConfirm(true);
    };

    // 确认支付
    const confirmPayment = () => {
        setShowPaymentConfirm(false);
        // 触发实际的抽卡逻辑
        if (drawBoxRef.current && drawBoxRef.current.executeDraw) {
            drawBoxRef.current.executeDraw();
        }
    };

    // 取消支付
    const cancelPayment = () => {
        setShowPaymentConfirm(false);
    };

    // 价格显示组件
    const PriceDisplay = () => {
        if (!priceData) {
            return <div style={{
                color: '#999',
                fontSize: '14px',
                marginTop: '8px',
                textAlign: 'center',
                padding: '20px'
            }}>暂无价格</div>;
        }

        const hasDiscount = priceData.discountRate < 1;

        return (
            <div style={{
                marginTop: '16px',
                padding: '20px',
                background: 'linear-gradient(135deg, #ffffff)',
                borderRadius: '12px',
                border: '1px solid #e8e8e8',
            }}>
                <h3 style={{
                    margin: '0 0 16px 0',
                    color: '#333',
                    fontSize: '18px',
                    textAlign: 'center',
                    fontWeight: '600'
                }}>价格信息</h3>
                {hasDiscount ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            marginBottom: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{
                                textDecoration: 'line-through',
                                color: '#999',
                                fontSize: '20px',
                                lineHeight: '1'
                            }}>
                                ¥{priceData.price}
                            </span>
                            <span style={{
                                color: 'rgb(195, 40, 42)',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                lineHeight: '1'
                            }}>
                                ¥{priceData.actualPrice}
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg,rgb(235, 63, 66),rgb(224, 95, 93))',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 8px rgba(217, 66, 68, 0.3)',
                                lineHeight: '1'
                            }}>
                                {(priceData.discountRate * 10).toFixed(1)}折
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        color: '#1890ff',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: '1'
                    }}>
                        ¥{priceData.price}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="series-detail-container">
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">加载中...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="series-detail-container">
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <div className="error-text">{error}</div>
            </div>
        </div>
    );

    if (!series) return null;

    const imageUrl = `http://localhost:7001/${series.cover}`;

    return (
        <>
            <div className="fullscreen-gradient-bg" style={{ padding: '20px', paddingTop: '80px', height: 'auto', overflow: 'auto' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto 80px auto', background: 'white', borderRadius: '12px', padding: '32px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    {/* 系列头部信息 */}
                    <div className="series-header">
                        <div className="series-title">{series.name}</div>
                        <div className="series-subtitle">{series.description}</div>
                    </div>

                    {/* 系列封面 */}
                    <div className="series-cover-container">
                        <img src={imageUrl} alt={series.name} className="series-cover-image" />
                    </div>

                    {/* 系列细节 */}
                    {series.detail && (
                        <div className="series-detail-section">
                            <h3 className="section-title">系列详情</h3>
                            <div className="series-detail-text">{series.detail}</div>
                        </div>
                    )}

                    {/* 价格信息 */}
                    <PriceDisplay />

                    {/* 系列款式 */}
                    {series.styles && series.styles.length > 0 && (
                        <div className="series-styles-section">
                            <h3 className="section-title">系列款式</h3>
                            <HorizontalScrollList>
                                {series.styles
                                    .sort((a, b) => {
                                        // 隐藏款排在最后
                                        if (a.isHidden && !b.isHidden) return 1;
                                        if (!a.isHidden && b.isHidden) return -1;
                                        return 0;
                                    })
                                    .map(style => (
                                        <div key={style.id} className={`style-card ${style.isHidden ? 'hidden-style' : ''}`}>
                                            <div className="style-image-container">
                                                <img src={`http://localhost:7001/${style.cover}`} alt={style.name} className="style-image" />
                                            </div>
                                            {style.isHidden && <div className="hidden-badge">隐藏款</div>}
                                            <div className="style-info">
                                                <div className="style-name">{style.name}</div>
                                                <div className="style-description">{style.description}</div>
                                            </div>
                                        </div>
                                    ))}
                            </HorizontalScrollList>
                        </div>
                    )}

                    {/* 抽盒组件 */}
                    <DrawBox
                        ref={drawBoxRef}
                        seriesId={id}
                        onDrawComplete={handleDrawComplete}
                        onPaymentConfirm={showPaymentModal}
                    />

                    {/* 确认支付弹窗 */}
                    <PaymentConfirmModal
                        isVisible={showPaymentConfirm}
                        priceData={priceData}
                        onConfirm={confirmPayment}
                        onCancel={cancelPayment}
                    />
                </div>
            </div>
        </>
    );
} 