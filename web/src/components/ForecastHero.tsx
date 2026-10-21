import React, { useState } from 'react';
import type { CityForecast, TimeSeriesPoint } from '../types';
import { TrendingUp, ShieldCheck, Compass, CheckCircle2, SlidersHorizontal, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TiltCard } from './TiltCard';
import { AtmosphericGlobe } from './AtmosphericGlobe';
import { ForecastSkeleton } from './LoadingSkeleton';

interface ForecastHeroProps {
  city: 'Lahore' | 'Karachi';
  forecast?: CityForecast;
  timeseries: TimeSeriesPoint[];
}

export const ForecastHero: React.FC<ForecastHeroProps> = ({ city, forecast, timeseries }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; ts: string } | null>(null);
  const [timeFilter, setTimeFilter] = useState<'48h' | '24h' | '12h'>('48h');
  const [show3DView, setShow3DView] = useState(false);

  if (!forecast) {
    return <ForecastSkeleton />;
  }

  const current = forecast.current_pm25;
  const predicted = forecast.predicted_pm25_24h;
  const lower80 = forecast.lower_80;
  const upper80 = forecast.upper_80;
  const delta = predicted - forecast.baseline_persistence;
  const isHighRisk = predicted > 150.0;

  const filteredSeries = timeseries.slice(
    timeFilter === '12h' ? -12 : timeFilter === '24h' ? -24 : -48
  );

  const maxVal = Math.max(...filteredSeries.map(t => t.pm25), upper80, 200);
  const minVal = 0;
  const svgWidth = 860;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 28;

  const pointsData = filteredSeries.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(filteredSeries.length - 1, 1)) * (svgWidth - 2 * paddingX - 90);
    const y = svgHeight - paddingY - ((pt.pm25 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
    return { x, y, pt };
  });

  const polylineStr = pointsData.map(p => `${p.x},${p.y}`).join(' ');

  const forecastX = svgWidth - paddingX - 10;
  const forecastY = svgHeight - paddingY - ((predicted - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
  const lowerY = svgHeight - paddingY - ((lower80 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
  const upperY = svgHeight - paddingY - ((upper80 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Crisp Section Header with 3D Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-green">EPD Verified Telemetry</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Zero-Leakage HistGradientBoosting</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            24-Hour Predictive PM2.5 Forecast & Telemetry • {city}
          </h2>
        </div>
        <button
          onClick={() => setShow3DView(!show3DView)}
          className="btn-outline"
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: show3DView ? 'var(--brand-green-subtle)' : 'transparent',
            borderColor: show3DView ? 'var(--brand-green)' : 'var(--card-border)',
            color: show3DView ? 'var(--brand-green-text)' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.8rem'
          }}
        >
          <Layers size={14} />
          {show3DView ? 'Hide 3D Atmosphere' : 'View 3D Particle Cloud'}
        </button>
      </div>

      <AnimatePresence>
        {show3DView && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="airlab-card"
            style={{ padding: '20px', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  3D Ambient Dispersion Simulator • {city}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Particulate aerosol suspension based on optical low-cost sensor telemetry.
                </p>
              </div>
              <span className={isHighRisk ? "badge badge-hazard" : "badge badge-green"}>
                {isHighRisk ? "Hazardous Density" : "Stable Dispersion"}
              </span>
            </div>
            <AtmosphericGlobe city={city} pm25={current} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern, Balanced KPI Grid */}
      <div className="grid-4">
        {/* Card 1: Current Observation */}
        <TiltCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: 0 }}>
              <Compass size={18} />
            </div>
            <span className={current > 150 ? "badge badge-hazard" : "badge badge-yellow"}>
              {current > 150 ? "Smog Alert" : "Moderate"}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Ground Observation
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.03em' }}>
            {current.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Pak-NEQS: 35 µg/m³ benchmark
          </div>
        </TiltCard>

        {/* Card 2: 24h Horizon Forecast */}
        <TiltCard style={{ borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.4)' : 'rgba(153, 222, 123, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="green-icon-box" style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              marginBottom: 0,
              backgroundColor: isHighRisk ? 'var(--danger-bg)' : 'var(--brand-green-subtle)',
              color: isHighRisk ? 'var(--danger-text)' : 'var(--brand-green-text)'
            }}>
              <TrendingUp size={18} />
            </div>
            <span className={isHighRisk ? "badge badge-hazard" : "badge badge-green"}>
              {isHighRisk ? "Emergency Alert" : "Within Standard"}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            24h Horizon Forecast (t+24)
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.03em' }}>
            {predicted.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isHighRisk ? 'var(--danger-text)' : 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            {isHighRisk ? "Exceeds 150 µg/m³ threshold" : "Standard municipal bounds"}
          </div>
        </TiltCard>

        {/* Card 3: 80% Conformal Prediction Band */}
        <TiltCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <span className="badge badge-green">82.4% Coverage</span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            80% Conformal Band
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', letterSpacing: '-0.03em' }}>
            [{lower80.toFixed(0)}, {upper80.toFixed(0)}] <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Calibrated residual bounds
          </div>
        </TiltCard>

        {/* Card 4: Persistence Delta */}
        <TiltCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: 0 }}>
              <CheckCircle2 size={18} />
            </div>
            <span className="badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
              Baseline Ref
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Persistence Baseline Delta
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.03em' }}>
            {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Naive baseline: {forecast.baseline_persistence.toFixed(1)} µg/m³
          </div>
        </TiltCard>
      </div>

      {/* Interactive Time Series Chart Block */}
      <div className="airlab-card" style={{ padding: '24px', position: 'relative' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Historical Telemetry & Calibrated 24h Prediction
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time ground sensor stream plotted with statutory Smog Emergency (150 µg/m³) and Pak-NEQS (35 µg/m³) references.
            </p>
          </div>

          {/* Time range switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <SlidersHorizontal size={12} /> Window:
            </span>
            {(['12h', '24h', '48h'] as const).map(w => (
              <button
                key={w}
                onClick={() => setTimeFilter(w)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--card-border)',
                  background: timeFilter === w ? 'var(--brand-green)' : 'transparent',
                  color: timeFilter === w ? '#172B10' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Animated Tooltip Popup */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                left: `${Math.min(hoveredPoint.x, svgWidth - 140)}px`,
                top: `${Math.max(hoveredPoint.y - 45, 10)}px`,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                zIndex: 20,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {hoveredPoint.val.toFixed(1)} µg/m³
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                {hoveredPoint.ts}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean SVG Canvas Chart */}
        <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
            {/* Grid Horizontal Guide Lines */}
            {[0, 35, 100, 150, 200].map(val => {
              const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
              const isThreshold = val === 35 || val === 150;
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke={isThreshold ? (val === 150 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(108, 174, 79, 0.4)') : 'var(--card-border)'}
                    strokeDasharray={isThreshold ? '4 4' : undefined}
                    strokeWidth={isThreshold ? 1.5 : 1}
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    fill={isThreshold ? (val === 150 ? '#E53E3E' : '#6CAE4F') : 'var(--text-muted)'}
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="inherit"
                    fontWeight={isThreshold ? 600 : 400}
                  >
                    {val}
                  </text>
                  {isThreshold && (
                    <text
                      x={svgWidth - paddingX + 6}
                      y={y + 3}
                      fill={val === 150 ? '#E53E3E' : '#6CAE4F'}
                      fontSize="9"
                      fontFamily="inherit"
                      fontWeight={600}
                    >
                      {val === 35 ? 'NEQS (35)' : 'Smog Emergency (150)'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Area Fill Gradient under History Line */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#99DE7B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#99DE7B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area under curve */}
            {pointsData.length > 0 && (() => {
              const first = pointsData[0];
              const last = pointsData[pointsData.length - 1];
              const zeroY = svgHeight - paddingY;
              const areaPath = `M ${first.x},${zeroY} L ${pointsData.map(p => `${p.x},${p.y}`).join(' L ')} L ${last.x},${zeroY} Z`;
              return <path d={areaPath} fill="url(#areaGradient)" />;
            })()}

            {/* History Polyline */}
            <polyline
              fill="none"
              stroke="#6CAE4F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />

            {/* Interactive Data Hover Circles */}
            {pointsData.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="#6CAE4F"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, val: p.pt.pm25, ts: p.pt.timestamp_utc })}
              />
            ))}

            {/* Prediction Interval Vertical Range */}
            <line
              x1={forecastX}
              y1={upperY}
              x2={forecastX}
              y2={lowerY}
              stroke="#E53E3E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={forecastX} cy={upperY} r="3" fill="#E53E3E" />
            <circle cx={forecastX} cy={lowerY} r="3" fill="#E53E3E" />

            {/* Prediction Point */}
            <circle
              cx={forecastX}
              cy={forecastY}
              r={6}
              fill="#E53E3E"
              stroke="#FFFFFF"
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ x: forecastX, y: forecastY, val: predicted, ts: 'Target t+24h' })}
            />
          </svg>
        </div>

        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong>Sensor Coverage:</strong> {forecast.sensors_evaluated} active PAQI nodes across {city}.
          </div>
          <div>
            <strong>Target Horizon:</strong> {forecast.forecast_target_time} (UTC)
          </div>
        </div>
      </div>
    </motion.div>
  );
};
