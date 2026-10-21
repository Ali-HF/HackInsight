import React from 'react';
import type { QualityAssessmentPayload } from '../types';
import { ShieldCheck, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';

export const DataQualityView: React.FC<{ quality?: QualityAssessmentPayload }> = ({ quality }) => {
  const assessment = quality?.quality_assessment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Editorial Header */}
      <div style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-green">DataQualityAgent</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Contract Governance Policy</span>
        </div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Automated Telemetry Certification & Audit
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
          Zero lookahead leakage and strict non-fabrication protocols. Gaps in low-cost optical sensor feeds
          are audited through four deterministic actions: <code>NO_ACTION</code>, <code>FLAG</code>, <code>FILL</code>, and <code>FIX</code>.
        </p>
      </div>

      {/* Action Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            NO_ACTION (Certified Clean)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {assessment?.actions_summary?.NO_ACTION !== undefined ? assessment.actions_summary.NO_ACTION : '—'} Checks
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Passed schema completeness and uniqueness criteria without adjustments.
          </p>
        </div>

        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            FLAG (Anomalies Retained)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {assessment?.actions_summary?.FLAG !== undefined ? assessment.actions_summary.FLAG : '—'} Checks
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Flagged extreme temporal spikes (&gt;800 µg/m³) while retaining raw audit trail.
          </p>
        </div>

        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <FileCheck size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            FILL (Bounded Imputation)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {assessment?.actions_summary?.FILL !== undefined ? assessment.actions_summary.FILL : '—'} Checks
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Strict policy: PM2.5 targets are never fabricated or synthetically imputed.
          </p>
        </div>

        <div className="airlab-card" style={{ padding: '18px' }}>
          <div className="green-icon-box" style={{ width: '38px', height: '38px', borderRadius: '8px', marginBottom: '10px' }}>
            <ShieldCheck size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            FIX (Deterministic Correction)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {assessment?.actions_summary?.FIX !== undefined ? assessment.actions_summary.FIX : '—'} Checks
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Automated string whitespace trimming and UTC timezone offset alignment.
          </p>
        </div>
      </div>

      {/* Detailed Audit Table */}
      <div className="airlab-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Rule-by-Rule Quality Certification Decisions
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Rule ID</th>
                <th style={{ padding: '8px 12px' }}>Check Description</th>
                <th style={{ padding: '8px 12px' }}>Action</th>
                <th style={{ padding: '8px 12px' }}>Records Checked</th>
                <th style={{ padding: '8px 12px' }}>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {assessment?.decisions?.slice(0, 7).map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{d.rule_id}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{d.check_id.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={d.action === 'NO_ACTION' ? 'badge badge-green' : 'badge badge-yellow'}>
                      {d.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {d.records_checked.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{d.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataQualityView;
