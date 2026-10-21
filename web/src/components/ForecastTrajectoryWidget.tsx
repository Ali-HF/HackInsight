import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Layers, Activity } from 'lucide-react';
import type { CityForecastTrajectory } from '../types';

interface ForecastTrajectoryWidgetProps {
  city: 'Lahore' | 'Karachi';
  trajectoryData?: CityForecastTrajectory | null;
  predictedVal: number;
  lower80: number;
  upper80: number;
  baselineVal?: number;
}

interface HoveredPointData {
  x: number;
  y: number;
  label: string;
  value: number;
  isForecast: boolean;
  lower80?: number;
  upper80?: number;
  baseline?: number;
}

export const ForecastTrajectoryWidget: React.FC<ForecastTrajectoryWidgetProps> = ({
  city,
  trajectoryData,
  predictedVal,
  lower80,
  upper80,
  baselineVal
}) => {
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPointData | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Extract history (last 12 hours) and 24h trajectory
  const rawHistory = trajectoryData?.history?.slice(-12) ?? [];
  const rawTrajectory = trajectoryData?.trajectory_24h ?? [];
  const forecastTarget = trajectoryData?.forecast_target;

  const finalPredicted = predictedVal || forecastTarget?.predicted || 0;
  const finalLower80 = lower80 || forecastTarget?.lower_80 || 0;
  const finalUpper80 = upper80 || forecastTarget?.upper_80 || 0;
  const finalBaseline = baselineVal !== undefined && baselineVal > 0 ? baselineVal : (forecastTarget?.baseline || finalPredicted);

  // Chart dimensions
  const width = 520;
  const height = 155;
  const paddingLeft = 32;
  const paddingRight = 32;
  const paddingTop = 26;
  const paddingBottom = 26;

  // Determine Y-scale
  const allValues = [
    ...rawHistory.map(h => h.pm25),
    ...rawTrajectory.map(t => t.predicted_pm25),
    ...rawTrajectory.map(t => t.upper_80),
    ...rawTrajectory.map(t => t.lower_80),
    finalPredicted,
    finalUpper80,
    finalBaseline
  ].filter(v => typeof v === 'number' && !isNaN(v));

  const maxVal = Math.max(...allValues, 200) * 1.08;
  const minVal = Math.max(0, Math.min(...allValues, 40) * 0.85);

  const scaleY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return height - paddingBottom - ((clamped - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);
  };

  // Divide width into: 38% History (-12h to t0), 62% Forecast (t0 to +24h)
  const dividerX = paddingLeft + (width - paddingLeft - paddingRight) * 0.38;

  // Map history points
  const historyPoints = rawHistory.map((pt, i) => {
    const x = paddingLeft + (i / Math.max(rawHistory.length - 1, 1)) * (dividerX - paddingLeft);
    const y = scaleY(pt.pm25);
    const hoursAgo = Math.round(12 - (i / Math.max(rawHistory.length - 1, 1)) * 12);
    const label = hoursAgo === 0 ? 't₀ (Now)' : `-${hoursAgo}h (Observed)`;
    return { x, y, pt, label };
  });

  const t0_Y = historyPoints.length > 0 ? historyPoints[historyPoints.length - 1].y : scaleY(finalBaseline);

  // Map forecast trajectory points
  const forecastPoints = rawTrajectory.length > 0
    ? rawTrajectory.map((step) => {
        const x = dividerX + (step.step_hour / 24.0) * (width - paddingRight - dividerX);
        const y = scaleY(step.predicted_pm25);
        const yUpper = scaleY(step.upper_80);
        const yLower = scaleY(step.lower_80);
        const label = step.label || `+${step.step_hour}h Forecast`;
        return { x, y, yUpper, yLower, step, label };
      })
    : [
        {
          x: width - paddingRight,
          y: scaleY(finalPredicted),
          yUpper: scaleY(finalUpper80),
          yLower: scaleY(finalLower80),
          step: { step_hour: 24, label: '+24h Forecast', predicted_pm25: finalPredicted, lower_80: finalLower80, upper_80: finalUpper80, baseline: finalBaseline },
          label: '+24h Forecast'
        }
      ];

  const t24Point = forecastPoints[forecastPoints.length - 1];

  // Combined interactive points for hover tracking
  const allInteractivePoints = useMemo(() => {
    const pts: HoveredPointData[] = [];

    // History points
    historyPoints.forEach((hp) => {
      pts.push({
        x: hp.x,
        y: hp.y,
        label: hp.label,
        value: hp.pt.pm25,
        isForecast: false,
        baseline: finalBaseline
      });
    });

    // t0 now point
    if (pts.length === 0 || Math.abs(pts[pts.length - 1].x - dividerX) > 2) {
      pts.push({
        x: dividerX,
        y: t0_Y,
        label: 't₀ (Now)',
        value: historyPoints.length > 0 ? historyPoints[historyPoints.length - 1].pt.pm25 : finalBaseline,
        isForecast: false,
        baseline: finalBaseline
      });
    }

    // Forecast points
    forecastPoints.forEach((fp) => {
      pts.push({
        x: fp.x,
        y: fp.y,
        label: fp.label,
        value: fp.step.predicted_pm25,
        isForecast: true,
        lower80: fp.step.lower_80,
        upper80: fp.step.upper_80,
        baseline: fp.step.baseline || finalBaseline
      });
    });

    return pts.sort((a, b) => a.x - b.x);
  }, [historyPoints, forecastPoints, dividerX, t0_Y, finalBaseline]);

  // Handle pointer tracking
  const handlePointerMove = (clientX: number) => {
    if (!svgRef.current || allInteractivePoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * width;

    let nearest = allInteractivePoints[0];
    let minDist = Math.abs(nearest.x - svgX);

    for (let i = 1; i < allInteractivePoints.length; i++) {
      const dist = Math.abs(allInteractivePoints[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        nearest = allInteractivePoints[i];
      }
    }

    setHoveredPoint(nearest);
  };

  // SVG Paths
  const historyPath = historyPoints.length > 0
    ? `M ${historyPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  const forecastPath = `M ${dividerX.toFixed(1)},${t0_Y.toFixed(1)} L ${forecastPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

  // Conformal envelope polygon: t0 -> upper trajectory -> t24 -> lower trajectory -> t0
  const upperCoords = forecastPoints.map(p => `${p.x.toFixed(1)},${p.yUpper.toFixed(1)}`);
  const lowerCoordsReverse = [...forecastPoints].reverse().map(p => `${p.x.toFixed(1)},${p.yLower.toFixed(1)}`);
  const bandPath = `M ${dividerX.toFixed(1)},${t0_Y.toFixed(1)} L ${upperCoords.join(' L ')} L ${lowerCoordsReverse.join(' L ')} Z`;

  // History area gradient
  const historyAreaPath = historyPoints.length > 0
    ? `${historyPath} L ${dividerX.toFixed(1)},${(height - paddingBottom).toFixed(1)} L ${paddingLeft},${(height - paddingBottom).toFixed(1)} Z`
    : '';

  // Baseline line
  const baselineY = scaleY(finalBaseline);

  const timeLabels = ['-12h', '-6h', 't₀ (Now)', '+6h', '+12h', '+18h', '+24h'];

  return (
    <div
      className="airlab-card"
      style={{
        padding: '20px 24px',
        borderRadius: '22px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      {/* 1. Header with Title, Summary Metric & Feature Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16A34A',
            flexShrink: 0
          }}>
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em', margin: 0 }}>
              24h PM2.5 Forecast & Uncertainty
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '1px' }}>
              Observed Ground Sensors → 24-Hour Conformal Horizon ({city})
            </span>
          </div>
        </div>

        {/* Header Right: +24h Target Badge & Controls (No overlapping card on the chart!) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            fontSize: '0.675rem',
            fontWeight: 700,
            color: '#0F172A',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            padding: '3px 8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ color: '#92400E', fontWeight: 600 }}>+24h:</span>
            <span style={{ color: '#D97706' }}>{finalPredicted.toFixed(1)} µg/m³</span>
          </div>

          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            style={{
              border: 'none',
              background: showConfidenceBand ? '#DCFCE7' : '#F1F5F9',
              color: showConfidenceBand ? '#15803D' : '#64748B',
              fontSize: '0.675rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            title="Toggle 80% Conformal Uncertainty Band"
          >
            <Layers size={11} />
            80% CI
          </button>

          <button
            onClick={() => setShowBaseline(!showBaseline)}
            style={{
              border: 'none',
              background: showBaseline ? '#FEF3C7' : '#F1F5F9',
              color: showBaseline ? '#92400E' : '#64748B',
              fontSize: '0.675rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            title="Toggle Persistence Baseline Reference"
          >
            <Activity size={11} />
            Baseline
          </button>
        </div>
      </div>

      {/* 2. SVG Chart Area with Clean, Non-Obstructing Hover Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={city}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          style={{ position: 'relative', width: '100%', height: '142px' }}
        >
          {/* Smart Floating Tooltip: Follows the cursor safely to the side/top so it NEVER hides the point or curve */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: `translate(${hoveredPoint.x > width * 0.55 ? '-112%' : '14%'}, ${hoveredPoint.y < 46 ? '12px' : '-108%'})`,
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(6px)',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '6px 10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                border: '1px solid rgba(255,255,255,0.1)',
                pointerEvents: 'none',
                zIndex: 30,
                whiteSpace: 'nowrap',
                transition: 'transform 0.08s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
                <span style={{ color: hoveredPoint.isForecast ? '#FBBF24' : '#34D399', fontWeight: 700 }}>
                  {hoveredPoint.label}
                </span>
                {hoveredPoint.isForecast && hoveredPoint.lower80 !== undefined && hoveredPoint.upper80 !== undefined && (
                  <span>80% CI: [{hoveredPoint.lower80.toFixed(0)} - {hoveredPoint.upper80.toFixed(0)}]</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', fontWeight: 800, fontSize: '0.8rem', marginTop: '2px' }}>
                <span style={{ color: '#E2E8F0' }}>PM2.5:</span>
                <span style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{hoveredPoint.value.toFixed(1)}</span>
                <span style={{ fontSize: '0.675rem', fontWeight: 500, color: '#94A3B8' }}>µg/m³</span>
                {finalBaseline !== undefined && (
                  <span style={{ fontSize: '0.625rem', fontWeight: 500, color: '#64748B', marginLeft: '4px' }}>
                    (Base: {finalBaseline.toFixed(1)})
                  </span>
                )}
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
            onMouseMove={(e) => handlePointerMove(e.clientX)}
            onMouseLeave={() => setHoveredPoint(null)}
            onTouchMove={(e) => {
              if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
            }}
            onTouchEnd={() => setHoveredPoint(null)}
          >
            <defs>
              {/* History gradient */}
              <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
              {/* Uncertainty envelope pattern */}
              <linearGradient id="bandGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.18" />
              </linearGradient>
            </defs>

            {/* Invisible background hit-area for smooth hover across entire chart */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="transparent"
            />

            {/* 1. Shaded 80% Conformal Uncertainty Band */}
            {showConfidenceBand && (
              <path d={bandPath} fill="url(#bandGradient)" pointerEvents="none" />
            )}

            {/* 2. Area fill under historical observation curve */}
            {historyAreaPath && (
              <path d={historyAreaPath} fill="url(#historyGradient)" pointerEvents="none" />
            )}

            {/* 3. Persistence Baseline Reference Line */}
            {showBaseline && (
              <g pointerEvents="none">
                <line
                  x1={paddingLeft}
                  y1={baselineY}
                  x2={width - paddingRight}
                  y2={baselineY}
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft + 4}
                  y={baselineY - 4}
                  fill="#94A3B8"
                  fontSize="8"
                  fontWeight="600"
                >
                  Baseline Persistence ({finalBaseline.toFixed(1)})
                </text>
              </g>
            )}

            {/* 4. Observed History Line (Green) */}
            {historyPath && (
              <path
                d={historyPath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.4"
                strokeLinecap="round"
                pointerEvents="none"
              />
            )}

            {/* 5. Issue Time Divider Line (Now / t0) */}
            <line
              x1={dividerX}
              y1={paddingTop - 6}
              x2={dividerX}
              y2={height - paddingBottom}
              stroke="#F59E0B"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              pointerEvents="none"
            />
            <circle cx={dividerX} cy={t0_Y} r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" pointerEvents="none" />

            {/* 6. Forecast Trajectory Curve (Amber/Orange) */}
            <path
              d={forecastPath}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
              pointerEvents="none"
            />

            {/* 7. Final t+24 Target Point with Golden Glow */}
            <circle
              cx={t24Point.x}
              cy={t24Point.y}
              r="5.5"
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth="2"
              pointerEvents="none"
            />
            <circle
              cx={t24Point.x}
              cy={t24Point.y}
              r="9"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1"
              strokeOpacity="0.4"
              pointerEvents="none"
            />

            {/* 8. Interactive Hover Indicator on the Line */}
            {hoveredPoint && (
              <g pointerEvents="none">
                {/* Vertical cursor guide line */}
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop - 6}
                  x2={hoveredPoint.x}
                  y2={height - paddingBottom}
                  stroke={hoveredPoint.isForecast ? '#D97706' : '#10B981'}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />

                {/* Glowing highlighted point on the line */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="9"
                  fill={hoveredPoint.isForecast ? '#F59E0B' : '#10B981'}
                  opacity="0.25"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="5"
                  fill={hoveredPoint.isForecast ? '#D97706' : '#10B981'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </motion.div>
      </AnimatePresence>

      {/* 3. Clean X-Axis Time Progression Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid #F1F5F9',
          fontSize: '0.675rem',
          color: '#64748B',
          fontWeight: 600
        }}
      >
        {timeLabels.map((lbl, idx) => (
          <span
            key={idx}
            style={{
              color: lbl.includes('Now') ? '#D97706' : (lbl.includes('+') ? '#2563EB' : '#64748B'),
              fontWeight: lbl.includes('Now') || lbl.includes('+24h') ? 700 : 500
            }}
          >
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ForecastTrajectoryWidget;
