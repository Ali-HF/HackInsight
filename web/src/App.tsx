import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ForecastHero } from './components/ForecastHero';
import { AgentAssistant } from './components/AgentAssistant';
import { DataQualityView } from './components/DataQualityView';
import { ModelMetricsView } from './components/ModelMetricsView';
import type { LatestForecastPayload, QualityAssessmentPayload, ModelMetricsPayload, TimeSeriesPoint } from './types';
import { Building2, Truck, School, Factory, ExternalLink, ArrowRight, Quote } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCity, setSelectedCity] = useState<'Lahore' | 'Karachi'>('Lahore');
  const [isDark, setIsDark] = useState<boolean>(false);

  const [forecastData, setForecastData] = useState<LatestForecastPayload | null>(null);
  const [qualityData, setQualityData] = useState<QualityAssessmentPayload | null>(null);
  const [metricsData, setMetricsData] = useState<ModelMetricsPayload | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<Record<string, TimeSeriesPoint[]>>({});

  useEffect(() => {
    // Check saved theme or system preference
    const saved = localStorage.getItem('airlab_theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('airlab_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('airlab_theme', 'light');
    }
  };

  useEffect(() => {
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
        backgroundColor: isDark ? '#142312' : '#1C2E1A',
        color: '#E5F6DF',
        padding: '8px 24px',
        fontSize: '0.8rem',
        fontWeight: 500,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
            Punjab Smog Prevention & Control Policy 2023 | Pak-NEQS Benchmark: 35 µg/m³
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Zero Lookahead Leakage</span>
            <span style={{ color: 'var(--brand-green)' }}>Asia/Karachi UTC+5</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation with Theme Toggle */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        lastUpdated={forecastData?.timestamp_utc}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      {/* Main Page Body */}
      <main className="container" style={{ flex: 1, padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: '44px' }}>
        {activeTab === 'overview' && (
          <>
            <ForecastHero
              city={selectedCity}
              forecast={currentCityForecast}
              timeseries={cityTimeseries}
            />

            {/* Decision Protocol Section (Airlab "What this means for you" style) */}
            <section id="decision-protocol" style={{ marginTop: '16px' }}>
              <div style={{ maxWidth: '820px', marginBottom: '24px' }}>
                <span className="badge badge-green" style={{ marginBottom: '8px' }}>
                  Statutory Smog Protocols
                </span>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Targeted municipal interventions 24 hours in advance.
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px' }}>
                  Standardized decision triggers approved for Punjab and Sindh provincial authorities
                  when 24-hour PM2.5 forecasts exceed statutory tiers.
                </p>
              </div>

              <div className="grid-4">
                <div className="airlab-card">
                  <div className="green-icon-box">
                    <School size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Schools & Outdoor
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Suspend outdoor morning assemblies and physical education when PM2.5 &gt; 150 µg/m³.
                  </p>
                </div>

                <div className="airlab-card">
                  <div className="green-icon-box">
                    <Truck size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Transport Restrictions
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Divert heavy diesel transport away from Ring Roads and city cores during inversion hours.
                  </p>
                </div>

                <div className="airlab-card">
                  <div className="green-icon-box">
                    <Factory size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Industrial Emitters
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Enforce wet scrubbers on brick kilns and mandate staggered operation for high emitters.
                  </p>
                </div>

                <div className="airlab-card">
                  <div className="green-icon-box">
                    <Building2 size={22} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Clinical Read-Ahead
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Mobilize hospital respiratory triage units and expand bronchodilator inventories 24h prior.
                  </p>
                </div>
              </div>
            </section>

            {/* Airlab Reference Section: Regional Coverage & Technical Depth split layout */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginTop: '12px'
            }}>
              <div className="airlab-card" style={{ padding: '32px' }}>
                <span className="badge badge-green" style={{ marginBottom: '12px' }}>
                  Regional Reach
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Continuous Ground Coverage Across Pakistan
                </h3>
                <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  With sensor arrays active across Punjab and Sindh, our pipeline fuses PAQI ground monitors
                  with NASA POWER boundary meteorology to deliver certified 24h foresight.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setSelectedCity('Lahore')} className="btn-outline">
                    Inspect Lahore Sector <ArrowRight size={14} />
                  </button>
                  <button onClick={() => setSelectedCity('Karachi')} className="btn-outline">
                    Inspect Karachi Sector <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="airlab-card" style={{ padding: '32px', backgroundColor: 'var(--brand-green-subtle)', borderColor: 'rgba(153, 222, 123, 0.4)' }}>
                <Quote size={28} color="#2D5A1E" style={{ marginBottom: '8px', opacity: 0.8 }} />
                <p style={{ fontSize: '1.05rem', color: 'var(--brand-green-text)', fontWeight: 500, lineHeight: 1.6, marginBottom: '18px' }}>
                  "The 24-hour lead time allows environmental response teams to enact targeted vehicle rationing
                  and school advisories before citizens are exposed to extreme smog peaks."
                </p>
                <div style={{ fontSize: '0.85rem', color: 'var(--brand-green-text)', fontWeight: 700 }}>
                  Environmental Protection Department (EPD) Smog Protocol
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-green-text)', opacity: 0.8 }}>
                  Statutory Smog Prevention Benchmark • Punjab 2023
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
        backgroundColor: 'var(--bg-main)',
        borderTop: '1px solid var(--card-border)',
        padding: '48px 0 32px 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px',
          marginBottom: '36px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                air<span style={{ color: 'var(--brand-green-dark)' }}>lab</span>
                <span style={{ fontSize: '0.8rem', marginLeft: '6px', color: 'var(--text-muted)' }}>Pakistan Operational Pipeline</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.6 }}>
              Built for TECHFEST '26 HackInsight. Delivering consistent, certified, and reproducible air quality forecasting across Lahore and Karachi.
            </p>
          </div>

          <div>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase' }}>
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
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase' }}>
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
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase' }}>
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
          borderTop: '1px solid var(--card-border)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
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
