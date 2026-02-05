
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

// Footer 组件可以直接在这里定义或者引入（之前在App.jsx里）
const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3 className="footer-title">学伴</h3>
                        <p className="footer-desc">
                            让学习资料触手可及，与千万大学生一起分享知识！
                        </p>
                    </div>
                    {/* ... 其他 footer 内容保持简化 ... */}
                    <div className="footer-bottom">
                        <p>&copy; 2026 学伴. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const MainLayout = () => {
    return (
        <div className="app">
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default MainLayout;
