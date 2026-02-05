import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { materialsAPI, interactionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FilePreview from '../components/FilePreview';
import './MaterialDetail.css';

const MaterialDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();

    const [material, setMaterial] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // 编辑相关状态
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '', type: '', category: '' });
    const [savingEdit, setSavingEdit] = useState(false);

    // 举报相关
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('spam');
    const [reportDesc, setReportDesc] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    useEffect(() => {
        fetchMaterialDetail();
    }, [id]);

    const fetchMaterialDetail = async () => {
        setLoading(true);
        try {
            const data = await materialsAPI.getById(id);
            setMaterial(data);

            // 设置用户的交互状态
            if (data.userRating) setUserRating(data.userRating);
            if (data.isFavorited) setIsFavorited(data.isFavorited);

            // 获取评论
            const commentsData = await interactionsAPI.getComments(id);
            setComments(commentsData);
        } catch (error) {
            console.error('获取资料详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            const response = await materialsAPI.download(id);

            // 创建Blob对象
            const blob = new Blob([response.data], { type: response.headers['content-type'] });

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // 优先使用后端返回的文件名，如果没有则使用当前详情中的文件名
            let fileName = material.file_name;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                // 尝试解析 UTF-8 文件名
                const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
                if (utf8Match) {
                    fileName = decodeURIComponent(utf8Match[1]);
                } else {
                    const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
                    if (fileNameMatch) {
                        fileName = fileNameMatch[1];
                    }
                }
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // 清理
            link.remove();
            window.URL.revokeObjectURL(url);

            // 更新下载次数
            setMaterial({ ...material, download_count: material.download_count + 1 });
        } catch (error) {
            console.error('下载失败:', error);
            toast.error('下载失败，请稍后重试');
        }
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorited) {
                await interactionsAPI.removeFavorite(id);
                setIsFavorited(false);
            } else {
                await interactionsAPI.addFavorite(id);
                setIsFavorited(true);
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
        }
    };

    const handleRating = async (rating) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            await interactionsAPI.rate(id, rating);
            setUserRating(rating);
            // 刷新资料详情以获取新的平均评分
            fetchMaterialDetail();
        } catch (error) {
            console.error('评分失败:', error);
            toast.error('评分失败，请稍后重试');
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            return;
        }

        setSubmittingComment(true);
        try {
            const comment = await interactionsAPI.addComment(id, newComment);
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('评论失败:', error);
            toast.error('评论失败，请稍后重试');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('确定要删除这条评论吗？')) {
            return;
        }

        try {
            await interactionsAPI.deleteComment(id, commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('删除评论失败:', error);
            toast.error('删除失败，请稍后重试');
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!isAuthenticated) {
            toast.warning('请先登录');
            return;
        }

        try {
            const comment = comments.find(c => c.id === commentId);

            if (comment.isLiked) {
                // 取消点赞
                const result = await interactionsAPI.unlikeComment(commentId);
                setComments(comments.map(c =>
                    c.id === commentId
                        ? { ...c, isLiked: false, likeCount: result.likeCount }
                        : c
                ));
            } else {
                // 点赞
                const result = await interactionsAPI.likeComment(commentId);
                setComments(comments.map(c =>
                    c.id === commentId
                        ? { ...c, isLiked: true, likeCount: result.likeCount }
                        : c
                ));
            }
        } catch (error) {
            console.error('点赞失败:', error);
            toast.error(error.response?.data?.error || '操作失败，请稍后重试');
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('链接已复制到剪贴板！');
        } catch (err) {
            console.error('复制失败:', err);
            // 降级方案
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            toast.success('链接已复制到剪贴板！');
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setSubmittingReport(true);
        try {
            await interactionsAPI.reportContent({
                targetType: 'material',
                targetId: id,
                reason: reportReason,
                description: reportDesc
            });
            toast.success('举报已提交，感谢您的反馈！');
            setShowReportModal(false);
            setReportDesc('');
            setReportReason('spam');
        } catch (error) {
            console.error('举报失败:', error);
            toast.error(error.response?.data?.error || '提交举报失败，请稍后重试');
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('确定要删除这个资料吗？此操作无法撤销。')) {
            return;
        }

        try {
            await materialsAPI.delete(id);
            toast.success('资料已删除');
            navigate('/materials');
        } catch (error) {
            console.error('删除失败:', error);
            toast.error('删除失败，请稍后重试');
        }
    };

    // 打开编辑模态框
    const openEditModal = () => {
        let tagsString = '';
        try {
            const tags = typeof material.tags === 'string' ? JSON.parse(material.tags) : material.tags;
            if (Array.isArray(tags)) {
                tagsString = tags.join(', ');
            }
        } catch (e) {
            console.error('解析标签失败:', e);
        }

        setEditData({
            title: material.title,
            description: material.description || '',
            type: material.type,
            category: material.category,
            tags: tagsString
        });
        setIsEditing(true);
    };

    // 处理编辑表单变化
    const handleEditChange = (e) => {
        setEditData({
            ...editData,
            [e.target.name]: e.target.value
        });
    };

    // 保存编辑
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editData.title.trim()) {
            toast.error('标题不能为空');
            return;
        }

        setSavingEdit(true);
        try {
            // 解析标签
            const tagsArray = editData.tags
                .split(/,|，/) // 支持中英文逗号
                .map(t => t.trim())
                .filter(t => t !== '');

            const dataToUpdate = {
                ...editData,
                tags: tagsArray
            };

            await materialsAPI.update(id, dataToUpdate);
            toast.success('资料编辑成功');
            setIsEditing(false);
            // 刷新资料信息
            const updatedMaterial = await materialsAPI.getById(id);
            setMaterial(updatedMaterial);
        } catch (error) {
            console.error('更新失败:', error);
            toast.error('更新失败，请稍后重试');
        } finally {
            setSavingEdit(false);
        }
    };

    const getFileIcon = (type) => {
        const icons = {
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'ppt': '📊',
            'pptx': '📊',
            'xls': '📈',
            'xlsx': '📈',
            'mp4': '🎥',
            'avi': '🎥',
            'mov': '🎥',
            'zip': '📦',
            'rar': '📦'
        };
        return icons[type] || '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

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

    if (loading) {
        return (
            <div className="material-detail-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="material-detail-page">
                <div className="container">
                    <div className="error-state">
                        <div className="error-icon">😕</div>
                        <h2>资料不存在</h2>
                        <Link to="/materials" className="btn btn-primary">
                            返回浏览
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const avgRating = material.avg_rating || 0;
    const typeLabels = { exam: '试卷', note: '笔记', course: '网课' };

    return (
        <div className="material-detail-page">
            <div className="container">
                {/* 面包屑导航 */}
                <nav className="breadcrumb">
                    <Link to="/">首页</Link>
                    <span className="separator">/</span>
                    <Link to="/materials">资料</Link>
                    <span className="separator">/</span>
                    <span className="current">{material.title}</span>
                </nav>

                <div className="detail-layout">
                    {/* 主要信息 */}
                    <div className="detail-main">
                        <div className="material-header">
                            <div className="file-icon-large">
                                {getFileIcon(material.file_type)}
                            </div>
                            <div className="header-info">
                                <h1 className="material-title">{material.title}</h1>
                                <div className="material-meta">
                                    <span className="type-badge">{typeLabels[material.type]}</span>
                                    <span className="category-badge">{material.category}</span>
                                    <span className="meta-item">
                                        <span>👁️</span>
                                        {material.view_count} 次查看
                                    </span>
                                    <span className="meta-item">
                                        <span>📥</span>
                                        {material.download_count} 次下载
                                    </span>
                                </div>

                                {/* 标签展示 */}
                                {material.tags && (
                                    <div className="detail-tags">
                                        {(() => {
                                            try {
                                                const tags = typeof material.tags === 'string' ? JSON.parse(material.tags) : material.tags;
                                                return Array.isArray(tags) && tags.map((tag, idx) => (
                                                    <span key={idx} className="detail-tag">#{tag}</span>
                                                ));
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 文件预览区域 */}
                        <FilePreview
                            fileUrl={material.file_path}
                            fileType={material.file_type}
                            title={material.title}
                        />

                        {/* 评分区域 */}
                        <div className="rating-section">
                            <div className="average-rating">
                                <div className="rating-score-row">
                                    <div className="rating-number">{avgRating.toFixed(1)}</div>
                                    <div className="rating-stars-large">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span key={`avg-star-${star}`} className={star <= Math.round(avgRating) ? 'star filled' : 'star'}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="rating-count">{material.rating_count || 0} 人参与评分</div>
                            </div>

                            {isAuthenticated ? (
                                <div className="user-rating">
                                    <p className="rating-label">您的评分</p>
                                    <div className="rating-stars">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className={`star-btn ${star <= (hoverRating || userRating) ? 'filled' : ''}`}
                                                onClick={() => handleRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link to="/login" className="btn btn-sm btn-ghost">登录后参与评分</Link>
                            )}
                        </div>

                        {/* 描述 */}
                        {material.description && (
                            <div className="description-section">
                                <h3 className="section-title">资料描述</h3>
                                <p className="description-text">{material.description}</p>
                            </div>
                        )}

                        {/* 评论区 */}
                        <div className="comments-section">
                            <h3 className="section-title">
                                评论 ({comments.length})
                            </h3>

                            {isAuthenticated && (
                                <form className="comment-form" onSubmit={handleSubmitComment}>
                                    <textarea
                                        className="comment-input"
                                        placeholder="写下你的评论..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows="4"
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submittingComment || !newComment.trim()}
                                    >
                                        {submittingComment ? '发送中...' : '发表评论'}
                                    </button>
                                </form>
                            )}

                            <div className="comments-list">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="comment-item">
                                            <div className="comment-header">
                                                <div className="comment-author">
                                                    <div className="author-avatar">
                                                        {comment.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="author-info">
                                                        <div className="author-name">{comment.username}</div>
                                                        <div className="comment-time">{formatDate(comment.created_at)}</div>
                                                    </div>
                                                </div>
                                                {user && user.id === comment.user_id && (
                                                    <button
                                                        className="delete-comment-btn"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                            <div className="comment-content">{comment.content}</div>
                                            <div className="comment-actions">
                                                <button
                                                    className={`like-btn ${comment.isLiked ? 'liked' : ''}`}
                                                    onClick={() => handleLikeComment(comment.id)}
                                                >
                                                    {comment.isLiked ? '❤️' : '🤍'} {comment.likeCount || 0}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-comments">
                                        <p>还没有评论，来抢沙发吧！</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 侧边栏 */}
                    <aside className="detail-sidebar">
                        <div className="sidebar-card">
                            <h3 className="card-title">文件信息</h3>
                            <div className="file-info-list">
                                <div className="info-item">
                                    <span className="info-label">文件名</span>
                                    <span className="info-value">{material.file_name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">文件大小</span>
                                    <span className="info-value">{formatFileSize(material.file_size)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">文件格式</span>
                                    <span className="info-value">{material.file_type.toUpperCase()}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">上传时间</span>
                                    <span className="info-value">{formatDate(material.created_at)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">上传者</span>
                                    <span className="info-value">
                                        {material.uploader_username}
                                        {material.uploader_level && (
                                            <span className="level-badge-small" style={{ color: getLevelColor(material.uploader_level) }}>
                                                Lvl {material.uploader_level}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button className="btn btn-primary btn-lg btn-block" onClick={handleDownload}>
                                    📥 下载资料
                                </button>
                                <button
                                    className={`btn ${isFavorited ? 'btn-ghost' : 'btn-secondary'} btn-lg btn-block`}
                                    onClick={handleToggleFavorite}
                                >
                                    {isFavorited ? '💔 取消收藏' : '❤️ 收藏'}
                                </button>
                                <button className="btn btn-ghost btn-lg btn-block" onClick={handleShare}>
                                    🔗 分享资料
                                </button>
                                {isAuthenticated && user && material.user_id === user.id && (
                                    <>
                                        <button
                                            className="btn btn-secondary btn-lg btn-block"
                                            onClick={openEditModal}
                                        >
                                            ✏️ 编辑资料
                                        </button>
                                        <button
                                            className="btn btn-danger btn-lg btn-block"
                                            style={{ marginTop: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                                            onClick={handleDelete}
                                        >
                                            🗑️ 删除资料
                                        </button>
                                    </>
                                )}
                                {isAuthenticated && user && material.user_id !== user.id && (
                                    <button
                                        className="btn btn-ghost btn-lg btn-block"
                                        style={{ color: '#eb5757' }}
                                        onClick={() => setShowReportModal(true)}
                                    >
                                        🚩 举报资料
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* 编辑模态框 */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>编辑资料信息</h2>
                            <button className="modal-close" onClick={() => setIsEditing(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveEdit}>
                            <div className="form-group">
                                <label className="form-label">标题 *</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="input"
                                    value={editData.title}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">资料类型</label>
                                <select
                                    name="type"
                                    className="select"
                                    value={editData.type}
                                    onChange={handleEditChange}
                                >
                                    <option value="exam">📝 试卷</option>
                                    <option value="note">📓 笔记</option>
                                    <option value="course">🎥 网课</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">学科分类</label>
                                <select
                                    name="category"
                                    className="select"
                                    value={editData.category}
                                    onChange={handleEditChange}
                                >
                                    <option value="高等数学">高等数学</option>
                                    <option value="线性代数">线性代数</option>
                                    <option value="概率论">概率论</option>
                                    <option value="大学物理">大学物理</option>
                                    <option value="计算机基础">计算机基础</option>
                                    <option value="程序设计">程序设计</option>
                                    <option value="数据结构">数据结构</option>
                                    <option value="大学英语">大学英语</option>
                                    <option value="思想政治">思想政治</option>
                                    <option value="其他">其他</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">描述</label>
                                <textarea
                                    name="description"
                                    className="input"
                                    rows="3"
                                    value={editData.description}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">标签</label>
                                <input
                                    type="text"
                                    name="tags"
                                    className="input"
                                    placeholder="多个标签用逗号分隔"
                                    value={editData.tags}
                                    onChange={handleEditChange}
                                />
                                <p className="form-help">添加标签有助于被更多人搜到</p>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setIsEditing(false)}
                                    disabled={savingEdit}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={savingEdit}
                                >
                                    {savingEdit ? '保存中...' : '提交修改'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 举报模态框 */}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🚩 举报资料</h2>
                            <button className="modal-close" onClick={() => setShowReportModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleReportSubmit} className="admin-form">
                            <div className="form-group">
                                <label className="form-label">举报原因</label>
                                <select
                                    className="select"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    required
                                >
                                    <option value="spam">垃圾广告</option>
                                    <option value="inappropriate">内容不当/不雅</option>
                                    <option value="misleading">误导性内容</option>
                                    <option value="copyright">侵犯版权</option>
                                    <option value="other">其他原因</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">详细描述 (可选)</label>
                                <textarea
                                    className="input"
                                    rows="4"
                                    value={reportDesc}
                                    onChange={(e) => setReportDesc(e.target.value)}
                                    placeholder="请提供更多细节，帮助我们快速处理..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowReportModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-danger" disabled={submittingReport}>
                                    {submittingReport ? '提交中...' : '提交举报'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const getLevelColor = (level) => {
    if (level >= 10) return 'var(--accent-orange)';
    if (level >= 5) return 'var(--accent-lime)';
    return 'var(--text-muted)';
};

export default MaterialDetail;
