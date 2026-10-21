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


      {/* Primary Navigation with Framer Motion Tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        lastUpdated={forecastData?.timestamp_utc}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      {/* Main Page Body with Animated Tab Transitions */}
      <main className="container" style={{ flex: 1, padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: '44px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '44px' }}
            >
              <ForecastHero
                city={selectedCity}
                forecast={currentCityForecast}
                timeseries={cityTimeseries}
              />

              {/* Decision Protocol Section - Clean and Scannable */}
              <section id="decision-protocol" style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span className="badge badge-green" style={{ marginBottom: '6px' }}>Statutory Thresholds</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Provincial Action Triggers
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Punjab & Sindh Protocols (PM2.5 &gt; 150 µg/m³)</span>
                </div>

                <div className="grid-4">
                  <div className="airlab-card" style={{ padding: '16px' }}>
                    <div className="green-icon-box" style={{ marginBottom: '8px' }}>
                      <School size={18} />
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Schools
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Suspend outdoor activities and morning assemblies when PM2.5 &gt; 150 µg/m³.
                    </p>
                  </div>

                  <div className="airlab-card" style={{ padding: '16px' }}>
                    <div className="green-icon-box" style={{ marginBottom: '8px' }}>
                      <Truck size={18} />
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Transport
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Divert heavy diesel traffic away from urban ring roads during nocturnal inversions.
                    </p>
                  </div>

                  <div className="airlab-card" style={{ padding: '16px' }}>
                    <div className="green-icon-box" style={{ marginBottom: '8px' }}>
                      <Factory size={18} />
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Industry
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Enforce wet scrubbers and mandate staggered shifts for high-emission clusters.
                    </p>
                  </div>

                  <div className="airlab-card" style={{ padding: '16px' }}>
                    <div className="green-icon-box" style={{ marginBottom: '8px' }}>
                      <Building2 size={18} />
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Clinical Triage
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Pre-mobilize respiratory triage and bronchodilator stocks 24h prior to smog surges.
                    </p>
                  </div>
                </div>
              </section>

              {/* Agent Assistant: Prominently featured on First Page */}
              <section id="agent-insight" style={{ marginTop: '8px' }}>
                <AgentAssistant />
              </section>
            </motion.div>
          )}

          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AgentAssistant />
            </motion.div>
          )}

          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <DataQualityView quality={qualityData ?? undefined} />
            </motion.div>
          )}

          {activeTab === 'model' && (
            <motion.div
              key="model"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <ModelMetricsView metrics={metricsData ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
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
              Source & Code
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://github.com/Ali-HF/HackInsight"
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
                style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
              >
                <GitBranch size={14} /> View on GitHub
              </a>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Production Deployment Verified
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
