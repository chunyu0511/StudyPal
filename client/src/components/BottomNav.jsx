import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaBook, FaPlusCircle, FaUsers, FaUser } from 'react-icons/fa';
import './BottomNav.css';

const BottomNav = () => {
    const { isAuthenticated } = useAuth();

    // 如果没有登录，虽然会显示按钮但会重定向到登录页（由路由保护）
    // 为了体验，这里可以让按钮直接跳转到 /login 或者保留现状让路由拦截

    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FaHome className="nav-icon" />
                <span className="nav-label">首页</span>
            </NavLink>
            <NavLink to="/materials" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FaBook className="nav-icon" />
                <span className="nav-label">资料</span>
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => `nav-item highlight ${isActive ? 'active' : ''}`}>
                <div className="center-btn">
                    <FaPlusCircle className="nav-icon" />
                </div>
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FaUsers className="nav-icon" />
                <span className="nav-label">社区</span>
            </NavLink>
            <NavLink to={isAuthenticated ? "/profile" : "/login"} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FaUser className="nav-icon" />
                <span className="nav-label">我的</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
