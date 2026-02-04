
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages - Frontend
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Materials from './pages/Materials';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import MaterialDetail from './pages/MaterialDetail';

// Pages - Admin
import AdminOverview from './pages/admin/Overview';
import UserManagement from './pages/admin/UserManagement';
import MaterialManagement from './pages/admin/MaterialManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 前台路由 (MainLayout) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="materials" element={<Materials />} />
            <Route path="materials/:id" element={<MaterialDetail />} />
            <Route path="upload" element={<Upload />} />
            <Route path="profile" element={<Profile />} />
            <Route path="about" element={<ComingSoon title="关于我们" />} />
          </Route>

          {/* 后台路由 (AdminLayout) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="materials" element={<MaterialManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="logs" element={<AuditLogs />} />
          </Route>

          {/* 404 跳转 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
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
