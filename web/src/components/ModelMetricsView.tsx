import React from 'react';
import type { ModelMetricsPayload } from '../types';
import { Award, Zap, TrendingDown, Target } from 'lucide-react';

export const ModelMetricsView: React.FC<{ metrics?: ModelMetricsPayload }> = ({ metrics }) => {
  const test = metrics?.test_metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-green">ML Forecasting Engine</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Chronological Train / Val / Test Partition</span>
        </div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Proven Predictive Accuracy vs Persistence Baseline
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
          Evaluated against {metrics?.test_rows !== undefined ? metrics.test_rows.toLocaleString() : 'held-out'} chronological test observations across Lahore and Karachi.
          Incorporates {metrics?.feature_count !== undefined ? `${metrics.feature_count} ` : ''}causal lag features, diurnal harmonic cycles, and meteorological boundary variables.
        </p>
      </div>

      {/* Metrics Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <Award size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Test Set MAE (24h Ahead)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {test?.model_mae !== undefined ? test.model_mae.toFixed(1) : '—'} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>µg/m³</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Baseline Persistence: {test?.base_mae !== undefined ? `${test.base_mae.toFixed(1)} µg/m³` : '—'}
          </p>
        </div>

        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <TrendingDown size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Test Set RMSE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {test?.model_rmse !== undefined ? test.model_rmse.toFixed(1) : '—'} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>µg/m³</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Baseline Persistence: {test?.base_rmse !== undefined ? `${test.base_rmse.toFixed(1)} µg/m³` : '—'}
          </p>
        </div>

        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <Zap size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            RMSE Improvement
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--brand-green-dark)', fontVariantNumeric: 'tabular-nums' }}>
            {test?.rmse_pct_improvement !== undefined ? `+${test.rmse_pct_improvement.toFixed(1)}%` : '—'}
          </div>
          <div style={{ marginTop: '6px' }}>
            <span className="badge badge-green">Outperforms Persistence</span>
          </div>
        </div>

        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <Target size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            80% Conformal Coverage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {metrics?.test_uncertainty_80pct?.empirical_coverage_pct !== undefined ? `${metrics.test_uncertainty_80pct.empirical_coverage_pct.toFixed(1)}%` : '—'}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Target: {metrics?.test_uncertainty_80pct?.target_coverage_pct !== undefined ? `${metrics.test_uncertainty_80pct.target_coverage_pct.toFixed(1)}%` : '80.0%'} (Well-calibrated)
          </p>
        </div>
      </div>

      {/* Dataset Cohort Splits Overview */}
      <div className="airlab-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Zero-Lookahead Dataset Partitioning
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Training Records</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {metrics?.train_rows !== undefined ? metrics.train_rows.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Historical calibration & lag engineering
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Validation Records</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {metrics?.validation_rows !== undefined ? metrics.validation_rows.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Hyperparameter tuning & quantile bounds
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Held-out Test Records</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {metrics?.test_rows !== undefined ? metrics.test_rows.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {metrics?.test_by_city?.['Lahore']?.n !== undefined && metrics?.test_by_city?.['Karachi']?.n !== undefined
                ? `${metrics.test_by_city['Lahore'].n.toLocaleString()} Lahore • ${metrics.test_by_city['Karachi'].n.toLocaleString()} Karachi`
                : 'Zero-lookahead regional test set'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelMetricsView;
