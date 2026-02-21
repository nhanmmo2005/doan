import React from 'react';
import './Skeleton.css';

export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  if (lines === 1) {
    return <Skeleton className={`skeleton-text ${className}`} />;
  }

  return (
    <div className={`skeleton-text-block ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`skeleton-text ${i === lines - 1 ? 'skeleton-text-short' : ''}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card card ${className}`}>
      <div className="skeleton-card-image">
        <Skeleton style={{ width: '100%', height: '200px' }} />
      </div>
      <div className="skeleton-card-content">
        <SkeletonText lines={2} />
        <div className="skeleton-meta">
          <Skeleton style={{ width: '60px', height: '16px' }} />
          <Skeleton style={{ width: '80px', height: '16px' }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPost({ className = '' }) {
  return (
    <div className={`skeleton-post card ${className}`}>
      <div className="skeleton-post-header">
        <Skeleton className="skeleton-avatar" />
        <div className="skeleton-post-meta">
          <SkeletonText lines={1} className="skeleton-name" />
          <Skeleton style={{ width: '100px', height: '12px' }} />
        </div>
      </div>
      <div className="skeleton-post-content">
        <SkeletonText lines={3} />
      </div>
      <div className="skeleton-post-actions">
        <Skeleton style={{ width: '60px', height: '20px', marginRight: '12px' }} />
        <Skeleton style={{ width: '50px', height: '20px' }} />
      </div>
    </div>
  );
}

export function SkeletonRestaurantGrid({ count = 6 }) {
  return (
    <div className="restaurant-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} className="restaurant-card-wrapper" />
      ))}
    </div>
  );
}

export function SkeletonProfile({ className = '' }) {
  return (
    <div className={`skeleton-profile card ${className}`}>
      <div className="skeleton-profile-header">
        <Skeleton className="skeleton-avatar-large" />
        <div className="skeleton-profile-info">
          <SkeletonText lines={1} className="skeleton-name" />
          <SkeletonText lines={2} className="skeleton-bio" />
          <div className="skeleton-stats">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} style={{ width: '80px', height: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5, className = '' }) {
  return (
    <div className={`skeleton-list ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton style={{ width: '100%', height: '20px' }} />
        </div>
      ))}
    </div>
  );
}