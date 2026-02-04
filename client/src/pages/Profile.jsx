import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { materialsAPI, interactionsAPI, authAPI } from '../utils/api';
import MaterialCard from '../components/MaterialCard';
import './Profile.css';

const Profile = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('uploads');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ uploadCount: 0, favoriteCount: 0, downloadCount: 0 });
    const [uploads, setUploads] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [downloads, setDownloads] = useState([]);
    const [editing, setEditing] = useState(false);
    const [profileData, setProfileData] = useState({ bio: '', avatar: '' });

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUserData();
        }
    }, [isAuthenticated, user, activeTab]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // 获取统计数据
            const statsData = await authAPI.getStats();
            setStats(statsData);

            // 根据当前标签获取不同的数据
            if (activeTab === 'uploads') {
                const uploadsData = await interactionsAPI.getUploadHistory();
                setUploads(uploadsData);
            } else if (activeTab === 'favorites') {
                const favoritesData = await interactionsAPI.getFavorites();
                setFavorites(favoritesData);
            } else if (activeTab === 'downloads') {
                const downloadsData = await interactionsAPI.getDownloadHistory();
                setDownloads(downloadsData);
            }
        } catch (error) {
            console.error('获取用户数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        setProfileData({
            bio: user.bio || '',
            avatar: user.avatar || ''
        });
        setEditing(true);
    };

    const handleSaveProfile = async () => {
        try {
            const updatedUser = await authAPI.updateProfile(profileData);
            updateUser(updatedUser.user);
            setEditing(false);
        } catch (error) {
            console.error('更新个人信息失败:', error);
            alert('更新失败，请稍后重试');
        }
    };

    const handleInputChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    if (!isAuthenticated) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="not-logged-in">
                        <div className="lock-icon">🔒</div>
                        <h2>请先登录</h2>
                        <p>登录后即可查看您的个人中心</p>
                        <Link to="/login" className="btn btn-primary btn-lg">
                            前往登录
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* 个人信息头部 */}
            <div className="profile-header">
                <div className="container">
                    <div className="profile-header-content">
                        <div className="avatar-section">
                            <div className="avatar">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="user-info">
                                <h1 className="username">{user.username}</h1>
                                <p className="email">{user.email}</p>
                                {!editing && user.bio && (
                                    <p className="bio">{user.bio}</p>
                                )}
                            </div>
                        </div>

                        {!editing ? (
                            <button className="btn btn-ghost" onClick={handleEditProfile}>
                                ✏️ 编辑资料
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                                    取消
                                </button>
                                <button className="btn btn-primary" onClick={handleSaveProfile}>
                                    保存
                                </button>
                            </div>
                        )}
                    </div>

                    {editing && (
                        <div className="edit-form">
                            <div className="form-group">
                                <label>头像URL</label>
                                <input
                                    type="text"
                                    name="avatar"
                                    className="input"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={profileData.avatar}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>个人简介</label>
                                <textarea
                                    name="bio"
                                    className="input"
                                    placeholder="介绍一下自己..."
                                    value={profileData.bio}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>
                        </div>
                    )}

                    {/* 统计卡片 */}
                    <div className="stats-cards">
                        <div className="stat-card">
                            <div className="stat-icon">📤</div>
                            <div className="stat-content">
                                <div className="stat-number">{stats.uploadCount}</div>
                                <div className="stat-label">上传的资料</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">❤️</div>
                            <div className="stat-content">
                                <div className="stat-number">{stats.favoriteCount}</div>
                                <div className="stat-label">收藏的资料</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📥</div>
                            <div className="stat-content">
                                <div className="stat-number">{stats.downloadCount}</div>
                                <div className="stat-label">下载的资料</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 标签页 */}
            <div className="container">
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
                        onClick={() => setActiveTab('uploads')}
                    >
                        📤 我的上传
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                    >
                        ❤️ 我的收藏
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'downloads' ? 'active' : ''}`}
                        onClick={() => setActiveTab('downloads')}
                    >
                        📥 下载历史
                    </button>
                </div>

                {/* 内容区域 */}
                <div className="tab-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>加载中...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'uploads' && (
                                <div className="materials-grid">
                                    {uploads.length > 0 ? (
                                        uploads.map(material => (
                                            <MaterialCard key={material.id} material={material} />
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">📦</div>
                                            <h3>还没有上传资料</h3>
                                            <p>分享您的学习资料，帮助更多同学</p>
                                            <Link to="/upload" className="btn btn-primary">
                                                上传资料
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'favorites' && (
                                <div className="materials-grid">
                                    {favorites.length > 0 ? (
                                        favorites.map(material => (
                                            <MaterialCard key={material.id} material={material} />
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">❤️</div>
                                            <h3>还没有收藏资料</h3>
                                            <p>浏览资料时点击❤️即可收藏</p>
                                            <Link to="/materials" className="btn btn-primary">
                                                浏览资料
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'downloads' && (
                                <div className="materials-grid">
                                    {downloads.length > 0 ? (
                                        downloads.map(material => (
                                            <MaterialCard key={material.id} material={material} />
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">📥</div>
                                            <h3>还没有下载记录</h3>
                                            <p>下载资料后会在这里显示</p>
                                            <Link to="/materials" className="btn btn-primary">
                                                浏览资料
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
