
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MaterialCard from '../components/MaterialCard';
import { CardSkeleton } from '../components/Skeleton';
import './Materials.css';

const Materials = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    // 筛选状态
    const [filters, setFilters] = useState({
        search: queryParams.get('search') || '',
        category: queryParams.get('category') || 'all',
        type: queryParams.get('type') || 'all',
        tag: queryParams.get('tag') || '',
        sort: queryParams.get('sort') || 'latest'
    });

    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1
    });

    // 搜索历史
    const [searchHistory, setSearchHistory] = useState([]);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const searchInputRef = useRef(null);

    // 热门搜索词 / 热门标签
    const trendingSearches = ['高等数学', '线性代数', '期末真题', '学霸笔记', '考研', '计算机网络'];

    // 加载搜索历史
    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(history);
    }, []);

    // 保存搜索历史
    const saveSearchHistory = (query) => {
        if (!query.trim()) return;

        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        // 移除重复项
        history = history.filter(item => item !== query);
        // 添加到开头
        history.unshift(query);
        // 只保留最近10条
        history = history.slice(0, 10);

        localStorage.setItem('searchHistory', JSON.stringify(history));
        setSearchHistory(history);
    };

    // 清除搜索历史
    const clearSearchHistory = () => {
        localStorage.removeItem('searchHistory');
        setSearchHistory([]);
    };

    // 监听 URL 变化或 filters 变化来获取数据
    useEffect(() => {
        const fetchMaterials = async () => {
            setLoading(true);
            try {
                // 构建查询参数
                const params = { ...filters, page: 1 };
                const data = await api.getMaterials(params);
                setMaterials(data.materials);
                setPagination(data.pagination);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();

        // 更新 URL 
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.category !== 'all') params.set('category', filters.category);
        if (filters.type !== 'all') params.set('type', filters.type);
        if (filters.tag) params.set('tag', filters.tag);
        if (filters.sort !== 'latest') params.set('sort', filters.sort);

        navigate(`/materials?${params.toString()}`, { replace: true });

    }, [filters.category, filters.type, filters.sort, filters.tag, filters.search]); // 监听 search 变化

    const handleSearch = (e) => {
        e.preventDefault();

        // 保存搜索历史
        if (filters.search.trim()) {
            saveSearchHistory(filters.search.trim());
        }

        setShowSearchHistory(false);
    };

    // 点击搜索历史项 或 热门标签
    const handleTagClick = (query) => {
        setFilters({ ...filters, search: '', tag: query });
        setShowSearchHistory(false);
    };

    const handleHistoryClick = (query) => {
        setFilters({ ...filters, search: query, tag: '' });
        setShowSearchHistory(false);
    };

    return (
        <div className="materials-page container">
            <div className="page-header-section">
                <h1>发现资料</h1>
                <p>海量学习资源，一键获取</p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="通过名称、拼音或标签搜索..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onFocus={() => setShowSearchHistory(true)}
                            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                        />

                        {/* 搜索历史下拉框 */}
                        {showSearchHistory && (searchHistory.length > 0) && (
                            <div className="search-dropdown">
                                {searchHistory.length > 0 && (
                                    <div className="search-section">
                                        <div className="search-section-header">
                                            <span className="section-title">🕐 搜索历史</span>
                                            <button type="button" className="clear-btn" onClick={clearSearchHistory}>
                                                清空
                                            </button>
                                        </div>
                                        <div className="search-items">
                                            {searchHistory.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="search-item"
                                                    onMouseDown={() => handleHistoryClick(item)}
                                                >
                                                    <span className="item-icon">🔍</span>
                                                    <span className="item-text">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>

                {/* 热门搜索/标签 */}
                <div className="hot-tags">
                    <span className="hot-tags-label">🔥 热门：</span>
                    {trendingSearches.map((tag, idx) => (
                        <button
                            key={idx}
                            className={`hot-tag-btn ${filters.tag === tag ? 'active' : ''}`}
                            onClick={() => handleTagClick(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                    {filters.tag && (
                        <button
                            className="clear-tag-btn"
                            onClick={() => setFilters({ ...filters, tag: '' })}
                        >
                            清除筛选 ✕
                        </button>
                    )}
                </div>

                <div className="filter-groups">
                    <div className="filter-item">
                        <label>类型</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="all">全部类型</option>
                            <option value="exam">试卷</option>
                            <option value="note">笔记</option>
                            <option value="course">网课</option>
                            <option value="other">其他</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>分类</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="all">全部分类</option>
                            <option value="CS">计算机</option>
                            <option value="Math">数学</option>
                            <option value="English">英语</option>
                            <option value="Economy">经济</option>
                            <option value="Other">综合</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>排序</label>
                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                        >
                            <option value="latest">最新上传</option>
                            <option value="popular">下载最多</option>
                            <option value="rating">评分最高</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="materials-grid">
                    {[...Array(8)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : materials.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>没有找到相关资料</h3>
                    <p>尝试更换关键词或清除筛选条件</p>
                    <button onClick={() => setFilters({ search: '', category: 'all', type: 'all', sort: 'latest' })}>
                        重置所有筛选
                    </button>
                </div>
            ) : (
                <div className="materials-grid">
                    {materials.map(material => (
                        <MaterialCard key={material.id} material={material} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Materials;
