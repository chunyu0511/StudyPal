
import './About.css';

const About = () => {
    return (
        <div className="about-page">
            <div className="about-hero">
                <h1 className="about-title">
                    关于 <span className="gradient-text">学伴</span>
                </h1>
                <p className="about-subtitle">
                    我们相信知识应该自由流动，而非被锁在象牙塔中。
                </p>
            </div>

            <div className="about-content">
                {/* 使命 */}
                <section className="about-section">
                    <div className="section-icon">🎯</div>
                    <h2>我们的使命</h2>
                    <p>
                        学伴诞生于一个简单的想法：为什么优秀的学习资料总是难以获取？
                        我们致力于打造一个开放、免费、无广告的学习资料共享社区，
                        让每一位大学生都能轻松获得高质量的学习资源。
                    </p>
                </section>

                {/* 价值观 */}
                <section className="about-section">
                    <div className="section-icon">💎</div>
                    <h2>核心价值观</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <span className="value-emoji">🌍</span>
                            <h3>开放共享</h3>
                            <p>知识不应有门槛，人人皆可贡献，人人皆可受益。</p>
                        </div>
                        <div className="value-card">
                            <span className="value-emoji">✨</span>
                            <h3>品质至上</h3>
                            <p>我们鼓励上传高质量的资料，让社区内容越来越好。</p>
                        </div>
                        <div className="value-card">
                            <span className="value-emoji">🤝</span>
                            <h3>互助互利</h3>
                            <p>你帮助了别人，别人也会帮助你。这是学伴的精神内核。</p>
                        </div>
                    </div>
                </section>

                {/* 功能特点 */}
                <section className="about-section">
                    <div className="section-icon">🛠️</div>
                    <h2>平台功能</h2>
                    <ul className="feature-list">
                        <li>📤 <strong>资料上传</strong>：支持 PDF、Word、PPT、Excel、视频等多种格式</li>
                        <li>🔍 <strong>智能搜索</strong>：按关键词、分类、类型快速找到你需要的资料</li>
                        <li>⭐ <strong>评分评论</strong>：对资料进行评价，帮助他人做出选择</li>
                        <li>❤️ <strong>收藏功能</strong>：一键收藏，随时回顾</li>
                        <li>👤 <strong>个人中心</strong>：管理你的上传、下载和收藏历史</li>
                    </ul>
                </section>

                {/* 技术栈 */}
                <section className="about-section">
                    <div className="section-icon">⚙️</div>
                    <h2>技术栈</h2>
                    <div className="tech-tags">
                        <span className="tech-tag">React 19</span>
                        <span className="tech-tag">Vite</span>
                        <span className="tech-tag">Node.js</span>
                        <span className="tech-tag">Express</span>
                        <span className="tech-tag">SQLite</span>
                        <span className="tech-tag">Recharts</span>
                    </div>
                </section>

                {/* 联系我们 */}
                <section className="about-section">
                    <div className="section-icon">📬</div>
                    <h2>联系我们</h2>
                    <p>
                        如果你有任何问题、建议或想法，欢迎通过以下方式联系我们：
                    </p>
                    <div className="contact-links">
                        <a href="https://github.com/chunyu0511/studyqpal" target="_blank" rel="noopener noreferrer" className="contact-link">
                            <span>🐙</span> GitHub
                        </a>
                        <a href="mailto:contact@studypal.com" className="contact-link">
                            <span>📧</span> Email
                        </a>
                    </div>
                </section>
            </div>

            <div className="about-footer">
                <p>© 2026 学伴 (StudyPal). Made with ❤️ for students.</p>
            </div>
        </div>
    );
};

export default About;
