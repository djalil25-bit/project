import React from 'react';

/**
 * AgriGovLogo — Professional SVG leaf+shield mark for AgriGov Market
 * Props:
 *   size: number (default 32) — icon size in px
 *   variant: 'full' | 'compact' (default 'full')
 *   className: optional extra class
 */
const AgriGovLogo = ({ size = 32, variant = 'full', className = '' }) => {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AgriGov Market"
      style={{ flexShrink: 0 }}
    >
      {/* Shield base */}
      <path
        d="M20 3L5 9.5V21C5 28.5 11.5 35.2 20 38C28.5 35.2 35 28.5 35 21V9.5L20 3Z"
        fill="url(#shieldGrad)"
      />
      {/* Leaf shape inside shield */}
      <path
        d="M20 12C17 12 14 15 14 19C14 22 16 24.5 19 25.5L19 29H21L21 25.5C24 24.5 26 22 26 19C26 15 23 12 20 12Z"
        fill="white"
        opacity="0.95"
      />
      {/* Leaf vein */}
      <line x1="20" y1="25.5" x2="20" y2="15" stroke="url(#shieldGrad)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Small dots for premium feel */}
      <circle cx="16" cy="18" r="1" fill="white" opacity="0.4" />
      <circle cx="24" cy="18" r="1" fill="white" opacity="0.4" />
      <defs>
        <linearGradient id="shieldGrad" x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f5233" />
          <stop offset="100%" stopColor="#1a7a4a" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (variant === 'compact') return (
    <span className={`agrigov-logo-compact ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {mark}
    </span>
  );

  return (
    <span
      className={`agrigov-logo-full ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}
    >
      {mark}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontSize: size * 0.48,
          fontWeight: 800,
          color: 'var(--primary-dark)',
          letterSpacing: '-0.3px',
          lineHeight: 1.1
        }}>
          AgriGov
        </span>
        <span style={{
          fontSize: size * 0.32,
          fontWeight: 500,
          color: 'var(--primary)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          Market
        </span>
      </span>
    </span>
  );
};

export default AgriGovLogo;
