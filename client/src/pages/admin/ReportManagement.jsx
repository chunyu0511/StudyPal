
import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

const ReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, resolved, dismissed, all

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await adminAPI.getReports(filter);
            setReports(data);
        } catch (error) {
            console.error('获取举报列表失败:', error);
            // alert('获取举报列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (id) => {
        if (!window.confirm('确定要驳回这个举报吗？内容将保留。')) return;
        try {
            await adminAPI.updateReportStatus(id, 'dismissed');
            fetchReports();
        } catch (error) {
            console.error(error);
            alert('操作失败');
        }
    };

    const handleResolve = async (id) => {
        try {
            await adminAPI.updateReportStatus(id, 'resolved');
            fetchReports();
        } catch (error) {
            console.error(error);
            alert('操作失败');
        }
    };

    const handleDeleteContent = async (id) => {
        if (!window.confirm('警告：确定要删除被举报的内容吗？此操作不可撤销！')) return;
        try {
            await adminAPI.deleteReportedContent(id);
            alert('内容已删除，举报已标记为处理完成');
            fetchReports();
        } catch (error) {
            console.error(error);
            alert('操作失败');
        }
    };

    const getReasonLabel = (reason) => {
        const map = {
            spam: '垃圾广告',
            inappropriate: '内容不当',
            misleading: '误导性内容',
            copyright: '版权问题',
            other: '其他'
        };
        return map[reason] || reason;
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'rgba(235, 169, 55, 0.15)', color: '#eba937' },
            resolved: { bg: 'rgba(55, 235, 100, 0.15)', color: '#37eb64' },
            dismissed: { bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)' }
        };
        const style = styles[status] || styles.dismissed;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'uppercase'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="report-management">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">举报审核</h1>
                    <p className="page-subtitle">处理用户提交的违规举报</p>
                </div>
                <div className="filter-group">
                    <select
                        className="select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="pending">待处理</option>
                        <option value="resolved">已处理</option>
                        <option value="dismissed">已驳回</option>
                        <option value="all">全部</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-container">
                {loading ? (
                    <div className="loading-state">加载中...</div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <p>没有找到相关举报记录</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>状态</th>
                                <th>举报原因</th>
                                <th>被举报内容 (预览)</th>
                                <th>举报人</th>
                                <th>时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>{getStatusBadge(report.status)}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{getReasonLabel(report.reason)}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.target_type === 'material' ? '资料' : '评论'}</div>
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                            {report.content_preview}
                                        </div>
                                        {report.description && (
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                "补充: {report.description}"
                                            </div>
                                        )}
                                    </td>
                                    <td>{report.reporter_name}</td>
                                    <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        {new Date(report.created_at).toLocaleString()}
                                    </td>
                                    <td>
                                        {report.status === 'pending' && (
                                            <div className="table-actions">
                                                <button
                                                    className="btn-danger-outline"
                                                    style={{ border: '1px solid #eb5757', color: '#eb5757', background: 'transparent' }}
                                                    onClick={() => handleDeleteContent(report.id)}
                                                    title="删除违规内容"
                                                >
                                                    🗑️ 删除内容
                                                </button>
                                                <button
                                                    className="btn-secondary-outline"
                                                    style={{ border: '1px solid #94a3b8', color: '#94a3b8', background: 'transparent' }}
                                                    onClick={() => handleDismiss(report.id)}
                                                    title="驳回举报"
                                                >
                                                    ❌ 驳回
                                                </button>
                                                <button
                                                    className="btn-primary-outline"
                                                    style={{ border: '1px solid #c8ff00', color: '#c8ff00', background: 'transparent' }}
                                                    onClick={() => handleResolve(report.id)}
                                                    title="标记为已处理(不删除)"
                                                >
                                                    ✅ 标记处理
                                                </button>
                                            </div>
                                        )}
                                        {report.status !== 'pending' && (
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>已归档</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ReportManagement;
