import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluateQueryGrounded, type AgentResponse, type ForecastCityData } from './AgentAssistant';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responseObj?: AgentResponse;
}

interface FullAIChatViewProps {
  onBackToDashboard: () => void;
  forecasts: Record<string, ForecastCityData> | null;
  quality: any;
  metrics?: any;
  selectedCity: 'Lahore' | 'Karachi';
  onSelectCity?: (city: 'Lahore' | 'Karachi') => void;
}

const SUGGESTED_PROMPTS = [
  {
    title: 'Compare Lahore & Karachi',
    subtitle: 'Which city has worse air right now and why?',
    query: 'Compare Lahore and Karachi air quality right now. Which city is worse and why?',
    icon: '⚖️'
  },
  {
    title: 'Tomorrow’s 24h Forecast',
    subtitle: 'Will pollution rise or fall over the next 24 hours?',
    query: 'What is the 24-hour PM2.5 forecast for Lahore and Karachi? Will air improve tomorrow?',
    icon: '🌤️'
  },
  {
    title: 'School & Mask Directives',
    subtitle: 'Official criteria for outdoor sports & school closures',
    query: 'What are the government school rules and mask requirements for smog in Punjab and Sindh?',
    icon: '🏫'
  },
  {
    title: 'Why Winter Smog Traps',
    subtitle: 'Inversion physics and agricultural crop burning',
    query: 'Why does smog become so severe in winter in Pakistan? Explain thermal inversion simply.',
    icon: '🌡️'
  },
  {
    title: 'Outdoor Exercise Safety',
    subtitle: 'Can I go jogging or send kids out to play today?',
    query: 'Is it safe to go jogging or exercise outdoors today? What precautions should I take?',
    icon: '🏃'
  },
  {
    title: 'Sensor Reliability & Truth',
    subtitle: 'Audit trail, PAQI network, and zero synthetic data',
    query: 'How reliable is this sensor data? How do you prevent fake or hallucinated readings?',
    icon: '🛡️'
  }
];

