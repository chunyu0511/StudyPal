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
        // 如果是文件名，添加后端路径
        // 注意：fileUrl 可能已经包含 /uploads/ 前缀（取决于后端返回），也可能只是文件名
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
                <video controls width="100%" poster="/video-placeholder.png">
                    <source src={fullUrl} type={`video/${type === 'mov' ? 'mp4' : type}`} />
                    您的浏览器不支持HTML5视频。
                </video>
            </div>
        );
    }

    // 渲染PDF预览
    if (type === 'pdf' || type === 'application/pdf') {
        return (
            <div className="file-preview-container pdf-preview">
                <iframe
                    src={`${fullUrl}#toolbar=0`}
                    title={title}
                    width="100%"
                    height="600px"
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

    // 不支持预览的文件类型
    return (
        <div className="file-preview-container no-preview">
            <div className="no-preview-content">
                <div className="file-icon-large">
                    {getFileIcon(type)}
                </div>
                <h3>此文件暂不支持在线预览</h3>
                <p>请下载文件到本地查看详细内容</p>
                <a href={fullUrl} download className="btn btn-primary">
                    📥 下载文件
                </a>
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
        'txt': '📄', 'md': '📄'
    };
    return icons[type] || '📎';
};

export default FilePreview;
