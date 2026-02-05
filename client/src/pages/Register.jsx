import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            toast.error('两次输入的密码不一致');
            setError('两次输入的密码不一致');
            return;
        }
        if (formData.password.length < 6) {
            toast.warning('密码长度至少为6个字符');
            setError('密码长度至少为6个字符');
            return;
        }
        setLoading(true);
        try {
            await register(formData.username, formData.email, formData.password);
            toast.success(`注册成功！欢迎加入，${formData.username} ✨`);
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.error || '注册失败，请稍后重试';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h2>创建账号</h2>
                <p>加入 StudyPal，开始知识共享</p>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>用户名</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>邮箱</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>密码</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>确认密码</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? '注册中...' : '注册'}
                </button>
            </form>

            <div className="auth-footer">
                已有账号？ <Link to="/login">直接登录</Link>
            </div>
        </div>
    );
};

export default Register;
