import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-title">
                                <span className="gradient-text">学伴</span>
                                <br />
                                让学习资料触手可及
                            </h1>
                            <p className="hero-subtitle">
                                汇集海量优质学习资料，包括试卷、笔记、网课等内容。
                                <br />
                                与千万大学生一起，分享知识，共同进步！
                            </p>
                            <div className="hero-buttons">
                                {isAuthenticated ? (
                                    <>
                                        <Link to="/materials" className="btn btn-primary btn-lg">
                                            <span>🔍</span> 浏览资料
                                        </Link>
                                        <Link to="/upload" className="btn btn-outline btn-lg">
                                            <span>📤</span> 上传分享
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/register" className="btn btn-primary btn-lg">
                                            <span>🚀</span> 立即开始
                                        </Link>
                                        <Link to="/materials" className="btn btn-outline btn-lg">
                                            <span>👀</span> 先看看
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* 统计数据 */}
                            <div className="hero-stats">
                                <div className="stat-item">
                                    <div className="stat-number">10,000+</div>
                                    <div className="stat-label">学习资料</div>
                                </div>
                                <div className="stat-divider"></div>
                                <div className="stat-item">
                                    <div className="stat-number">5,000+</div>
                                    <div className="stat-label">活跃用户</div>
                                </div>
                                <div className="stat-divider"></div>
                                <div className="stat-item">
                                    <div className="stat-number">50+</div>
                                    <div className="stat-label">学科分类</div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-image">
                            <div className="floating-card card-1">
                                <div className="card-icon">📝</div>
                                <div className="card-title">试卷资料</div>
                            </div>
                            <div className="floating-card card-2">
                                <div className="card-icon">📓</div>
                                <div className="card-title">学习笔记</div>
                            </div>
                            <div className="floating-card card-3">
                                <div className="card-icon">🎥</div>
                                <div className="card-title">网课视频</div>
                            </div>
                            <div className="hero-circle"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title text-center">为什么选择学伴？</h2>
                    <p className="section-subtitle text-center">
                        我们致力于打造最温馨、最便捷的学习资料分享平台
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <h3 className="feature-title">精准分类</h3>
                            <p className="feature-desc">
                                多维度分类系统，让你快速找到所需资料。支持按学科、年级、类型等筛选。
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3 className="feature-title">极速下载</h3>
                            <p className="feature-desc">
                                无需等待，即点即下。所有资料直接存储，无需跳转第三方网盘。
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🌟</div>
                            <h3 className="feature-title">质量保障</h3>
                            <p className="feature-desc">
                                社区评分系统，热门资料推荐。让优质内容脱颖而出。
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🤝</div>
                            <h3 className="feature-title">知识共享</h3>
                            <p className="feature-desc">
                                上传你的笔记，帮助更多同学。分享知识，共同进步。
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💾</div>
                            <h3 className="feature-title">个人收藏</h3>
                            <p className="feature-desc">
                                收藏感兴趣的资料，随时回顾。打造你的专属学习资料库。
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-title">数据统计</h3>
                            <p className="feature-desc">
                                查看你的学习足迹，了解下载、上传、收藏记录。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">准备好开始了吗？</h2>
                        <p className="cta-subtitle">
                            加入我们的学习社区，与千万大学生一起分享知识！
                        </p>
                        {!isAuthenticated && (
                            <Link to="/register" className="btn btn-primary btn-lg">
                                <span>🎓</span> 免费注册
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
