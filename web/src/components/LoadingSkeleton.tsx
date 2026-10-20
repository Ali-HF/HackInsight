import React from 'react';
import { motion } from 'framer-motion';

export const ShimmerBox: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style = {} }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--bg-subtle)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--card-border)',
        ...style
      }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(153, 222, 123, 0.25), transparent)'
        }}
      />
    </div>
  );
};

export const ForecastSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ maxWidth: '820px' }}>
        <ShimmerBox width="200px" height="24px" borderRadius="var(--radius-pill)" style={{ marginBottom: '14px' }} />
        <ShimmerBox width="85%" height="42px" style={{ marginBottom: '12px' }} />
        <ShimmerBox width="60%" height="24px" />
      </div>

      <div className="grid-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="airlab-card" style={{ padding: '24px' }}>
            <ShimmerBox width="48px" height="48px" borderRadius="var(--radius-md)" style={{ marginBottom: '16px' }} />
            <ShimmerBox width="60%" height="16px" style={{ marginBottom: '10px' }} />
            <ShimmerBox width="45%" height="36px" style={{ marginBottom: '12px' }} />
            <ShimmerBox width="75%" height="20px" borderRadius="var(--radius-pill)" />
          </div>
        ))}
      </div>

      <div className="airlab-card" style={{ padding: '30px' }}>
        <ShimmerBox width="300px" height="24px" style={{ marginBottom: '20px' }} />
        <ShimmerBox width="100%" height="220px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
};
