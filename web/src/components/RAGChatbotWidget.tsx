import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, BookOpen, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateQueryGrounded } from './AgentAssistant';

interface RAGChatbotWidgetProps {
  city: 'Lahore' | 'Karachi';
  forecasts: any;
  quality: any;
}

export const RAGChatbotWidget: React.FC<RAGChatbotWidgetProps> = ({
  city,
  forecasts,
  quality
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(() =>
    evaluateQueryGrounded(`What is the 24h PM2.5 forecast for ${city}?`, forecasts, quality)
  );

  const quickPrompts = [
    `24h Forecast`,
    `Safe outside?`,
    `School rules`,
    `Sensor reliability`
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    setInputQuery('');
    setLoading(true);

    try {
      // 1. Evaluate with grounded semantic engine
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

  return (
    <div className="airlab-card" style={{
      padding: '18px 20px',
      borderRadius: '22px',
      backgroundColor: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%'
    }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={14} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em' }}>
              Decision Assistant
            </h3>
          </div>

          <span className="badge badge-green" style={{ fontSize: '0.675rem', padding: '2px 8px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#15803D' }} />
            Grounded RAG
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(`${p} for ${city}`)}
              style={{
                fontSize: '0.675rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={10} color="#15803D" />
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Response Stream (Compact & Scrollable) */}
      <div style={{
        flex: 1,
        minHeight: '110px',
        maxHeight: '135px',
        overflowY: 'auto',
        backgroundColor: '#F8FAFC',
        borderRadius: '12px',
        padding: '10px 12px',
        border: '1px solid #EDF2F7',
        fontSize: '0.78rem',
        lineHeight: 1.45,
        color: '#334155',
        marginBottom: '10px'
      }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontStyle: 'italic', padding: '8px 0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
              Grounding response from sensor telemetry...
            </div>
          ) : (
            <motion.div
              key={response?.interaction_id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{ color: '#0F172A', fontWeight: 500, marginBottom: '6px' }}>
                {response?.answer}
              </div>

              {/* Warning Alert Banner (if present) */}
              {response?.warnings && response.warnings.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  padding: '3px 6px',
                  fontSize: '0.675rem',
                  color: '#B91C1C',
                  marginBottom: '6px'
                }}>
                  <AlertCircle size={11} color="#DC2626" />
                  <span>{response.warnings[0]}</span>
                </div>
              )}

              {/* Citations / Sources */}
              {response?.citations && response.citations.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#64748B', flexWrap: 'wrap', marginTop: '4px' }}>
                  <BookOpen size={10} color="#15803D" />
                  <span style={{ fontWeight: 600 }}>Source:</span>
                  <span>{response.citations[0].title}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Compact Input Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#F1F5F9',
        borderRadius: '999px',
        padding: '4px 6px 4px 12px',
        border: '1px solid #E2E8F0'
      }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about ${city} air quality or advisories...`}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.75rem',
            color: '#1E293B',
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
            transition: 'background-color 0.15s ease'
          }}
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
};

export default RAGChatbotWidget;
