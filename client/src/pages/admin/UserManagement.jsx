
import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await adminAPI.getUsers();
                setUsers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleBan = async (id, currentStatus) => {
        const action = currentStatus ? '解封' : '封禁';
        if (!window.confirm(`确定要${action}此用户吗？`)) return;

        try {
            const res = await adminAPI.toggleBan(id);
            setUsers(users.map(u => u.id === id ? { ...u, is_banned: res.is_banned } : u));
            alert(`${action}成功`);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || '操作失败');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">用户管理</h1>
                    <p className="page-subtitle">查看和管理所有注册用户</p>
                </div>
                <button className="btn btn-primary" onClick={() => alert('此功能正在开发中')}>+ 添加用户</button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>用户 ID</th>
                            <th>基本信息</th>
                            <th>角色权限</th>
                            <th>状态</th>
                            <th>注册时间</th>
                            <th style={{ textAlign: 'right' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ opacity: u.is_banned ? 0.6 : 1, background: u.is_banned ? '#f9fafb' : 'transparent' }}>
                                <td>#{u.id}</td>
                                <td>
                                    <div className="table-row-title">{u.username}</div>
                                    <div className="table-row-sub">{u.email}</div>
                                </td>
                                <td>
                                    <span className={`role-badge ${u.role}`}>
                                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                                    </span>
                                </td>
                                <td>
                                    {u.is_banned ? (
                                        <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.8rem' }}>🛑 已封禁</span>
                                    ) : (
                                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.8rem' }}>✅ 正常</span>
                                    )}
                                </td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="delete-btn"
                                        style={{
                                            color: u.is_banned ? '#16a34a' : '#dc2626',
                                            background: u.is_banned ? '#dcfce7' : '#fee2e2'
                                        }}
                                        onClick={() => handleBan(u.id, u.is_banned)}
                                    >
                                        {u.is_banned ? '解封' : '封禁'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
