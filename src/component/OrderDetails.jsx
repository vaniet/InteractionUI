import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './OrderDetails.css';

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

const OrderDetails = () => {
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [orderDetail, setOrderDetail] = useState(null);
    const { user } = useUser();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    // 批量操作相关状态
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [singleShippingOrderId, setSingleShippingOrderId] = useState(null); // 为单个订单填写收货信息
    const [shippingForm, setShippingForm] = useState({
        receiverName: '',
        receiverPhone: '',
        shippingAddress: ''
    });
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingInfoStatus, setShippingInfoStatus] = useState({}); // 存储每个订单的收货信息状态
    const [deliveryLoading, setDeliveryLoading] = useState(false);

    // 显示确认弹窗
    const showConfirm = (action, message) => {
        setConfirmAction(() => action);
        setConfirmMessage(message);
        setShowConfirmModal(true);
    };

    // 确认操作
    const handleConfirm = async () => {
        if (confirmAction && typeof confirmAction === 'function') {
            await confirmAction();
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
    };

    // 取消确认
    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
    };

    // 批量选择相关函数
    const toggleOrderSelection = (orderId) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
    };

    const selectAllOrders = () => {
        // 根据当前状态选择订单
        let targetStatus = 'pending';
        if (selectedStatus === 'shipped') {
            targetStatus = 'shipped';
        }

        const targetOrderIds = filteredOrders
            .filter(order => order.shippingStatus === targetStatus)
            .filter(order => {
                // 在待发货的批量设置收货信息场景，仅选择未填写收货信息的订单
                if (targetStatus === 'pending') {
                    return !shippingInfoStatus[order.id];
                }
                return true;
            })
            .map(order => order.id);
        setSelectedOrders(new Set(targetOrderIds));
    };

    const clearSelection = () => {
        setSelectedOrders(new Set());
    };

    const openShippingModal = () => {
        setSingleShippingOrderId(null);
        setShowShippingModal(true);
    };

    const openSingleShippingModal = (orderId) => {
        setSingleShippingOrderId(orderId);
        setShowShippingModal(true);
    };

    // 打开单个订单的地址编辑，预填当前信息
    const openSingleAddressEdit = (order) => {
        setSingleShippingOrderId(order.id);
        setShippingForm({
            receiverName: order.receiverName || '',
            receiverPhone: order.receiverPhone || '',
            shippingAddress: order.shippingAddress || ''
        });
        setShowShippingModal(true);
    };

    const closeShippingModal = () => {
        setShowShippingModal(false);
        setSingleShippingOrderId(null);
        setShippingForm({
            receiverName: '',
            receiverPhone: '',
            shippingAddress: ''
        });
    };

    const handleShippingFormChange = (field, value) => {
        setShippingForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 设置收货信息（支持单个或批量）
    const batchSetShippingInfo = async () => {
        const targetIds = singleShippingOrderId ? [singleShippingOrderId] : Array.from(selectedOrders);

        if (targetIds.length === 0) {
            setMsgType('error');
            setMsg('请先选择要设置的订单');
            return;
        }

        // 验证目标订单都是待发货状态
        const targetOrders = orders.filter(order => targetIds.includes(order.id));
        const nonPendingOrders = targetOrders.filter(order => order.shippingStatus !== 'pending');

        if (nonPendingOrders.length > 0) {
            setMsgType('error');
            setMsg('只能为待发货状态的订单设置收货信息');
            return;
        }

        if (!shippingForm.receiverName || !shippingForm.receiverPhone || !shippingForm.shippingAddress) {
            setMsgType('error');
            setMsg('请填写完整的收货信息');
            return;
        }

        setShippingLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMsgType('error');
                setMsg('请先登录');
                return;
            }

            const promises = targetIds.map(async (orderId) => {
                try {
                    const res = await fetch(`http://localhost:7001/purchase/shipping-info/${orderId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(shippingForm)
                    });

                    if (res.status === 401) {
                        throw new Error('登录已过期');
                    }

                    const data = await res.json();
                    if (data.code === 200) {
                        return { orderId, success: true };
                    } else {
                        return { orderId, success: false, error: data.message };
                    }
                } catch (err) {
                    return { orderId, success: false, error: err.message };
                }
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                setMsgType('success');
                setMsg(`成功设置 ${successCount} 个订单的收货信息${failCount > 0 ? `，${failCount} 个失败` : ''}`);
                closeShippingModal();
                clearSelection();

                // 更新收货信息状态
                const updatedStatus = { ...shippingInfoStatus };
                targetIds.forEach(orderId => {
                    updatedStatus[orderId] = true;
                });
                setShippingInfoStatus(updatedStatus);
            } else {
                setMsgType('error');
                setMsg('设置收货信息失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('网络错误，设置收货信息失败');
        } finally {
            setShippingLoading(false);
        }
    };

    // 单个确认收货
    const confirmDeliverySingle = async (orderId) => {
        setDeliveryLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMsgType('error');
                setMsg('请先登录');
                return;
            }

            const res = await fetch(`http://localhost:7001/purchase/confirm-delivery/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                setMsgType('error');
                setMsg('登录已过期，请重新登录');
                return;
            }

            const data = await res.json();
            if (data.code === 200) {
                setMsgType('success');
                setMsg('确认收货成功');
                fetchOrders();
            } else {
                setMsgType('error');
                setMsg(data.message || '确认收货失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('网络错误，确认收货失败');
        } finally {
            setDeliveryLoading(false);
        }
    };

    // 批量确认收货
    const batchConfirmDelivery = async () => {
        if (selectedOrders.size === 0) {
            setMsgType('error');
            setMsg('请先选择要确认收货的订单');
            return;
        }

        setDeliveryLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMsgType('error');
                setMsg('请先登录');
                return;
            }

            const promises = Array.from(selectedOrders).map(async (orderId) => {
                try {
                    const res = await fetch(`http://localhost:7001/purchase/confirm-delivery/${orderId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (res.status === 401) {
                        throw new Error('登录已过期');
                    }

                    const data = await res.json();
                    if (data.code === 200) {
                        return { orderId, success: true };
                    } else {
                        return { orderId, success: false, error: data.message };
                    }
                } catch (err) {
                    return { orderId, success: false, error: err.message };
                }
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                setMsgType('success');
                setMsg(`成功确认收货 ${successCount} 个订单${failCount > 0 ? `，${failCount} 个失败` : ''}`);
                clearSelection();
                fetchOrders(); // 刷新订单列表
            } else {
                setMsgType('error');
                setMsg('确认收货失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('网络错误，确认收货失败');
        } finally {
            setDeliveryLoading(false);
        }
    };

    // 检查收货信息完整性
    const checkShippingInfo = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            const res = await fetch(`http://localhost:7001/purchase/shipping-info/check/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                return data.code === 200 && data.data && data.data.isComplete === true;
            }
            return false;
        } catch (err) {
            console.error(`检查订单 ${orderId} 收货信息失败:`, err);
            return false;
        }
    };

    // 批量检查收货信息状态
    const checkAllShippingInfo = async (orderIds) => {
        const statusPromises = orderIds.map(async (orderId) => {
            const isComplete = await checkShippingInfo(orderId);
            return { orderId, isComplete };
        });

        const results = await Promise.all(statusPromises);
        const statusMap = {};
        results.forEach(({ orderId, isComplete }) => {
            statusMap[orderId] = isComplete;
        });
        setShippingInfoStatus(statusMap);
    };

    // 获取订单列表
    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('请先登录');
                setLoading(false);
                return;
            }

            const res = await fetch('http://localhost:7001/purchase/my-purchases', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                setError('登录已过期，请重新登录');
                setLoading(false);
                return;
            }

            const data = await res.json();
            if (data.code === 200) {
                // 获取订单ID列表
                const purchaseIds = data.data.purchaseIds || [];

                // 为每个订单ID获取详细信息
                const orderPromises = purchaseIds.map(async (orderId) => {
                    try {
                        const detailRes = await fetch(`http://localhost:7001/purchase/${orderId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (detailRes.ok) {
                            const detailData = await detailRes.json();
                            if (detailData.code === 200) {
                                return detailData.data;
                            }
                        }
                        return null;
                    } catch (err) {
                        console.error(`获取订单 ${orderId} 详情失败:`, err);
                        return null;
                    }
                });

                const orderDetails = await Promise.all(orderPromises);
                const validOrders = orderDetails.filter(order => order !== null);
                setOrders(validOrders);

                // 检查所有订单的收货信息状态
                if (validOrders.length > 0) {
                    const orderIds = validOrders.map(order => order.id);
                    await checkAllShippingInfo(orderIds);
                }
            } else {
                setError(data.message || '获取订单信息失败');
            }
        } catch (err) {
            setError('网络错误，无法获取订单信息');
        } finally {
            setLoading(false);
        }
    };

    // 获取订单详情
    const fetchOrderDetail = async (orderId) => {
        setDetailLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMsgType('error');
                setMsg('请先登录');
                return;
            }

            const res = await fetch(`http://localhost:7001/purchase/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                setMsgType('error');
                setMsg('登录已过期，请重新登录');
                return;
            }

            const data = await res.json();
            if (data.code === 200) {
                setOrderDetail(data.data);
            } else {
                setMsgType('error');
                setMsg(data.message || '获取订单详情失败');
            }
        } catch (err) {
            setMsgType('error');
            setMsg('网络错误，无法获取订单详情');
        } finally {
            setDetailLoading(false);
        }
    };

    // 打开详情弹窗
    const openDetailModal = async (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
        await fetchOrderDetail(order.id);
    };

    // 关闭详情弹窗
    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
        setOrderDetail(null);
    };

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '未知';
        return new Date(dateString).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 获取状态显示名称
    const getStatusDisplayName = (status) => {
        const statusMap = {
            'pending': '待发货',
            'shipped': '已发货',
            'delivered': '已收货'
        };
        return statusMap[status] || status;
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        const colorMap = {
            'pending': '#ffb600',
            'shipped': '#1890ff',
            'delivered': '#52c41a'
        };
        return colorMap[status] || '#666';
    };

    // 筛选订单
    const filteredOrders = orders.filter(order => {
        if (selectedStatus === 'all') return true;
        return order.shippingStatus === selectedStatus;
    });

    // 当切换到非待发货和已发货状态时，清空选择
    useEffect(() => {
        if (selectedStatus !== 'pending' && selectedStatus !== 'shipped') {
            setSelectedOrders(new Set());
        }
    }, [selectedStatus]);

    // 计算各状态订单数量
    const statusCounts = {
        all: orders.length,
        pending: orders.filter(order => order.shippingStatus === 'pending').length,
        shipped: orders.filter(order => order.shippingStatus === 'shipped').length,
        delivered: orders.filter(order => order.shippingStatus === 'delivered').length
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="order-details-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">加载中...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="order-details-container">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <TopMessage message={msg} type={msgType} onClose={() => setMsg('')} />
            <div className="fullscreen-gradient-bg" style={{ padding: '20px', paddingTop: '80px', height: 'auto', overflow: 'auto' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto 80px auto', background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <h1 style={{ textAlign: 'center', marginBottom: '32px', color: '#692748' }}>我的订单</h1>

                    {/* 状态筛选 */}
                    <div className="status-filter">
                        {[
                            { key: 'all', label: '全部' },
                            { key: 'pending', label: '待发货' },
                            { key: 'shipped', label: '已发货' },
                            { key: 'delivered', label: '已收货' }
                        ].map(status => (
                            <button
                                key={status.key}
                                className={`status-filter-btn ${selectedStatus === status.key ? 'active' : ''}`}
                                onClick={() => setSelectedStatus(status.key)}
                            >
                                {status.label} ({statusCounts[status.key]})
                            </button>
                        ))}
                    </div>

                    {/* 批量操作区域 - 在待发货和已发货状态显示 */}
                    {filteredOrders.length > 0 && (selectedStatus === 'pending' || selectedStatus === 'shipped') && (
                        <div className="batch-actions">
                            <div className="batch-selection">
                                <button
                                    className="batch-btn select-all-btn"
                                    onClick={selectAllOrders}
                                    disabled={selectedOrders.size === filteredOrders.length}
                                >
                                    全选未发货订单
                                </button>
                                <button
                                    className="batch-btn clear-btn"
                                    onClick={clearSelection}
                                    disabled={selectedOrders.size === 0}
                                >
                                    取消选择
                                </button>
                                <span className="selection-count">
                                    已选择 {selectedOrders.size} 个订单
                                </span>
                            </div>
                            <div className="batch-operations">
                                {selectedStatus === 'pending' && (
                                    <button
                                        className="batch-btn shipping-btn"
                                        onClick={openShippingModal}
                                        disabled={selectedOrders.size === 0}
                                    >
                                        批量设置收货信息
                                    </button>
                                )}
                                {selectedStatus === 'shipped' && (
                                    <button
                                        className="batch-btn delivery-btn"
                                        onClick={batchConfirmDelivery}
                                        disabled={selectedOrders.size === 0 || deliveryLoading}
                                    >
                                        {deliveryLoading ? '确认中...' : '批量确认收货'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 订单列表 */}
                    <div className="orders-container">
                        {filteredOrders.length === 0 ? (
                            <div className="no-orders">
                                <div className="no-orders-icon">📦</div>
                                <div className="no-orders-text">暂无订单</div>
                            </div>
                        ) : (
                            <div className="orders-grid">
                                {filteredOrders.map(order => (
                                    <div key={order.id} className={`order-card ${selectedOrders.has(order.id) ? 'selected' : ''}`}>
                                        {/* 在待发货和已发货状态显示选择框 */}
                                        {(selectedStatus === 'pending' || selectedStatus === 'shipped') && (
                                            <div className="order-selection">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.has(order.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleOrderSelection(order.id);
                                                    }}
                                                    className="order-checkbox"
                                                />
                                            </div>
                                        )}
                                        <div className="order-content-wrapper" onClick={() => openDetailModal(order)}>
                                            <div className="order-header">
                                                <div className="order-id">订单 #{order.id}</div>
                                                <div
                                                    className="order-status"
                                                    style={{ color: getStatusColor(order.shippingStatus) }}
                                                >
                                                    {getStatusDisplayName(order.shippingStatus)}
                                                </div>
                                            </div>
                                            <div className="order-content">
                                                <div className="order-images">
                                                    <div className="order-style-image">
                                                        <img
                                                            src={`http://localhost:7001/${order.styleCover}`}
                                                            alt={order.styleName}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="fallback-image" style={{ display: 'none' }}>
                                                            {order.styleName?.charAt(0)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="order-info">
                                                    <div className="style-name">{order.styleName}</div>
                                                    {order.isHidden && <div className="hidden-badge">隐藏款</div>}
                                                    <div className="purchase-time">购买时间: {formatDate(order.purchasedAt)}</div>
                                                    {/* 收货信息状态标识 */}
                                                    {order.shippingStatus === 'pending' && (
                                                        <div className={`shipping-info-status ${shippingInfoStatus[order.id] ? 'complete' : 'incomplete'}`}>
                                                            {shippingInfoStatus[order.id] ? '✅ 收货信息已填写' : '⚠️ 收货信息未填写'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* 单个订单操作按钮 */}
                                        <div className="order-actions" onClick={(e) => e.stopPropagation()}>
                                            {order.shippingStatus === 'pending' && !shippingInfoStatus[order.id] && (
                                                <button className="order-action-btn" onClick={() => openSingleShippingModal(order.id)}>填写收货信息</button>
                                            )}
                                            {order.shippingStatus === 'pending' && shippingInfoStatus[order.id] && (
                                                <button className="order-action-btn" onClick={() => openSingleAddressEdit(order)}>修改收货信息</button>
                                            )}
                                            {order.shippingStatus === 'shipped' && (
                                                <button
                                                    className="order-action-btn primary"
                                                    disabled={deliveryLoading}
                                                    onClick={() => showConfirm(() => confirmDeliverySingle(order.id), '确认已收到该订单商品吗？')}
                                                >
                                                    {deliveryLoading ? '确认中...' : '确认收货'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 订单详情弹窗 */}
            {showDetailModal && (
                <div className="detail-modal-overlay" onClick={closeDetailModal}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3 className="detail-modal-title">订单详情</h3>
                            <button className="close-detail-btn" onClick={closeDetailModal}>×</button>
                        </div>
                        <div className="detail-modal-content">
                            {detailLoading ? (
                                <div className="detail-loading">
                                    <div className="loading-spinner"></div>
                                    <div>加载中...</div>
                                </div>
                            ) : orderDetail ? (
                                <div className="order-detail-content">
                                    {/* 商品信息（上） */}
                                    <div className="detail-section">
                                        <h4 className="detail-section-title">商品信息</h4>
                                        <div className="product-detail">
                                            <div className="product-images">
                                                <div className="product-style-image">
                                                    <img
                                                        src={`http://localhost:7001/${orderDetail.styleCover}`}
                                                        alt={orderDetail.styleName}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <div className="fallback-image" style={{ display: 'none' }}>
                                                        {orderDetail.styleName?.charAt(0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="product-info">
                                                <div className="product-series-name">{orderDetail.seriesName}</div>
                                                <div className="product-style-name">{orderDetail.styleName}</div>
                                                {orderDetail.isHidden && <div className="hidden-badge detail-hidden-badge">隐藏款</div>}
                                                {orderDetail.style?.description && (
                                                    <div className="product-description">{orderDetail.style.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* 订单信息（下） */}
                                    <div className="detail-section">
                                        <h4 className="detail-section-title">订单信息</h4>
                                        <div className="detail-info-grid">
                                            <div className="detail-info-item">
                                                <span className="detail-label">订单编号:</span>
                                                <span className="detail-value">#{orderDetail.id}</span>
                                            </div>
                                            <div className="detail-info-item">
                                                <span className="detail-label">购买时间:</span>
                                                <span className="detail-value">{formatDate(orderDetail.purchasedAt)}</span>
                                            </div>
                                            <div className="detail-info-item">
                                                <span className="detail-label">订单状态:</span>
                                                <span
                                                    className="detail-value status-badge"
                                                    style={{ color: getStatusColor(orderDetail.shippingStatus) }}
                                                >
                                                    {getStatusDisplayName(orderDetail.shippingStatus)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 物流信息 */}
                                    {orderDetail.shippingStatus !== 'pending' && orderDetail.shippingStatus !== 'cancelled' && (
                                        <div className="detail-section">
                                            <h4 className="detail-section-title">物流信息</h4>
                                            <div className="detail-info-grid">
                                                {orderDetail.shippedAt && (
                                                    <div className="detail-info-item">
                                                        <span className="detail-label">发货时间:</span>
                                                        <span className="detail-value">{formatDate(orderDetail.shippedAt)}</span>
                                                    </div>
                                                )}
                                                {orderDetail.deliveredAt && (
                                                    <div className="detail-info-item">
                                                        <span className="detail-label">收货时间:</span>
                                                        <span className="detail-value">{formatDate(orderDetail.deliveredAt)}</span>
                                                    </div>
                                                )}
                                                {orderDetail.trackingNumber && (
                                                    <div className="detail-info-item">
                                                        <span className="detail-label">快递单号:</span>
                                                        <span className="detail-value">{orderDetail.trackingNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* 收货信息 */}
                                    {(orderDetail.shippingAddress || orderDetail.receiverName || orderDetail.receiverPhone) && (
                                        <div className="detail-section">
                                            <h4 className="detail-section-title">
                                                收货信息
                                                {orderDetail.shippingStatus === 'pending' && (
                                                    <span className={`detail-status-badge ${shippingInfoStatus[orderDetail.id] ? 'complete' : 'incomplete'}`}>
                                                        {shippingInfoStatus[orderDetail.id] ? '✅ 已填写' : '⚠️ 未填写'}
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="detail-info-grid">
                                                {orderDetail.receiverName && (
                                                    <div className="detail-info-item">
                                                        <span className="detail-label">收货人:</span>
                                                        <span className="detail-value">{orderDetail.receiverName}</span>
                                                    </div>
                                                )}
                                                {orderDetail.receiverPhone && (
                                                    <div className="detail-info-item">
                                                        <span className="detail-label">联系电话:</span>
                                                        <span className="detail-value">{orderDetail.receiverPhone}</span>
                                                    </div>
                                                )}
                                                {orderDetail.shippingAddress && (
                                                    <div className="detail-info-item full-width">
                                                        <span className="detail-label">收货地址:</span>
                                                        <span className="detail-value">{orderDetail.shippingAddress}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="detail-error">获取订单详情失败</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 批量/单个 设置收货信息弹窗 */}
            {showShippingModal && (
                <div className="shipping-modal-overlay" onClick={closeShippingModal}>
                    <div className="shipping-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="shipping-modal-title">{singleShippingOrderId ? '填写收货信息' : '批量设置收货信息'}</h3>
                        <div className="shipping-form-group">
                            <label htmlFor="receiverName">收货人:</label>
                            <input
                                type="text"
                                id="receiverName"
                                value={shippingForm.receiverName}
                                onChange={(e) => handleShippingFormChange('receiverName', e.target.value)}
                                placeholder="请输入收货人姓名"
                            />
                        </div>
                        <div className="shipping-form-group">
                            <label htmlFor="receiverPhone">联系电话:</label>
                            <input
                                type="text"
                                id="receiverPhone"
                                value={shippingForm.receiverPhone}
                                onChange={(e) => handleShippingFormChange('receiverPhone', e.target.value)}
                                placeholder="请输入联系电话"
                            />
                        </div>
                        <div className="shipping-form-group">
                            <label htmlFor="shippingAddress">收货地址:</label>
                            <textarea
                                id="shippingAddress"
                                value={shippingForm.shippingAddress}
                                onChange={(e) => handleShippingFormChange('shippingAddress', e.target.value)}
                                placeholder="请输入收货地址"
                            ></textarea>
                        </div>
                        <div className="shipping-modal-actions">
                            <button className="shipping-modal-btn shipping-modal-yes" onClick={batchSetShippingInfo} disabled={shippingLoading}>
                                {shippingLoading ? '设置中...' : (singleShippingOrderId ? '保存' : '设置')}
                            </button>
                            <button className="shipping-modal-btn shipping-modal-no" onClick={closeShippingModal} disabled={shippingLoading}>
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 确认弹窗 */}
            {showConfirmModal && (
                <div className="confirm-modal-overlay" onClick={handleCancelConfirm}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="confirm-modal-title">确认操作</h3>
                        <p className="confirm-modal-message">{confirmMessage}</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-btn confirm-modal-yes" onClick={handleConfirm}>是</button>
                            <button className="confirm-modal-btn confirm-modal-no" onClick={handleCancelConfirm}>否</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderDetails; 