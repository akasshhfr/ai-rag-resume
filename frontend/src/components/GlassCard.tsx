import React, { useEffect, useRef } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

export default function GlassCard({ children, className = '', animate = false, delay = 0, style }: GlassCardProps) {
  return (
    <div
      className={`el-card ${className}`}
      style={{
        ...style,
        ...(animate ? {
          animation: `fadeSlideUp 0.45s ease both`,
          animationDelay: `${delay}ms`,
          opacity: 0,
        } : {})
      }}
    >
      {children}
    </div>
  );
}
