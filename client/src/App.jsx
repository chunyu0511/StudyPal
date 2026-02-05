import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import PageTransition from './components/PageTransition';

// Pages - Frontend
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Materials from './pages/Materials';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import MaterialDetail from './pages/MaterialDetail';
import Community from './pages/Community';
import BountyDetail from './pages/BountyDetail';
import About from './pages/About';
import Leaderboard from './pages/Leaderboard';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';

// Pages - Admin
import AdminOverview from './pages/admin/Overview';
import UserManagement from './pages/admin/UserManagement';
import MaterialManagement from './pages/admin/MaterialManagement';
import ReportManagement from './pages/admin/ReportManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';

import './App.css';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 前台路由 (MainLayout) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<PageTransition><Home /></PageTransition>} />
          <Route path="login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="materials" element={<PageTransition><Materials /></PageTransition>} />
          <Route path="materials/:id" element={<PageTransition><MaterialDetail /></PageTransition>} />
          <Route path="upload" element={<PageTransition><Upload /></PageTransition>} />
          <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="user/:id" element={<PageTransition><UserProfile /></PageTransition>} />
          <Route path="community" element={<PageTransition><Community /></PageTransition>} />
          <Route path="bounties/:id" element={<PageTransition><BountyDetail /></PageTransition>} />
          <Route path="about" element={<PageTransition><About /></PageTransition>} />
          <Route path="leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Route>

        {/* 后台路由 (AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PageTransition><AdminOverview /></PageTransition>} />
          <Route path="users" element={<PageTransition><UserManagement /></PageTransition>} />
          <Route path="materials" element={<PageTransition><MaterialManagement /></PageTransition>} />
          <Route path="reports" element={<PageTransition><ReportManagement /></PageTransition>} />
          <Route path="settings" element={<PageTransition><SystemSettings /></PageTransition>} />
          <Route path="logs" element={<PageTransition><AuditLogs /></PageTransition>} />
        </Route>

        {/* 404 跳转 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

// 临时占位组件
const ComingSoon = ({ title }) => {
  return (
    <div className="coming-soon">
      <div className="container">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">🚧</div>
          <h1 className="coming-soon-title">{title}</h1>
          <p className="coming-soon-text">此功能正在开发中，敬请期待！</p>
        </div>
      </div>
    </div>
  );
};

export default App;
