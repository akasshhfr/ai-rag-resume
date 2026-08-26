import React from 'react';

type BadgeVariant = 'good' | 'warning' | 'bad' | 'locked' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  good:    { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  warning: { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
  bad:     { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  locked:  { backgroundColor: '#f5f5f4', color: '#777169', border: '1px solid #e7e5e4' },
  neutral: { backgroundColor: '#f0efed', color: '#292524', border: '1px solid #e7e5e4' },
};

export default function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`el-badge ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}
