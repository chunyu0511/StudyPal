
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { materialsAPI, communityAPI } from '../utils/api';
import './Home.css';

const Home = () => {
    const { user, isAuthenticated } = useAuth();
    const [trending, setTrending] = useState({ popular: [], topRated: [], latest: [] });
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const trendingData = await materialsAPI.getTrending();
            setTrending(trendingData);

            if (isAuthenticated) {
                const feedData = await communityAPI.getFeed();
                setFeed(feedData.slice(0, 3));
            }
        } catch (error) {
            console.error('获取首页数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (type) => {
        const icons = {
            'pdf': '📄', 'doc': '📝', 'docx': '📝', 'ppt': '📊', 'pptx': '📊',
            'xls': '📈', 'xlsx': '📈', 'mp4': '🎥', 'avi': '🎥', 'mov': '🎥'
        };
        return icons[type] || '📎';
    };

    const renderMaterialCard = (material) => (
        <Link to={`/materials/${material.id}`} key={material.id} className="trending-card">
            <div className="trending-card-icon">{getFileIcon(material.file_type)}</div>
            <div className="trending-card-content">
                <h4 className="trending-card-title">{material.title}</h4>
                <div className="trending-card-meta">
                    <span className="meta-badge">{material.type === 'exam' ? '📝 试卷' : material.type === 'note' ? '📓 笔记' : '🎥 网课'}</span>
                    {material.avg_rating > 0 && (
                        <span className="meta-rating">⭐ {material.avg_rating.toFixed(1)}</span>
                    )}
                    <span className="meta-downloads">📥 {material.download_count}</span>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="zine-home">
            <div className="container">
                {/* 英雄区域 - 像杂志封面 */}
                <section className="hero-section">
                    <div className="hero-badge">EST. 2026 ✦ 大学生知识共享</div>

                    <h1 className="hero-title">
                        <span className="title-line">不只是</span>
                        <span className="title-highlight">学习资料</span>
                        <span className="title-line handwrite">是灵感交换站</span>
                    </h1>

                    <p className="hero-desc">
                        上传你的笔记，下载别人的智慧。<br />
                        <span className="text-lime">免费、开放、无广告。</span>
                    </p>

                    <div className="hero-cta">
                        <Link to="/materials" className="btn btn-primary">
                            进入资料库 →
                        </Link>
                        <Link to="/community" className="btn btn-secondary">
                            社区讨论 💬
                        </Link>
                        {!user && (
                            <Link to="/register" className="btn btn-ghost">
                                注册账号
                            </Link>
                        )}
                    </div>

                    {/* 装饰元素 */}
                    <div className="floating-sticker sticker-1">📚</div>
                    <div className="floating-sticker sticker-2">✏️</div>
                    <div className="floating-sticker sticker-3">💡</div>
                </section>

                {/* 社交动态简报 - 仅对已登录用户显示 */}
                {isAuthenticated && feed.length > 0 && (
                    <section className="feed-brief-section">
                        <div className="container">
                            <div className="feed-brief-header">
                                <h3 className="section-title-small">👥 关注动态</h3>
                                <Link to="/community" className="text-link">查看全部 →</Link>
                            </div>
                            <div className="feed-brief-list">
                                {feed.map(post => (
                                    <div key={post.id} className="feed-brief-item">
                                        <div className="avatar micro-avatar">
                                            {post.avatar ? <img src={post.avatar} alt={post.username} /> : post.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="feed-brief-content">
                                            <span className="feed-author">{post.username}</span>
                                            <p className="feed-text">{post.content.substring(0, 50)}...</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 热门推荐区 */}
                {!loading && (
                    <section className="trending-section">
                        <h2 className="section-title">
                            <span className="handwrite text-orange">Hot Picks</span>
                            <br />本周热门推荐
                        </h2>

                        <div className="trending-grid">
                            {/* 热门下载 */}
                            <div className="trending-column">
                                <h3 className="trending-column-title">🔥 下载最多</h3>
                                <div className="trending-list">
                                    {trending.popular.slice(0, 4).map(renderMaterialCard)}
                                </div>
                            </div>

                            {/* 好评资料 */}
                            <div className="trending-column">
                                <h3 className="trending-column-title">⭐ 好评如潮</h3>
                                <div className="trending-list">
                                    {trending.topRated.slice(0, 4).map(renderMaterialCard)}
                                </div>
                            </div>

                            {/* 最新上传 */}
                            <div className="trending-column">
                                <h3 className="trending-column-title">✨ 新鲜出炉</h3>
                                <div className="trending-list">
                                    {trending.latest.slice(0, 4).map(renderMaterialCard)}
                                </div>
                            </div>
                        </div>

                        <div className="trending-cta">
                            <Link to="/materials" className="btn btn-ghost">
                                查看全部资料 →
                            </Link>
                        </div>
                    </section>
                )}

                {/* 分类卡片区 - 不规则网格 */}
                <section className="categories-section">
                    <h2 className="section-title">
                        <span className="handwrite text-orange">Pick your poison</span>
                        <br />选择你的战场
                    </h2>

                    <div className="zine-grid">
                        <Link to="/materials?type=exam" className="zine-card card-tilt-left">
                            <span className="card-emoji">📝</span>
                            <h3>期末试卷</h3>
                            <p>历年真题 / 模拟卷 / 答案解析</p>
                            <span className="card-arrow">→</span>
                        </Link>

                        <Link to="/materials?type=note" className="zine-card card-tilt-right card-featured">
                            <span className="card-emoji">📓</span>
                            <h3>学霸笔记</h3>
                            <p>手写笔记 / 思维导图 / 重点总结</p>
                            <span className="card-arrow">→</span>
                        </Link>

                        <Link to="/materials?type=course" className="zine-card">
                            <span className="card-emoji">💻</span>
                            <h3>网课资源</h3>
                            <p>视频教程 / 课件PPT / 录像</p>
                            <span className="card-arrow">→</span>
                        </Link>

                        <Link to="/materials?category=CS" className="zine-card card-tilt-left">
                            <span className="card-emoji">⌨️</span>
                            <h3>计算机专区</h3>
                            <p>代码 / 算法 / 项目实战</p>
                            <span className="card-arrow">→</span>
                        </Link>
                    </div>
                </section>

                {/* 荣耀先锋榜预览 */}
                <section className="leaderboard-preview">
                    <div className="preview-content">
                        <div className="preview-text">
                            <h2 className="section-title">
                                <span className="handwrite text-orange">Pioneers</span>
                                <br />贡献者巅峰榜
                            </h2>
                            <p>每一份资料的上传，都在点亮知识的灯塔。加入我们的先锋行动，用你的贡献，赢得社区的至高敬意。</p>
                            <Link to="/leaderboard" className="btn btn-primary">
                                查看完整榜单 🏆
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 底部宣言 */}
                <section className="manifesto-section">
                    <blockquote>
                        "知识就像盗版 CD，<br />
                        <span className="text-lime">越分享越有价值。</span>"
                    </blockquote>
                    <cite>— 某位不愿透露姓名的学霸</cite>
                </section>
            </div>
        </div>
    );
};

export default Home;
