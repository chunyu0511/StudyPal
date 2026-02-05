import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { materialsAPI, interactionsAPI, authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import MaterialCard from '../components/MaterialCard';
import BadgeModal from '../components/BadgeModal';
import './Profile.css';

const Profile = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('uploads');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ uploadCount: 0, favoriteCount: 0, downloadCount: 0 });
    const [uploads, setUploads] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [downloads, setDownloads] = useState([]);
    const [views, setViews] = useState([]);
    const [badges, setBadges] = useState([]);
    const [editing, setEditing] = useState(false);
    const [profileData, setProfileData] = useState({ bio: '', avatar: '' });
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
    const [showUsersModal, setShowUsersModal] = useState({ open: false, title: '', users: [] });

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

            // 获取徽章数据
            const badgesData = await authAPI.getBadges(user.id);
            setBadges(badgesData);

            // 获取关注统计
            const fStats = await authAPI.getFollowStatus(user.id);
            setFollowStats({ followersCount: fStats.followersCount, followingCount: fStats.followingCount });

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
            } else if (activeTab === 'views') {
                const viewsData = await interactionsAPI.getViewHistory();
                setViews(viewsData);
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
            toast.error('更新失败，请稍后重试');
        }
    };

    const handleShowFollowers = async () => {
        try {
            const data = await authAPI.getFollowers(user.id);
            setShowUsersModal({ open: true, title: '我的粉丝', users: data });
        } catch (error) {
            console.error(error);
        }
    };

    const handleShowFollowing = async () => {
        try {
            const data = await authAPI.getFollowing(user.id);
            setShowUsersModal({ open: true, title: '我关注的人', users: data });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件大小 (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('图片大小不能超过 2MB');
            return;
        }

        try {
            const res = await authAPI.uploadAvatar(file);
            updateUser({ ...user, avatar: res.avatar });
            toast.success('头像上传成功');
        } catch (error) {
            console.error('上传头像失败:', error);
            toast.error('上传失败，请重试');
        }
    };

    const handleInputChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const nextLevelXP = (user?.level || 1) * (user?.level || 1) * 100;
    const currentProgress = user?.xp ? (user.xp / nextLevelXP) * 100 : 0;

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
            {/* 勋章详请弹窗 */}
            {selectedBadge && (
                <BadgeModal
                    badge={selectedBadge}
                    onClose={() => setSelectedBadge(null)}
                />
            )}

            {showUsersModal.open && (
                <div className="modal-overlay" onClick={() => setShowUsersModal({ ...showUsersModal, open: false })}>
                    <div className="modal-content users-list-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{showUsersModal.title}</h3>
                            <button className="close-btn" onClick={() => setShowUsersModal({ ...showUsersModal, open: false })}>×</button>
                        </div>
                        <div className="modal-body">
                            {showUsersModal.users.length > 0 ? (
                                <div className="modal-users-grid">
                                    {showUsersModal.users.map(u => (
                                        <div key={u.id} className="user-list-item">
                                            <div className="avatar avatar-xs">
                                                {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="user-list-info">
                                                <span className="user-list-name">{u.username}</span>
                                                <span className="user-list-level">Lvl {u.level || 1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-modal-text">暂无记录</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 个人信息头部 */}
            <div className="profile-header">
                <div className="container">
                    <div className="profile-header-content">
                        <div className="avatar-section">
                            <div className="avatar avatar-lg">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="user-info">
                                <div className="user-title-row">
                                    <h1 className="username">{user.username}</h1>
                                    <div className="user-level-tag" style={{ color: getLevelColor(user.level) }}>
                                        Lvl {user.level || 1}
                                    </div>
                                    {user.role === 'admin' && <span className="admin-badge">ADMIN</span>}
                                </div>
                                <div className="user-social-stats">
                                    <span className="social-stat-item clickable" onClick={handleShowFollowing}><b>{followStats.followingCount}</b> 正在关注</span>
                                    <span className="social-stat-item clickable" onClick={handleShowFollowers}><b>{followStats.followersCount}</b> 粉丝</span>
                                </div>
                                <p className="email">{user.email}</p>

                                <div className="user-xp-bar">
                                    <div className="xp-label">
                                        <span>经验值</span>
                                        <span>{user.xp || 0} / {nextLevelXP} XP</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div className="progress-fill" style={{ width: `${currentProgress}%` }}></div>
                                    </div>
                                </div>

                                {badges.length > 0 && (
                                    <div className="badges-list">
                                        {badges.slice(0, 5).map(badge => (
                                            <div
                                                key={badge.id}
                                                className="badge-item clickable"
                                                onClick={() => setSelectedBadge(badge)}
                                                title={`点击查看: ${badge.name}`}
                                            >
                                                <span className="badge-icon">{badge.icon}</span>
                                            </div>
                                        ))}
                                        {badges.length > 5 && <span className="more-badges">+{badges.length - 5}</span>}
                                    </div>
                                )}

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
                        <div className="edit-form ripple-card">
                            <div className="form-group avatar-upload-group">
                                <label>个人头像</label>
                                <div className="avatar-preview-container">
                                    <div className="avatar avatar-xl">
                                        {user.avatar ? <img src={user.avatar} alt="预览" /> : user.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="upload-controls">
                                        <input
                                            type="file"
                                            id="avatar-input"
                                            hidden
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                        <label htmlFor="avatar-input" className="btn btn-secondary btn-sm">
                                            📤 选择新图片
                                        </label>
                                        <p className="upload-hint">支持 JPG/PNG，大小不超过 2MB</p>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>个人简介</label>
                                <textarea
                                    name="bio"
                                    value={profileData.bio}
                                    onChange={handleInputChange}
                                    placeholder="介绍一下你自己..."
                                    maxLength={100}
                                />
                                <span className="char-limit">{profileData.bio.length}/100</span>
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
                    <button
                        className={`tab-btn ${activeTab === 'views' ? 'active' : ''}`}
                        onClick={() => setActiveTab('views')}
                    >
                        👁️ 浏览历史
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
                                            <div className="empty-state-icon">📦</div>
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
                                            <div className="empty-state-icon">❤️</div>
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
                                            <div className="empty-state-icon">📥</div>
                                            <h3>还没有下载记录</h3>
                                            <p>下载资料后会在这里显示</p>
                                            <Link to="/materials" className="btn btn-primary">
                                                浏览资料
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'views' && (
                                <div className="materials-grid">
                                    {views.length > 0 ? (
                                        views.map(material => (
                                            <MaterialCard key={material.id} material={material} />
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">👁️</div>
                                            <h3>还没有浏览记录</h3>
                                            <p>浏览资料后会在这里显示</p>
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

const getLevelColor = (level) => {
    if (level >= 10) return 'var(--accent-orange)';
    if (level >= 5) return 'var(--accent-lime)';
    return 'var(--text-muted)';
};

export default Profile;
