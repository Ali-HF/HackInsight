import type { QualityAssessmentPayload } from '../types';
import { ShieldCheck, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';

export const DataQualityView: React.FC<{ quality?: QualityAssessmentPayload }> = ({ quality }) => {
  const assessment = quality?.quality_assessment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Editorial Header matching Airlab reference */}
      <div style={{ maxWidth: '840px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="badge badge-green">Autonomous DataQualityAgent</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>• Contract Governance Policy</span>
        </div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#1C2024' }}>
          Technical depth through rigorous, automated data certification.
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
          Zero lookahead leakage and strict non-fabrication protocols. Gaps in low-cost optical sensor feeds
          are audited through four deterministic actions: <code>NO_ACTION</code>, <code>FLAG</code>, <code>FILL</code>, and <code>FIX</code>.
        </p>
      </div>

      {/* Action Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="airlab-card">
          <div className="green-icon-box">
            <CheckCircle2 size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            NO_ACTION (Certified Clean)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '6px', color: '#1C2024' }}>
            {assessment?.actions_summary.NO_ACTION ?? 10} Checks
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Passed schema completeness and uniqueness criteria without adjustments.
          </p>
        </div>

        <div className="airlab-card">
          <div className="green-icon-box" style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FCD34D' }}>
            <AlertTriangle size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            FLAG (Anomalies Retained)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '6px', color: '#1C2024' }}>
            {assessment?.actions_summary.FLAG ?? 3} Checks
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Flagged extreme temporal spikes (&gt;800 µg/m³) while retaining raw audit trail.
          </p>
        </div>

        <div className="airlab-card">
          <div className="green-icon-box">
            <FileCheck size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            FILL (Bounded Imputation)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '6px', color: '#1C2024' }}>
            {assessment?.actions_summary.FILL ?? 0} Checks
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Strict policy: PM2.5 targets are never fabricated or synthetically imputed.
          </p>
        </div>

        <div className="airlab-card">
          <div className="green-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            FIX (Deterministic Correction)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '6px', color: '#1C2024' }}>
            {assessment?.actions_summary.FIX ?? 0} Checks
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Automated string whitespace trimming and UTC timezone offset alignment.
          </p>
        </div>
      </div>

      {/* Detailed Audit Table */}
      <div className="airlab-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1C2024', marginBottom: '16px' }}>
          Rule-by-Rule Quality Certification Decisions
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>Rule ID</th>
                <th style={{ padding: '10px 14px' }}>Check Description</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
                <th style={{ padding: '10px 14px' }}>Records Checked</th>
                <th style={{ padding: '10px 14px' }}>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {assessment?.decisions?.slice(0, 7).map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #EDF2F7' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{d.rule_id}</td>
                  <td style={{ padding: '12px 14px', color: '#1C2024' }}>{d.check_id.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={d.action === 'NO_ACTION' ? 'badge badge-green' : 'badge badge-yellow'}>
                      {d.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {d.records_checked.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
