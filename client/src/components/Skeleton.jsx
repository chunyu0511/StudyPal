
import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius, className = '' }) => {
    return (
        <div
            className={`skeleton-base ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius || '4px'
            }}
        />
    );
};

export const CardSkeleton = () => {
    return (
        <div className="skeleton-card">
            <Skeleton height="180px" borderRadius="12px 12px 0 0" />
            <div style={{ padding: '1rem' }}>
                <Skeleton width="80%" height="24px" className="mb-2" />
                <Skeleton width="60%" height="16px" className="mb-2" />
                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                    <Skeleton width="40px" height="24px" borderRadius="12px" />
                    <Skeleton width="60px" height="24px" borderRadius="12px" />
                </div>
            </div>
        </div>
    );
};

export const ListSkeleton = ({ rows = 5 }) => {
    return (
        <div className="skeleton-list">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="skeleton-list-item">
                    <Skeleton width="50px" height="50px" borderRadius="8px" />
                    <div style={{ flex: 1 }}>
                        <Skeleton width="70%" height="20px" className="mb-2" />
                        <Skeleton width="40%" height="14px" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
