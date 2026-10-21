import React from 'react';
import { Wind, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeatherSwimHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: 'Lahore' | 'Karachi';
  setSelectedCity?: (city: 'Lahore' | 'Karachi') => void;
  isDark: boolean;
  toggleDark: () => void;
}

export const WeatherSwimHeader: React.FC<WeatherSwimHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  isDark,
  toggleDark
}) => {
  const tabs = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'assistant', label: 'AI Assistant' },
    { id: 'quality', label: 'Data Quality' },
    { id: 'protocols', label: 'Action Protocols' },
    { id: 'model', label: 'Model Metrics' }
  ];

  return (
    <header className="airlabs-navbar">
      <div className="airlabs-navbar-inner">
        {/* 1. Brand Logo: airLabs */}
        <div
          onClick={() => setActiveTab('overview')}
          className="airlabs-brand"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            <Wind size={18} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: isDark ? '#F8FAFC' : '#0F172A'
            }}>
              air<span style={{ color: '#059669' }}>Labs</span>
            </span>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              marginBottom: '3px',
              marginLeft: '1px'
            }} />
          </div>
        </div>

        {/* 2. Center Pill Tabs with Smooth Animated Pill */}
        <nav className="airlabs-nav-tabs">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  position: 'relative',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'color 0.15s ease',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#0F172A',
                      borderRadius: '999px',
                      zIndex: -1
                    }}
                  />
                )}
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* 3. Right Controls: Professional City Segmented Switcher & Theme Toggle */}
        <div className="airlabs-nav-controls">
          {/* Segmented City Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
            padding: '3px',
            borderRadius: '999px',
            border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
          }}>
            <button
              onClick={() => setSelectedCity && setSelectedCity('Lahore')}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: selectedCity === 'Lahore' ? 700 : 600,
                backgroundColor: selectedCity === 'Lahore' ? (isDark ? '#0F172A' : '#FFFFFF') : 'transparent',
                color: selectedCity === 'Lahore' ? (isDark ? '#F8FAFC' : '#0F172A') : '#64748B',
                boxShadow: selectedCity === 'Lahore' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
            >
              Lahore
            </button>
            <button
              onClick={() => setSelectedCity && setSelectedCity('Karachi')}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: selectedCity === 'Karachi' ? 700 : 600,
                backgroundColor: selectedCity === 'Karachi' ? (isDark ? '#0F172A' : '#FFFFFF') : 'transparent',
                color: selectedCity === 'Karachi' ? (isDark ? '#F8FAFC' : '#0F172A') : '#64748B',
                boxShadow: selectedCity === 'Karachi' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
            >
              Karachi
            </button>
          </div>

          {/* Subtle Live PAQI Status */}
          <div className="airlabs-live-tag">
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#16A34A',
              boxShadow: '0 0 6px #16A34A'
            }} />
            <span>PAQI Live</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDark}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#334155' : 'rgba(226, 232, 240, 0.8)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDark ? '#FBBF24' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            {isDark ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default WeatherSwimHeader;
