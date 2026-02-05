import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Upload.css';

const Upload = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'note',
        category: '高等数学',
        tags: '', // 新增标签字段
    });

    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 如果未登录，重定向到登录页
    useEffect(() => {
        if (!isAuthenticated) {
            toast.warning('请先登录再执行上传操作');
            navigate('/login');
        }
    }, [isAuthenticated, navigate, toast]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleFileSelect = (selectedFile) => {
        // 验证文件类型
        const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mp4', 'avi', 'mov', 'zip', 'rar'];
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
            toast.error('不支持的文件类型');
            setError('支持的格式：PDF, Word, PPT, Excel, 视频, 压缩包');
            return;
        }

        // 验证文件大小 (100MB)
        const maxSize = 100 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            toast.error('文件过大');
            setError('文件大小不能超过 100MB');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    // 拖拽处理
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 验证
        if (!formData.title.trim()) {
            setError('请输入资料标题');
            return;
        }

        if (!file) {
            setError('请选择要上传的文件');
            return;
        }

        setUploading(true);

        try {
            // 解析标签
            const tagsArray = formData.tags
                .split(/,|，/) // 支持中英文逗号
                .map(t => t.trim())
                .filter(t => t !== '');

            const formDataToSend = new FormData();
            // 建议先添加文本字段，最后添加文件，确保后端 multer 能更早解析到字段
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('tags', JSON.stringify(tagsArray));
            formDataToSend.append('file', file);

            await materialsAPI.upload(formDataToSend);

            setSuccess(true);
            toast.success('资料上传成功！感谢你的贡献 ✨');

            // 2秒后跳转到资料列表
            setTimeout(() => {
                navigate('/materials');
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || '上传失败，请稍后重试';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (success) {
        return (
            <div className="upload-page">
                <div className="container">
                    <div className="success-message">
                        <div className="success-icon">🎉</div>
                        <h2 className="success-title">上传成功！</h2>
                        <p className="success-text">你的资料已成功上传，正在跳转到资料列表...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-page">
            <div className="upload-header">
                <div className="container">
                    <h1 className="page-title">
                        <span className="gradient-text">上传资料</span>
                    </h1>
                    <p className="page-subtitle">
                        分享你的学习资料，帮助更多同学
                    </p>
                </div>
            </div>

            <div className="container">
                <div className="upload-content">
                    <form className="upload-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-error">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        {/* 文件上传区域 */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <span className="section-icon">📎</span>
                                选择文件
                            </h3>

                            <div
                                className={`file-drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                            >
                                {!file ? (
                                    <>
                                        <div className="drop-zone-icon">📤</div>
                                        <p className="drop-zone-title">拖拽文件到这里，或点击选择</p>
                                        <p className="drop-zone-desc">
                                            支持格式：PDF, Word, PPT, Excel, 视频, 压缩包
                                            <br />
                                            最大文件大小：100MB
                                        </p>
                                        <input
                                            type="file"
                                            id="file-input"
                                            className="file-input"
                                            onChange={handleFileInputChange}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.avi,.mov,.zip,.rar"
                                        />
                                        <label htmlFor="file-input" className="btn btn-primary">
                                            选择文件
                                        </label>
                                    </>
                                ) : (
                                    <div className="file-preview">
                                        <div className="file-info">
                                            <div className="file-icon-large">📄</div>
                                            <div className="file-details">
                                                <p className="file-name">{file.name}</p>
                                                <p className="file-size">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setFile(null)}
                                        >
                                            更换文件
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 资料信息 */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <span className="section-icon">📝</span>
                                资料信息
                            </h3>

                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="title" className="form-label">
                                        标题 <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        className="input"
                                        placeholder="例如：高等数学期末考试试卷"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="type" className="form-label">
                                        资料类型 <span className="required">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        className="select"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="exam">📝 试卷</option>
                                        <option value="note">📓 笔记</option>
                                        <option value="course">🎥 网课</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category" className="form-label">
                                        学科分类 <span className="required">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        className="select"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="高等数学">高等数学</option>
                                        <option value="线性代数">线性代数</option>
                                        <option value="概率论">概率论</option>
                                        <option value="大学物理">大学物理</option>
                                        <option value="计算机基础">计算机基础</option>
                                        <option value="程序设计">程序设计</option>
                                        <option value="数据结构">数据结构</option>
                                        <option value="大学英语">大学英语</option>
                                        <option value="思想政治">思想政治</option>
                                        <option value="其他">其他</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="description" className="form-label">
                                        描述
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="input"
                                        placeholder="简单描述一下这份资料的内容，帮助其他同学了解..."
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="tags" className="form-label">
                                        标签 (Tags)
                                    </label>
                                    <input
                                        type="text"
                                        id="tags"
                                        name="tags"
                                        className="input"
                                        placeholder="多个标签用逗号分隔，如：期末真题, 高数上, 必考"
                                        value={formData.tags}
                                        onChange={handleInputChange}
                                    />
                                    <p className="form-help">
                                        添加标签有助于资料被更多人发现
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 提交按钮 */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-ghost btn-lg"
                                onClick={() => navigate('/materials')}
                                disabled={uploading}
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={uploading || !file}
                            >
                                {uploading ? (
                                    <>
                                        <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                        上传中...
                                    </>
                                ) : (
                                    <>
                                        <span>📤</span>
                                        上传资料
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* 上传提示 */}
                    <aside className="upload-tips">
                        <div className="tips-card">
                            <h3 className="tips-title">📌 上传须知</h3>
                            <ul className="tips-list">
                                <li>✅ 确保上传的资料内容合法合规</li>
                                <li>✅ 建议使用清晰准确的标题</li>
                                <li>✅ 添加详细的描述有助于其他同学找到资料</li>
                                <li>✅ 选择正确的类型和分类</li>
                                <li>✅ 支持的文件格式：PDF, Word, PPT, Excel, 视频, 压缩包</li>
                                <li>✅ 单个文件最大 100MB</li>
                            </ul>
                        </div>

                        <div className="tips-card">
                            <h3 className="tips-title">💡 上传小贴士</h3>
                            <ul className="tips-list">
                                <li>🌟 优质的资料会获得更多下载和好评</li>
                                <li>🤝 分享知识，帮助他人，共同进步</li>
                                <li>📊 你可以在个人中心查看上传记录</li>
                                <li>❤️ 感谢你为学习社区做出的贡献</li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Upload;
