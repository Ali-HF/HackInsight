import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ForecastHero } from './components/ForecastHero';
import { AgentAssistant } from './components/AgentAssistant';
import { DataQualityView } from './components/DataQualityView';
import { ModelMetricsView } from './components/ModelMetricsView';
import type { LatestForecastPayload, QualityAssessmentPayload, ModelMetricsPayload, TimeSeriesPoint } from './types';
import { Building2, Truck, School, Factory, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCity, setSelectedCity] = useState<'Lahore' | 'Karachi'>('Lahore');

  const [forecastData, setForecastData] = useState<LatestForecastPayload | null>(null);
  const [qualityData, setQualityData] = useState<QualityAssessmentPayload | null>(null);
  const [metricsData, setMetricsData] = useState<ModelMetricsPayload | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<Record<string, TimeSeriesPoint[]>>({});

  useEffect(() => {
    // Load local static pipeline JSON payloads exported directly from backend
    fetch('/data/latest_forecast.json')
      .then(res => res.json())
      .then(data => setForecastData(data))
      .catch(err => console.warn('Using default forecast:', err));

    fetch('/data/latest_quality.json')
      .then(res => res.json())
      .then(data => setQualityData(data))
      .catch(err => console.warn('Using default quality:', err));

    fetch('/data/metrics_summary.json')
      .then(res => res.json())
      .then(data => setMetricsData(data))
      .catch(err => console.warn('Using default metrics:', err));

    fetch('/data/timeseries.json')
      .then(res => res.json())
      .then(data => setTimeseriesData(data))
      .catch(err => console.warn('Using default timeseries:', err));
  }, []);

  const currentCityForecast = forecastData?.forecast_data?.cities?.[selectedCity];
  const cityTimeseries = timeseriesData[selectedCity] ?? [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-subtle)' }}>
      {/* Top Banner: Statutory Clean Air Standards */}
      <div style={{
        backgroundColor: '#1C2E1A',
        color: '#E5F6DF',
        padding: '8px 24px',
        fontSize: '0.8rem',
        fontWeight: 500,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
            Punjab Smog Prevention & Control Policy 2023 | Pak-NEQS Statutory Benchmark: 35 µg/m³
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Verified Zero-Leakage Pipeline</span>
            <span style={{ color: 'var(--brand-green)' }}>Asia/Karachi Standard Time</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        lastUpdated={forecastData?.timestamp_utc}
      />

      {/* Main Page Body */}
      <main className="container" style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {activeTab === 'overview' && (
          <>
            <ForecastHero
              city={selectedCity}
              forecast={currentCityForecast}
              timeseries={cityTimeseries}
            />

            {/* Decision Protocol Section (Airlab "What this means for you" style) */}
            <section id="decision-protocol" style={{ marginTop: '24px' }}>
              <div style={{ maxWidth: '780px', marginBottom: '28px' }}>
                <span className="badge badge-green" style={{ marginBottom: '8px' }}>
                  Statutory Smog Protocols
                </span>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#1C2024' }}>
                  Targeted municipal interventions 24 hours in advance.
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px' }}>
                  Standardized decision triggers approved for Punjab and Sindh provincial authorities
                  when 24-hour PM2.5 forecasts exceed statutory tiers.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="airlab-card">
                  <div className="green-icon-box">
                    <School size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>Schools & Youth</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Suspend outdoor physical training and enact remote/hybrid schooling when PM2.5 forecast &gt; 150 µg/m³.
                  </p>
                </div>

                <div className="airlab-card">
                  <div className="green-icon-box">
                    <Truck size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>Heavy Transport</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Re-route non-essential heavy diesel trucks away from urban centers during forecasted peak morning inversions.
                  </p>
                </div>

                <div className="airlab-card">
                  <div className="green-icon-box">
                    <Factory size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>Industrial Emitters</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Preemptively shift high-emission operating hours and mandate wet scrubbers on brick kilns and steel mills.
                  </p>
                </div>

                <div className="airlab-card">
                  <div className="green-icon-box">
                    <Building2 size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>Hospital Preparedness</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Alert public respiratory clinics to increase bronchodilator inventories and oxygen reserves 24 hours prior.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'assistant' && (
          <AgentAssistant />
        )}

        {activeTab === 'quality' && (
          <DataQualityView quality={qualityData ?? undefined} />
        )}

        {activeTab === 'model' && (
          <ModelMetricsView metrics={metricsData ?? undefined} />
        )}
      </main>

      {/* Airlab-style Clean Minimal Footer */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--card-border)',
        padding: '48px 0 32px 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '40px',
          marginBottom: '36px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="text-xl font-bold tracking-tight text-[#1C1F26]">
                air<span style={{ color: 'var(--brand-green-dark)' }}>lab</span>
                <span style={{ fontSize: '0.8rem', marginLeft: '6px', color: 'var(--text-muted)' }}>Pakistan Operational Pipeline</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.6 }}>
              Built for TECHFEST '26 HackInsight. Delivering consistent, certified, and reproducible air quality forecasting across Lahore and Karachi.
            </p>
          </div>

          <div>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C2024', marginBottom: '14px', textTransform: 'uppercase' }}>
              Architecture
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Member 1: Data Engineering</span>
              <span>Member 2: ML Forecaster</span>
              <span>Member 3: Grounded Agent</span>
              <span>Member 4: Orchestration & UI</span>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C2024', marginBottom: '14px', textTransform: 'uppercase' }}>
              Standards
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Pak-NEQS 2010 (35 µg/m³)</span>
              <span>Punjab Smog Plan (150 µg/m³)</span>
              <span>WHO 2021 (15 µg/m³)</span>
              <span>NASA ASDC DAAC Sensor DOI</span>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C2024', marginBottom: '14px', textTransform: 'uppercase' }}>
              Deploy
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
                className="btn-airlab"
                style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
              >
                Deploy to Vercel <ExternalLink size={13} />
              </a>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Native Vite + TypeScript SPA
              </span>
            </div>
          </div>
        </div>

        <div className="container" style={{
          borderTop: '1px solid #EDF2F7',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>© 2026 HackInsight Team DataMinors. Open-source under MIT License.</div>
          <div>Pakistan Air Quality Initiative (PAQI) Low-Cost Sensor Network</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
