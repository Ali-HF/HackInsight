import React, { useState } from 'react';
import type { CityForecast, TimeSeriesPoint } from '../types';
import { ShieldCheck, Compass, CheckCircle2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtmosphericGlobe } from './AtmosphericGlobe';
import { ForecastSkeleton } from './LoadingSkeleton';

interface ForecastHeroProps {
  city: 'Lahore' | 'Karachi';
  forecast?: CityForecast;
  timeseries: TimeSeriesPoint[];
}

export const ForecastHero: React.FC<ForecastHeroProps> = ({ city, forecast, timeseries }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; ts: string } | null>(null);
  const [timeFilter, setTimeFilter] = useState<'48h' | '24h' | '12h'>('24h');
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
  const svgWidth = 560;
  const svgHeight = 150;
  const paddingX = 35;
  const paddingY = 20;

  const pointsData = filteredSeries.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(filteredSeries.length - 1, 1)) * (svgWidth - 2 * paddingX - 40);
    const y = svgHeight - paddingY - ((pt.pm25 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
    return { x, y, pt };
  });

  const forecastX = svgWidth - paddingX;
  const forecastY = svgHeight - paddingY - ((predicted - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
  const lowerY = svgHeight - paddingY - ((lower80 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
  const upperY = svgHeight - paddingY - ((upper80 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Executive Forecast Summary Card */}
      <div className="airlab-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-green-dark)' }} />
              24h Horizon Forecast
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {city} Telemetry Node
            </span>
          </div>

          <button
            onClick={() => setShow3DView(!show3DView)}
            className="btn-outline"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: show3DView ? 'var(--brand-green-subtle)' : 'transparent',
              borderColor: show3DView ? 'var(--brand-green)' : 'var(--card-border)'
            }}
          >
            <Layers size={13} />
            {show3DView ? 'Hide 3D Cloud' : '3D Aerosol Cloud'}
          </button>
        </div>

        {/* Primary Metric Highlight Box */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--card-border)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {predicted.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>µg/m³</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              HistGradientBoosting Point Prediction (t+24h)
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span className={isHighRisk ? "badge badge-hazard" : "badge badge-green"} style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
              {isHighRisk ? "Smog Emergency Trigger" : "Within Standard"}
            </span>
            <span style={{ fontSize: '0.725rem', color: isHighRisk ? 'var(--danger-text)' : 'var(--text-muted)' }}>
              {isHighRisk ? "Exceeds 150 µg/m³ threshold" : "Complies with statutory limits"}
            </span>
          </div>
        </div>

        {/* 3 Inline Compact Supporting Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              <Compass size={12} color="var(--brand-green-dark)" /> Current Ground
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {current.toFixed(1)} <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>µg/m³</span>
            </div>
          </div>

          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              <ShieldCheck size={12} color="var(--brand-green-dark)" /> 80% Conformal
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              [{lower80.toFixed(0)}, {upper80.toFixed(0)}] <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>µg/m³</span>
            </div>
          </div>

          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              <CheckCircle2 size={12} color="var(--brand-green-dark)" /> Naive Baseline Δ
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>µg/m³</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Particle Cloud Modal / Card */}
      <AnimatePresence>
        {show3DView && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="airlab-card"
            style={{ padding: '16px', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                3D Aerosol Dispersion Model • {city}
              </span>
              <span className={isHighRisk ? "badge badge-hazard" : "badge badge-green"} style={{ fontSize: '0.7rem' }}>
                {isHighRisk ? "Hazardous Density" : "Stable Dispersion"}
              </span>
            </div>
            <AtmosphericGlobe city={city} pm25={current} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refined Compact Telemetry Chart Card */}
      <div className="airlab-card" style={{ padding: '18px 20px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ground Telemetry & Calibrated Trend
            </h4>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Hourly low-cost sensor data with emergency 150 µg/m³ threshold
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {(['12h', '24h', '48h'] as const).map(w => (
              <button
                key={w}
                onClick={() => setTimeFilter(w)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--card-border)',
                  background: timeFilter === w ? 'var(--brand-green)' : 'transparent',
                  color: timeFilter === w ? '#172B10' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'absolute',
                left: `${Math.min(hoveredPoint.x, svgWidth - 110)}px`,
                top: `${Math.max(hoveredPoint.y - 38, 8)}px`,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '0.725rem',
                boxShadow: 'var(--shadow-card)',
                zIndex: 20,
                pointerEvents: 'none'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {hoveredPoint.val.toFixed(1)} µg/m³
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                {hoveredPoint.ts}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SVG Sparkline */}
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Guide Lines */}
            {[35, 150].map(val => {
              const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
              const isSmog = val === 150;
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke={isSmog ? 'rgba(239, 68, 68, 0.4)' : 'rgba(108, 174, 79, 0.35)'}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 6}
                    y={y + 3}
                    fill={isSmog ? '#E53E3E' : '#6CAE4F'}
                    fontSize="8"
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {val}
                  </text>
                  <text
                    x={svgWidth - paddingX + 4}
                    y={y + 3}
                    fill={isSmog ? '#E53E3E' : '#6CAE4F'}
                    fontSize="8"
                    fontWeight="600"
                  >
                    {isSmog ? 'Smog Alert (150)' : 'NEQS (35)'}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <defs>
              <linearGradient id="compactAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#99DE7B" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#99DE7B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {pointsData.length > 0 && (() => {
              const first = pointsData[0];
              const last = pointsData[pointsData.length - 1];
              const zeroY = svgHeight - paddingY;
              const areaPath = `M ${first.x},${zeroY} L ${pointsData.map(p => `${p.x},${p.y}`).join(' L ')} L ${last.x},${zeroY} Z`;
              return <path d={areaPath} fill="url(#compactAreaGradient)" />;
            })()}

            {/* Polyline */}
            <polyline
              fill="none"
              stroke="#6CAE4F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsData.map(p => `${p.x},${p.y}`).join(' ')}
            />

            {/* Interactive Data Points */}
            {pointsData.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#FFFFFF"
                stroke="#6CAE4F"
                strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, val: p.pt.pm25, ts: p.pt.timestamp_utc })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}

            {/* Horizon Prediction Point & Interval */}
            <line
              x1={forecastX}
              y1={lowerY}
              x2={forecastX}
              y2={upperY}
              stroke="rgba(239, 68, 68, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={forecastX} cy={lowerY} r="2.5" fill="#EF4444" />
            <circle cx={forecastX} cy={upperY} r="2.5" fill="#EF4444" />
            <circle cx={forecastX} cy={forecastY} r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ForecastHero;
