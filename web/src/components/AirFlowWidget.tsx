import React from 'react';
import { Wind, Compass, Leaf, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AirFlowWidgetProps {
  isHighRisk: boolean;
}

export const AirFlowWidget: React.FC<AirFlowWidgetProps> = ({ isHighRisk }) => {
  return (
    <div className="airlab-card" style={{
      padding: '20px 22px',
      borderRadius: '22px',
      backgroundColor: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em' }}>
          Air Flow Status
        </h3>
        <span style={{ fontSize: '0.725rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Compass size={13} color="#22C55E" /> Anemometer
        </span>
      </div>

      {/* Middle Body: Large Speed Number + Circular Compass Dial */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0' }}>
        <div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {isHighRisk ? '3.8' : '7.5'}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>
            km/hours (1.0 m/s)
          </div>
        </div>

        {/* Circular Compass Radar Graphic (Matching WeatherSwim) */}
        <div style={{
          position: 'relative',
          width: '104px',
          height: '104px',
          borderRadius: '50%',
          backgroundColor: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)'
        }}>
          {/* Compass Axis Markings */}
          <span style={{ position: 'absolute', top: '5px', fontSize: '0.625rem', fontWeight: 800, color: '#22C55E' }}>N</span>
          <span style={{ position: 'absolute', right: '7px', fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8' }}>E</span>
          <span style={{ position: 'absolute', bottom: '5px', fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8' }}>S</span>
          <span style={{ position: 'absolute', left: '7px', fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8' }}>W</span>

          {/* Rotating Wind Arrow */}
          <motion.div
            animate={{ rotate: [30, 45, 30] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)'
            }} />
          </motion.div>

          {/* Center Wind Badge */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            border: '1px solid rgba(134, 239, 172, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)'
          }}>
            <Wind size={13} color="#15803D" />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#15803D', marginTop: '1px' }}>
              1.0 m/s
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Alert Banner (WeatherSwim Pill Style) */}
      <div style={{
        backgroundColor: isHighRisk ? '#FEF2F2' : '#F0FDF4',
        border: `1px solid ${isHighRisk ? '#FECACA' : '#DCFCE7'}`,
        borderRadius: '14px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isHighRisk ? (
          <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
        ) : (
          <Leaf size={15} color="#16A34A" style={{ flexShrink: 0 }} />
        )}
        <div style={{ fontSize: '0.725rem', lineHeight: 1.3, color: isHighRisk ? '#991B1B' : '#166534' }}>
          <strong>{isHighRisk ? 'Inversion Alert!' : 'Fresh Air Movement!'}</strong>
          <span style={{ display: 'block', fontSize: '0.675rem', opacity: 0.9 }}>
            {isHighRisk
              ? 'Low boundary layer trapping surface particulate smog.'
              : 'Wind circulation is helping disperse urban pollutants.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AirFlowWidget;
