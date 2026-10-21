import React, { useState } from 'react';
import type { TimeSeriesPoint } from '../types';

interface TrendAnalysisWidgetProps {
  timeseries: TimeSeriesPoint[];
  predictedVal: number;
  lower80: number;
  upper80: number;
  city: string;
}

export const TrendAnalysisWidget: React.FC<TrendAnalysisWidgetProps> = ({
  timeseries,
  predictedVal,
  lower80: _lower80,
  upper80
}) => {
  const [activeFilter, setActiveFilter] = useState<'REAL TIME' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('REAL TIME');

  const series = timeseries.slice(-14);
  const maxVal = Math.max(...series.map(t => t.pm25), upper80, 220);
  const minVal = 0;

  const width = 500;
  const height = 150;
  const paddingX = 25;
  const paddingY = 24;

  // Split history vs forecast horizon
  const historyPoints = series.map((pt, i) => {
    const x = paddingX + (i / Math.max(series.length + 3, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((pt.pm25 - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y, pt };
  });

  const dividerX = historyPoints.length > 0 ? historyPoints[historyPoints.length - 1].x : width * 0.7;
  const dividerY = historyPoints.length > 0 ? historyPoints[historyPoints.length - 1].y : height * 0.5;

  const forecastX = width - paddingX - 10;
  const forecastY = height - paddingY - ((predictedVal - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);

  // Time labels along X-axis
  const timeLabels = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  return (
    <div className="airlab-card" style={{
      padding: '20px 24px',
      borderRadius: '22px',
      backgroundColor: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Top Header & Filter Pills (WeatherSwim Style) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em' }}>
          Pollution Trend Analysis
        </h3>

        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#F1F5F9',
          padding: '3px 4px',
          borderRadius: '999px'
        }}>
          {(['REAL TIME', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                border: 'none',
                background: activeFilter === f ? '#0F172A' : 'transparent',
                color: activeFilter === f ? '#FFFFFF' : '#64748B',
                fontSize: '0.675rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Smooth Curve Area */}
      <div style={{ position: 'relative', width: '100%', height: '140px' }}>
        {/* Floating Tooltip Card (Matching WeatherSwim's floating pill) */}
        <div style={{
          position: 'absolute',
          left: `${dividerX - 60}px`,
          top: `${Math.max(dividerY - 50, 6)}px`,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '6px 12px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.675rem', color: '#64748B' }}>
            <span>Oct 21, 2026</span>
            <span style={{ fontWeight: 600 }}>14:00 PM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', fontWeight: 700, color: '#1E293B' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: predictedVal > 150 ? '#EF4444' : '#EAB308' }} />
            {predictedVal > 150 ? 'Severe Alert' : 'Moderate'} PM2.5: {predictedVal.toFixed(1)}
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84CC16" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#EAB308" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill under historical curve */}
          {historyPoints.length > 0 && (() => {
            const first = historyPoints[0];
            const last = historyPoints[historyPoints.length - 1];
            const zeroY = height - paddingY;
            const pathD = `M ${first.x},${zeroY} L ${historyPoints.map(p => `${p.x},${p.y}`).join(' L ')} L ${last.x},${zeroY} Z`;
            return <path d={pathD} fill="url(#trendGradient)" />;
          })()}

          {/* History Solid Curve (Green) */}
          <path
            d={historyPoints.length > 0
              ? `M ${historyPoints.map(p => `${p.x},${p.y}`).join(' L ')}`
              : ''}
            fill="none"
            stroke="#65A30D"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Vertical Current Time Divider (Gold dashed line like in WeatherSwim) */}
          <line
            x1={dividerX}
            y1={10}
            x2={dividerX}
            y2={height - paddingY}
            stroke="#EAB308"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx={dividerX} cy={dividerY} r="5" fill="#EAB308" stroke="#FFFFFF" strokeWidth="2" />

          {/* Future Forecast Horizon Dotted Curve (Orange/Gold) */}
          <line
            x1={dividerX}
            y1={dividerY}
            x2={forecastX}
            y2={forecastY}
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeDasharray="4 4"
          />
          <circle cx={forecastX} cy={forecastY} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      </div>

      {/* Clean X-Axis Time Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid #F1F5F9',
        fontSize: '0.675rem',
        color: '#94A3B8',
        fontWeight: 600
      }}>
        {timeLabels.map((lbl, idx) => (
          <span key={idx}>{lbl}</span>
        ))}
      </div>
    </div>
  );
};

export default TrendAnalysisWidget;
