import './BadgeModal.css';

const BadgeModal = ({ badge, onClose }) => {
    if (!badge) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="badge-modal-overlay" onClick={onClose}>
            <div className="badge-modal-card" onClick={e => e.stopPropagation()}>
                <button className="badge-modal-close" onClick={onClose}>×</button>

                <div className="badge-modal-glow" style={{ '--glow-color': getRarityColor(badge.rarity) }}></div>

                <div className="badge-modal-header">
                    <div className="badge-modal-icon-wrapper">
                        <span className="badge-modal-icon">{badge.icon}</span>
                    </div>
                    <h2 className="badge-modal-name">{badge.name}</h2>
                    <div className="badge-rarity-pill" style={{ backgroundColor: getRarityColor(badge.rarity) }}>
                        全站仅 {badge.rarity}% 的用户拥有
                    </div>
                </div>

                <div className="badge-modal-body">
                    <p className="badge-modal-desc">{badge.description}</p>
                    <div className="badge-modal-meta">
                        <div className="meta-item">
                            <span className="meta-label">获得日期</span>
                            <span className="meta-value">{formatDate(badge.earned_at)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">勋章稀有度</span>
                            <span className="meta-value">{getRarityText(badge.rarity)}</span>
                        </div>
                    </div>
                </div>

                <div className="badge-modal-footer">
                    <button className="btn btn-primary btn-block" onClick={onClose}>太酷了！</button>
                </div>
            </div>
        </div>
    );
};

const getRarityColor = (rarity) => {
    if (rarity <= 5) return '#ff4d4d'; // 传奇 (Red)
    if (rarity <= 15) return '#f2994a'; // 史诗 (Orange)
    if (rarity <= 30) return '#bb6bd9'; // 稀有 (Purple)
    return '#27ae60'; // 普通 (Green)
};

const getRarityText = (rarity) => {
    if (rarity <= 5) return '✨ 传奇勋章';
    if (rarity <= 15) return '🔥 史诗勋章';
    if (rarity <= 30) return '⭐ 稀有勋章';
    return '🌱 普通勋章';
};

export default BadgeModal;
