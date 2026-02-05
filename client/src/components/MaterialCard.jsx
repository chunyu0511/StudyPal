import { Link } from 'react-router-dom';
import './MaterialCard.css';

const MaterialCard = ({ material }) => {
    // 计算平均评分
    const avgRating = material.avg_rating || 0;

    // 获取文件类型图标
    const getFileIcon = (fileType) => {
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            ppt: '📊',
            pptx: '📊',
            xls: '📈',
            xlsx: '📈',
            mp4: '🎥',
            avi: '🎥',
            mov: '🎥',
            zip: '📦',
            rar: '📦',
        };
        return icons[fileType?.toLowerCase()] || '📁';
    };

    // 获取类型标签
    const getTypeLabel = (type) => {
        const labels = {
            exam: '试卷',
            note: '笔记',
            course: '网课',
        };
        return labels[type] || type;
    };

    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 格式化日期
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        if (days < 365) return `${Math.floor(days / 30)}个月前`;
        return `${Math.floor(days / 365)}年前`;
    };

    return (
        <Link to={`/materials/${material.id}`} className="material-card">
            <div className="material-card-header">
                <div className="file-icon">{getFileIcon(material.file_type)}</div>
                <div className="material-badges">
                    <span className={`badge badge-type type-${material.type}`}>
                        {getTypeLabel(material.type)}
                    </span>
                </div>
            </div>

            <div className="material-card-body">
                <h3 className="material-title">{material.title}</h3>
                <p className="material-description">
                    {material.description || '暂无描述'}
                </p>

                {/* 标签展示 */}
                {material.tags && (
                    <div className="material-tags">
                        {(() => {
                            try {
                                const tags = typeof material.tags === 'string' ? JSON.parse(material.tags) : material.tags;
                                return Array.isArray(tags) && tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="tag-badge">#{tag}</span>
                                ));
                            } catch (e) {
                                return null;
                            }
                        })()}
                    </div>
                )}

                <div className="material-meta">
                    <span className="meta-item">
                        <span className="meta-icon">📚</span>
                        {material.category}
                    </span>
                    <span className="meta-item">
                        <span className="meta-icon">💾</span>
                        {formatFileSize(material.file_size)}
                    </span>
                </div>

                <div className="material-stats">
                    <div className="stat-group">
                        <span className="stat-item">
                            <span className="stat-icon">⭐</span>
                            <span className="stat-value">{avgRating.toFixed(1)}</span>
                        </span>
                        <span className="stat-item">
                            <span className="stat-icon">👁️</span>
                            <span className="stat-value">{material.view_count || 0}</span>
                        </span>
                        <span className="stat-item">
                            <span className="stat-icon">⬇️</span>
                            <span className="stat-value">{material.download_count || 0}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="material-card-footer">
                <div className="uploader-info">
                    <div className="uploader-avatar">
                        {material.uploader_username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="uploader-name">{material.uploader_username}</span>
                </div>
                <span className="upload-time">{formatDate(material.created_at)}</span>
            </div>
        </Link>
    );
};

export default MaterialCard;
