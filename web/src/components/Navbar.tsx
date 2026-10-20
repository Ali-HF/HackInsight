import { Logo } from './Logo';
import { ShieldCheck, Activity, BrainCircuit, BarChart3 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: 'Lahore' | 'Karachi';
  setSelectedCity: (city: 'Lahore' | 'Karachi') => void;
  lastUpdated?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  lastUpdated
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--card-border)',
      backgroundColor: '#FFFFFF',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px'
      }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Logo />
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Action Controls & City Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* City switcher pill */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F4EE',
            padding: '3px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid #E1E6DE'
          }}>
            <button
              onClick={() => setSelectedCity('Lahore')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedCity === 'Lahore' ? '#FFFFFF' : 'transparent',
                color: selectedCity === 'Lahore' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: selectedCity === 'Lahore' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Lahore (Smog Zone)
            </button>
            <button
              onClick={() => setSelectedCity('Karachi')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedCity === 'Karachi' ? '#FFFFFF' : 'transparent',
                color: selectedCity === 'Karachi' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: selectedCity === 'Karachi' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Karachi (Coastal)
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
            border: '1px solid #D1EBC2',
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
            {lastUpdated ? `Live: ${lastUpdated.slice(11, 16)} UTC` : 'Prefect: Asia/Karachi'}
          </div>

          <a
            href="#decision-protocol"
            className="btn-airlab"
            style={{ fontSize: '0.8125rem', padding: '8px 18px' }}
          >
            Action Protocol
          </a>
        </div>
      </div>
    </header>
  );
};
