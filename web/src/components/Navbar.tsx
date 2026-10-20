import { Logo } from './Logo';
import { ShieldCheck, Activity, BrainCircuit, BarChart3, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: 'Lahore' | 'Karachi';
  setSelectedCity: (city: 'Lahore' | 'Karachi') => void;
  lastUpdated?: string;
  isDark: boolean;
  toggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  lastUpdated,
  isDark,
  toggleDark
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--card-border)',
      backgroundColor: 'var(--bg-main)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '74px',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '8px',
        paddingBottom: '8px'
      }}>
        {/* Brand identity & Navigation links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Logo />
          
          <nav className="nav-menu" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'overview' ? 'var(--brand-green-subtle)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--brand-green-text)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'overview' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Activity size={16} />
              24h Forecast
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'assistant' ? 'var(--brand-green-subtle)' : 'transparent',
                color: activeTab === 'assistant' ? 'var(--brand-green-text)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'assistant' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <BrainCircuit size={16} />
              Insight Agent
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'quality' ? 'var(--brand-green-subtle)' : 'transparent',
                color: activeTab === 'quality' ? 'var(--brand-green-text)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'quality' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={16} />
              Data Quality
            </button>

            <button
              onClick={() => setActiveTab('model')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'model' ? 'var(--brand-green-subtle)' : 'transparent',
                color: activeTab === 'model' ? 'var(--brand-green-text)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'model' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={16} />
              Model Metrics
            </button>
          </nav>
        </div>

        {/* Action Controls & City Selector & Dark Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* City switcher pill */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--card-border)'
          }}>
            <button
              onClick={() => setSelectedCity('Lahore')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedCity === 'Lahore' ? 'var(--bg-card)' : 'transparent',
                color: selectedCity === 'Lahore' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: selectedCity === 'Lahore' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Lahore
            </button>
            <button
              onClick={() => setSelectedCity('Karachi')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedCity === 'Karachi' ? 'var(--bg-card)' : 'transparent',
                color: selectedCity === 'Karachi' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: selectedCity === 'Karachi' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Karachi
            </button>
          </div>

          {/* Operational Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--brand-green-subtle)',
            border: '1px solid rgba(153, 222, 123, 0.4)',
            fontSize: '0.75rem',
            color: 'var(--brand-green-text)',
            fontWeight: 600
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#48BB78',
              display: 'inline-block'
            }} />
            {lastUpdated ? `Live: ${lastUpdated.slice(11, 16)} UTC` : 'Prefect: Live'}
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="btn-outline"
            style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', justifyContent: 'center' }}
          >
            {isDark ? <Sun size={16} color="#99DE7B" /> : <Moon size={16} color="#4A5568" />}
          </button>
        </div>
      </div>
    </header>
  );
};
