
import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Overview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await adminAPI.getStats();
                setData(res);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!data) return null;

    const { summary, chartData } = data;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">数据概览</h1>
                    <p className="page-subtitle">系统运行状态实时监控</p>
                </div>
            </div>

            {/* 顶部的统计卡片 */}
            <div className="admin-stats">
                <div className="stat-box">
                    <div className="stat-box-icon"><i className="fas fa-users"></i>👥</div>
                    <div className="stat-box-info">
                        <h3>{summary.totalUsers.toLocaleString()}</h3>
                        <p>总用户</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-box-icon"><i className="fas fa-book"></i>📚</div>
                    <div className="stat-box-info">
                        <h3>{summary.totalMaterials.toLocaleString()}</h3>
                        <p>资料库</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-box-icon"><i className="fas fa-download"></i>📥</div>
                    <div className="stat-box-info">
                        <h3>{summary.totalDownloads.toLocaleString()}</h3>
                        <p>累计下载</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-box-icon"><i className="fas fa-comments"></i>💬</div>
                    <div className="stat-box-info">
                        <h3>{summary.totalComments.toLocaleString()}</h3>
                        <p>互动评论</p>
                    </div>
                </div>
            </div>

            {/* 趋势图表 */}
            <div style={{ marginTop: '2rem', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>📈 流量趋势 (近7天)</h3>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>实时更新</div>
                </div>

                <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontSize: '0.9rem', fontWeight: 500 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Area
                                type="monotone"
                                dataKey="users"
                                name="新增用户"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorUser)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="downloads"
                                name="下载量"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorDownload)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="materials"
                                name="新增资料"
                                stroke="#f59e0b"
                                fill="none"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Overview;
