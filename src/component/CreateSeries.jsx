import React, { useState, useRef } from 'react';
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

const CreateSeries = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');

    // 系列基本信息
    const [seriesInfo, setSeriesInfo] = useState({
        name: '',
        cover: '',
        description: '',
        detail: ''
    });

    // 系列封面文件
    const [seriesCoverFile, setSeriesCoverFile] = useState(null);

    // 价格信息
    const [priceInfo, setPriceInfo] = useState({
        price: ''
    });
    const [priceError, setPriceError] = useState('');

    // 样式列表
    const [styles, setStyles] = useState([
        {
            name: '',
            isHidden: false,
            cover: '',
            description: ''
        }
    ]);

    // 样式封面文件列表
    const [styleCoverFiles, setStyleCoverFiles] = useState([null]);

    const seriesCoverRef = useRef();
    const styleCoverRefs = useRef([]);

    const handleSeriesChange = (e) => {
        const { name, value } = e.target;
        setSeriesInfo(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setPriceInfo(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceInputChange = (e) => {
        const { value } = e.target;
        const validPattern = /^\d*(?:\.\d{0,2})?$/;
        setPriceInfo(prev => ({ ...prev, price: value }));
        if (value === '' || validPattern.test(value)) {
            setPriceError('');
        } else {
            setPriceError('仅允许输入整数或最多两位小数');
        }
    };

    const handleStyleChange = (index, field, value) => {
        setStyles(prev => {
            const newStyles = [...prev];
            newStyles[index] = { ...newStyles[index], [field]: value };

            // 如果勾选了隐藏款，取消其他样式的隐藏款状态
            if (field === 'isHidden' && value === true) {
                newStyles.forEach((style, i) => {
                    if (i !== index) {
                        style.isHidden = false;
                    }
                });
            }

            return newStyles;
        });
    };

    const addStyle = () => {
        setStyles(prev => [...prev, {
            name: '',
            isHidden: false,
            cover: '',
            description: ''
        }]);
        setStyleCoverFiles(prev => [...prev, null]);
    };

    const removeStyle = (index) => {
        if (styles.length > 1) {
            setStyles(prev => prev.filter((_, i) => i !== index));
            setStyleCoverFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSeriesCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSeriesCoverFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSeriesInfo(prev => ({ ...prev, cover: ev.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStyleCoverChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            setStyleCoverFiles(prev => {
                const newFiles = [...prev];
                newFiles[index] = file;
                return newFiles;
            });
            const reader = new FileReader();
            reader.onload = (ev) => {
                handleStyleChange(index, 'cover', ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            // 验证必填字段
            if (!seriesInfo.name.trim()) {
                throw new Error('请输入系列名称');
            }

            const validStyles = styles.filter(style => style.name.trim());
            if (validStyles.length === 0) {
                throw new Error('至少需要添加一个样式');
            }

            // 验证价格（整数或至多两位小数）
            const validPricePattern = /^\d+(?:\.\d{1,2})?$/;
            if (!priceInfo.price || !validPricePattern.test(priceInfo.price) || parseFloat(priceInfo.price) <= 0) {
                throw new Error('请输入有效的价格（整数或至多两位小数）');
            }

            // 1. 上传系列封面
            let seriesCoverPath = '';
            if (seriesCoverFile) {
                const formData = new FormData();
                formData.append('file', seriesCoverFile);
                formData.append('type', 'series');
                formData.append('name', seriesInfo.name);
                const uploadRes = await fetch('http://localhost:7001/upload/', {
                    method: 'POST',
                    body: formData
                });
                if (!uploadRes.ok) throw new Error('系列封面上传失败');
                const uploadData = await uploadRes.json();
                seriesCoverPath = uploadData.url;
            }

            // 2. 上传样式封面
            const uploadedStyles = [];
            for (let i = 0; i < validStyles.length; i++) {
                const style = validStyles[i];
                let styleCoverPath = '';

                if (styleCoverFiles[i]) {
                    const formData = new FormData();
                    formData.append('file', styleCoverFiles[i]);
                    formData.append('type', 'styles');
                    formData.append('name', style.name);
                    const uploadRes = await fetch('http://localhost:7001/upload/', {
                        method: 'POST',
                        body: formData
                    });
                    if (!uploadRes.ok) throw new Error(`样式 ${style.name} 封面上传失败`);
                    const uploadData = await uploadRes.json();
                    styleCoverPath = uploadData.url;
                }

                uploadedStyles.push({
                    name: style.name,
                    isHidden: style.isHidden || false,
                    cover: styleCoverPath,
                    description: style.description || ''
                });
            }

            // 3. 提交系列数据
            const submitData = {
                name: seriesInfo.name,
                cover: seriesCoverPath,
                description: seriesInfo.description || '',
                detail: seriesInfo.detail || '',
                styles: uploadedStyles
            };

            console.log('提交的数据:', submitData);
            console.log('Token:', localStorage.getItem('token'));

            const res = await fetch('http://localhost:7001/series/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(submitData)
            });

            console.log('响应状态:', res.status);
            console.log('响应头:', res.headers);

            const data = await res.json();
            console.log('响应数据:', data);

            // 检查是否有id字段来判断创建成功
            if (data.id) {
                // 4. 设置价格
                const priceData = {
                    seriesId: data.id,
                    price: parseFloat(priceInfo.price)
                };

                const priceRes = await fetch('http://localhost:7001/price/set-price', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(priceData)
                });

                if (!priceRes.ok) {
                    throw new Error('价格设置失败');
                }

                const priceResult = await priceRes.json();
                console.log('价格设置结果:', priceResult);

                setMsgType('success');
                setMsg('系列创建成功！价格设置成功！');

                // 清空所有字段内容
                setSeriesInfo({
                    name: '',
                    cover: '',
                    description: '',
                    detail: ''
                });
                setSeriesCoverFile(null);
                setPriceInfo({
                    price: ''
                });
                setStyles([{
                    name: '',
                    isHidden: false,
                    cover: '',
                    description: ''
                }]);
                setStyleCoverFiles([null]);
            } else {
                throw new Error(data.message || '创建失败');
            }
        } catch (err) {
            console.error('创建系列错误:', err);
            setMsgType('error');
            setMsg(err.message || '创建失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TopMessage message={msg} type={msgType} onClose={() => setMsg('')} />
            <div className="fullscreen-gradient-bg" style={{ padding: '20px', paddingTop: '80px', height: 'auto', overflow: 'auto' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto 80px auto', background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    {/* 返回主界面按钮 */}
                    <div style={{ marginBottom: '24px' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/mainpage')}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #1890ff',
                                borderRadius: '5px',
                                background: 'white',
                                color: '#1890ff',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            返回主界面
                        </button>
                    </div>

                    <h1 style={{ textAlign: 'center', marginBottom: '32px', color: '#692748' }}>创建盲盒系列</h1>

                    <form onSubmit={handleSubmit}>
                        {/* 系列基本信息 */}
                        <div style={{ marginBottom: '32px' }}>
                            <h2 style={{ marginBottom: '16px', color: '#692748' }}>系列信息</h2>

                            <div className="form-group">
                                <label>系列名称 *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    placeholder="请输入系列名称"
                                    value={seriesInfo.name}
                                    onChange={handleSeriesChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>系列封面</label>
                                <div
                                    className="upload-image-box"
                                    style={{ width: '200px', height: '120px' }}
                                    onClick={() => seriesCoverRef.current?.click()}
                                >
                                    {seriesInfo.cover ? (
                                        <img src={seriesInfo.cover} alt="系列封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span className="upload-plus">+</span>
                                    )}
                                    <input
                                        type="file"
                                        ref={seriesCoverRef}
                                        accept="image/*"
                                        onChange={handleSeriesCoverChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>系列描述</label>
                                <textarea
                                    name="description"
                                    className="input-field"
                                    placeholder="请输入系列描述"
                                    value={seriesInfo.description}
                                    onChange={handleSeriesChange}
                                    rows="3"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>系列细节</label>
                                <textarea
                                    name="detail"
                                    className="input-field"
                                    placeholder="请输入系列细节"
                                    value={seriesInfo.detail}
                                    onChange={handleSeriesChange}
                                    rows="2"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>


                        {/* 样式列表 */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h2 style={{ color: '#692748' }}>样式列表</h2>
                            </div>

                            {styles.map((style, index) => (
                                <div key={index} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h3 style={{ margin: 0, color: '#692748' }}>样式 {index + 1}</h3>
                                        {styles.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStyle(index)}
                                                style={{ background: '#ff3860', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                                            >
                                                删除
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>样式名称 *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="请输入样式名称"
                                            value={style.name}
                                            onChange={(e) => handleStyleChange(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>样式封面</label>
                                        <div
                                            className="upload-image-box"
                                            style={{ width: '120px', height: '120px' }}
                                            onClick={() => styleCoverRefs.current[index]?.click()}
                                        >
                                            {style.cover ? (
                                                <img src={style.cover} alt="样式封面" />
                                            ) : (
                                                <span className="upload-plus">+</span>
                                            )}
                                            <input
                                                type="file"
                                                ref={el => styleCoverRefs.current[index] = el}
                                                accept="image/*"
                                                onChange={(e) => handleStyleCoverChange(index, e)}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>样式描述</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="请输入样式描述"
                                            value={style.description}
                                            onChange={(e) => handleStyleChange(index, 'description', e.target.value)}
                                            rows="2"
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={style.isHidden}
                                                onChange={(e) => handleStyleChange(index, 'isHidden', e.target.checked)}
                                                style={{ marginRight: '8px' }}
                                            />
                                            隐藏款
                                        </label>
                                    </div>
                                </div>
                            ))}


                            {/* 添加样式按钮 */}
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <button
                                    type="button"
                                    className="button"
                                    onClick={addStyle}
                                    style={{ padding: '8px 16px', fontSize: '14px' }}
                                >
                                    添加样式
                                </button>
                            </div>
                        </div>

                            {/* 价格设置 */}
                            <div style={{ marginBottom: '16px' }}>
                                <h2 style={{ color: '#692748' }}>价格设置</h2>
                            </div>
                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label>价格 (元) *</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input-field"
                                    placeholder="请输入价格（整数或至多两位小数）"
                                    value={priceInfo.price}
                                    onChange={handlePriceInputChange}
                                />
                                {priceError && (
                                    <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '6px' }}>
                                        {priceError}
                                    </div>
                                )}
                            </div>
                        {/* 提交按钮 */}
                        <div style={{ textAlign: 'center' }}>
                            <button
                                type="submit"
                                className="button"
                                disabled={loading || !!priceError || !priceInfo.price}
                                style={{ marginRight: '16px' }}
                            >
                                {loading ? '创建中...' : '创建系列'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/mainpage')}
                                style={{ padding: '12px 24px', border: '1px solid #ddd', borderRadius: '5px', background: 'white', cursor: 'pointer' }}
                            >
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateSeries;
