import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className={className}>
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '8px',
      backgroundColor: '#1E2E1A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#99DE7B',
      boxShadow: '0 2px 6px rgba(30, 46, 26, 0.2)'
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m8 17 4 4 4-4" />
      </svg>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
        air<span style={{ color: 'var(--brand-green-dark)' }}>lab</span>
      </span>
      <span style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: 'var(--brand-green-subtle)',
        color: 'var(--brand-green-text)',
        border: '1px solid rgba(153, 222, 123, 0.4)'
      }}>
        PK EPD
      </span>
    </div>
  </div>
);

export default Logo;
