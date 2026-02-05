
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

const ToastItem = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration);
        return () => clearTimeout(timer);
    }, [toast, removeToast]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return '✨';
            case 'error': return '💢';
            case 'warning': return '⚠️';
            default: return '📢';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`toast-item toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
        >
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-content">{toast.message}</div>
            <div className="toast-close">×</div>
            {/* Sticky tape effect */}
            <div className="toast-tape"></div>
        </motion.div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
