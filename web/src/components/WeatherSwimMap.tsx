import React from 'react';
import { CloudRain, Wind, Droplets, Zap, Plus, Minus, Layers, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeatherSwimMapProps {
  city: 'Lahore' | 'Karachi';
  currentPm25: number;
  predictedPm25: number;
  isHighRisk: boolean;
}

export const WeatherSwimMap: React.FC<WeatherSwimMapProps> = ({
  city,
  currentPm25,
  isHighRisk
}) => {
  // District coordinates and names based on selected city
  const districts = city === 'Lahore'
    ? [
        { name: 'WOODLANDS / RAVI', x: '35%', y: '12%' },
        { name: 'YISHUN / SHAHDRAS', x: '60%', y: '15%' },
        { name: 'MALL ROAD', x: '24%', y: '40%' },
        { name: 'GULBERG CENTRAL', x: '46%', y: '42%' },
        { name: 'MODEL TOWN', x: '58%', y: '43%' },
        { name: 'DHA PHASE 5', x: '68%', y: '58%' },
        { name: 'JOHAR TOWN', x: '26%', y: '58%' },
        { name: 'BAHRIA / TOA PAYOH', x: '63%', y: '61%' },
        { name: 'AIRPORT / BEDIAN', x: '82%', y: '42%' },
        { name: 'RAIWIND', x: '40%', y: '85%' },
      ]
    : [
        { name: 'NORTH NAZIMABAD', x: '35%', y: '15%' },
        { name: 'GULSHAN-E-IQBAL', x: '60%', y: '18%' },
        { name: 'SADDAR DOWNTOWN', x: '32%', y: '42%' },
        { name: 'CLIFTON SEAFRONT', x: '45%', y: '50%' },
        { name: 'DEFENCE / DHA', x: '62%', y: '46%' },
        { name: 'KORANGI INDUSTRIAL', x: '72%', y: '56%' },
        { name: 'MALIR CANTT', x: '82%', y: '36%' },
        { name: 'PORT QASIM', x: '85%', y: '68%' },
        { name: 'MANORA ISLAND', x: '25%', y: '65%' },
      ];

  // Plume color based on PM2.5 severity
  const plumeGradient = isHighRisk
    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.55) 0%, rgba(249, 115, 22, 0.45) 32%, rgba(234, 179, 8, 0.35) 58%, rgba(132, 204, 22, 0.18) 78%, rgba(255,255,255,0) 100%)'
    : 'radial-gradient(circle, rgba(234, 179, 8, 0.5) 0%, rgba(132, 204, 22, 0.4) 38%, rgba(34, 197, 94, 0.22) 68%, rgba(255,255,255,0) 100%)';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '430px',
      borderRadius: '24px',
      overflow: 'hidden',
      backgroundColor: 'var(--map-bg, #EAF1F5)',
      border: '1px solid var(--card-border, #E2E8F0)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 1. Stylized Background Geography (Subtle Roads, Coastline & Water) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.85 }}>
        <defs>
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203, 213, 225, 0.35)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridPattern)" />

        {/* Abstract Coastlines & River curves */}
        {city === 'Lahore' ? (
          // Ravi River curve
          <path
            d="M -20 80 Q 220 120 450 60 T 900 110 T 1400 90"
            fill="none"
            stroke="rgba(186, 215, 233, 0.8)"
            strokeWidth="32"
            strokeLinecap="round"
          />
        ) : (
          // Karachi Arabian Sea Coastline
          <path
            d="M -50 340 Q 300 280 600 320 T 1300 270 L 1300 500 L -50 500 Z"
            fill="rgba(186, 220, 240, 0.6)"
            stroke="rgba(147, 197, 225, 0.6)"
            strokeWidth="3"
          />
        )}

        {/* Major Arterial Roads / Ring Roads */}
        <circle cx="50%" cy="48%" r="180" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle cx="50%" cy="48%" r="280" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
        <line x1="10%" y1="20%" x2="90%" y2="75%" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
        <line x1="20%" y1="80%" x2="80%" y2="20%" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
      </svg>

      {/* 2. District Labels printed cleanly on map */}
      {districts.map((d, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'rgba(100, 116, 139, 0.75)',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {d.name}
        </span>
      ))}

      {/* 3. The Atmospheric Aerosol Plume (WeatherSwim Heatmap center) */}
      <motion.div
        animate={{ scale: [1, 1.03, 1], opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '540px',
          height: '380px',
          borderRadius: '50%',
          background: plumeGradient,
          filter: 'blur(34px)',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '48%'
        }}
      />

      {/* 4. Center Location Marker & City Pin */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '48%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        zIndex: 5
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid #FFFFFF'
        }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: isHighRisk ? '#EF4444' : '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={8} color="#FFFFFF" />
          </div>
        </div>
        <span style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: isHighRisk ? '#991B1B' : '#15803D',
          letterSpacing: '-0.02em',
          textShadow: '0 1px 8px rgba(255,255,255,0.9)'
        }}>
          {city}
        </span>
      </div>

      {/* 5. Four Floating Frosted Glass Widgets (Matching WeatherSwim Exactly) */}

      {/* Top-Left Bubble: RAINFALL */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          position: 'absolute',
          left: '23%',
          top: '18%',
          width: '124px',
          height: '124px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 8,
          cursor: 'pointer'
        }}
      >
        <CloudRain size={18} color="#22C55E" style={{ marginBottom: '4px' }} />
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
          0 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>mm</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          RAINFALL
        </span>
      </motion.div>

      {/* Bottom-Center-Left Bubble: TEMPERATURE */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          position: 'absolute',
          left: '37%',
          top: '38%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 8,
          cursor: 'pointer'
        }}
      >
        <Wind size={18} color="#F97316" style={{ marginBottom: '4px' }} />
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
          23 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>°C</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          TEMPERATURE
        </span>
      </motion.div>

      {/* Top-Right Bubble: HUMIDITY */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          position: 'absolute',
          left: '58%',
          top: '15%',
          width: '136px',
          height: '136px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 8,
          cursor: 'pointer'
        }}
      >
        <Droplets size={20} color="#0EA5E9" style={{ marginBottom: '4px' }} />
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
          68 <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>%</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          HUMIDITY
        </span>
      </motion.div>

      {/* Bottom-Right Bubble: PM2.5 / AIR QUALITY */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          position: 'absolute',
          left: '68%',
          top: '36%',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isHighRisk ? '2px solid rgba(239, 68, 68, 0.5)' : '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 14px 34px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 8,
          cursor: 'pointer'
        }}
      >
        <Zap size={20} color={isHighRisk ? '#EF4444' : '#22C55E'} style={{ marginBottom: '4px' }} />
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isHighRisk ? '#DC2626' : '#16A34A', lineHeight: 1 }}>
          {currentPm25.toFixed(0)} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>µg/m³</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          PM2.5 / AIR
        </span>
      </motion.div>

      {/* 6. Concentration Legend (Bottom-Left) */}
      <div style={{
        position: 'absolute',
        left: '24px',
        bottom: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '10px 16px',
        borderRadius: '16px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        border: '1px solid rgba(255,255,255,0.8)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
          <span>Low (0)</span>
          <span style={{ color: '#EF4444' }}>High (300+)</span>
        </div>
        <div style={{
          width: '130px',
          height: '7px',
          borderRadius: '999px',
          background: 'linear-gradient(to right, #22C55E, #EAB308, #F97316, #EF4444)'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#334155' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
          PM2.5 Concentration
        </div>
      </div>

      {/* 7. Map Controls (Bottom-Right/Right Edge) */}
      <div style={{
        position: 'absolute',
        right: '20px',
        bottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10
      }}>
        <button style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#334155'
        }}>
          <Layers size={14} />
        </button>
        <button style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#334155'
        }}>
          <Plus size={14} />
        </button>
        <button style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#334155'
        }}>
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
};

export default WeatherSwimMap;
