import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import BadgeModal from '../components/BadgeModal';
import './Profile.css'; // 复用 Profile 的 CSS

const UserProfile = () => {
    const { id } = useParams();
    const { user: currentUser, isAuthenticated } = useAuth();
    const toast = useToast();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [badges, setBadges] = useState([]);
    const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, isFollowing: false });
    const [hoveringFollow, setHoveringFollow] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState(null);

    useEffect(() => {
        if (id) {
            fetchUserProfile();
        }
    }, [id, isAuthenticated]); // 当 ID 或 登录状态变化时重新获取

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            // 获取用户基本资料
            const userData = await authAPI.getUserProfile(id);
            setUser(userData);

            // 获取徽章
            const badgesData = await authAPI.getBadges(id);
            setBadges(badgesData);

            // 获取关注状态
            const followData = await authAPI.getFollowStatus(id);
            setStats(followData);
        } catch (error) {
            console.error('获取用户资料失败:', error);
            toast.error('无法加载用户资料');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!isAuthenticated) {
            toast.error('请先登录');
            return;
        }

        try {
            if (stats.isFollowing) {
                await authAPI.unfollowUser(id);
                setStats(prev => ({
                    ...prev,
                    isFollowing: false,
                    followersCount: prev.followersCount - 1
                }));
                toast.success(`已取消关注 ${user.username}`);
            } else {
                await authAPI.followUser(id);
                setStats(prev => ({
                    ...prev,
                    isFollowing: true,
                    followersCount: prev.followersCount + 1
                }));
                toast.success(`已关注 ${user.username}`);
            }
        } catch (error) {
            console.error('关注操作失败:', error);
            toast.error('操作失败，请稍后重试');
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="container flex-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="container empty-state">
                    <div className="empty-state-icon">🤷‍♂️</div>
                    <h3>用户不存在</h3>
                    <p>该用户可能已被注销或封禁</p>
                    <Link to="/community" className="btn btn-primary">返回社区</Link>
                </div>
            </div>
        );
    }

    // 检查是否是查看自己的资料（虽然这通常会重定向到 /profile，但做个兜底）
    const isSelf = currentUser && currentUser.id == id;

    const nextLevelXP = (user.level || 1) * (user.level || 1) * 100;
    const currentProgress = user.xp ? (user.xp / nextLevelXP) * 100 : 0;

    return (
        <div className="profile-page">
            {selectedBadge && (
                <BadgeModal
                    badge={selectedBadge}
                    onClose={() => setSelectedBadge(null)}
                />
            )}

            <div className="profile-header">
                <div className="container">
                    <div className="profile-header-content">
                        <div className="avatar-section">
                            <div className="avatar avatar-lg">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} />
                                ) : (
                                    <span>{user.username.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="user-info">
                                <div className="user-title-row">
                                    <h1 className="username">{user.username}</h1>
                                    <div className="user-level-tag" style={{ color: getLevelColor(user.level) }}>
                                        Lvl {user.level || 1}
                                    </div>
                                    {isSelf && <span className="admin-badge" style={{ backgroundColor: 'var(--accent-lime)', color: 'black' }}>YOU</span>}
                                </div>
                                <div className="user-social-stats">
                                    <span className="social-stat-item"><b>{stats.followingCount}</b> 正在关注</span>
                                    <span className="social-stat-item"><b>{stats.followersCount}</b> 粉丝</span>
                                </div>
                                <p className="email">加入于 {new Date(user.created_at).toLocaleDateString()}</p>

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
                                        {badges.map(badge => (
                                            <div
                                                key={badge.id}
                                                className="badge-item clickable"
                                                onClick={() => setSelectedBadge(badge)}
                                                title={badge.name}
                                            >
                                                <span className="badge-icon">{badge.icon}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {user.bio && <p className="bio">{user.bio}</p>}
                            </div>
                        </div>

                        <div className="profile-actions">
                            {!isSelf && (
                                <button
                                    className={`btn ${stats.isFollowing ? (hoveringFollow ? 'btn-danger' : 'btn-secondary') : 'btn-primary'}`}
                                    onClick={handleToggleFollow}
                                    onMouseEnter={() => setHoveringFollow(true)}
                                    onMouseLeave={() => setHoveringFollow(false)}
                                    style={{ minWidth: '120px' }}
                                >
                                    {stats.isFollowing
                                        ? (hoveringFollow ? '取消关注' : '已关注')
                                        : '关注'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container empty-state">
                <p>暂时没有更多公开动态可显示。</p>
            </div>
        </div>
    );
};

const getLevelColor = (level) => {
    if (level >= 10) return 'var(--accent-orange)';
    if (level >= 5) return 'var(--accent-lime)';
    return 'var(--text-muted)';
};

export default UserProfile;
