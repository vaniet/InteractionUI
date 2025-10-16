import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const PaymentConfirmModal = ({
    isVisible,
    priceData,
    onConfirm,
    onCancel
}) => {
    useEffect(() => {
        if (!isVisible) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isVisible]);

    if (!isVisible) return null;

    const overlay = (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                inset: 0
            }}
        >
            <div onClick={(e) => e.stopPropagation()} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '450px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 4px 16px rgba(24, 144, 255, 0.3)'
                }}>
                    <span style={{ fontSize: '32px', color: 'white' }}>💰</span>
                </div>

                <h3 style={{
                    margin: '0 0 16px 0',
                    color: '#333',
                    fontSize: '20px',
                    fontWeight: '600'
                }}>
                    确认支付
                </h3>

                <p style={{
                    margin: '0 0 24px 0',
                    color: '#666',
                    fontSize: '16px',
                    lineHeight: '1.5'
                }}>
                    您即将支付以下费用进行抽卡：
                </p>

                {priceData && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '20px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e8e8e8'
                    }}>
                        {priceData.discountRate < 1 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <span style={{
                                    textDecoration: 'line-through',
                                    color: '#999',
                                    fontSize: '18px'
                                }}>
                                    ¥{priceData.price}
                                </span>
                                <span style={{
                                    color: '#ff4d4f',
                                    fontSize: '24px',
                                    fontWeight: 'bold'
                                }}>
                                    ¥{priceData.actualPrice}
                                </span>
                                <span style={{
                                    background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                                }}>
                                    {(priceData.discountRate * 10).toFixed(1)}折
                                </span>
                            </div>
                        ) : (
                            <div style={{
                                color: '#1890ff',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}>
                                ¥{priceData.price}
                            </div>
                        )}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '12px 32px',
                            background: 'white',
                            color: '#666',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minWidth: '100px'
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
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                            transition: 'all 0.3s ease',
                            minWidth: '100px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                        }}
                    >
                        确认支付
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(overlay, document.body);
};

export default PaymentConfirmModal; 