import React from 'react';
import { Cpu, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModelMetricsPayload, CityForecast } from '../types';

interface ModelPerformanceWidgetProps {
  city: 'Lahore' | 'Karachi';
  metrics: ModelMetricsPayload | null;
  forecast?: CityForecast | null;
}

export const ModelPerformanceWidget: React.FC<ModelPerformanceWidgetProps> = ({
  city,
  metrics,
  forecast: _forecast
}) => {
  // Extract real city metrics or fallback to overall test metrics from metrics_summary.json
  const cityMetrics = metrics?.test_by_city?.[city];
  const modelMae = cityMetrics?.model_mae;

  return (
    <div
      className="airlab-card"
      style={{
        padding: '22px 24px',
        borderRadius: '22px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 1. Header (Verified badge removed for decluttered look) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563EB',
          flexShrink: 0
        }}>
          <Cpu size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em', margin: 0 }}>
            Model Performance
          </h3>
          <span style={{ fontSize: '0.725rem', color: '#64748B', display: 'block', marginTop: '1px' }}>
            {metrics?.model_type ?? 'HistGradientBoosting'} • 24h Horizon
          </span>
        </div>
      </div>

      {/* 2. Middle Body: Clean display of the actual metric */}
      <div style={{ margin: 'auto 0', padding: '18px 0' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={city}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}>
              Mean Absolute Error (MAE)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{
                fontSize: '3.25rem',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1,
                letterSpacing: '-0.03em'
              }}>
                {modelMae !== undefined ? modelMae.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748B' }}>
                µg/m³
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Bottom Information Note with "i" icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid #F1F5F9',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#64748B',
            marginTop: '2px'
          }}
        >
          <Info size={11} strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#64748B', margin: 0 }}>
          {cityMetrics?.n !== undefined
            ? `Average error across ${cityMetrics.n.toLocaleString()} test observations for ${city} with zero lookahead.`
            : `Average prediction error evaluated on chronological test partition with zero lookahead.`}
        </p>
      </div>

      {/* Subtle "i" watermark in background */}
      <div
        style={{
          position: 'absolute',
          right: '-14px',
          bottom: '-14px',
          opacity: 0.035,
          pointerEvents: 'none',
          userSelect: 'none',
          color: '#0F172A'
        }}
        aria-hidden="true"
      >
        <Info size={110} strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default ModelPerformanceWidget;
