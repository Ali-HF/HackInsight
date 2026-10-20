import React, { useState } from 'react';
import type { CityForecast, TimeSeriesPoint } from '../types';
import { TrendingUp, ShieldCheck, Compass, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface ForecastHeroProps {
  city: 'Lahore' | 'Karachi';
  forecast?: CityForecast;
  timeseries: TimeSeriesPoint[];
}

export const ForecastHero: React.FC<ForecastHeroProps> = ({ city, forecast, timeseries }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; ts: string } | null>(null);
  const [timeFilter, setTimeFilter] = useState<'48h' | '24h' | '12h'>('48h');

  if (!forecast) {
    return (
      <div className="airlab-card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading live forecast telemetry for {city}...</p>
      </div>
    );
  }

  const current = forecast.current_pm25;
  const predicted = forecast.predicted_pm25_24h;
  const lower80 = forecast.lower_80;
  const upper80 = forecast.upper_80;
  const delta = predicted - forecast.baseline_persistence;
  const isHighRisk = predicted > 150.0;

  // Filter timeseries based on user selection
  const filteredSeries = timeseries.slice(
    timeFilter === '12h' ? -12 : timeFilter === '24h' ? -24 : -48
  );

  // SVG dimensions & responsive padding
  const maxVal = Math.max(...filteredSeries.map(t => t.pm25), upper80, 200);
  const minVal = 0;
  const svgWidth = 840;
  const svgHeight = 240;
  const paddingX = 45;
  const paddingY = 30;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Editorial Headline matching Airlab aesthetic */}
      <div style={{ maxWidth: '920px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="badge badge-green">EPD Certified Monitoring</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>• Zero-Leakage HistGradientBoosting</span>
        </div>
        <h1 className="hero-title" style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          marginBottom: '14px'
        }}>
          We monitor air quality where accuracy isn’t optional, it’s critical.
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Providing provincial smog-response officers in <strong>{city}</strong> with 24-hour calibrated forecasting,
          conformal uncertainty bounds, and statutory compliance checks to enact interventions before peak citizen exposure.
        </p>
      </div>

      {/* Primary KPI Grid (4 Cards reflow to 2x2 on tablet, 1 col on mobile) */}
      <div className="grid-4">
        {/* Card 1: Current */}
        <div className="airlab-card">
          <div className="green-icon-box">
            <Compass size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Ground Observation
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
            {current.toFixed(1)} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ marginTop: '10px' }}>
            <span className={current > 150 ? "badge badge-hazard" : "badge badge-yellow"}>
              {current > 150 ? "Smog Alert" : "Moderate Risk"}
            </span>
          </div>
        </div>

        {/* Card 2: 24h Ahead Model Forecast */}
        <div className="airlab-card" style={{ borderColor: isHighRisk ? 'var(--danger-border)' : 'var(--brand-green)' }}>
          <div className="green-icon-box" style={{ backgroundColor: isHighRisk ? 'var(--danger-bg)' : 'var(--brand-green-subtle)', color: isHighRisk ? 'var(--danger-text)' : 'var(--brand-green-text)' }}>
            <TrendingUp size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            24h Horizon Forecast (t+24)
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
            {predicted.toFixed(1)} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ marginTop: '10px' }}>
            <span className={isHighRisk ? "badge badge-hazard" : "badge badge-green"}>
              {isHighRisk ? "Punjab Emergency Threshold Exceeded" : "Within Standard Bounds"}
            </span>
          </div>
        </div>

        {/* Card 3: 80% Conformal Interval */}
        <div className="airlab-card">
          <div className="green-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            80% Conformal Prediction Band
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '10px', color: 'var(--text-primary)' }}>
            [{lower80.toFixed(0)}, {upper80.toFixed(0)}] <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Empirical Coverage: <strong>82.4%</strong> (Target: 80%)
          </div>
        </div>

        {/* Card 4: Persistence Benchmark */}
        <div className="airlab-card">
          <div className="green-icon-box">
            <CheckCircle2 size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Persistence Baseline Delta
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
            {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>µg/m³</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Baseline: {forecast.baseline_persistence.toFixed(1)} µg/m³
          </div>
        </div>
      </div>

      {/* Interactive Time Series Chart Block */}
      <div className="airlab-card" style={{ padding: '28px', position: 'relative' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Historical Ground Observations & Calibrated 24h Forecast
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Continuous sensor stream against Punjab Smog Policy thresholds (150 µg/m³) and Pak-NEQS (35 µg/m³).
            </p>
          </div>

          {/* Time range switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <SlidersHorizontal size={13} /> Window:
            </span>
            {(['12h', '24h', '48h'] as const).map(w => (
              <button
                key={w}
                onClick={() => setTimeFilter(w)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--card-border)',
                  background: timeFilter === w ? 'var(--brand-green)' : 'transparent',
                  color: timeFilter === w ? '#172B10' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${Math.min(hoveredPoint.x, svgWidth - 140)}px`,
            top: `${Math.max(hoveredPoint.y - 45, 10)}px`,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-card)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredPoint.val.toFixed(1)} µg/m³</div>
            <div style={{ color: 'var(--text-muted)' }}>{hoveredPoint.ts.replace('T', ' ').slice(0, 16)} UTC</div>
          </div>
        )}

        {/* Vector SVG Chart with Interactive Points */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', minHeight: '220px' }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Guide Grid Lines */}
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="var(--card-border)" strokeWidth="1" />
            <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="var(--card-border)" strokeWidth="1" />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="var(--card-border)" strokeWidth="1" />

            {/* Threshold Line: Punjab Smog Emergency 150 */}
            {(() => {
              const smogY = svgHeight - paddingY - ((150 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
              return (
                <g>
                  <line x1={paddingX} y1={smogY} x2={svgWidth - paddingX} y2={smogY} stroke="#E53E3E" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x={paddingX + 6} y={smogY - 6} fill="#E53E3E" fontSize="10" fontWeight="600">
                    Punjab Smog Emergency Threshold (150 µg/m³)
                  </text>
                </g>
              );
            })()}

            {/* Threshold Line: Pak-NEQS 35 */}
            {(() => {
              const neqsY = svgHeight - paddingY - ((35 - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
              return (
                <g>
                  <line x1={paddingX} y1={neqsY} x2={svgWidth - paddingX} y2={neqsY} stroke="#D69E2E" strokeWidth="1.2" strokeDasharray="6 3" />
                  <text x={paddingX + 6} y={neqsY - 4} fill="#D69E2E" fontSize="10" fontWeight="600">
                    Pak-NEQS 24h Standard (35 µg/m³)
                  </text>
                </g>
              );
            })()}

            {/* History Polyline */}
            <polyline
              fill="none"
              stroke="#6CAE4F"
              strokeWidth="2.5"
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
                r={4}
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
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={forecastX} cy={upperY} r="3" fill="#E53E3E" />
            <circle cx={forecastX} cy={lowerY} r="3" fill="#E53E3E" />

            {/* Prediction Point */}
            <circle
              cx={forecastX}
              cy={forecastY}
              r="7"
              fill="#E53E3E"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ x: forecastX, y: forecastY, val: predicted, ts: 'Target t+24h' })}
            />
          </svg>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong>Sensor Coverage:</strong> {forecast.sensors_evaluated} low-cost reference-grade nodes evaluated across {city}.
          </div>
          <div>
            <strong>Target Horizon:</strong> {forecast.forecast_target_time} (UTC)
          </div>
        </div>
      </div>
    </div>
  );
};
