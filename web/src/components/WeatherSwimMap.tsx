import React from 'react';
import { CloudRain, Wind, Droplets, Zap, Plus, Minus, Layers, MapPin, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherSwimMapProps {
  selectedCity: 'Lahore' | 'Karachi';
  onSelectCity: (city: 'Lahore' | 'Karachi') => void;
  lahorePm25: number;
  karachiPm25: number;
  lahorePredicted: number;
  karachiPredicted: number;
  lahoreTemp?: number;
  karachiTemp?: number;
  lahoreHumidity?: number;
  karachiHumidity?: number;
  lahoreRain?: number;
  karachiRain?: number;
}

export const WeatherSwimMap: React.FC<WeatherSwimMapProps> = ({
  selectedCity,
  onSelectCity,
  lahorePm25,
  karachiPm25,
  lahorePredicted,
  karachiPredicted,
  lahoreTemp = 20,
  karachiTemp = 29,
  lahoreHumidity = 42,
  karachiHumidity = 38,
  lahoreRain = 0,
  karachiRain = 0
}) => {
  const isLahore = selectedCity === 'Lahore';
  const activePm25 = isLahore ? lahorePm25 : karachiPm25;
  const activePredicted = isLahore ? lahorePredicted : karachiPredicted;
  const isHighRisk = activePredicted > 150.0;

  // Plume color based on active city PM2.5 severity
  const plumeGradient = isHighRisk
    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.55) 0%, rgba(249, 115, 22, 0.45) 32%, rgba(234, 179, 8, 0.35) 58%, rgba(132, 204, 22, 0.18) 78%, rgba(255,255,255,0) 100%)'
    : 'radial-gradient(circle, rgba(234, 179, 8, 0.5) 0%, rgba(132, 204, 22, 0.4) 38%, rgba(34, 197, 94, 0.22) 68%, rgba(255,255,255,0) 100%)';

  // District labels for active city
  const lahoreDistricts = [
    { name: 'WOODLANDS / RAVI', x: '42%', y: '14%' },
    { name: 'SHAHDRA NORTH', x: '65%', y: '16%' },
    { name: 'MALL ROAD', x: '35%', y: '36%' },
    { name: 'GULBERG CENTRAL', x: '50%', y: '40%' },
    { name: 'MODEL TOWN', x: '62%', y: '42%' },
    { name: 'DHA PHASE 5', x: '72%', y: '56%' },
    { name: 'JOHAR TOWN', x: '34%', y: '56%' },
    { name: 'AIRPORT / BEDIAN', x: '82%', y: '42%' },
  ];

  const karachiDistricts = [
    { name: 'NORTH NAZIMABAD', x: '34%', y: '16%' },
    { name: 'GULSHAN-E-IQBAL', x: '58%', y: '18%' },
    { name: 'SADDAR DOWNTOWN', x: '32%', y: '42%' },
    { name: 'CLIFTON SEAFRONT', x: '45%', y: '52%' },
    { name: 'DEFENCE / DHA', x: '64%', y: '46%' },
    { name: 'KORANGI INDUSTRIAL', x: '74%', y: '56%' },
    { name: 'MALIR CANTT', x: '82%', y: '34%' },
    { name: 'PORT QASIM', x: '84%', y: '68%' },
  ];

  const districts = isLahore ? lahoreDistricts : karachiDistricts;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '440px',
      borderRadius: '24px',
      overflow: 'hidden',
      backgroundColor: '#EAF1F5',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 1. Stylized Background Geography Grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.85 }}>
        <defs>
          <pattern id="gridPattern2" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203, 213, 225, 0.35)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridPattern2)" />

        {/* Dynamic Water & River paths based on active region */}
        <AnimatePresence mode="wait">
          {isLahore ? (
            <motion.path
              key="lahore-ravi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              d="M -20 90 Q 240 130 480 70 T 950 115 T 1450 85"
              fill="none"
              stroke="rgba(186, 215, 233, 0.85)"
              strokeWidth="32"
              strokeLinecap="round"
            />
          ) : (
            <motion.path
              key="karachi-coast"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              d="M -50 330 Q 300 270 650 320 T 1400 260 L 1400 500 L -50 500 Z"
              fill="rgba(186, 220, 240, 0.65)"
              stroke="rgba(147, 197, 225, 0.7)"
              strokeWidth="3"
            />
          )}
        </AnimatePresence>

        {/* Ring Roads and Transit Grids */}
        <circle cx="50%" cy="48%" r="180" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle cx="50%" cy="48%" r="280" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
        <line x1="10%" y1="20%" x2="90%" y2="75%" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
        <line x1="20%" y1="80%" x2="80%" y2="20%" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
      </svg>

      {/* 2. District Labels printed on map with smooth cross-fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCity}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {districts.map((d, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: d.x,
                top: d.y,
                fontSize: '0.675rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'rgba(100, 116, 139, 0.75)',
                textTransform: 'uppercase',
                userSelect: 'none'
              }}
            >
              {d.name}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 3. The Atmospheric Aerosol Plume for Active City */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCity}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: [1, 1.03, 1] }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            opacity: { duration: 0.45, ease: 'easeInOut' },
            scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }}
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
      </AnimatePresence>

      {/* 4. Center Primary City Epicenter (Active Node) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCity}
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -8 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10
          }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              border: '2.5px solid #FFFFFF'
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: isHighRisk ? '#EF4444' : '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s ease'
            }}>
              <MapPin size={9} color="#FFFFFF" />
            </div>
          </motion.div>

          <span style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: isHighRisk ? '#991B1B' : '#15803D',
            letterSpacing: '-0.02em',
            textShadow: '0 1px 10px rgba(255,255,255,0.95)',
            transition: 'color 0.3s ease'
          }}>
            {selectedCity}
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#64748B',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 8px',
            borderRadius: '999px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}>
            {isLahore ? '26 Networked Ground Sensors' : '4 Networked Ground Sensors'}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* 5A. ACTIVE GROUND STATION TELEMETRY BADGE (ALWAYS ACCURATE TO CURRENT CITY) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCity + '-station'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '10px 16px',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 12
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isHighRisk ? '#FEE2E2' : '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isHighRisk ? '#DC2626' : '#15803D',
            position: 'relative'
          }}>
            <Radio size={16} />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isHighRisk ? '#EF4444' : '#22C55E',
              boxShadow: isHighRisk ? '0 0 6px #EF4444' : '0 0 6px #22C55E'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0F172A' }}>
                {isLahore ? 'Lahore Ground Station' : 'Karachi Coastal Station'}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: isHighRisk ? '#FEE2E2' : '#DCFCE7',
                color: isHighRisk ? '#991B1B' : '#166534'
              }}>
                {isLahore ? `${lahorePm25.toFixed(1)} µg/m³` : `${karachiPm25.toFixed(1)} µg/m³`}
              </span>
            </div>
            <span style={{ fontSize: '0.675rem', color: '#64748B', display: 'block', marginTop: '1px' }}>
              {isLahore ? 'ID: 0166919645da6ef4 • 26 sensors reporting' : 'ID: 212607b3f328c11e • 4 sensors reporting'}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 5B. REGIONAL NETWORK SWITCH CONTROL (EXPLICIT NAVIGATION BUTTON) */}
      <motion.button
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelectCity(isLahore ? 'Karachi' : 'Lahore')}
        title={`Click to switch monitoring network to ${isLahore ? 'Karachi' : 'Lahore'}`}
        style={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '999px',
          padding: '8px 16px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          zIndex: 12,
          outline: 'none'
        }}
      >
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 800,
          color: '#64748B',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          Switch Grid:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
            {isLahore ? 'Karachi' : 'Lahore'}
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '999px',
            backgroundColor: '#F1F5F9',
            color: '#334155'
          }}>
            {isLahore ? `${karachiPm25.toFixed(1)} µg/m³` : `${lahorePm25.toFixed(1)} µg/m³`}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 800 }}>↗</span>
        </div>
      </motion.button>

      {/* 6. Four Floating Frosted Glass Widgets (WeatherSwim Style) */}

      {/* Bubble 1: RAINFALL */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          position: 'absolute',
          left: '22%',
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
          zIndex: 8
        }}
      >
        <CloudRain size={18} color="#22C55E" style={{ marginBottom: '4px' }} />
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
          {isLahore ? lahoreRain : karachiRain} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>mm</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          RAINFALL
        </span>
      </motion.div>

      {/* Bubble 2: TEMPERATURE */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          position: 'absolute',
          left: '36%',
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
          zIndex: 8
        }}
      >
        <Wind size={18} color="#F97316" style={{ marginBottom: '4px' }} />
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCity}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}
          >
            {isLahore ? lahoreTemp : karachiTemp} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>°C</span>
          </motion.div>
        </AnimatePresence>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          TEMPERATURE
        </span>
      </motion.div>

      {/* Bubble 3: HUMIDITY */}
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
          zIndex: 8
        }}
      >
        <Droplets size={20} color="#0EA5E9" style={{ marginBottom: '4px' }} />
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCity}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}
          >
            {isLahore ? lahoreHumidity : karachiHumidity} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>%</span>
          </motion.div>
        </AnimatePresence>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          HUMIDITY
        </span>
      </motion.div>

      {/* Bubble 4: PM2.5 / AIR QUALITY */}
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
          transition: 'border-color 0.35s ease'
        }}
      >
        <Zap size={20} color={isHighRisk ? '#EF4444' : '#22C55E'} style={{ marginBottom: '4px', transition: 'color 0.3s ease' }} />
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCity}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: isHighRisk ? '#DC2626' : '#16A34A',
              lineHeight: 1,
              transition: 'color 0.3s ease'
            }}
          >
            {activePm25.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>µg/m³</span>
          </motion.div>
        </AnimatePresence>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginTop: '2px' }}>
          PM2.5 / AIR
        </span>
      </motion.div>

      {/* 7. Low-to-High Concentration Legend (Bottom-Left) */}
      <div style={{
        position: 'absolute',
        left: '24px',
        bottom: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
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

      {/* 8. Map Zoom Controls */}
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
