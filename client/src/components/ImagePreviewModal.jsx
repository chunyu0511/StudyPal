import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImagePreviewModal.css';

const ImagePreviewModal = ({ url, onClose }) => {
    if (!url) return null;

    const overlayRef = useRef(null);
    const imgRef = useRef(null);

    // 可以在这里添加手势逻辑，或者简单的点击遮罩关闭

    // 监听 ESC 关闭
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    return createPortal(
        <div className="image-preview-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <button className="close-preview-btn" onClick={onClose}>×</button>
            <div className="image-preview-container">
                <img src={url} alt="Full preview" className="full-screen-image" ref={imgRef} />
            </div>
        </div>,
        document.body
    );
};

export default ImagePreviewModal;
