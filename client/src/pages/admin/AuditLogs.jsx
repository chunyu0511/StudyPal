
const AuditLogs = () => {
    // 模拟数据
    const logs = [
        { id: 1, action: 'DELETE_MATERIAL', target: 'Material #42', user: 'admin', ip: '192.168.1.1', time: '2026-02-04 14:30' },
        { id: 2, action: 'BAN_USER', target: 'User #108', user: 'admin', ip: '192.168.1.1', time: '2026-02-04 12:15' },
        { id: 3, action: 'UPDATE_SETTINGS', target: 'System', user: 'admin', ip: '192.168.1.1', time: '2026-02-03 09:45' },
        { id: 4, action: 'LOGIN', target: 'System', user: 'admin', ip: '192.168.1.1', time: '2026-02-03 09:00' },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">操作日志</h1>
                    <p className="page-subtitle">审计关键操作记录 (模拟数据)</p>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>操作类型</th>
                            <th>操作对象</th>
                            <th>操作人</th>
                            <th>IP地址</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{log.time}</td>
                                <td>
                                    <span style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'var(--text-light)',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '0.25rem',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td>{log.target}</td>
                                <td>
                                    <span style={{
                                        color: 'var(--accent-lime)',
                                        background: 'rgba(200, 255, 0, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}>
                                        {log.user}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
