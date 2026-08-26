import React, { useEffect, useRef } from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreGauge({ score, size = 120, label }: ScoreGaugeProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const strokeWidth = 8;
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - score / 100);

  let strokeColor = '#dc2626'; // bad
  if (score >= 80) strokeColor = '#16a34a'; // good
  else if (score >= 60) strokeColor = '#b45309'; // warning

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.setProperty('--dash-total', `${circumference}`);
      circleRef.current.style.setProperty('--dash-offset', `${targetOffset}`);
      circleRef.current.style.animation = 'gaugeAnim 1.4s cubic-bezier(0.4,0,0.2,1) forwards';
    }
  }, [score, circumference, targetOffset]);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e7e5e4" strokeWidth={strokeWidth} fill="transparent" />
        <circle ref={circleRef} cx={size/2} cy={size/2} r={radius} stroke={strokeColor} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: size > 150 ? '2.5rem' : '1.6rem', fontWeight: 300, color: strokeColor, lineHeight: 1 }}>{score}</span>
        {label && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.5px' }}>{label}</span>}
      </div>
    </div>
  );
}
