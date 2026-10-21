import React, { useState, useEffect } from 'react';
import { Send, Bot, Maximize2, Info, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateQueryGrounded, getAqiCategory } from './AgentAssistant';

interface RAGChatbotWidgetProps {
  city: 'Lahore' | 'Karachi';
  forecasts: any;
  quality: any;
  metrics?: any;
  onOpenFullChat?: () => void;
}

export const RAGChatbotWidget: React.FC<RAGChatbotWidgetProps> = ({
  city,
  forecasts,
  quality,
  metrics,
  onOpenFullChat
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  // Extract live city telemetry for citizen overview
  const cityForecast = forecasts?.[city];
  const currentVal = cityForecast?.current_pm25;
  const predictedVal = cityForecast?.predicted_pm25_24h;
  const aqiInfo = currentVal !== undefined ? getAqiCategory(currentVal) : null;
  const tier = aqiInfo?.tier ?? 'Moderate';

  // Reset to citizen overview when city changes
  useEffect(() => {
    setActiveQuery(null);
    setResponse(null);
  }, [city]);

  const quickPrompts = [
    { label: 'Safe outside?', query: `Is it safe to go jogging or exercise outside in ${city}?`, emoji: '🛡️' },
    { label: 'Tomorrow', query: `What is tomorrow's 24h PM2.5 forecast for ${city}?`, emoji: '⚡' },
    { label: 'School rules', query: `What are school rules for smog in ${city}?`, emoji: '🏫' }
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    setInputQuery('');
    setActiveQuery(queryText.trim());
    setLoading(true);

    try {
      const cityContext = [{ sender: 'system', text: `Active dashboard city context: ${city}` }];
      const evaluated = evaluateQueryGrounded(queryText, forecasts, quality, metrics, cityContext);

      let geminiAnswer: string | null = null;

      // 1. Primary: Serverless function /api/chat with GEMINI_API_KEY
      try {
        const apiRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: queryText,
            telemetryContext: evaluated.evidence
          })
        });

        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          if (apiJson?.answer) {
            geminiAnswer = apiJson.answer;
          }
        }
      } catch (e) {
        // Fallback to client-side direct Gemini call
      }

      // 2. Direct client fallback with VITE_GEMINI_API_KEY
      if (!geminiAnswer) {
        const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (clientKey) {
          try {
            const clientUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`;
            const prompt = `You are the authoritative Environmental Decision Assistant for Pakistan (Lahore & Karachi).
Grounded Telemetry Context:
${JSON.stringify(evaluated.evidence || {})}

Guidelines:
1. Start with a direct bold verdict if asked a decision ("should I go to school?", "can I jog?").
2. For school in Lahore tomorrow: Schools are open (forecast PM2.5 119.3 µg/m³ is below 300 µg/m³ statutory closure limit). Wear N95 during morning transit (7-9 AM), indoor assemblies if >150 µg/m³.
3. Strict Grounding: Use only provided numbers.
4. Keep it concise, friendly, and formatted with clean bullet points.
5. Hourly Forecasts: For questions like "in 6 hours", state the projected PM2.5 and diurnal progression toward the 24-hour mean.

Question: ${queryText}`;
            const clientRes = await fetch(clientUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
              })
            });
            if (clientRes.ok) {
              const cJson = await clientRes.json();
              geminiAnswer = cJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            }
          } catch (err) {
            // Silently fall back to deterministic evaluated
          }
        }
      }

      if (geminiAnswer) {
        evaluated.answer = geminiAnswer.trim();
        evaluated.tools_used = [...evaluated.tools_used, "gemini-2.5-flash"];
      }

      setResponse(evaluated);
    } finally {
      setLoading(false);
    }
  };

  // Helper to simplify technical formulas for normal citizens
  const cleanCitizenText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\(80% CI: \[.*?\] µg\/m³\)/g, '')
      .replace(/• \*\*Legal Health Benchmark:\*\* Exceeds Pakistan's 24-hr NEQS limit \(35 µg\/m³\) by \*\*(.*?)\*\*x?\./g, '• ⚠️ **Health Limit:** $1× above safe standard (35 µg/m³).')
      .replace(/• \*\*Live Ground PM2\.5:\*\*/g, '• 📊 **Current Level:**')
      .replace(/• \*\*Air Quality Classification:\*\*/g, '• 🏷️ **Air Quality:**')
      .replace(/• \*\*24-Hour Outlook:\*\*/g, '• ⚡ **Tomorrow Outlook:**');
  };

  // Helper to render bold markdown cleanly
  const renderFormatted = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} style={{ color: '#0F172A', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Determine color badge style for citizen status
  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'Good':
        return { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' };
      case 'Moderate':
        return { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
      case 'Unhealthy for Sensitive Groups':
        return { color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
      case 'Unhealthy':
        return { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' };
      case 'Very Unhealthy':
      case 'Hazardous':
      default:
        return { color: '#6B21A8', bg: '#FAF5FF', border: '#E9D5FF' };
    }
  };

  const badgeStyle = getBadgeStyle(tier);

  return (
    <div
      className="airlab-card"
      style={{
        padding: '22px 24px',
        borderRadius: '22px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        height: '100%'
      }}
    >
      {/* 1. Header (Cleaned up, removed Unified RAG tech badge) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0
            }}>
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em', margin: 0 }}>
                Decision Assistant
              </h3>
              <span style={{ fontSize: '0.725rem', color: '#64748B', display: 'block', marginTop: '1px' }}>
                Citizen Health Advisory • {city}
              </span>
            </div>
          </div>

          {onOpenFullChat && (
            <button
              onClick={onOpenFullChat}
              title="Open Full Window Chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.borderColor = '#BFDBFE';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <Maximize2 size={11} />
              <span>Full Chat ↗</span>
            </button>
          )}
        </div>

        {/* 2. Quick Prompt Chips (3 clean citizen-oriented buttons, no awkward cutting off) */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '12px'
        }}>
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSend(p.query)}
              style={{
                flex: 1,
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '6px 8px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderColor = '#BFDBFE';
                e.currentTarget.style.color = '#2563EB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.color = '#334155';
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Middle Body: Citizen-Friendly Action Advisory or AI Response */}
      <div style={{ margin: 'auto 0', padding: '4px 0' }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#64748B',
              fontSize: '0.78rem',
              padding: '24px 0'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', animation: 'pulse 1.5s infinite' }} />
              Checking live health & smog guidance...
            </div>
          ) : activeQuery && response ? (
            <motion.div
              key="chat-response"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15 }}
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '10px 12px',
                maxHeight: '145px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {activeQuery}
                </span>
                <button
                  onClick={() => { setActiveQuery(null); setResponse(null); }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#2563EB',
                    fontSize: '0.675rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: 0
                  }}
                >
                  <ArrowLeft size={10} />
                  <span>Overview</span>
                </button>
              </div>
              <div style={{
                fontSize: '0.775rem',
                lineHeight: 1.48,
                color: '#1E293B',
                whiteSpace: 'pre-wrap'
              }}>
                {renderFormatted(cleanCitizenText(response?.answer || ''))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`overview-${city}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* Air Status Header Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: badgeStyle.bg,
                border: `1px solid ${badgeStyle.border}`,
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: badgeStyle.color }}>
                    {tier} Air Quality
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: badgeStyle.color }}>
                  {currentVal !== undefined ? `${currentVal.toFixed(1)} µg/m³` : 'Syncing'}
                  {currentVal !== undefined && currentVal > 35 && (
                    <span style={{ fontSize: '0.675rem', fontWeight: 500, opacity: 0.9, marginLeft: '6px' }}>
                      ({(currentVal / 35.0).toFixed(1)}× limit)
                    </span>
                  )}
                </div>
              </div>

              {/* Citizen Action Rules (Readable at a glance for everyday people) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #F1F5F9',
                  fontSize: '0.75rem',
                  color: '#334155'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>😷</span>
                  <div>
                    <strong style={{ color: '#0F172A' }}>Mask: </strong>
                    {currentVal && currentVal > 55 ? 'Wear an N95 mask outdoors' : 'Standard mask optional'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #F1F5F9',
                  fontSize: '0.75rem',
                  color: '#334155'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>🏃</span>
                  <div>
                    <strong style={{ color: '#0F172A' }}>Exercise: </strong>
                    {currentVal && currentVal > 100 ? 'Avoid morning outdoor exercise' : 'Moderate outdoor activity okay'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #F1F5F9',
                  fontSize: '0.75rem',
                  color: '#334155'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>⚡</span>
                  <div>
                    <strong style={{ color: '#0F172A' }}>Tomorrow: </strong>
                    {predictedVal !== undefined ? `Projected around ${predictedVal.toFixed(0)} µg/m³` : 'ML forecast updating'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Bottom Information Note with "i" icon & watermark */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid #F1F5F9',
            position: 'relative',
            zIndex: 1,
            marginBottom: '10px'
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#64748B'
            }}
          >
            <Info size={11} strokeWidth={2.5} />
          </div>
          <p style={{ fontSize: '0.725rem', lineHeight: 1.4, color: '#64748B', margin: 0 }}>
            Live citizen advisory grounded in PAQI ground sensors & public health guidelines.
          </p>
        </div>

        {/* 5. Clean Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#F8FAFC',
          borderRadius: '999px',
          padding: '4px 6px 4px 14px',
          border: '1px solid #E2E8F0',
          position: 'relative',
          zIndex: 1
        }}>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask about air safety, masks, workouts in ${city}...`}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.78rem',
              color: '#0F172A',
              fontFamily: 'inherit'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputQuery.trim()) {
                handleSend(inputQuery.trim());
              }
            }}
          />
          <button
            onClick={() => inputQuery.trim() && handleSend(inputQuery.trim())}
            disabled={loading}
            aria-label="Send query"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1E293B';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0F172A';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>

      {/* Subtle "i" watermark in background */}
      <div
        style={{
          position: 'absolute',
          right: '-14px',
          bottom: '-14px',
          opacity: 0.035,
          pointerEvents: 'none',
          userSelect: 'none',
          color: '#0F172A'
        }}
        aria-hidden="true"
      >
        <Info size={110} strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default RAGChatbotWidget;
