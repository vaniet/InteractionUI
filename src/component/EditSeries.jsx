import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

const EditSeries = () => {
    const [seriesList, setSeriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');
    const [expandedSeries, setExpandedSeries] = useState(new Set());
    const [stockData, setStockData] = useState({});
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(1);
    const [stockLoading, setStockLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // 新增价格管理相关状态
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [priceData, setPriceData] = useState({});
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceForm, setPriceForm] = useState({ price: '', discountRate: '' });
    const [listedLoadingId, setListedLoadingId] = useState(null);

    const navigate = useNavigate();

    // 获取所有系列详情
    const fetchSeriesList = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:7001/series/allWithDetail');
            const data = await res.json();
            if (data.code === 200) {
                setSeriesList(data.data || []);
            } else {
                setError(data.message || '获取系列失败');
            }
        } catch (err) {
            setError('网络错误，无法获取系列');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeriesList();
    }, []);

    // 切换系列展开状态
    const toggleSeriesExpansion = (seriesId) => {
        const newExpanded = new Set(expandedSeries);
        if (newExpanded.has(seriesId)) {
            newExpanded.delete(seriesId);
        } else {
            newExpanded.add(seriesId);
        }
        setExpandedSeries(newExpanded);
    };


    // 删除系列
    const deleteSeries = async (seriesId) => {
        try {
            const res = await fetch(`http://localhost:7001/series/delete/${seriesId}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                // 更新本地状态
                setSeriesList(prevList => prevList.filter(series => series.id !== seriesId));
                setMsgType('success');
                setMsg('系列删除成功');
            } else {
                throw new Error('删除失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('删除系列失败');
        }
    };

    // 上/下架
    const toggleListed = async (series) => {
        if (!series) return;
        setListedLoadingId(series.id);
        try {
            const res = await fetch(`http://localhost:7001/series/${series.id}/listed`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isListed: !series.isListed })
            });
            const data = await res.json();
            if (data.code === 200) {
                setSeriesList(prev => prev.map(s => s.id === series.id ? { ...s, isListed: !series.isListed } : s));
                setMsgType('success');
                setMsg(!series.isListed ? '系列已上架' : '系列已下架');
            } else {
                throw new Error(data.message || '更新上架状态失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('更新上架状态失败');
        } finally {
            setListedLoadingId(null);
        }
    };

    // 获取库存信息
    const fetchStockInfo = async (seriesId) => {
        try {
            const res = await fetch(`http://localhost:7001/stock/series/${seriesId}`);
            const data = await res.json();
            if (data.code === 200) {
                setStockData(prev => ({
                    ...prev,
                    [seriesId]: data.data || []
                }));
            } else {
                throw new Error(data.message || '获取库存失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('获取库存信息失败');
        }
    };

    // 创建库存
    const createStock = async () => {
        if (!selectedSeries || stockQuantity < 1) return;

        setStockLoading(true);
        try {
            const res = await fetch('http://localhost:7001/stock/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seriesId: selectedSeries.id,
                    quantity: stockQuantity
                })
            });
            const data = await res.json();

            if (data.code === 200) {
                setMsgType('success');
                setMsg('库存创建成功');
                // 刷新库存信息
                await fetchStockInfo(selectedSeries.id);
                setShowStockModal(false);
                setStockQuantity(1);
            } else {
                throw new Error(data.message || '创建库存失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('创建库存失败');
        } finally {
            setStockLoading(false);
        }
    };

    // 显示删除确认弹窗
    const showDeleteConfirmModal = (stockId) => {
        setDeleteTargetId(stockId);
        setShowDeleteConfirm(true);
    };

    // 删除库存
    const deleteStock = async () => {
        if (!deleteTargetId) return;

        try {
            const res = await fetch(`http://localhost:7001/stock/${deleteTargetId}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                setMsgType('success');
                setMsg('库存删除成功');
                // 刷新库存信息
                await fetchStockInfo(selectedSeries.id);
            } else {
                throw new Error('删除失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('删除库存失败');
        } finally {
            setShowDeleteConfirm(false);
            setDeleteTargetId(null);
        }
    };

    // 打开库存管理模态框
    const openStockModal = (series) => {
        setSelectedSeries(series);
        setShowStockModal(true);
        fetchStockInfo(series.id);
    };

    // 获取价格信息
    const fetchPriceInfo = async (seriesId) => {
        try {
            const res = await fetch(`http://localhost:7001/price/${seriesId}`);
            const data = await res.json();
            if (data.code === 200) {
                setPriceData(prev => ({
                    ...prev,
                    [seriesId]: data.data
                }));
                // 设置表单初始值
                setPriceForm({
                    price: data.data.price || '',
                    discountRate: data.data.discountRate || ''
                });
            } else {
                throw new Error(data.message || '获取价格信息失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('获取价格信息失败');
        }
    };

    // 设置价格
    const setPrice = async () => {
        if (!selectedSeries || !priceForm.price || parseFloat(priceForm.price) <= 0) {
            setMsgType('error');
            setMsg('请输入有效的价格');
            return;
        }

        setPriceLoading(true);
        try {
            const res = await fetch('http://localhost:7001/price/set-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seriesId: selectedSeries.id,
                    price: parseFloat(priceForm.price)
                })
            });
            const data = await res.json();

            if (data.code === 200) {
                setMsgType('success');
                setMsg('价格设置成功');
                // 刷新价格信息
                await fetchPriceInfo(selectedSeries.id);
            } else {
                throw new Error(data.message || '设置价格失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('设置价格失败');
        } finally {
            setPriceLoading(false);
        }
    };

    // 设置折扣
    const setDiscount = async () => {
        if (!selectedSeries || !priceForm.discountRate || parseFloat(priceForm.discountRate) <= 0 || parseFloat(priceForm.discountRate) > 1) {
            setMsgType('error');
            setMsg('请输入有效的折扣率（0-1之间）');
            return;
        }

        setPriceLoading(true);
        try {
            const res = await fetch('http://localhost:7001/price/set-discount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seriesId: selectedSeries.id,
                    discountRate: parseFloat(priceForm.discountRate)
                })
            });
            const data = await res.json();

            if (data.code === 200) {
                setMsgType('success');
                setMsg('折扣设置成功');
                // 刷新价格信息
                await fetchPriceInfo(selectedSeries.id);
            } else {
                throw new Error(data.message || '设置折扣失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('设置折扣失败');
        } finally {
            setPriceLoading(false);
        }
    };

    // 打开价格管理模态框
    const openPriceModal = (series) => {
        setSelectedSeries(series);
        setShowPriceModal(true);
        fetchPriceInfo(series.id);
    };

    // 将款式ID数组转换为款式名称
    const getStyleNamesFromIds = (idsString, styles) => {
        try {
            const ids = JSON.parse(idsString);
            if (!Array.isArray(ids) || !styles) return idsString;

            const styleMap = {};
            styles.forEach(style => {
                styleMap[style.id] = {
                    name: style.name,
                    isHidden: style.isHidden
                };
            });

            // 按照ID增序排序，隐藏款排在最后
            const sortedIds = ids.sort((a, b) => {
                const styleA = styleMap[a];
                const styleB = styleMap[b];

                // 如果都是隐藏款或都不是隐藏款，按ID排序
                if (styleA?.isHidden === styleB?.isHidden) {
                    return a - b;
                }

                // 隐藏款排在最后
                if (styleA?.isHidden && !styleB?.isHidden) return 1;
                if (!styleA?.isHidden && styleB?.isHidden) return -1;

                return 0;
            });

            const names = sortedIds.map(id => {
                const style = styleMap[id];
                if (!style) return `未知款式(${id})`;
                return style.isHidden ? `${style.name}(隐藏)` : style.name;
            });

            return names.join(', ');
        } catch (error) {
            return idsString; // 如果解析失败，返回原始字符串
        }
    };

    if (loading) return (
        <div className="main-container">
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">加载中...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="main-container">
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <div className="error-text">{error}</div>
            </div>
        </div>
    );

    return (
        <>
            <TopMessage message={msg} type={msgType} onClose={() => setMsg('')} />
            <div className="fullscreen-gradient-bg" style={{ padding: '20px', paddingTop: '80px', height: 'auto', overflow: 'auto' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto 80px auto', background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>

                    <h1 style={{ textAlign: 'center', marginBottom: '32px', color: '#692748' }}>系列管理</h1>

                    {seriesList.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', fontSize: '16px', padding: '40px' }}>
                            暂无系列数据
                        </div>
                    ) : (
                        <div className="series-management-list">
                            {seriesList.map(series => (
                                <div key={series.id} className="series-management-item">
                                    {/* 系列头部 */}
                                    <div className="series-header-row">
                                        <div className="series-info">
                                            <div className="series-cover-small">
                                                <img src={`http://localhost:7001/${series.cover}`} alt={series.name} />
                                            </div>
                                            <div className="series-details">
                                                <h3 className="series-name">{series.name}</h3>
                                                <span className="series-count">款式数量: {series.styleCount}</span>
                                            </div>
                                        </div>
                                        <div className="series-actions">
                                            <button
                                                className="expand-button"
                                                onClick={() => toggleSeriesExpansion(series.id)}
                                            >
                                                {expandedSeries.has(series.id) ? '收起' : '展开'}
                                            </button>
                                            <button
                                                className="price-button"
                                                onClick={() => openPriceModal(series)}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: '1px solid #1890ff',
                                                    borderRadius: '5px',
                                                    background: 'white',
                                                    color: '#1890ff',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    marginRight: '8px'
                                                }}
                                            >
                                                价格管理
                                            </button>
                                            <button
                                                className="stock-button"
                                                onClick={() => openStockModal(series)}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: '1px solid #52c41a',
                                                    borderRadius: '5px',
                                                    background: 'white',
                                                    color: '#52c41a',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    marginRight: '8px'
                                                }}
                                            >
                                                库存管理
                                            </button>
                                            <button
                                                className="toggle-listed-button"
                                                onClick={() => toggleListed(series)}
                                                disabled={listedLoadingId === series.id}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: `1px solid ${series.isListed ? '#faad14' : '#52c41a'}`,
                                                    borderRadius: '5px',
                                                    background: 'white',
                                                    color: series.isListed ? '#faad14' : '#52c41a',
                                                    cursor: listedLoadingId === series.id ? 'not-allowed' : 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {listedLoadingId === series.id ? '处理中...' : (series.isListed ? '下架' : '上架')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 展开的款式列表 */}
                                    {expandedSeries.has(series.id) && (
                                        <div className="styles-list">
                                            {series.styles && series.styles.length > 0 ? (
                                                <div className="styles-grid">
                                                    {series.styles
                                                        .sort((a, b) => {
                                                            // 隐藏款排在最后
                                                            if (a.isHidden && !b.isHidden) return 1;
                                                            if (!a.isHidden && b.isHidden) return -1;
                                                            return 0;
                                                        })
                                                        .map(style => (
                                                            <div key={style.id} className="style-management-card">
                                                                <div className="style-image-container">
                                                                    <img src={`http://localhost:7001/${style.cover}`} alt={style.name} />
                                                                    {style.isHidden && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '8px',
                                                                            right: '8px',
                                                                            background: 'linear-gradient(135deg, #ff3860, #ff6b9d)',
                                                                            color: 'white',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            boxShadow: '0 2px 4px rgba(255, 56, 96, 0.3)',
                                                                            zIndex: 1
                                                                        }}>
                                                                            隐藏款
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="style-info">
                                                                    <div className="style-name">{style.name}</div>
                                                                    <div className="style-description">{style.description}</div>

                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                                    该系列暂无款式
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 库存管理模态框 */}
            {showStockModal && selectedSeries && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, color: '#692748' }}>库存管理 - {selectedSeries.name}</h2>
                            <button
                                onClick={() => setShowStockModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 当前库存信息 */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ marginBottom: '16px', color: '#333' }}>当前库存</h3>
                            {stockData[selectedSeries.id] && stockData[selectedSeries.id].length > 0 ? (
                                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                    {stockData[selectedSeries.id].map((stock, index) => (
                                        <div key={stock.id} style={{
                                            border: '1px solid #e8e8e8',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginBottom: '12px',
                                            background: stock.isSoldOut ? '#f5f5f5' : '#f6ffed'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: stock.isSoldOut ? '#999' : '#52c41a' }}>
                                                        {stock.isSoldOut ? '已售罄' : '有库存'}
                                                    </span>
                                                    <button
                                                        onClick={() => showDeleteConfirmModal(stock.id)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: '1px solid #ff4d4f',
                                                            borderRadius: '4px',
                                                            background: 'white',
                                                            color: '#ff4d4f',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="删除此库存记录"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#999' }}>
                                                    {new Date(stock.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                <div>盲盒内容: {getStyleNamesFromIds(stock.boxContents, selectedSeries.styles)}</div>
                                                <div>已售商品: {getStyleNamesFromIds(stock.soldItems || '[]', selectedSeries.styles)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                    暂无库存信息
                                </div>
                            )}
                        </div>

                        {/* 添加库存 */}
                        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '24px' }}>
                            <h3 style={{ marginBottom: '16px', color: '#333' }}>添加库存</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ fontSize: '14px', color: '#333' }}>数量:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={stockQuantity}
                                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        width: '100px'
                                    }}
                                />
                                <button
                                    onClick={createStock}
                                    disabled={stockLoading}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        background: stockLoading ? '#ccc' : '#52c41a',
                                        color: 'white',
                                        cursor: stockLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {stockLoading ? '创建中...' : '创建库存'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 价格管理模态框 */}
            {showPriceModal && selectedSeries && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, color: '#692748' }}>价格管理 - {selectedSeries.name}</h2>
                            <button
                                onClick={() => setShowPriceModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 当前价格信息 */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ marginBottom: '16px', color: '#333' }}>当前价格信息</h3>
                            {priceData[selectedSeries.id] ? (
                                <div style={{
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    background: '#f6ffed'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>价格信息</span>
                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                            {new Date(priceData[selectedSeries.id].updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                                        <div>原价: ¥{priceData[selectedSeries.id].price}</div>
                                        <div>折扣率: {(priceData[selectedSeries.id].discountRate * 100).toFixed(0)}%</div>
                                        <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>
                                            实际价格: ¥{priceData[selectedSeries.id].actualPrice}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                    暂无价格信息
                                </div>
                            )}
                        </div>

                        {/* 设置价格 */}
                        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '24px', marginBottom: '24px' }}>
                            <h3 style={{ marginBottom: '16px', color: '#333' }}>设置价格</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <label style={{ fontSize: '14px', color: '#333', minWidth: '60px' }}>原价:</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={priceForm.price}
                                    onChange={(e) => setPriceForm(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="请输入价格"
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        flex: 1
                                    }}
                                />
                                <button
                                    onClick={setPrice}
                                    disabled={priceLoading}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        background: priceLoading ? '#ccc' : '#1890ff',
                                        color: 'white',
                                        cursor: priceLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {priceLoading ? '设置中...' : '设置价格'}
                                </button>
                            </div>
                        </div>

                        {/* 设置折扣 */}
                        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '24px' }}>
                            <h3 style={{ marginBottom: '16px', color: '#333' }}>设置折扣</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ fontSize: '14px', color: '#333', minWidth: '60px' }}>折扣率:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={priceForm.discountRate}
                                    onChange={(e) => setPriceForm(prev => ({ ...prev, discountRate: e.target.value }))}
                                    placeholder="0.0-1.0"
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        flex: 1
                                    }}
                                />
                                <button
                                    onClick={setDiscount}
                                    disabled={priceLoading}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        background: priceLoading ? '#ccc' : '#52c41a',
                                        color: 'white',
                                        cursor: priceLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {priceLoading ? '设置中...' : '设置折扣'}
                                </button>
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                                折扣率范围: 0.0-1.0 (0.8 表示 8 折)
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除确认弹窗 */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: '#fff2f0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                margin: '0 auto 16px',
                                border: '2px solid #ffccc7'
                            }}>
                                <span style={{ fontSize: '32px', color: '#ff4d4f' }}>⚠️</span>
                            </div>
                            <h3 style={{ margin: '0 0 12px', color: '#333', fontSize: '18px' }}>
                                确认删除
                            </h3>
                            <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                                确定要删除这个库存记录吗？<br />
                                此操作不可恢复。
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteTargetId(null);
                                }}
                                style={{
                                    padding: '8px 24px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    background: 'white',
                                    color: '#666',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    minWidth: '80px'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={deleteStock}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#ff4d4f',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    minWidth: '80px'
                                }}
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditSeries;
