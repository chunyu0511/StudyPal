import { useState } from 'react';
import './FilePreview.css';

const FilePreview = ({ fileUrl, fileType, title }) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    if (!fileUrl || !fileType) {
        return null;
    }

    // 获取完整的文件URL
    let fullUrl = fileUrl;
    if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:')) {
        const path = fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl;
        if (path.startsWith('/uploads/')) {
            fullUrl = `http://localhost:3000${path}`;
        } else {
            fullUrl = `http://localhost:3000/uploads${path}`;
        }
    }

    // 规范化文件类型
    const type = fileType.toLowerCase();

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    // 渲染图片预览
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type) || ['image/jpeg', 'image/png', 'image/gif'].includes(type)) {
        return (
            <div className="file-preview-container image-preview">
                {loading && <div className="preview-loading"><div className="spinner"></div></div>}
                <img
                    src={fullUrl}
                    alt={title}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{ display: loading ? 'none' : 'block' }}
                />
                {error && <div className="preview-error">无法加载图片</div>}
            </div>
        );
    }

    // 渲染视频预览
    if (['mp4', 'webm', 'ogg', 'mov'].includes(type) || ['video/mp4', 'video/webm'].includes(type)) {
        return (
            <div className="file-preview-container video-preview">
                <div className="video-wrapper">
                    <video controls width="100%">
                        <source src={fullUrl} type={`video/${type === 'mov' ? 'mp4' : type}`} />
                        您的浏览器不支持HTML5视频。
                    </video>
                </div>
            </div>
        );
    }

    // 渲染音频预览
    if (['mp3', 'wav', 'ogg'].includes(type) || ['audio/mpeg', 'audio/wav'].includes(type)) {
        return (
            <div className="file-preview-container audio-preview">
                <div className="audio-wrapper">
                    <div className="audio-info">
                        <span className="audio-icon">🎵</span>
                        <span className="audio-title">{title}</span>
                    </div>
                    <audio controls className="custom-audio">
                        <source src={fullUrl} type={`audio/${type === 'mp3' ? 'mpeg' : type}`} />
                        您的浏览器不支持音频播放。
                    </audio>
                </div>
            </div>
        );
    }

    // 渲染PDF预览
    if (type === 'pdf' || type === 'application/pdf') {
        return (
            <div className="file-preview-container pdf-preview">
                <div className="preview-header">
                    <span>📑 PDF 在线预览</span>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="btn-link">在新窗口打开</a>
                </div>
                <iframe
                    src={`${fullUrl}#toolbar=0`}
                    title={title}
                    width="100%"
                    height="600px"
                    onLoad={handleLoad}
                >
                    <div className="pdf-fallback">
                        <p>您的浏览器不支持直接预览PDF。</p>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                            下载查看
                        </a>
                    </div>
                </iframe>
            </div>
        );
    }

    // 不支持预览的文件类型 (Office, Zip 等)
    return (
        <div className="file-preview-container no-preview">
            <div className="no-preview-content">
                <div className="preview-icon-box">
                    <span className="large-icon">{getFileIcon(type)}</span>
                </div>
                <h3 className="no-preview-title">该文件类型暂不支持在线预览</h3>
                <p className="no-preview-desc">您可以将其下载到设备后使用对应软件查看</p>

                <div className="preview-actions">
                    <a href={fullUrl} download className="btn btn-primary btn-lg">
                        📥 安全下载资料
                    </a>
                    {(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(type)) && (
                        <p className="office-tip">💡 提示：Word/PPT/Excel 资料下载后体验更佳</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// 辅助函数：获取文件图标
const getFileIcon = (type) => {
    const icons = {
        'doc': '📝', 'docx': '📝',
        'ppt': '📊', 'pptx': '📊',
        'xls': '📈', 'xlsx': '📈',
        'zip': '📦', 'rar': '📦',
        'txt': '📄', 'md': '📄',
        'mp3': '🎵', 'wav': '🎵',
        'pdf': '📄'
    };
    return icons[type] || '📎';
};

export default FilePreview;