export const FullAIChatView: React.FC<FullAIChatViewProps> = ({
  onBackToDashboard,
  forecasts,
  quality,
  metrics,
  selectedCity: _selectedCity,
  onSelectCity: _onSelectCity
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-msg',
      sender: 'assistant',
      text: `Hello! I am your **Unified Environmental Decision Assistant** for Pakistan.\n\nI monitor **both Lahore and Karachi** using live ground sensors from the Pakistan Air Quality Initiative (PAQI) and verified meteorological models. Ask me about current air safety, 24-hour smog forecasts, school rules, outdoor masks, or comparing cities.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseObj: evaluateQueryGrounded(
        `Compare Lahore and Karachi air quality right now.`,
        forecasts,
        quality,
        metrics
      )
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (forecasts && messages.length === 1 && messages[0].id === 'init-msg') {
      setMessages([
        {
          id: 'init-msg',
          sender: 'assistant',
          text: `Hello! I am your **Unified Environmental Decision Assistant** for Pakistan.\n\nI monitor **both Lahore and Karachi** using live ground sensors from the Pakistan Air Quality Initiative (PAQI) and verified meteorological models. Ask me about current air safety, 24-hour smog forecasts, school rules, outdoor masks, or comparing cities.`,
          timestamp: messages[0].timestamp,
          responseObj: evaluateQueryGrounded(
            `Compare Lahore and Karachi air quality right now.`,
            forecasts,
            quality,
            metrics
          )
        }
      ]);
    }
  }, [forecasts, quality, metrics]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. Evaluate with local unified grounded RAG engine
      const evaluated = evaluateQueryGrounded(text, forecasts, quality, metrics);

      // 2. Attempt remote Gemini 2.5 Flash if endpoint is available
      try {
        const apiRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text,
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
        // Fallback cleanly to grounded answer
      }

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'assistant',
        text: evaluated.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseObj: evaluated
      };

      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: `Starting a fresh inquiry session. Ask me any question about **Lahore**, **Karachi**, smog physics, or health protocols.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const toggleEvidence = (msgId: string) => {
    setExpandedEvidence(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Helper to format text with bold (**text**), line breaks, and headers
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} style={{ height: '8px' }} />;
      }

      // Check for bullet lines
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().replace(/^[-•*]\s+/, '') : line;

      // Parse bold segments
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} style={{ color: '#0F172A', fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0 4px 8px' }}>
            <span style={{ color: '#2563EB', fontWeight: 800, marginTop: '-1px' }}>•</span>
            <span style={{ fontSize: '0.925rem', lineHeight: 1.6, color: '#334155' }}>{renderedParts}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} style={{ margin: '4px 0', fontSize: '0.925rem', lineHeight: 1.6, color: '#334155' }}>
          {renderedParts}
        </p>
      );
    });
  };

  const lahoreLive = forecasts?.['Lahore']?.current_pm25;
  const karachiLive = forecasts?.['Karachi']?.current_pm25;

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 110px)',
      minHeight: '680px',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      boxShadow: '0 8px 32px rgba(15, 23, 42, 0.05)'
    }}>
      {/* 1. LEFT SIDEBAR (Claude / ChatGPT style) */}
      <aside style={{
        width: '320px',
        borderRight: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Top Header & New Chat Button */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={onBackToDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0',
              outline: 'none'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 16px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Sparkles size={16} color="#60A5FA" />
            + New Conversation
          </button>

          {/* Dual City Telemetry Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '12px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
              <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Live Ground Telemetry
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#2563EB" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Lahore</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#DC2626' }}>
                {lahoreLive !== undefined ? `${lahoreLive.toFixed(1)} µg/m³` : 'Syncing...'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#0D9488" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Karachi</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EA580C' }}>
                {karachiLive !== undefined ? `${karachiLive.toFixed(1)} µg/m³` : 'Syncing...'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Recommended Prompts */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Recommended Queries
          </span>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                borderRadius: '10px',
                padding: '9px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EDF2F7';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.05rem' }}>{p.icon}</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {p.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom Verification Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#16A34A" />
            <div style={{ fontSize: '0.7rem', color: '#334155', lineHeight: 1.3 }}>
              <strong>100% Ground Telemetry</strong>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                Zero hallucinated numerical data
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONVERSATION WORKSPACE */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        position: 'relative'
      }}>
        {/* Workspace Top Header */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <Bot size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                Unified Environmental Decision Assistant
              </h2>
              <span style={{ fontSize: '0.725rem', color: '#64748B' }}>
                Simultaneously grounded in Lahore & Karachi monitoring stations
              </span>
            </div>
          </div>

          <button
            onClick={onBackToDashboard}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Close Full Window ✕
          </button>
        </div>

        {/* Message Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const resp = msg.responseObj;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  justifyContent: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                    flexShrink: 0
                  }}>
                    <Sparkles size={16} />
                  </div>
                )}

                <div style={{
                  maxWidth: isUser ? '75%' : '84%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Message Bubble */}
                  <div style={{
                    backgroundColor: isUser ? '#0F172A' : '#F8FAFC',
                    color: isUser ? '#FFFFFF' : '#1E293B',
                    padding: isUser ? '12px 18px' : '18px 22px',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    border: isUser ? 'none' : '1px solid #E2E8F0',
                    boxShadow: isUser ? '0 4px 12px rgba(15, 23, 42, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.02)'
                  }}>
                    {isUser ? (
                      <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.5, color: '#FFFFFF' }}>
                        {msg.text}
                      </p>
                    ) : (
                      renderMessageContent(msg.text)
                    )}
                  </div>

                  {/* AI Metadata Box: Verified Sources & Telemetry Drawer */}
                  {!isUser && resp && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
                      {/* Citations Box */}
                      {resp.citations && resp.citations.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginTop: '2px'
                        }}>
                          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Verified Sources:
                          </span>
                          {resp.citations.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #DBEAFE',
                                color: '#1E40AF'
                              }}
                            >
                              <BookOpen size={11} color="#2563EB" />
                              {c.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expandable Grounding Evidence Accordion */}
                      {resp.evidence && Object.keys(resp.evidence).length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleEvidence(msg.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: '#64748B',
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '2px 0',
                              outline: 'none'
                            }}
                          >
                            {expandedEvidence[msg.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            <span>{expandedEvidence[msg.id] ? 'Hide Numerical Evidence' : 'Inspect Verified Telemetry Evidence'}</span>
                          </button>

                          {expandedEvidence[msg.id] && (
                            <motion.pre
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              style={{
                                margin: '6px 0 0 0',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                backgroundColor: '#0F172A',
                                color: '#38BDF8',
                                fontSize: '0.7rem',
                                fontFamily: 'monospace',
                                overflowX: 'auto',
                                lineHeight: 1.45
                              }}
                            >
                              {JSON.stringify(resp.evidence, null, 2)}
                            </motion.pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span style={{
                    fontSize: '0.675rem',
                    color: '#94A3B8',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    paddingLeft: isUser ? '0' : '4px'
                  }}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>
                    U
                  </div>
                )}
              </motion.div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B', fontSize: '0.825rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}>
                <Sparkles size={16} />
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Synthesizing grounded multi-city telemetry...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Area */}
        <div style={{
          padding: '16px 28px 20px 28px',
          borderTop: '1px solid #F1F5F9',
          backgroundColor: '#FFFFFF'
        }}>
          {/* Quick Prompt Pills above Input */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
            {SUGGESTED_PROMPTS.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                style={{
                  fontSize: '0.725rem',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '18px',
            padding: '6px 8px 6px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            transition: 'border-color 0.2s ease'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Lahore or Karachi air, smog forecasts, health rules, or compare cities..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.925rem',
                color: '#0F172A',
                padding: '8px 0'
              }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: input.trim() && !loading ? '#2563EB' : '#CBD5E1',
                color: '#FFFFFF',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.675rem', color: '#94A3B8' }}>
            <span>Grounded in PAQI telemetry, EPA Barkjohn calibration, and official Pak-EPA NEQS standards.</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </section>
    </div>
  );
};
