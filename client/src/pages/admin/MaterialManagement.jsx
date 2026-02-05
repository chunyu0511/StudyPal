
import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const MaterialManagement = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const data = await adminAPI.getMaterials();
                setMaterials(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('确定要强制删除此资料吗？（物理删除）')) return;
        try {
            await adminAPI.deleteMaterial(id);
            setMaterials(materials.filter(m => m.id !== id));
            alert('删除成功');
        } catch (error) {
            alert('删除失败');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">资料管理</h1>
                    <p className="page-subtitle">审核及管理通过平台上传的所有文件</p>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>资料 ID</th>
                            <th>资料详情</th>
                            <th>格式</th>
                            <th>大小</th>
                            <th style={{ textAlign: 'right' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map(m => (
                            <tr key={m.id}>
                                <td>#{m.id}</td>
                                <td>
                                    <div className="table-row-title">
                                        <a href={`/materials/${m.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>
                                            {m.title}
                                        </a>
                                    </div>
                                    <div className="table-row-sub" style={{ color: 'var(--text-muted)' }}>
                                        上传者: {m.uploader_username} • {new Date(m.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent-lime)' }}>
                                        {m.file_type}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{(m.file_size / 1024 / 1024).toFixed(2)} MB</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 107, 53, 0.3)', background: 'transparent', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                        onClick={() => handleDelete(m.id)}
                                    >
                                        🗑️ 强制删除
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

export default MaterialManagement;
