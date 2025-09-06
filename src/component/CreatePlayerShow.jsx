import React, { useState, useRef, useEffect } from 'react';
import './CreatePlayerShow.css';

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

const CreatePlayerShow = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');
    const [seriesList, setSeriesList] = useState([]);

    // 表单数据
    const [formData, setFormData] = useState({
        seriesId: '',
        title: '',
        content: ''
    });

    // 图片文件列表
    const [imageFiles, setImageFiles] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [isSeriesExpanded, setIsSeriesExpanded] = useState(false);

    const imageInputRef = useRef();

    // 获取系列列表
    useEffect(() => {
        if (isOpen) {
            fetchSeriesList();
        }
    }, [isOpen]);

    const fetchSeriesList = async () => {
        try {
            const res = await fetch('http://localhost:7001/series/all');
            const data = await res.json();
            if (data.code === 200) {
                const seriesData = data.data || [];
                setSeriesList(seriesData);

                // 如果没有选择系列且有系列数据，默认选择第一个
                if (!formData.seriesId && seriesData.length > 0) {
                    setFormData(prev => ({ ...prev, seriesId: seriesData[0].id }));
                }
            }
        } catch (err) {
            console.error('获取系列列表失败:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // 限制最多5张图片
        const newFiles = [...imageFiles, ...files].slice(0, 5);
        setImageFiles(newFiles);

        // 生成预览URL
        const newUrls = [];
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                newUrls.push(ev.target.result);
                if (newUrls.length === newFiles.length) {
                    setImageUrls([...newUrls]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            // 验证必填字段
            if (!formData.title.trim()) {
                throw new Error('请输入标题');
            }

            if (imageFiles.length === 0) {
                throw new Error('请至少上传一张图片');
            }

            if (!formData.seriesId) {
                throw new Error('请选择系列');
            }

            // 上传图片
            const uploadedImages = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'player-show');
                formData.append('name', `show_${Date.now()}_${i}`);

                const uploadRes = await fetch('http://localhost:7001/upload/', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    throw new Error(`图片 ${i + 1} 上传失败`);
                }

                const uploadData = await uploadRes.json();
                uploadedImages.push(uploadData.url);
            }

            // 提交玩家秀数据
            const submitData = {
                seriesId: parseInt(formData.seriesId),
                title: formData.title.trim(),
                content: formData.content.trim(),
                images: uploadedImages
            };

            const res = await fetch('http://localhost:7001/player-shows/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(submitData)
            });

            const data = await res.json();

            if (data.code === 200) {
                setMsgType('success');
                setMsg('玩家秀发布成功！');

                // 清空表单
                setFormData({
                    seriesId: '',
                    title: '',
                    content: ''
                });
                setImageFiles([]);
                setImageUrls([]);

                // 关闭弹窗并刷新列表
                setTimeout(() => {
                    onClose();
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                throw new Error(data.message || '发布失败');
            }
        } catch (err) {
            console.error('发布玩家秀错误:', err);
            setMsgType('error');
            setMsg(err.message || '发布失败');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <TopMessage message={msg} type={msgType} onClose={() => setMsg('')} />

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
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* 弹窗内容 */}
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
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
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#999'
                        }}
                    >
                        ×
                    </button>

                    <h2 style={{
                        textAlign: 'center',
                        marginBottom: '32px',
                        color: '#692748',
                        fontSize: '24px'
                    }}>
                        发布玩家秀
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* 选择系列 */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                选择系列 *
                            </label>

                            {/* 折叠的系列选择器 */}
                            <div style={{
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                overflow: 'hidden'
                            }}>
                                {/* 当前选中的系列显示 */}
                                {formData.seriesId && (
                                    <div
                                        onClick={() => setIsSeriesExpanded(!isSeriesExpanded)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            backgroundColor: 'white',
                                            borderBottom: isSeriesExpanded ? '1px solid #f0f0f0' : 'none'
                                        }}
                                    >
                                        {(() => {
                                            const selectedSeries = seriesList.find(s => s.id === formData.seriesId);
                                            return selectedSeries ? (
                                                <>
                                                    <img
                                                        src={`http://localhost:7001/${selectedSeries.cover}`}
                                                        alt={selectedSeries.name}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '6px',
                                                            marginRight: '12px',
                                                            objectFit: 'cover'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/40x40/692748/ffffff?text=S';
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>
                                                            {selectedSeries.name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                                            {selectedSeries.styleCount} 个样式
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ color: '#999', fontSize: '14px' }}>
                                                    请选择系列
                                                </div>
                                            );
                                        })()}
                                        <div style={{
                                            color: '#666',
                                            fontSize: '16px',
                                            transform: isSeriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease'
                                        }}>
                                            ▼
                                        </div>
                                    </div>
                                )}

                                {/* 展开的系列列表 */}
                                {isSeriesExpanded && (
                                    <div style={{
                                        maxHeight: '200px',
                                        overflow: 'auto'
                                    }}>
                                        {seriesList.map(series => (
                                            <div
                                                key={series.id}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, seriesId: series.id }));
                                                    setIsSeriesExpanded(false);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    backgroundColor: formData.seriesId === series.id ? '#f8f9fa' : 'white',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = formData.seriesId === series.id ? '#f8f9fa' : 'white'}
                                            >
                                                <img
                                                    src={`http://localhost:7001/${series.cover}`}
                                                    alt={series.name}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '6px',
                                                        marginRight: '12px',
                                                        objectFit: 'cover'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/40x40/692748/ffffff?text=S';
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>
                                                        {series.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                                        {series.styleCount} 个样式
                                                    </div>
                                                </div>
                                                {formData.seriesId === series.id && (
                                                    <div style={{ color: '#692748', fontSize: '16px' }}>✓</div>
                                                )}
                                            </div>
                                        ))}
                                        {seriesList.length === 0 && (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: '#999',
                                                fontSize: '14px'
                                            }}>
                                                暂无可用系列
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 如果没有选择系列，显示默认选择 */}
                                {!formData.seriesId && seriesList.length > 0 && (
                                    <div
                                        onClick={() => setIsSeriesExpanded(!isSeriesExpanded)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <img
                                            src={`http://localhost:7001/${seriesList[0].cover}`}
                                            alt={seriesList[0].name}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '6px',
                                                marginRight: '12px',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/40x40/692748/ffffff?text=S';
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>
                                                {seriesList[0].name} (默认)
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                                {seriesList[0].styleCount} 个样式
                                            </div>
                                        </div>
                                        <div style={{
                                            color: '#666',
                                            fontSize: '16px',
                                            transform: isSeriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease'
                                        }}>
                                            ▼
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 标题 */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                标题 *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="请输入标题"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* 内容 */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                内容描述
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="分享你的收获感受..."
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* 图片上传 */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                上传图片 * (最多5张)
                            </label>

                            {/* 图片预览区域 */}
                            {imageUrls.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '12px',
                                    marginBottom: '16px'
                                }}>
                                    {imageUrls.map((url, index) => (
                                        <div key={index} style={{ position: 'relative' }}>
                                            <img
                                                src={url}
                                                alt={`预览 ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#ff3860',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    lineHeight: '1',
                                                    padding: '0'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 上传按钮 */}
                            {imageUrls.length < 5 && (
                                <div
                                    onClick={() => imageInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed #ddd',
                                        borderRadius: '6px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: '#666',
                                        transition: 'border-color 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.borderColor = '#692748'}
                                    onMouseLeave={(e) => e.target.style.borderColor = '#ddd'}
                                >
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                                    <div>点击上传图片</div>
                                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                        已上传 {imageUrls.length}/5 张
                                    </div>
                                </div>
                            )}

                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* 提交按钮 */}
                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '12px 32px',
                                    background: '#692748',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? '发布中...' : '发布玩家秀'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreatePlayerShow; 