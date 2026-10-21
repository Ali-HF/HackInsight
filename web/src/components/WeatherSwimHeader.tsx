import React from 'react';
import { Search, SlidersHorizontal, Bell, ShieldCheck, Sun, Moon } from 'lucide-react';

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
  setSelectedCity: _setSelectedCity,
  isDark,
  toggleDark
}) => {
  const tabs = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'quality', label: 'Data Quality' },
    { id: 'protocols', label: 'Action Protocols' },
    { id: 'model', label: 'Model Metrics' }
  ];

  return (
    <header style={{
      width: '100%',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      backgroundColor: 'transparent'
    }}>
      {/* 1. Brand Logo (WeatherSwim style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          onClick={() => setActiveTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>
            Weather<span style={{ color: '#22C55E' }}>Air</span>
          </span>
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            letterSpacing: '0.04em'
          }}>
            PK
          </span>
        </div>

        {/* 2. Center Pill Tabs (WeatherSwim Style: Active dark pill) */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#FFFFFF',
          padding: '4px 6px',
          borderRadius: '999px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          border: '1px solid rgba(226, 232, 240, 0.7)'
        }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  border: 'none',
                  background: isActive ? '#0F172A' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Search Bar, Controls & Agency Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Search input with icons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: '999px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <Search size={14} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search sensor node..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              color: '#334155',
              width: '130px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Icon Action Buttons (Filter, Notification, Settings) */}
        <button style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748B'
        }}>
          <SlidersHorizontal size={14} />
        </button>

        <button style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748B'
        }}>
          <Bell size={14} />
        </button>

        <button
          onClick={toggleDark}
          title="Toggle Theme"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B'
          }}
        >
          {isDark ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} />}
        </button>

        {/* Agency Profile Card (WeatherSwim style) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          padding: '5px 14px 5px 6px',
          borderRadius: '999px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803D'
          }}>
            <ShieldCheck size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              PAQI • {selectedCity}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>
              epd.gov.pk
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default WeatherSwimHeader;
