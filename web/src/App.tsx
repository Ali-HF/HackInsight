import React, { useEffect, useState } from 'react';
import { WeatherSwimHeader } from './components/WeatherSwimHeader';
import { WeatherSwimMap } from './components/WeatherSwimMap';
import { TrendAnalysisWidget } from './components/TrendAnalysisWidget';
import { AirFlowWidget } from './components/AirFlowWidget';
import { RAGChatbotWidget } from './components/RAGChatbotWidget';
import { DataQualityView } from './components/DataQualityView';
import { ModelMetricsView } from './components/ModelMetricsView';
import type { LatestForecastPayload, QualityAssessmentPayload, ModelMetricsPayload, TimeSeriesPoint } from './types';
import { School, Truck, Factory, Building2 } from 'lucide-react';
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

  const lahoreForecast = forecastData?.forecast_data?.cities?.['Lahore'];
  const karachiForecast = forecastData?.forecast_data?.cities?.['Karachi'];

  const lahorePm25 = lahoreForecast?.current_pm25 ?? 180.1;
  const karachiPm25 = karachiForecast?.current_pm25 ?? 95.5;
  const lahorePredicted = lahoreForecast?.predicted_pm25_24h ?? 153.8;
  const karachiPredicted = karachiForecast?.predicted_pm25_24h ?? 107.9;

  const predictedPm25 = currentCityForecast?.predicted_pm25_24h ?? (selectedCity === 'Karachi' ? 107.9 : 153.8);
  const lower80 = currentCityForecast?.lower_80 ?? (selectedCity === 'Karachi' ? 53.0 : 75.8);
  const upper80 = currentCityForecast?.upper_80 ?? (selectedCity === 'Karachi' ? 182.4 : 259.7);
  const isHighRisk = predictedPm25 > 150.0;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F0F4F7',
      color: '#0F172A',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* 1. WeatherSwim Style Navbar */}
      <WeatherSwimHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      {/* 2. Main Dashboard Content */}
      <main style={{
        flex: 1,
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        padding: '0 24px 32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Upper Section: Atmospheric Map Canvas with Interactive On-Map City Switching */}
              <WeatherSwimMap
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                lahorePm25={lahorePm25}
                karachiPm25={karachiPm25}
                lahorePredicted={lahorePredicted}
                karachiPredicted={karachiPredicted}
              />

              {/* Lower Section: 3 Bottom Widgets matching WeatherSwim */}
              <div className="weatherswim-bottom-grid">
                {/* Bottom Left: Pollution Trend Analysis */}
                <TrendAnalysisWidget
                  timeseries={cityTimeseries}
                  predictedVal={predictedPm25}
                  lower80={lower80}
                  upper80={upper80}
                  city={selectedCity}
                />

                {/* Bottom Center: Air Flow Status & Wind Compass */}
                <AirFlowWidget isHighRisk={isHighRisk} />

                {/* Bottom Right: Grounded RAG Decision Assistant Chatbot */}
                <RAGChatbotWidget
                  city={selectedCity}
                  forecasts={forecastData?.forecast_data?.cities || null}
                  quality={qualityData?.quality_assessment || null}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <DataQualityView quality={qualityData ?? undefined} />
            </motion.div>
          )}

          {activeTab === 'protocols' && (
            <motion.div
              key="protocols"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ maxWidth: '800px', marginBottom: '8px' }}>
                <span className="badge badge-green" style={{ marginBottom: '6px' }}>Provincial Protocols</span>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
                  Statutory Smog Emergency Protocols (PM2.5 &gt; 150 µg/m³)
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '4px' }}>
                  Legally enforceable action triggers issued by the Government of Punjab Environmental Protection Department (EPD) and Sindh EPA.
                </p>
              </div>

              <div className="grid-4">
                <div className="airlab-card" style={{ padding: '20px' }}>
                  <div className="green-icon-box">
                    <School size={20} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '4px' }}>
                    Schools & Academia
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                    Mandatory suspension of morning assemblies and outdoor athletics when PM2.5 exceeds 150 µg/m³. Enforce N95 masking.
                  </p>
                </div>

                <div className="airlab-card" style={{ padding: '20px' }}>
                  <div className="green-icon-box">
                    <Truck size={20} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '4px' }}>
                    Heavy Diesel Transport
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                    Divert inter-city heavy freight off urban arterial corridors during nocturnal temperature inversions (20:00 - 06:00).
                  </p>
                </div>

                <div className="airlab-card" style={{ padding: '20px' }}>
                  <div className="green-icon-box">
                    <Factory size={20} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '4px' }}>
                    Industrial Kilns & Mills
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                    Mandate wet scrubbers and zigzag conversion for brick kilns. Enforce staggered operational shifts for steel re-rolling mills.
                  </p>
                </div>

                <div className="airlab-card" style={{ padding: '20px' }}>
                  <div className="green-icon-box">
                    <Building2 size={20} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '4px' }}>
                    Clinical Triage
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                    Pre-position emergency bronchodilators, nebulizers, and pediatric oxygen beds in district headquarters hospitals 24h ahead.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'model' && (
            <motion.div
              key="model"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ModelMetricsView metrics={metricsData ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Clean Minimalist Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '20px 24px',
        borderTop: '1px solid rgba(226, 232, 240, 0.7)',
        backgroundColor: '#FFFFFF',
        fontSize: '0.75rem',
        color: '#94A3B8',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>WeatherAir PK</strong>
          <span>• Powered by Pakistan Air Quality Initiative (PAQI) Sensor Telemetry</span>
        </div>
        <div>
          Autonomous ML Forecaster & Grounded Decision Support • Open Source
        </div>
      </footer>
    </div>
  );
};

export default App;
