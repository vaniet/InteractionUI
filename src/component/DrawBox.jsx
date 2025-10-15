import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUser } from '../contexts/UserContext';
import { userApi } from '../services/userApi';

function TopMessage({ message, type, onClose }) {
    React.useEffect(() => {
        if (message) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;
    return (
        <div className={`top-message top-message-${type}`}>{message}</div>
    );
}

const DrawBox = forwardRef(({ seriesId, onDrawComplete, onCancel, onPaymentConfirm }, ref) => {
    const { user, refreshUser } = useUser();
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawResult, setDrawResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [stockInfo, setStockInfo] = useState(null);
    const [loadingStock, setLoadingStock] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedStockId, setSelectedStockId] = useState(null);
    const [currentStockIndex, setCurrentStockIndex] = useState(0);
    const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
    const [seriesInfo, setSeriesInfo] = useState(null);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        executeDraw
    }));

    // 计算剩余数量
    const calculateRemainingCount = (stock) => {
        try {
            const boxContents = JSON.parse(stock.boxContents || '[]');
            const soldItems = JSON.parse(stock.soldItems || '[]');
            return boxContents.length - soldItems.length;
        } catch (error) {
            return '未知';
        }
    };

    // 根据styleId获取款式信息
    const getStyleInfo = (styleId) => {
        if (!seriesInfo || !seriesInfo.styles) return null;
        return seriesInfo.styles.find(style => style.id === styleId);
    };

    // 获取当前用户信息
    const fetchCurrentUser = async () => {
        try {
            const response = await userApi.getCurrentUser();
            if (response.code === 200) {
                setCurrentUser(response.data);
            } else {
                setMessageType('error');
                setMessage('获取用户信息失败');
            }
        } catch (err) {
            setMessageType('error');
            setMessage('网络错误，无法获取用户信息');
        }
    };

    // 获取系列信息
    const fetchSeriesInfo = async () => {
        try {
            const res = await fetch(`http://localhost:7001/series/${seriesId}`);
            const data = await res.json();
            if (data.code === 200 && data.data) {
                setSeriesInfo(data.data);
            } else {
                setMessageType('error');
                setMessage('获取系列信息失败');
            }
        } catch (err) {
            setMessageType('error');
            setMessage('网络错误，无法获取系列信息');
        }
    };

    // 获取库存信息
    const fetchStockInfo = async () => {
        setLoadingStock(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessageType('error');
                setMessage('请先登录');
                setLoadingStock(false);
                return;
            }

            const res = await fetch(`http://localhost:7001/stock/series/${seriesId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                setMessageType('error');
                setMessage('登录已过期，请重新登录');
                localStorage.removeItem('token');
                return;
            }

            const data = await res.json();
            if (data.code === 200) {
                // 过滤出有库存的盒子（未售罄的）
                const availableStocks = (data.data || []).filter(stock => !stock.isSoldOut);
                setStockInfo(availableStocks);
            } else {
                setMessageType('error');
                setMessage(data.message || '获取库存信息失败');
            }
        } catch (err) {
            setMessageType('error');
            setMessage('网络错误，无法获取库存信息');
        } finally {
            setLoadingStock(false);
        }
    };

    useEffect(() => {
        // 确保用户信息是最新的
        if (user) {
            fetchCurrentUser();
        } else {
            // 如果UserContext中没有用户信息，尝试刷新
            refreshUser();
        }
        fetchSeriesInfo();
        fetchStockInfo();
    }, [seriesId, user]);

    // 选择盒子
    const selectStock = (stockId) => {
        setSelectedStockId(stockId);
        setSelectedBoxIndex(null); // 切换盒子时重置选中的方块
    };

    // 选择盲盒方块
    const selectBox = (boxIndex) => {
        setSelectedBoxIndex(boxIndex);
        // 确保当前库存被选中
        if (stockInfo && stockInfo[currentStockIndex]) {
            setSelectedStockId(stockInfo[currentStockIndex].id);
        }
    };

    // 切换到上一个盒子
    const goToPreviousStock = () => {
        if (stockInfo && stockInfo.length > 0) {
            const newIndex = currentStockIndex > 0 ? currentStockIndex - 1 : stockInfo.length - 1;
            setCurrentStockIndex(newIndex);
            setSelectedStockId(stockInfo[newIndex].id);
            setSelectedBoxIndex(null); // 切换盒子时重置选中的方块
        }
    };

    // 切换到下一个盒子
    const goToNextStock = () => {
        if (stockInfo && stockInfo.length > 0) {
            const newIndex = currentStockIndex < stockInfo.length - 1 ? currentStockIndex + 1 : 0;
            setCurrentStockIndex(newIndex);
            setSelectedStockId(stockInfo[newIndex].id);
            setSelectedBoxIndex(null); // 切换盒子时重置选中的方块
        }
    };

    // 执行抽卡
    const performDraw = async () => {
        if (!currentUser) {
            setMessageType('error');
            setMessage('请先登录');
            return;
        }

        // 检查是否选择了盒子
        if (!selectedStockId) {
            setMessageType('error');
            setMessage('请先选择一个盒子');
            return;
        }

        // 检查是否选择了盲盒方块
        if (selectedBoxIndex === null) {
            setMessageType('error');
            setMessage('请先选择一个盲盒');
            return;
        }

        // 检查是否有可用的库存
        if (!stockInfo || stockInfo.length === 0) {
            setMessageType('error');
            setMessage('该系列暂无可用库存');
            return;
        }

        // 检查选中的盒子是否有库存
        const selectedStock = stockInfo.find(stock => stock.id === selectedStockId);
        if (!selectedStock || calculateRemainingCount(selectedStock) === 0) {
            setMessageType('error');
            setMessage('选中的盒子已售罄');
            return;
        }

        // 如果有确认支付回调，先调用它
        if (onPaymentConfirm) {
            onPaymentConfirm();
            return;
        }

        // 如果没有确认支付回调，直接执行抽卡
        await executeDraw();
    };

    // 执行实际的抽卡逻辑
    const executeDraw = async () => {
        setIsDrawing(true);
        setShowResult(false);
        setDrawResult(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessageType('error');
                setMessage('请先登录');
                setIsDrawing(false);
                return;
            }

            const res = await fetch(`http://localhost:7001/stock/purchase/${selectedStockId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                setMessageType('error');
                setMessage('登录已过期，请重新登录');
                localStorage.removeItem('token');
                setIsDrawing(false);
                return;
            }

            const data = await res.json();

            if (data.code === 200) {
                setDrawResult(data.data);
                setShowResult(true);
                setMessageType('success');
                setMessage('抽卡成功！');

                // 更新库存信息
                await fetchStockInfo();

                // 通知父组件抽卡完成
                if (onDrawComplete) {
                    onDrawComplete(data.data);
                }
            } else {
                setMessageType('error');
                setMessage(data.message || '抽卡失败');
            }
        } catch (err) {
            setMessageType('error');
            setMessage('网络错误，抽卡失败');
        } finally {
            setIsDrawing(false);
        }
    };

    // 关闭结果弹窗
    const closeResult = () => {
        setShowResult(false);
        setDrawResult(null);
    };

    return (
        <>
            <TopMessage
                message={message}
                type={messageType}
                onClose={() => setMessage('')}
            />

            <div className="draw-box-container">
                {/* 用户信息提示 */}
                {currentUser && (
                    <div className="user-info-hint">
                        <span className="user-welcome">选择一盒</span>
                    </div>
                )}

                {/* 库存信息 */}
                {!loadingStock && stockInfo && stockInfo.length > 0 && (
                    <div className="stock-info">
                        <h4 className="stock-title">可用库存盒子</h4>
                        <div className="stock-display-container">
                            {/* 左箭头 */}
                            <button
                                className="stock-nav-button stock-nav-prev"
                                onClick={goToPreviousStock}
                                disabled={stockInfo.length <= 1}
                            >
                                ‹
                            </button>

                            {/* 当前盒子 */}
                            <div className="stock-display">
                                {stockInfo[currentStockIndex] && (
                                    <div
                                        className={`stock-item ${calculateRemainingCount(stockInfo[currentStockIndex]) === 0 ? 'out-of-stock' : ''}`}
                                        onClick={() => calculateRemainingCount(stockInfo[currentStockIndex]) > 0 && selectStock(stockInfo[currentStockIndex].id)}
                                    >
                                        <div className="stock-remaining-count">
                                            剩余: {calculateRemainingCount(stockInfo[currentStockIndex])} 个
                                        </div>
                                        <div className="mystery-boxes-container">
                                            {(() => {
                                                try {
                                                    const boxContents = JSON.parse(stockInfo[currentStockIndex].boxContents || '[]');
                                                    const soldItems = JSON.parse(stockInfo[currentStockIndex].soldItems || '[]');
                                                    const totalBoxes = boxContents.length;
                                                    const remainingBoxes = totalBoxes - soldItems.length;

                                                    return Array.from({ length: totalBoxes }, (_, index) => {
                                                        const isSold = index < soldItems.length;
                                                        const isSelectable = index >= soldItems.length;

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`mystery-box ${isSold ? 'sold' : ''} ${selectedBoxIndex === index && isSelectable ? 'selected' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isSelectable) {
                                                                        selectBox(index);
                                                                    }
                                                                }}
                                                            >
                                                                <div className={isSold ? 'sold-text' : 'question-mark'}>
                                                                    {isSold ? '已售' : '?'}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                } catch (error) {
                                                    return Array.from({ length: calculateRemainingCount(stockInfo[currentStockIndex]) }, (_, index) => (
                                                        <div
                                                            key={index}
                                                            className={`mystery-box ${selectedBoxIndex === index ? 'selected' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                selectBox(index);
                                                            }}
                                                        >
                                                            <div className="question-mark">?</div>
                                                        </div>
                                                    ));
                                                }
                                            })()}
                                        </div>
                                        <div className="stock-box-id">盒子 #{stockInfo[currentStockIndex].id}</div>
                                    </div>
                                )}
                            </div>

                            {/* 右箭头 */}
                            <button
                                className="stock-nav-button stock-nav-next"
                                onClick={goToNextStock}
                                disabled={stockInfo.length <= 1}
                            >
                                ›
                            </button>
                        </div>

                        {/* 盒子计数器 */}
                        <div className="stock-counter">
                            {currentStockIndex + 1} / {stockInfo.length}
                        </div>
                    </div>
                )}

                {/* 无库存提示 */}
                {!loadingStock && (!stockInfo || stockInfo.length === 0) && (
                    <div className="no-stock-info">
                        <div className="no-stock-message">该系列暂无可用库存，请联系管理员添加库存</div>
                    </div>
                )}

                {/* 抽取按钮 */}
                {!loadingStock && stockInfo && stockInfo.length > 0 && (
                    <div className="draw-action-section">
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <button
                                className={`draw-button ${isDrawing ? 'drawing' : ''}`}
                                onClick={performDraw}
                                disabled={isDrawing || !selectedStockId || selectedBoxIndex === null}
                            >
                                {isDrawing ? (
                                    <>
                                        <div className="draw-spinner"></div>
                                        <span>抽卡中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="draw-text">抽取</span>
                                    </>
                                )}
                            </button>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    disabled={isDrawing}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'white',
                                        color: '#666',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#f5f5f5';
                                        e.target.style.borderColor = '#ccc';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'white';
                                        e.target.style.borderColor = '#d9d9d9';
                                    }}
                                >
                                    取消
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 抽卡结果弹窗 */}
                {showResult && drawResult && (
                    <div className="result-modal-overlay" onClick={closeResult}>
                        <div className="result-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="result-header">
                                <h3 className="result-title">🎉 恭喜抽中！</h3>
                                <button className="close-result-btn" onClick={closeResult}>×</button>
                            </div>
                            <div className="result-content">
                                {(() => {
                                    const styleInfo = getStyleInfo(drawResult.styleId);
                                    if (styleInfo) {
                                        return (
                                            <>
                                                <div className="result-style-image">
                                                    <img
                                                        src={`http://localhost:7001/${styleInfo.cover}`}
                                                        alt={styleInfo.name}
                                                        className="style-cover"
                                                    />
                                                </div>
                                                <div className="result-style-name">{styleInfo.name}</div>
                                                {styleInfo.description && (
                                                    <div className="result-style-description">{styleInfo.description}</div>
                                                )}
                                                <div className="result-message">您已成功抽中该款式！</div>
                                            </>
                                        );
                                    } else {
                                        return (
                                            <>
                                                <div className="result-style-id">款式ID: {drawResult.styleId}</div>
                                                <div className="result-message">您已成功抽中该款式！</div>
                                            </>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});

export default DrawBox; 