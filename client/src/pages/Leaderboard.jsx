import { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import './Leaderboard.css';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const data = await authAPI.getLeaderboard();
            setUsers(data);
        } catch (error) {
            console.error('获取排行榜失败:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="leaderboard-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>正在加载巅峰榜单...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            <div className="container">
                <div className="leaderboard-header">
                    <h1 className="page-title">
                        <span className="gradient-text">先锋贡献榜</span>
                    </h1>
                    <p className="page-subtitle">致敬那些为学习社区做出卓越贡献的开拓者</p>
                </div>

                <div className="podium">
                    {users.slice(0, 3).map((user, index) => (
                        <div key={user.id} className={`podium-item place-${index + 1}`}>
                            <div className="podium-avatar-wrapper">
                                <div className="podium-rank">{index + 1}</div>
                                <div className="avatar podium-avatar">
                                    {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="podium-info">
                                <h3 className="podium-username">{user.username}</h3>
                                <div className="podium-level">Lvl {user.level || 1}</div>
                                <div className="podium-xp">{user.xp || 0} XP</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="leaderboard-list">
                    <div className="list-header">
                        <span className="rank-col">排名</span>
                        <span className="user-col">用户</span>
                        <span className="level-col">等级</span>
                        <span className="upload-col">贡献量</span>
                        <span className="xp-col">总经验</span>
                    </div>
                    {users.slice(3).map((user, index) => (
                        <div key={user.id} className="user-row">
                            <span className="rank-col">#{index + 4}</span>
                            <div className="user-col">
                                <div className="avatar small-avatar">
                                    {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="row-username">{user.username}</span>
                            </div>
                            <span className="level-col">
                                <span className="level-badge" style={{ color: getLevelColor(user.level) }}>
                                    Lvl {user.level || 1}
                                </span>
                            </span>
                            <span className="upload-col">{user.upload_count} 资料</span>
                            <span className="xp-col font-mono">{user.xp || 0}</span>
                        </div>
                    ))}
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

export default Leaderboard;
