import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainPage() {
    const [seriesList, setSeriesList] = useState([]);
    const [filteredSeriesList, setFilteredSeriesList] = useState([]);
    const [messageList, setMessageList] = useState([]); // 新增：存储消息数据
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [priceData, setPriceData] = useState({});
    const navigate = useNavigate();

    // 分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(24); // 每页24个

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError('');
            try {
                // 并行获取系列数据和消息数据
                const [seriesRes, messageRes] = await Promise.all([
                    fetch('http://localhost:7001/series/listed'),
                    fetch('http://localhost:7001/message/all')
                ]);

                const seriesData = await seriesRes.json();
                const messageData = await messageRes.json();

                if (seriesData.code === 200) {
                    const allSeries = seriesData.data || [];
                    const total = allSeries.length;


                    // 前端分页：计算当前页的数据
                    const startIndex = (currentPage - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const currentPageSeries = allSeries.slice(startIndex, endIndex);

                    setSeriesList(currentPageSeries);
                    setFilteredSeriesList(currentPageSeries);
                    setTotalCount(total);
                    setTotalPages(Math.ceil(total / pageSize));

                    // 获取当前页系列的价格信息
                    await fetchAllPrices(currentPageSeries);
                } else {
                    setError(seriesData.message || '获取系列失败');
                }

                if (messageData.code === 200) {
                    setMessageList(messageData.data || []);
                }
            } catch (err) {
                setError('网络错误，无法获取数据');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [currentPage, pageSize]);

    // 获取所有系列的价格信息
    const fetchAllPrices = async (seriesList) => {
        const pricePromises = seriesList.map(async (series) => {
            try {
                const res = await fetch(`http://localhost:7001/price/${series.id}`);
                const data = await res.json();
                if (data.code === 200) {
                    return { seriesId: series.id, priceInfo: data.data };
                }
                return { seriesId: series.id, priceInfo: null };
            } catch (err) {
                return { seriesId: series.id, priceInfo: null };
            }
        });

        const priceResults = await Promise.all(pricePromises);
        const priceMap = {};
        priceResults.forEach(result => {
            if (result.priceInfo) {
                priceMap[result.seriesId] = result.priceInfo;
            }
        });
        setPriceData(priceMap);
    };

    // 价格显示组件
    const PriceDisplay = ({ seriesId }) => {
        const priceInfo = priceData[seriesId];

        if (!priceInfo) {
            return <div style={{
                color: '#999',
                fontSize: '14px',
                textAlign: 'center',
                marginTop: '8px'
            }}>暂无价格</div>;
        }

        const hasDiscount = priceInfo.discountRate < 1;

        return (
            <div style={{
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
            }}>
                {hasDiscount ? (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{
                                textDecoration: 'line-through',
                                color: '#999',
                                fontSize: '14px',
                                lineHeight: '1'
                            }}>
                                ¥{priceInfo.price}
                            </span>
                            <span style={{
                                color: 'rgb(195, 40, 42)',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                lineHeight: '1'
                            }}>
                                ¥{priceInfo.actualPrice}
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg,rgb(235, 72, 75), #ff7875)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(190, 47, 52, 0.3)',
                                lineHeight: '1'
                            }}>
                                {(priceInfo.discountRate * 10).toFixed(1)}折
                            </span>
                        </div>
                    </>
                ) : (
                    <div style={{
                        color: '#1890ff',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: '1'
                    }}>
                        ¥{priceInfo.price}
                    </div>
                )}
            </div>
        );
    };

    // 基于消息内容的搜索过滤功能
    const handleSearch = async (value) => {
        setSearchTerm(value);

        if (!value.trim()) {
            // 重新获取分页数据
            try {
                const seriesRes = await fetch('http://localhost:7001/series/listed');
                const seriesData = await seriesRes.json();

                if (seriesData.code === 200) {
                    const allSeries = seriesData.data || [];
                    const total = allSeries.length;

                    // 前端分页：计算当前页的数据
                    const startIndex = (currentPage - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const currentPageSeries = allSeries.slice(startIndex, endIndex);

                    setSeriesList(currentPageSeries);
                    setFilteredSeriesList(currentPageSeries);
                    setTotalCount(total);
                    setTotalPages(Math.ceil(total / pageSize));

                    // 获取当前页系列的价格信息
                    await fetchAllPrices(currentPageSeries);
                }
            } catch (err) {
                console.error('获取数据失败:', err);
            }
            return;
        }

        // 搜索时需要获取所有系列数据
        try {
            const allSeriesRes = await fetch('http://localhost:7001/series/listed');
            const allSeriesData = await allSeriesRes.json();

            if (allSeriesData.code === 200) {
                const allSeries = allSeriesData.data || [];

                // 在消息数据中搜索匹配的内容
                const matchedMessages = messageList.filter(message =>
                    message.content.toLowerCase().includes(value.toLowerCase())
                );

                // 获取匹配消息对应的系列ID
                const matchedSeriesIds = matchedMessages.map(message => message.seriesId);

                // 过滤出匹配的系列
                const filtered = allSeries.filter(series =>
                    matchedSeriesIds.includes(series.id)
                );

                setFilteredSeriesList(filtered);
                setCurrentPage(1); // 搜索时重置到第一页
            }
        } catch (err) {
            console.error('搜索失败:', err);
        }
    };

    // 键盘事件处理
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && searchTerm) {
            clearSearch();
        }
    };

    // 清空搜索
    const clearSearch = () => {
        setSearchTerm('');
        setFilteredSeriesList(seriesList);
        setCurrentPage(1);
    };

    // 分页处理函数
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1300px',
                minHeight: '800px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxSizing: 'border-box'
            }}>
                <h1 style={{ color: '#692748', marginBottom: 32, textAlign: 'center' }}>在售系列</h1>

                {/* 搜索框 */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{
                        position: 'relative',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>
                        <input
                            type="text"
                            placeholder="搜索内容关键词..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 60px',
                                paddingRight: searchTerm ? '44px' : '16px',
                                border: '2px solid #e8e8e8',
                                borderRadius: '25px',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#692748';
                                e.target.style.boxShadow = '0 0 0 3px rgba(105, 39, 72, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e8e8e8';
                                e.target.style.boxShadow = 'none';
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '18px',
                                    color: '#999',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f0f0f0';
                                    e.target.style.color = '#666';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = '#999';
                                }}
                            >
                                ✕
                            </button>
                        )}
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#999',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            搜索 |
                        </div>
                    </div>
                </div>

                {loading && <div>加载中...</div>}
                {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

                {/* 搜索状态提示 */}
                {!loading && !error && searchTerm && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 16,
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        在内容中匹配到 {filteredSeriesList.length} 个系列
                    </div>
                )}

                {/* 分页信息 */}
                {!loading && !error && !searchTerm && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 16,
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        共 {totalCount} 个系列，第 {currentPage} 页，共 {totalPages} 页
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 36,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {filteredSeriesList.length > 0 ? (
                        filteredSeriesList.map(series => {
                            const imageUrl = `http://localhost:7001/${series.cover}`;
                            return (
                                <div
                                    key={series.id}
                                    className="series-card"
                                    onClick={() => navigate(`/series/${series.id}`)}
                                >
                                    <div className="series-card-image">
                                        <img src={imageUrl} alt={series.name} />
                                    </div>
                                    <div className="series-card-content">
                                        <div className="series-card-title">{series.name}</div>
                                        <PriceDisplay seriesId={series.id} />
                                    </div>
                                </div>
                            );
                        })
                    ) : !loading && !error && searchTerm ? (
                        <div style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#999'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>未找到相关系列</div>
                            <div style={{ fontSize: '14px', color: '#ccc' }}>
                                尝试使用其他关键词搜索
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* 分页控件 */}
                {!loading && !error && !searchTerm && totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '40px',
                        gap: '8px'
                    }}>
                        {/* 上一页按钮 */}
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

                        {/* 页码按钮 */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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

                        {/* 下一页按钮 */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                background: currentPage === totalPages ? '#f5f5f5' : 'white',
                                color: currentPage === totalPages ? '#ccc' : '#333',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== totalPages) {
                                    e.target.style.borderColor = '#692748';
                                    e.target.style.color = '#692748';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== totalPages) {
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
        </div>
    );
}