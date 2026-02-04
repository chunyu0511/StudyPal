
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import './AdminLayout.css';

const AdminLayout = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    // 权限保护
    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    if (!user || user.role !== 'admin') return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <span style={{ fontSize: '20px' }}>🛡️</span>
                    <Link to="/admin" className="sidebar-logo">AdminPanel</Link>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" className={({ isActive }) => isActive && window.location.pathname === '/admin' ? "nav-item active" : "nav-item"} end>
                        <span>📊</span> 概览仪表
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <span>👥</span> 用户管理
                    </NavLink>
                    <NavLink to="/admin/materials" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <span>📚</span> 资料管理
                    </NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <span>⚙️</span> 系统设置
                    </NavLink>
                    <NavLink to="/admin/logs" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <span>📝</span> 操作日志
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="admin-user-info">
                        <div className="admin-avatar">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>超级管理员</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        退出登录
                    </button>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link to="/" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>返回前台 &rarr;</Link>
                    </div>
                </div>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
