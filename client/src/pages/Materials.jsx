
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
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
        sort: queryParams.get('sort') || 'latest'
    });

    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1
    });

    // 监听 URL 变化或 filters 变化来获取数据
    useEffect(() => {
        const fetchMaterials = async () => {
            setLoading(true);
            try {
                // 构建查询参数
                const params = { ...filters, page: 1 }; // 切换筛选时不保留页码，重置为1
                // 实际请求API时，可能需要处理 'all' 值，如果API把 'all' 当作忽略，那就没问题
                // 根据后端代码，后端会检查 type && type !== 'all'，所以传 'all' 是安全的

                const data = await api.getMaterials(params);
                setMaterials(data.materials);
                setPagination(data.pagination);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        // 防抖：如果用户在打字，不要每次都请求，但这比较复杂。
        // 简单起见，我们可以在点击“搜索”或按回车时才触发 search 更新，或者用 debounce。
        // 这里为了简单，search 变化即请求（但 input onChange 时更新 local state，useEffect 监听 debounced value 或者 input blur）
        // 更好的体验是：Filter 变化直接请求，Search 需要回车。

        // 既然我们把 filters 用于状态管理，我们把 fetch 逻辑独立出来。
        fetchMaterials();

        // 更新 URL 
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.category !== 'all') params.set('category', filters.category);
        if (filters.type !== 'all') params.set('type', filters.type);
        if (filters.sort !== 'latest') params.set('sort', filters.sort);

        navigate(`/materials?${params.toString()}`, { replace: true });

    }, [filters.category, filters.type, filters.sort]);
    // 注意：search 单独处理，避免打字时频繁请求

    const handleSearch = (e) => {
        e.preventDefault();
        // 触发 useEffect 里的逻辑（如果 search 在 dep array）
        // 或者直接调用 fetch
        // 这里做一个 tricky 的处理：我们在 useEffect 里不监听 search，而是专门监听这里
        const fetchWithSearch = async () => {
            setLoading(true);
            try {
                const data = await api.getMaterials({ ...filters, page: 1 });
                setMaterials(data.materials);
                setPagination(data.pagination);

                const params = new URLSearchParams(location.search);
                if (filters.search) params.set('search', filters.search); else params.delete('search');
                navigate(`/materials?${params.toString()}`, { replace: true });
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchWithSearch();
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
                            type="text"
                            placeholder="搜索资料名称、描述..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                </form>

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
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>正在加载精彩内容...</p>
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
                        <div key={material.id} className="material-card">
                            <div className={`file-type-icon type-${material.type}`}>
                                {material.type === 'exam' && '📝'}
                                {material.type === 'note' && '📓'}
                                {material.type === 'course' && '💻'}
                                {material.type === 'other' && '📦'}
                            </div>
                            <div className="material-content">
                                <h3 className="material-title" title={material.title}>
                                    <a href={`/materials/${material.id}`}>{material.title}</a>
                                </h3>
                                <div className="material-meta">
                                    <span className="category-tag">{material.category}</span>
                                    {material.avg_rating > 0 && <span className="rating">⭐ {material.avg_rating.toFixed(1)}</span>}
                                </div>
                                <div className="material-footer">
                                    <div className="user-info">
                                        <span>@{material.uploader_username}</span>
                                    </div>
                                    <div className="stats-info">
                                        <span>⬇️ {material.download_count}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Materials;
