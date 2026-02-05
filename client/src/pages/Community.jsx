import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ImagePreviewModal from '../components/ImagePreviewModal';
import BountySection from '../components/BountySection';
import './Community.css';

const Community = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const toast = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'feed'
    const [visibleComments, setVisibleComments] = useState(new Set());
    const [postComments, setPostComments] = useState({}); // { postId: [comments] }
    const [commentInputs, setCommentInputs] = useState({}); // { postId: 'content' }

    const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' | 'bounty'

    // 大图预览
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, [activeFilter]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = activeFilter === 'all'
                ? await communityAPI.getPosts()
                : await communityAPI.getFeed();
            setPosts(data);
        } catch (error) {
            console.error('获取帖子失败:', error);
            toast.error('获取动态失败');
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedImages.length > 4) {
            toast.error('最多只能上传 4 张图片');
            return;
        }

        const newImages = [...selectedImages, ...files];
        setSelectedImages(newImages);

        // 生成预览 URL
        const newPreviews = [...previewImages, ...files.map(file => URL.createObjectURL(file))];
        setPreviewImages(newPreviews);
    };

    const removeImage = (index) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newPreviews = previewImages.filter((_, i) => i !== index);

        // 释放旧的 URL 对象
        URL.revokeObjectURL(previewImages[index]);

        setSelectedImages(newImages);
        setPreviewImages(newPreviews);
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim() && selectedImages.length === 0) return;

        setSubmitting(true);
        try {
            // 1. 上传所有图片
            const uploadedImageUrls = [];
            if (selectedImages.length > 0) {
                for (const image of selectedImages) {
                    const res = await communityAPI.uploadPostImage(image);
                    uploadedImageUrls.push(res.url);
                }
            }

            // 2. 创建帖子
            const newPost = await communityAPI.createPost({
                content: newPostContent,
                images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null
            });

            // 更新用户 XP
            if (newPost.currentUserXP) {
                updateUser({ ...user, xp: newPost.currentUserXP, level: (newPost.currentUserLevel || user.level) });
            }

            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setSelectedImages([]);
            setPreviewImages([]);
            toast.success('发布成功！获得 20 XP');
        } catch (error) {
            console.error(error);
            toast.error('发布失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('确定要删除这条帖子吗？')) return;
        try {
            await communityAPI.deletePost(postId);
            setPosts(posts.filter(p => p.id !== postId));
            toast.success('帖子已删除');
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm('确定要删除这条评论吗？')) return;
        try {
            await communityAPI.deleteComment(commentId);
            setPostComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
            // 更新评论计数
            setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));
            toast.success('评论已删除');
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const handleToggleLike = async (postId) => {
        if (!isAuthenticated) {
            toast.error('请先登录');
            return;
        }
        try {
            const res = await communityAPI.toggleLikePost(postId);
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        isLiked: res.liked,
                        like_count: res.liked ? post.like_count + 1 : post.like_count - 1
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('点赞失败:', error);
        }
    };

    const handleToggleComments = async (postId) => {
        const newVisible = new Set(visibleComments);
        if (newVisible.has(postId)) {
            newVisible.delete(postId);
        } else {
            newVisible.add(postId);
            // 如果还没加载过评论，则加载
            if (!postComments[postId]) {
                try {
                    const comments = await communityAPI.getComments(postId);
                    setPostComments(prev => ({ ...prev, [postId]: comments }));
                } catch (error) {
                    console.error('加载评论失败:', error);
                    toast.error('无法加载评论');
                }
            }
        }
        setVisibleComments(newVisible);
    };

    const handleCommentInputChange = (postId, value) => {
        setCommentInputs(prev => ({ ...prev, [postId]: value }));
    };

    const handleSubmitComment = async (postId) => {
        const content = commentInputs[postId];
        if (!content || !content.trim()) return;

        try {
            const newComment = await communityAPI.createComment(postId, content);

            // 更新用户 XP
            if (newComment.currentUserXP) {
                updateUser({ ...user, xp: newComment.currentUserXP, level: (newComment.currentUserLevel || user.level) });
            }

            setPostComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            // 更新帖子的评论数
            setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
            toast.success('评论成功！获得 5 XP');
        } catch (error) {
            console.error('发表评论失败:', error);
            toast.error('发表评论失败');
        }
    };

    return (
        <div className="community-page">
            <div className="container">
                <h1 className="page-title">
                    <span className="gradient-text">学伴社区</span>
                </h1>
                <p className="page-subtitle">在这里，与志同道合的同学自由探讨</p>

                <div className="community-tabs" style={{ marginTop: '2rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '2rem' }}>
                    <button
                        className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
                        onClick={() => setActiveTab('discussion')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'discussion' ? '2px solid var(--accent-lime)' : '2px solid transparent',
                            color: activeTab === 'discussion' ? 'var(--text-light)' : 'var(--text-muted)',
                            padding: '0.5rem 1rem',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'discussion' ? '600' : 'normal'
                        }}
                    >
                        💬 讨论广场
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'bounty' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bounty')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'bounty' ? '2px solid var(--accent-lime)' : '2px solid transparent',
                            color: activeTab === 'bounty' ? 'var(--text-light)' : 'var(--text-muted)',
                            padding: '0.5rem 1rem',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'bounty' ? '600' : 'normal'
                        }}
                    >
                        💰 悬赏大厅
                    </button>
                </div>

                {activeTab === 'bounty' ? (
                    <div style={{ marginTop: '2rem' }}>
                        <BountySection />
                    </div>
                ) : (
                    <div className="community-layout">
                        {/* 左侧主要内容 */}
                        <div className="community-main">
                            {/* 发布广场 */}
                            {isAuthenticated ? (
                                <form className="post-creator ripple-card" onSubmit={handleCreatePost}>
                                    <div className="user-mini-info">
                                        <div className="avatar avatar-sm">
                                            {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="mini-username">想分享点什么？</span>
                                    </div>
                                    <textarea
                                        className="post-input"
                                        placeholder="今天学了什么有趣的东西？或者有什么疑问？"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        maxLength={500}
                                    />

                                    {previewImages.length > 0 && (
                                        <div className="image-previews">
                                            {previewImages.map((src, index) => (
                                                <div key={index} className="preview-image-item">
                                                    <img src={src} alt="预览" />
                                                    <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="post-creator-footer">
                                        <div className="creator-actions">
                                            <input
                                                type="file"
                                                id="post-image-upload"
                                                multiple
                                                accept="image/*"
                                                hidden
                                                onChange={handleImageSelect}
                                            />
                                            <label htmlFor="post-image-upload" className="btn btn-secondary btn-sm" title="添加图片">
                                                📷 图片
                                            </label>
                                            <span className="char-count">{newPostContent.length}/500</span>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submitting || (!newPostContent.trim() && selectedImages.length === 0)}
                                        >
                                            {submitting ? '发布中...' : '发布帖子 🚀'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="login-prompt-card ripple-card">
                                    <h3>加入讨论</h3>
                                    <p>登录后即可发布动态、评论和点赞</p>
                                    <button className="btn btn-primary">立即登录</button>
                                </div>
                            )}

                            {/* 筛选器 */}
                            <div className="community-filters">
                                <button
                                    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('all')}
                                >
                                    🌐 广场动态
                                </button>
                                {isAuthenticated && (
                                    <button
                                        className={`filter-btn ${activeFilter === 'feed' ? 'active' : ''}`}
                                        onClick={() => setActiveFilter('feed')}
                                    >
                                        👥 我的关注
                                    </button>
                                )}
                            </div>

                            {/* 帖子列表 */}
                            <div className="posts-list">
                                {loading ? (
                                    <div className="loading-state">
                                        <div className="spinner"></div>
                                        <p>正在获取动态...</p>
                                    </div>
                                ) : posts.length > 0 ? (
                                    posts.map(post => (
                                        <div key={post.id} className="post-card ripple-card">
                                            <div className="post-header">
                                                <div className="post-author">
                                                    <Link to={`/user/${post.user_id}`} className="avatar avatar-md">
                                                        {post.avatar ? <img src={post.avatar} alt={post.username} /> : post.username.charAt(0).toUpperCase()}
                                                    </Link>
                                                    <div className="author-meta">
                                                        <div className="author-name-row">
                                                            <Link to={`/user/${post.user_id}`} className="author-name">{post.username}</Link>
                                                            {post.level && (
                                                                <span className="level-badge-small" style={{ color: getLevelColor(post.level) }}>
                                                                    Lvl {post.level}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="post-time">{new Date(post.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {(user?.id === post.user_id || user?.role === 'admin') && (
                                                    <button className="delete-btn" onClick={() => handleDeletePost(post.id)} title="删除帖子">
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                            <div className="post-content">
                                                {post.content}
                                            </div>
                                            {post.images && (
                                                <div className={`post-images grid-${JSON.parse(post.images).length > 1 ? 'multi' : 'single'}`}>
                                                    {JSON.parse(post.images).map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt="帖子配图"
                                                            className="post-image"
                                                            onClick={() => setFullScreenImage(img)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <div className="post-footer">
                                                <button
                                                    className={`post-action-btn ${post.isLiked ? 'active' : ''}`}
                                                    onClick={() => handleToggleLike(post.id)}
                                                >
                                                    {post.isLiked ? '❤️' : '🤍'} {post.like_count || 0}
                                                </button>
                                                <button
                                                    className={`post-action-btn ${visibleComments.has(post.id) ? 'active' : ''}`}
                                                    onClick={() => handleToggleComments(post.id)}
                                                >
                                                    💬 {post.comment_count || 0} 评论
                                                </button>
                                            </div>

                                            {/* 评论区 */}
                                            {visibleComments.has(post.id) && (
                                                <div className="comments-section">
                                                    <div className="comments-list">
                                                        {postComments[post.id]?.length > 0 ? (
                                                            postComments[post.id].map(comment => (
                                                                <div key={comment.id} className="comment-item">
                                                                    <div className="comment-header">
                                                                        <Link to={`/user/${comment.user_id}`} className="avatar avatar-sm">
                                                                            {comment.avatar ? <img src={comment.avatar} alt={comment.username} /> : comment.username.charAt(0).toUpperCase()}
                                                                        </Link>
                                                                        <Link to={`/user/${comment.user_id}`} className="comment-author">{comment.username}</Link>
                                                                        {comment.level && (
                                                                            <span className="level-badge-small" style={{ color: getLevelColor(comment.level) }}>
                                                                                Lvl {comment.level}
                                                                            </span>
                                                                        )}
                                                                        <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                                        {(user?.id === comment.user_id || user?.role === 'admin') && (
                                                                            <button className="delete-comment-btn" onClick={() => handleDeleteComment(post.id, comment.id)}>×</button>
                                                                        )}
                                                                    </div>
                                                                    <div className="comment-body">
                                                                        {comment.content}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="no-comments">暂无评论，快来抢沙发吧！</p>
                                                        )}
                                                    </div>

                                                    {isAuthenticated ? (
                                                        <div className="comment-input-area">
                                                            <input
                                                                type="text"
                                                                className="comment-inline-input"
                                                                placeholder="写下你的想法..."
                                                                value={commentInputs[post.id] || ''}
                                                                onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                                                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                                            />
                                                            <button
                                                                className="comment-send-btn"
                                                                onClick={() => handleSubmitComment(post.id)}
                                                                disabled={!commentInputs[post.id]?.trim()}
                                                            >
                                                                发送
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="comment-login-hint">请登录后参与讨论</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📭</div>
                                        <p>暂时还没有动态，去发布第一篇吧！</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 右侧边栏 */}
                        <aside className="community-sidebar">
                            <div className="sidebar-card ripple-card">
                                <h3 className="sidebar-title">社区规则</h3>
                                <ul className="sidebar-list">
                                    <li>保持友善，鼓励互助</li>
                                    <li>不要发布广告或恶意内容</li>
                                    <li>专注于学习与校园生活</li>
                                </ul>
                            </div>

                            <div className="sidebar-card ripple-card">
                                <h3 className="sidebar-title">活跃先锋</h3>
                                <p className="sidebar-text">排行榜前 10 名用户将显示在此。前往 <a href="/leaderboard">贡献榜</a> 查看更多。</p>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

const getLevelColor = (level) => {
    if (level >= 10) return 'var(--accent-orange)';
    if (level >= 5) return 'var(--accent-lime)';
    return 'var(--text-muted)';
};

export default Community;
