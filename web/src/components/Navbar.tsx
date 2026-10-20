import { Logo } from './Logo';
import { ShieldCheck, Activity, BrainCircuit, BarChart3, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: 'Lahore' | 'Karachi';
  setSelectedCity: (city: 'Lahore' | 'Karachi') => void;
  lastUpdated?: string;
  isDark: boolean;
  toggleDark: () => void;
}

const NAV_ITEMS = [
  { id: 'overview', label: '24h Forecast', icon: Activity },
  { id: 'assistant', label: 'Insight Agent', icon: BrainCircuit },
  { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
  { id: 'model', label: 'Model Metrics', icon: BarChart3 }
];

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
      backdropFilter: 'blur(12px)',
      transition: 'background-color 0.25s ease, border-color 0.25s ease'
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
        {/* Brand identity & Interactive Animated Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <Logo />
          
          <nav className="nav-menu" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: 'transparent',
                    color: isActive ? 'var(--brand-green-text)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'color 0.2s ease'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'var(--brand-green-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid rgba(153, 222, 123, 0.4)',
                        zIndex: -1
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Controls & City Switcher with Spring Animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Animated City Switcher */}
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--card-border)'
          }}>
            {(['Lahore', 'Karachi'] as const).map((city) => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    position: 'relative',
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'color 0.2s ease'
                  }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCityIndicator"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-pill)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                        zIndex: -1
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {city}
                </button>
              );
            })}
          </div>

          {/* Operational Pulse Pill */}
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
              boxShadow: '0 0 8px #48BB78'
            }} />
            {lastUpdated ? `Live: ${lastUpdated.slice(11, 16)} UTC` : 'Prefect: Live'}
          </div>

          {/* Theme Switcher with subtle rotation */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 15 }}
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="btn-outline"
            style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', justifyContent: 'center' }}
          >
            {isDark ? <Sun size={16} color="#99DE7B" /> : <Moon size={16} color="#4A5568" />}
          </motion.button>
        </div>
      </div>
    </header>
  );
};
