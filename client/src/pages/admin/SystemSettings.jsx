
import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        site_name: '',
        allow_registration: true,
        maintenance_mode: false,
        max_upload_size: 100
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminAPI.getSettings();
                setSettings(data);
            } catch (error) {
                console.error(error);
                alert('加载设置失败');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminAPI.updateSettings(settings);
            alert('系统设置已更新');
            // 可以选择在这里刷新页面或者重新获取设置，确保数据同步
        } catch (error) {
            console.error(error);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '800px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">系统设置</h1>
                    <p className="page-subtitle">配置全站参数和开关</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? '保存中...' : '保存更改'}
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>网站名称</label>
                    <input
                        type="text"
                        name="site_name"
                        value={settings.site_name}
                        onChange={handleChange}
                        className="form-control"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>最大上传限制 (MB)</label>
                    <input
                        type="number"
                        name="max_upload_size"
                        value={settings.max_upload_size}
                        onChange={handleChange}
                        style={{ width: '200px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>开放注册</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>允许新用户注册账号</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" name="allow_registration" checked={settings.allow_registration} onChange={handleChange} />
                        <span className="slider round"></span>
                    </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>维护模式</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>开启后仅管理员可访问前台</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode} onChange={handleChange} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>

            <style>{`
                .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e2e8f0; transition: .4s; border-radius: 34px; }
                .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                input:checked + .slider { background-color: #2563eb; }
                input:checked + .slider:before { transform: translateX(24px); }
            `}</style>
        </div>
    );
};

export default SystemSettings;
