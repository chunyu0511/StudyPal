import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo" onClick={closeMenu}>
                        <span className="logo-icon">📚</span>
                        <span className="logo-text">学伴</span>
                    </Link>

                    {/* 移动端菜单按钮 */}
                    <button
                        className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* 导航区域 (Desktop & Mobile Dropdown) */}
                    <div className={`navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
                        {/* 导航链接 */}
                        <div className="navbar-links">
                            <Link to="/materials" className="nav-link" onClick={closeMenu}>
                                <span className="nav-icon">🔍</span>
                                浏览资料
                            </Link>
                            <Link to="/community" className="nav-link" onClick={closeMenu}>
                                <span className="nav-icon">💬</span>
                                社区交流
                            </Link>
                            {isAuthenticated && (
                                <Link to="/upload" className="nav-link" onClick={closeMenu}>
                                    <span className="nav-icon">📤</span>
                                    上传资料
                                </Link>
                            )}
                            <Link to="/leaderboard" className="nav-link" onClick={closeMenu}>
                                <span className="nav-icon">🏆</span>
                                先锋榜
                            </Link>
                            <Link to="/about" className="nav-link" onClick={closeMenu}>
                                <span className="nav-icon">💡</span>
                                关于我们
                            </Link>
                        </div>

                        {/* 用户菜单 */}
                        <div className="navbar-actions">
                            {isAuthenticated ? (
                                <div className="user-menu">
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="nav-link admin-link" onClick={closeMenu}>
                                            <span className="nav-icon">🛡️</span>
                                            管理后台
                                        </Link>
                                    )}
                                    <Link to="/profile" className="user-avatar" onClick={closeMenu}>
                                        <div className="avatar avatar-sm">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.username} />
                                            ) : (
                                                <span>{user.username.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <span className="username">{user.username}</span>
                                    </Link>
                                    <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                                        退出登录
                                    </button>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className="btn btn-ghost btn-sm" onClick={closeMenu}>
                                        登录
                                    </Link>
                                    <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                                        注册
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
