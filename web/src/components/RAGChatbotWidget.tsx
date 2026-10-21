import React, { useState, useEffect } from 'react';
import { Send, Bot, ShieldCheck, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateQueryGrounded } from './AgentAssistant';

interface RAGChatbotWidgetProps {
  city: 'Lahore' | 'Karachi';
  forecasts: any;
  quality: any;
  onOpenFullChat?: () => void;
}

export const RAGChatbotWidget: React.FC<RAGChatbotWidgetProps> = ({
  city,
  forecasts,
  quality,
  onOpenFullChat
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(() =>
    evaluateQueryGrounded(`What is the 24h PM2.5 forecast for ${city}?`, forecasts, quality)
  );

  // Sync default answer when city changes
  useEffect(() => {
    setResponse(evaluateQueryGrounded(`What is the 24h PM2.5 forecast for ${city}?`, forecasts, quality));
  }, [city, forecasts, quality]);

  const quickPrompts = [
    { label: 'Compare Cities', query: `Compare Lahore and Karachi air quality right now.`, emoji: '⚖️' },
    { label: 'Tomorrow', query: `What is tomorrow's 24h PM2.5 forecast for ${city}?`, emoji: '⚡' },
    { label: 'Safe outside?', query: `Is it safe to go jogging or exercise outside in ${city}?`, emoji: '🛡️' },
    { label: 'School rules', query: `What are school rules for smog in ${city}?`, emoji: '🏫' },
    { label: 'Why smog traps', query: `Why does smog trap in winter in Pakistan?`, emoji: '🌡️' }
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    setInputQuery('');
    setLoading(true);

    try {
      // 1. Evaluate with unified multi-city grounded semantic engine
      const evaluated = evaluateQueryGrounded(queryText, forecasts, quality);

      // 2. Attempt remote Gemini 2.5 Flash if available
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
            evaluated.answer = apiJson.answer;
            evaluated.tools_used = [...evaluated.tools_used, "gemini-2.5-flash"];
          }
        }
      } catch (e) {
        // Fallback cleanly to local evaluated response
      }

      setResponse(evaluated);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render bold markdown (**text**) cleanly
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

  return (
    <div className="airlab-card" style={{
      padding: '20px 22px',
      borderRadius: '22px',
      backgroundColor: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%'
    }}>
      {/* Top Header & Expand Button */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={14} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em', margin: 0 }}>
              Decision Assistant
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenFullChat && (
              <button
                onClick={onOpenFullChat}
                title="Expand to Full Window AI Chat Assistant"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.675rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#DBEAFE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
              >
                <Maximize2 size={11} />
                <span>Full Chat ↗</span>
              </button>
            )}

            <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#15803D' }} />
              Unified RAG
            </span>
          </div>
        </div>

        {/* Horizontal Non-Wrapping Quick Prompt Chips */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          paddingBottom: '2px',
          marginBottom: '10px',
          scrollbarWidth: 'none'
        }}>
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSend(p.query)}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Response Speech Bubble (Spacious, Uncluttered, Plain English) */}
      <div style={{
        flex: 1,
        minHeight: '120px',
        maxHeight: '165px',
        overflowY: 'auto',
        backgroundColor: '#F8FAFC',
        borderRadius: '14px',
        padding: '12px 14px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748B',
              fontSize: '0.78rem',
              fontStyle: 'italic',
              padding: '12px 0'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
              Checking multi-city sensor telemetry...
            </div>
          ) : (
            <motion.div
              key={response?.interaction_id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
            >
              <div style={{
                fontSize: '0.815rem',
                lineHeight: 1.5,
                color: '#1E293B',
                fontWeight: 450,
                whiteSpace: 'pre-wrap'
              }}>
                {renderFormatted(response?.answer || '')}
              </div>

              {/* Verified Grounding Subtitle & Full Chat Link */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.675rem',
                color: '#64748B',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid #EDF2F7'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={12} color="#16A34A" />
                  <span>Verified ground telemetry (PAQI)</span>
                </div>

                {onOpenFullChat && (
                  <button
                    onClick={onOpenFullChat}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563EB',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <span>Read in full window ↗</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#F1F5F9',
        borderRadius: '999px',
        padding: '4px 6px 4px 14px',
        border: '1px solid #E2E8F0'
      }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about Lahore, Karachi, forecasts, masks...`}
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
  );
};

export default RAGChatbotWidget;
