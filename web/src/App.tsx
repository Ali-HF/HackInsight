import React, { useEffect, useState } from 'react';
import { WeatherSwimHeader } from './components/WeatherSwimHeader';
import { WeatherSwimMap } from './components/WeatherSwimMap';
import { ForecastTrajectoryWidget } from './components/ForecastTrajectoryWidget';
import { ModelPerformanceWidget } from './components/ModelPerformanceWidget';
import { RAGChatbotWidget } from './components/RAGChatbotWidget';
import { FullAIChatView } from './components/FullAIChatView';
import { DataQualityView } from './components/DataQualityView';
import { ModelMetricsView } from './components/ModelMetricsView';
import type {
  LatestForecastPayload,
  QualityAssessmentPayload,
  ModelMetricsPayload,
  CityForecastTrajectory
} from './types';
import { School, Truck, Factory, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCity, setSelectedCity] = useState<'Lahore' | 'Karachi'>('Lahore');
  const [isDark, setIsDark] = useState<boolean>(false);

  const [forecastData, setForecastData] = useState<LatestForecastPayload | null>(null);
  const [qualityData, setQualityData] = useState<QualityAssessmentPayload | null>(null);
  const [metricsData, setMetricsData] = useState<ModelMetricsPayload | null>(null);
  const [trajectoryData, setTrajectoryData] = useState<Record<string, CityForecastTrajectory>>({});

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

  const [liveWeather, setLiveWeather] = useState<{
    Lahore?: { temp: number; humidity: number; rain: number; wind: number };
    Karachi?: { temp: number; humidity: number; rain: number; wind: number };
  }>({});

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

    fetch('/data/forecast_timeseries.json')
      .then(res => res.json())
      .then(data => setTrajectoryData(data))
      .catch(err => console.warn('Using default trajectory:', err));

    // Live Open-Meteo real-time outdoor weather queries
    fetch('https://api.open-meteo.com/v1/forecast?latitude=31.5204&longitude=74.3587&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m')
      .then(res => res.json())
      .then(data => {
        if (data?.current) {
          setLiveWeather(prev => ({
            ...prev,
            Lahore: {
              temp: data.current.temperature_2m,
              humidity: data.current.relative_humidity_2m,
              rain: data.current.precipitation,
              wind: data.current.wind_speed_10m
            }
          }));
        }
      })
      .catch(err => console.warn('Lahore live weather offline, using cached snapshot:', err));

    fetch('https://api.open-meteo.com/v1/forecast?latitude=24.8607&longitude=67.0011&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m')
      .then(res => res.json())
      .then(data => {
        if (data?.current) {
          setLiveWeather(prev => ({
            ...prev,
            Karachi: {
              temp: data.current.temperature_2m,
              humidity: data.current.relative_humidity_2m,
              rain: data.current.precipitation,
              wind: data.current.wind_speed_10m
            }
          }));
        }
      })
      .catch(err => console.warn('Karachi live weather offline, using cached snapshot:', err));
  }, []);

  const currentCityForecast = forecastData?.forecast_data?.cities?.[selectedCity];

  const lahoreForecast = forecastData?.forecast_data?.cities?.['Lahore'];
  const karachiForecast = forecastData?.forecast_data?.cities?.['Karachi'];

  const lahorePm25 = lahoreForecast?.current_pm25;
  const karachiPm25 = karachiForecast?.current_pm25;
  const lahorePredicted = lahoreForecast?.predicted_pm25_24h;
  const karachiPredicted = karachiForecast?.predicted_pm25_24h;

  const lahoreTemp = liveWeather.Lahore?.temp ?? lahoreForecast?.temperature_c;
  const karachiTemp = liveWeather.Karachi?.temp ?? karachiForecast?.temperature_c;
  const lahoreHumidity = liveWeather.Lahore?.humidity ?? lahoreForecast?.humidity_pct;
  const karachiHumidity = liveWeather.Karachi?.humidity ?? karachiForecast?.humidity_pct;
  const lahoreRain = liveWeather.Lahore?.rain ?? lahoreForecast?.precipitation_mm;
  const karachiRain = liveWeather.Karachi?.rain ?? karachiForecast?.precipitation_mm;

  const predictedPm25 = currentCityForecast?.predicted_pm25_24h ?? 0;
  const lower80 = currentCityForecast?.lower_80 ?? 0;
  const upper80 = currentCityForecast?.upper_80 ?? 0;
  const baselineVal = currentCityForecast?.baseline_persistence ?? 0;

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
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Upper Section: Atmospheric Map Canvas with Verified Ground Station & Explicit Grid Switch */}
              <WeatherSwimMap
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                lahorePm25={lahorePm25}
                karachiPm25={karachiPm25}
                lahorePredicted={lahorePredicted}
                karachiPredicted={karachiPredicted}
                lahoreTemp={lahoreTemp}
                karachiTemp={karachiTemp}
                lahoreHumidity={lahoreHumidity}
                karachiHumidity={karachiHumidity}
                lahoreRain={lahoreRain}
                karachiRain={karachiRain}
                lahoreSensors={lahoreForecast?.sensors_evaluated}
                karachiSensors={karachiForecast?.sensors_evaluated}
                lahoreSensorId={lahoreForecast?.sensor_id}
                karachiSensorId={karachiForecast?.sensor_id}
                isLiveOutdoor={Boolean(liveWeather.Lahore || liveWeather.Karachi || lahoreForecast?.source?.includes('live'))}
              />

              {/* Lower Section: 3 Bottom Widgets matching WeatherSwim */}
              <div className="weatherswim-bottom-grid">
                {/* Bottom Left: 24h PM2.5 Forecast & Conformal Uncertainty Horizon */}
                <ForecastTrajectoryWidget
                  city={selectedCity}
                  trajectoryData={trajectoryData[selectedCity] ?? null}
                  predictedVal={predictedPm25}
                  lower80={lower80}
                  upper80={upper80}
                  baselineVal={baselineVal}
                />

                {/* Bottom Center: Model Performance & Lift Telemetry */}
                <ModelPerformanceWidget
                  city={selectedCity}
                  metrics={metricsData}
                  forecast={currentCityForecast}
                />

                {/* Bottom Right: Grounded RAG Decision Assistant Chatbot */}
                <RAGChatbotWidget
                  city={selectedCity}
                  forecasts={forecastData?.forecast_data?.cities || null}
                  quality={qualityData?.quality_assessment || null}
                  metrics={metricsData}
                  onOpenFullChat={() => setActiveTab('assistant')}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            >
              <FullAIChatView
                onBackToDashboard={() => setActiveTab('overview')}
                forecasts={forecastData?.forecast_data?.cities || null}
                quality={qualityData?.quality_assessment || null}
                metrics={metricsData}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
              />
            </motion.div>
          )}

          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            >
              <DataQualityView quality={qualityData ?? undefined} />
            </motion.div>
          )}

          {activeTab === 'protocols' && (
            <motion.div
              key="protocols"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
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
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
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
          <strong style={{ color: '#0F172A', fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem' }}>air<span style={{ color: '#059669' }}>Labs</span></strong>
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
