
import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        site_name: '',
        allow_registration: true,
        maintenance_mode: false,
        max_upload_size: 100
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminAPI.getSettings();
                setSettings(data);
            } catch (error) {
                console.error(error);
                toast.error('加载设置失败');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminAPI.updateSettings(settings);
            toast.success('系统设置已更新');
        } catch (error) {
            console.error(error);
            toast.error('保存设置失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ maxWidth: '800px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">系统设置</h1>
                    <p className="page-subtitle">配置全站参数和开关</p>
                </div>
            </div>
            <div className="settings-form">
                <Skeleton height="80px" className="mb-2" />
                <Skeleton height="80px" className="mb-2" />
                <Skeleton height="60px" className="mb-2" />
                <Skeleton height="60px" />
            </div>
        </div>
    );

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

            <div className="settings-form">
                <div className="setting-item">
                    <label className="setting-label">网站名称</label>
                    <input
                        type="text"
                        name="site_name"
                        value={settings.site_name}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="setting-item">
                    <label className="setting-label">最大上传限制 (MB)</label>
                    <input
                        type="number"
                        name="max_upload_size"
                        value={settings.max_upload_size}
                        onChange={handleChange}
                        style={{ width: '150px' }}
                    />
                </div>

                <div className="setting-item" style={{ gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                    <div>
                        <div className="setting-label">开放注册</div>
                        <div className="setting-description">允许新用户注册账号</div>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" name="allow_registration" checked={settings.allow_registration} onChange={handleChange} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="setting-item" style={{ gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                    <div>
                        <div className="setting-label">维护模式</div>
                        <div className="setting-description">开启后仅管理员可访问前台</div>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode} onChange={handleChange} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
