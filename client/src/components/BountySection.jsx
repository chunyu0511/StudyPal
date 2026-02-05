import { useState, useEffect } from 'react';
import { bountiesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import '../pages/BountyBoard.css'; // Keep reusing the CSS

const BountySection = () => {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBounty, setNewBounty] = useState({ title: '', description: '', reward_xp: 50, tags: '', images: [] });
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBounties();
    }, []);

    const fetchBounties = async () => {
        setLoading(true);
        try {
            const data = await bountiesAPI.getList();
            setBounties(data);
        } catch (error) {
            console.error('获取悬赏列表失败:', error);
            // toast.error('获取悬赏列表失败'); // Fail silently or less intrusively in a mixed view
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedImages.length > 4) {
            toast.error('最多只能上传 4 张图片');
            return;
        }

        // Upload immediately or wait? Wait is better for UX if server supports it, but here we upload on select often 
        // to get URL. Let's stick to uploading on select to simplify form submission logic (just image URLs array).
        // Actually, let's keep it simple: store file objects and upload on submit.
        // Wait, typical pattern here (Community.jsx) is storing files and uploading on submit.
        const newImages = [...selectedImages, ...files];
        setSelectedImages(newImages);

        const newPreviews = [...previewImages, ...files.map(file => URL.createObjectURL(file))];
        setPreviewImages(newPreviews);
    };

    const removeImage = (index) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newPreviews = previewImages.filter((_, i) => i !== index);
        URL.revokeObjectURL(previewImages[index]);
        setSelectedImages(newImages);
        setPreviewImages(newPreviews);
    };

    const handleCreateBounty = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return;

        if (newBounty.reward_xp > user.xp) {
            toast.error('你的XP不足');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload images
            const uploadedImageUrls = [];
            if (selectedImages.length > 0) {
                // Reuse community upload endpoint (which we might need to expose/update if needed)
                // Assuming we use 'communityAPI.uploadPostImage' or similar. 
                // Let's use communityAPI since it fits 'upload generic image'.
                const { communityAPI } = await import('../utils/api');
                for (const image of selectedImages) {
                    const res = await communityAPI.uploadPostImage(image);
                    uploadedImageUrls.push(res.url);
                }
            }

            const bountyPayload = {
                ...newBounty,
                images: uploadedImageUrls,
                tags: newBounty.tags.split(/[,，\s]+/).filter(t => t.trim().length > 0) // simple comma/space split
            };

            await bountiesAPI.create(bountyPayload);
            toast.success('悬赏发布成功！');
            setShowCreateModal(false);
            setNewBounty({ title: '', description: '', reward_xp: 50, tags: '', images: [] });
            setSelectedImages([]);
            setPreviewImages([]);
            fetchBounties();
            window.location.reload();
        } catch (error) {
            console.error('发布悬赏失败:', error);
            toast.error(error.response?.data?.error || '发布失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bounty-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="section-intro">
                    <h3>悬赏大厅</h3>
                    <p className="text-muted">用 XP 换取知识，解决难题</p>
                </div>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => isAuthenticated ? setShowCreateModal(true) : toast.warning('请先登录')}
                >
                    + 发布悬赏
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <div className="bounty-grid">
                    {bounties.map(bounty => (
                        <Link to={`/bounties/${bounty.id}`} key={bounty.id} className={`bounty-card ${bounty.status}`}>
                            <div className="bounty-status-badge">{bounty.status === 'open' ? '进行中' : '已解决'}</div>
                            <div className="bounty-xp-box">
                                <span className="xp-amount">+{bounty.reward_xp}</span>
                                <span className="xp-label">XP</span>
                            </div>
                            <div className="bounty-content">
                                <h3 className="bounty-title">{bounty.title}</h3>
                                <p className="bounty-desc">{bounty.description.substring(0, 60)}...</p>
                                {bounty.tags && JSON.parse(bounty.tags).length > 0 && (
                                    <div className="bounty-tags" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {JSON.parse(bounty.tags).map((tag, idx) => (
                                            <span key={idx} style={{
                                                fontSize: '0.75rem',
                                                background: 'var(--bg-main)',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-subtle)',
                                                color: 'var(--text-muted)'
                                            }}>#{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="bounty-meta">
                                    <span className="bounty-author">
                                        <div className="micro-avatar">{bounty.username.charAt(0)}</div>
                                        {bounty.username}
                                    </span>
                                    <span className="bounty-answers">💬 {bounty.answer_count} 回答</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {bounties.length === 0 && (
                        <div className="empty-state">
                            暂无悬赏，快来发布第一个吧！
                        </div>
                    )}
                </div>
            )}

            {/* 发布悬赏模态框 - Reuse styles */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>发布新悬赏</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateBounty}>
                            <div className="form-group">
                                <label>悬赏标题</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newBounty.title}
                                    onChange={e => setNewBounty({ ...newBounty, title: e.target.value })}
                                    required
                                    placeholder="例如：求2023高数期末试卷"
                                />
                            </div>
                            <div className="form-group">
                                <label>详细描述</label>
                                <textarea
                                    className="input"
                                    rows="4"
                                    value={newBounty.description}
                                    onChange={e => setNewBounty({ ...newBounty, description: e.target.value })}
                                    required
                                    placeholder="请详细描述你需要什么..."
                                />
                            </div>
                            <div className="form-group">
                                <label>标签 (用逗号或空格分隔)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newBounty.tags}
                                    onChange={e => setNewBounty({ ...newBounty, tags: e.target.value })}
                                    placeholder="例如：高数 期末复习 笔记"
                                />
                            </div>
                            <div className="form-group">
                                <label>添加图片 ({selectedImages.length}/4)</label>
                                <div className="image-upload-area" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {previewImages.map((src, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                            <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '12px', lineHeight: '1', cursor: 'pointer' }}
                                            >×</button>
                                        </div>
                                    ))}
                                    {selectedImages.length < 4 && (
                                        <>
                                            <input
                                                type="file"
                                                id="bounty-image"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageSelect}
                                                hidden
                                            />
                                            <label htmlFor="bounty-image" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>+ 图片</label>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>悬赏XP (当前拥有: {user?.xp})</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="10"
                                    max={user?.xp}
                                    value={newBounty.reward_xp}
                                    onChange={e => setNewBounty({ ...newBounty, reward_xp: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>取消</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? '发布中...' : '确认扣除XP并发布'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BountySection;
