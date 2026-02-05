import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bountiesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './BountyBoard.css'; // Reuse CSS

const BountyDetail = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [bounty, setBounty] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAnswer, setNewAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // For answer images
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    // For answer comments
    const [expandedComments, setExpandedComments] = useState(new Set()); // answerId -> bool
    const [answerComments, setAnswerComments] = useState({}); // answerId -> []
    const [commentInputs, setCommentInputs] = useState({}); // answerId -> string

    // Image fullscreen view
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        fetchBountyDetail();
    }, [id]);

    const fetchBountyDetail = async () => {
        setLoading(true);
        try {
            const data = await bountiesAPI.getById(id);
            setBounty(data.bounty);
            setAnswers(data.answers);
        } catch (error) {
            console.error('获取悬赏详情失败:', error);
            toast.error('悬赏不存在');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBounty = async () => {
        if (!window.confirm('确定要撤销此悬赏吗？将退还 XP 并删除悬赏。')) return;
        try {
            await bountiesAPI.cancel(id);
            toast.success('已撤销，XP已退还');
            window.location.href = '/community'; // Redirect to community
        } catch (error) {
            toast.error(error.response?.data?.error || '撤销失败');
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

    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        if (!newAnswer.trim() && selectedImages.length === 0) return;

        setSubmitting(true);
        try {
            // Upload images first
            const uploadedImageUrls = [];
            if (selectedImages.length > 0) {
                const { communityAPI } = await import('../utils/api');
                for (const image of selectedImages) {
                    const res = await communityAPI.uploadPostImage(image);
                    uploadedImageUrls.push(res.url);
                }
            }

            const payload = {
                content: newAnswer,
                images: uploadedImageUrls
            };

            const newAnswerData = await bountiesAPI.answer(id, payload);
            setAnswers([...answers, newAnswerData]);
            setNewAnswer('');
            setSelectedImages([]);
            setPreviewImages([]);
            toast.success('回答提交成功！');
        } catch (error) {
            console.error('提交回答失败:', error);
            toast.error(error.response?.data?.error || '提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleComments = async (answerId) => {
        const newSet = new Set(expandedComments);
        if (newSet.has(answerId)) {
            newSet.delete(answerId);
        } else {
            newSet.add(answerId);
            if (!answerComments[answerId]) {
                try {
                    const comments = await bountiesAPI.getAnswerComments(answerId);
                    setAnswerComments(prev => ({ ...prev, [answerId]: comments }));
                } catch (e) {
                    console.error(e);
                }
            }
        }
        setExpandedComments(newSet);
    };

    const submitAnswerComment = async (answerId) => {
        const content = commentInputs[answerId];
        if (!content?.trim()) return;

        try {
            const newComment = await bountiesAPI.addAnswerComment(answerId, content);
            setAnswerComments(prev => ({
                ...prev,
                [answerId]: [...(prev[answerId] || []), newComment]
            }));
            setCommentInputs(prev => ({ ...prev, [answerId]: '' }));
            toast.success('评论成功');
        } catch (error) {
            toast.error('评论失败');
        }
    };

    const handleAcceptAnswer = async (answerId) => {
        if (!window.confirm('确认采纳此回答？这将结贴并把XP转给对方。')) return;

        try {
            await bountiesAPI.acceptAnswer(id, answerId);
            toast.success('已采纳回答！');
            // 刷新状态
            fetchBountyDetail();
        } catch (error) {
            console.error('采纳失败:', error);
            toast.error('采纳失败');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;
    if (!bounty) return <div className="container">悬赏未找到</div>;

    const isOwner = isAuthenticated && user?.id === bounty.user_id;

    return (
        <div className="bounty-detail-page">
            <div className="container">
                <Link to="/community" className="back-link">← 返回社区</Link>

                <div className="bounty-detail-header">
                    <div className="bounty-detail-xp">+{bounty.reward_xp} XP</div>
                    <h1>{bounty.title}</h1>
                    <div className="bounty-meta" style={{ marginBottom: '1.5rem' }}>
                        <span>发布者: {bounty.username}</span>
                        <span> • {new Date(bounty.created_at).toLocaleDateString()}</span>
                        <span className={`status-tag ${bounty.status}`}> • {bounty.status === 'open' ? '🟢 进行中' : '🔴 已结束'}</span>
                    </div>
                    <div className="description-text">
                        {bounty.description}
                    </div>
                    {bounty.tags && JSON.parse(bounty.tags).length > 0 && (
                        <div className="bounty-tags" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {JSON.parse(bounty.tags).map((tag, idx) => (
                                <span key={idx} style={{
                                    background: 'var(--bg-main)',
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-muted)'
                                }}>#{tag}</span>
                            ))}
                        </div>
                    )}
                    {bounty.images && (
                        <div className="bounty-images" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {JSON.parse(bounty.images).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt="悬赏配图"
                                    style={{ width: '100%', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                                    onClick={() => setFullScreenImage(img)}
                                />
                            ))}
                        </div>
                    )}

                    {isOwner && bounty.status === 'open' && !bounty.solved_by && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', textAlign: 'right' }}>
                            <button className="btn btn-sm btn-outline-danger" onClick={handleCancelBounty}>
                                撤销悬赏 (退还 XP)
                            </button>
                        </div>
                    )}
                </div>

                <div className="answers-section">
                    <h2>回答 ({answers.length})</h2>

                    {bounty.status === 'open' && isAuthenticated && !isOwner && (
                        <form onSubmit={handleAnswerSubmit} className="comment-form">
                            <textarea
                                className="comment-input"
                                rows="4"
                                placeholder="提供你的解决方案..."
                                value={newAnswer}
                                onChange={e => setNewAnswer(e.target.value)}
                                style={{ marginBottom: '1rem' }}
                            />

                            {previewImages.length > 0 && (
                                <div className="image-previews" style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    {previewImages.map((src, index) => (
                                        <div key={index} className="preview-image-item" style={{ position: 'relative' }}>
                                            <img src={src} alt="预览" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button type="button" className="remove-image-btn" onClick={() => removeImage(index)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', border: 'none', cursor: 'pointer' }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <input
                                        type="file"
                                        id="answer-image-upload"
                                        multiple
                                        accept="image/*"
                                        hidden
                                        onChange={handleImageSelect}
                                    />
                                    <label htmlFor="answer-image-upload" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>📷 添加图片</label>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={submitting || (!newAnswer.trim() && selectedImages.length === 0)}>
                                    {submitting ? '提交中...' : '提交回答'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="answers-list">
                        {answers.map(answer => (
                            <div key={answer.id} className={`answer-card ${answer.is_accepted ? 'accepted' : ''}`}>
                                {answer.is_accepted === 1 && <div className="accepted-badge">✅ 已采纳 (获得悬赏)</div>}

                                <div className="answer-header">
                                    <div className="comment-author">
                                        <div className="micro-avatar">{answer.username.charAt(0)}</div>
                                        <strong>{answer.username}</strong>
                                    </div>
                                    <span className="comment-time">{new Date(answer.created_at).toLocaleString()}</span>
                                </div>

                                <div className="comment-content" style={{ margin: '1rem 0', whiteSpace: 'pre-wrap' }}>
                                    {answer.content}
                                </div>

                                {answer.images && (
                                    <div className="answer-images" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '1rem' }}>
                                        {JSON.parse(answer.images).map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt="回答配图"
                                                style={{ width: '100%', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                                                onClick={() => setFullScreenImage(img)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="answer-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => toggleComments(answer.id)}
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        💬 评论 ({expandedComments.has(answer.id) ? '收起' : '展开'})
                                    </button>

                                    {isOwner && bounty.status === 'open' && (
                                        <button
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => handleAcceptAnswer(answer.id)}
                                        >
                                            采纳此回答
                                        </button>
                                    )}
                                </div>

                                {expandedComments.has(answer.id) && (
                                    <div className="answer-comments" style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-subtle)' }}>
                                        {answerComments[answer.id]?.map(comment => (
                                            <div key={comment.id} className="comment-item" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{comment.username}:</span>
                                                <span>{comment.content}</span>
                                            </div>
                                        ))}
                                        {isAuthenticated && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                                                    placeholder="回复..."
                                                    value={commentInputs[answer.id] || ''}
                                                    onChange={e => setCommentInputs({ ...commentInputs, [answer.id]: e.target.value })}
                                                    onKeyPress={e => e.key === 'Enter' && submitAnswerComment(answer.id)}
                                                />
                                                <button className="btn btn-secondary btn-sm" onClick={() => submitAnswerComment(answer.id)}>发送</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {fullScreenImage && (
                <div
                    className="modal-overlay"
                    onClick={() => setFullScreenImage(null)}
                    style={{ zIndex: 2000, background: 'rgba(0,0,0,0.9)' }}
                >
                    <img
                        src={fullScreenImage}
                        alt="Zoomed"
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />
                    <button
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
                        onClick={() => setFullScreenImage(null)}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default BountyDetail;
