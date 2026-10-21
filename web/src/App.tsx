import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ForecastHero } from './components/ForecastHero';
import { AgentAssistant } from './components/AgentAssistant';
import { DataQualityView } from './components/DataQualityView';
import { ModelMetricsView } from './components/ModelMetricsView';
import type { LatestForecastPayload, QualityAssessmentPayload, ModelMetricsPayload, TimeSeriesPoint } from './types';
import { Building2, Truck, School, Factory, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCity, setSelectedCity] = useState<'Lahore' | 'Karachi'>('Lahore');
  const [isDark, setIsDark] = useState<boolean>(false);

  const [forecastData, setForecastData] = useState<LatestForecastPayload | null>(null);
  const [qualityData, setQualityData] = useState<QualityAssessmentPayload | null>(null);
  const [metricsData, setMetricsData] = useState<ModelMetricsPayload | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<Record<string, TimeSeriesPoint[]>>({});

  useEffect(() => {
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
      {/* Primary Sticky Header */}
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
      <main className="container" style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
            >
              {/* 1. Executive Grid: Forecast Telemetry (Left) + Grounded Decision Assistant (Right) */}
              <div className="grid-hero">
                <ForecastHero
                  city={selectedCity}
                  forecast={currentCityForecast}
                  timeseries={cityTimeseries}
                />
                <AgentAssistant />
              </div>

              {/* 3. Provincial Action Triggers - Clean, Non-bloated Summary Strip */}
              <section id="decision-protocol" style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-green">Statutory Triggers</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Provincial Smog Action Protocols
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Active when 24h PM2.5 &gt; 150 µg/m³ (Punjab EPD & Sindh EPA)
                  </span>
                </div>

                <div className="grid-4">
                  <div className="airlab-card" style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="green-icon-box" style={{ width: '34px', height: '34px', borderRadius: '8px', marginBottom: 0, flexShrink: 0 }}>
                      <School size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        Schools & Academia
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        Suspend morning assemblies and outdoor sports. Mandatory N95 masks.
                      </p>
                    </div>
                  </div>

                  <div className="airlab-card" style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="green-icon-box" style={{ width: '34px', height: '34px', borderRadius: '8px', marginBottom: 0, flexShrink: 0 }}>
                      <Truck size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        Heavy Transport
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        Divert heavy diesel traffic off urban ring roads during nocturnal inversions.
                      </p>
                    </div>
                  </div>

                  <div className="airlab-card" style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="green-icon-box" style={{ width: '34px', height: '34px', borderRadius: '8px', marginBottom: 0, flexShrink: 0 }}>
                      <Factory size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        Industrial Clusters
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        Mandate wet scrubbers for brick kilns and enforce staggered shift operations.
                      </p>
                    </div>
                  </div>

                  <div className="airlab-card" style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="green-icon-box" style={{ width: '34px', height: '34px', borderRadius: '8px', marginBottom: 0, flexShrink: 0 }}>
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        Clinical Triage
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        Mobilize emergency bronchodilator stocks and pediatric respiratory beds.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AgentAssistant />
            </motion.div>
          )}

          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DataQualityView quality={qualityData ?? undefined} />
            </motion.div>
          )}

          {activeTab === 'model' && (
            <motion.div
              key="model"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ModelMetricsView metrics={metricsData ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Clean Minimalist Footer */}
      <footer style={{
        backgroundColor: 'var(--bg-main)',
        borderTop: '1px solid var(--card-border)',
        padding: '36px 0 24px 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                air<span style={{ color: 'var(--brand-green-dark)' }}>lab</span>
                <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: 'var(--text-muted)', fontWeight: 500 }}>PK EPD Telemetry</span>
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.5 }}>
              TECHFEST '26 HackInsight. Certified, zero-leakage air quality forecasting across Lahore and Karachi.
            </p>
          </div>

          <div>
            <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Architecture
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Data Engineering (Prefect & Parquet)</span>
              <span>ML Forecaster (HistGradientBoosting)</span>
              <span>Grounded Decision RAG Agent</span>
              <span>Production Web UI (React & Vite)</span>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Statutory Benchmarks
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Pak-NEQS 2010 (35 µg/m³)</span>
              <span>Punjab Smog Emergency (150 µg/m³)</span>
              <span>WHO 2021 (15 µg/m³)</span>
              <span>PAQI Sensor Network Calibration</span>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Repository
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="https://github.com/Ali-HF/HackInsight"
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
                style={{ fontSize: '0.78rem', padding: '6px 14px', width: 'fit-content' }}
              >
                <GitBranch size={13} /> View on GitHub
              </a>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Production Deployment Verified
              </span>
            </div>
          </div>
        </div>

        <div className="container" style={{
          borderTop: '1px solid var(--card-border)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div>© 2026 HackInsight Team DataMinors. Open-source under MIT License.</div>
          <div>Pakistan Air Quality Initiative (PAQI) Low-Cost Sensor Telemetry</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
