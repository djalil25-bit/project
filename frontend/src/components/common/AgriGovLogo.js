import React from 'react';

/**
 * AgriGovLogo — Professional SVG leaf+shield mark for AgriGov Market
 * Props:
 *   size: number (default 32) — icon size in px
 *   variant: 'full' | 'compact' (default 'full')
 *   className: optional extra class
 */
const AgriGovLogo = ({ size = 32, variant = 'full', className = '' }) => {
  const logoSrc = "/images/agrigov_market_logo_annotated_version.png";
  
  const mark = (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      flexShrink: 0
    }}>
      <img 
        src={logoSrc} 
        alt="AgriGov Logo" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '🌾'; // Fallback emoji
        }}
      />
    </div>
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
          color: '#1a4731', // Dark green matching the logo
          letterSpacing: '-0.3px',
          lineHeight: 1.1
        }}>
          AgriGov
        </span>
        <span style={{
          fontSize: size * 0.32,
          fontWeight: 500,
          color: '#22543d', // Medium green
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
