import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Mic,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  School,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateQueryGrounded, type AgentResponse, type ForecastCityData } from './AgentAssistant';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responseObj?: AgentResponse;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  messages: ChatMessage[];
}

interface FullAIChatViewProps {
  onBackToDashboard: () => void;
  forecasts: Record<string, ForecastCityData> | null;
  quality: any;
  metrics?: any;
  selectedCity: 'Lahore' | 'Karachi';
  onSelectCity?: (city: 'Lahore' | 'Karachi') => void;
}

const FILTER_TAGS = ['All', 'Forecasts', 'Health', 'Regulations', 'Sensors', 'Compare'];

// airLabs brand flower/wind emblem matching our theme
const AirlabsEmblem: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
      stroke="#10B981"
      strokeWidth="1.8"
      strokeDasharray="2 3"
    />
    <circle cx="12" cy="12" r="4.5" fill="#10B981" />
    <path
      d="M12 4.5V7.5M12 16.5V19.5M4.5 12H7.5M16.5 12H19.5M6.7 6.7L8.8 8.8M15.2 15.2L17.3 17.3M6.7 17.3L8.8 15.2M15.2 8.8L17.3 6.7"
      stroke="#059669"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: 'sample-1',
    title: 'Compare Lahore & Karachi',
    preview: 'Lahore current PM2.5 vs Karachi coastal air quality comparison...',
    timestamp: 'Today, 2:15 PM',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Compare Lahore and Karachi air quality right now. Which city is worse and why?',
        timestamp: '2:15 PM'
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: `**Air Quality Comparison (Right Now):**\n\n• **Lahore:** **94.5 µg/m³** (Unhealthy) — Higher particulate concentration.\n• **Karachi:** **31.9 µg/m³** (Moderate)\n\n*Lahore suffers from inland basin temperature inversions, while Karachi benefits from horizontal maritime ventilation.*`,
        timestamp: '2:15 PM'
      }
    ]
  },
  {
    id: 'sample-2',
    title: 'Tomorrow’s 24h Forecast',
    preview: 'Projected 24-hour PM2.5 trajectory with conformal uncertainty...',
    timestamp: 'Yesterday',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        text: 'What is the 24-hour PM2.5 forecast for Lahore and Karachi?',
        timestamp: 'Yesterday'
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        text: `**Tomorrow's 24-Hour PM2.5 Forecast (Both Cities):**\n\n• **Lahore:** Projected at **119.3 µg/m³** (80% CI: [21 - 165] µg/m³)\n• **Karachi:** Projected at **57.3 µg/m³** (80% CI: [0 - 103] µg/m³)\n\n*Neither city is projected to breach the 150 µg/m³ emergency threshold tomorrow.*`,
        timestamp: 'Yesterday'
      }
    ]
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
  // Load chat history from localStorage or fallback to defaults
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('airlabs_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Fallback
    }
    return DEFAULT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('airlabs_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
      // Ignore
    }
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
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

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Evaluate with grounded RAG
      const evaluated = evaluateQueryGrounded(text, forecasts, quality, metrics, updatedMessages);

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

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // Save/update session in chat history
      const sessionTitle = text.length > 32 ? `${text.slice(0, 32)}...` : text;
      const previewText = evaluated.answer.slice(0, 60).replace(/\n/g, ' ') + '...';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (activeSessionId) {
        // Update existing session
        setChatHistory(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          preview: previewText,
          timestamp: timeStr,
          messages: finalMessages
        } : s));
      } else {
        // Create new session
        const newSessionId = `session-${Date.now()}`;
        setActiveSessionId(newSessionId);
        const newSession: ChatSession = {
          id: newSessionId,
          title: sessionTitle,
          preview: previewText,
          timestamp: timeStr,
          messages: finalMessages
        };
        setChatHistory(prev => [newSession, ...prev]);
      }
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
    setMessages([]);
    setActiveSessionId(null);
    setInput('');
  };

  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  const toggleEvidence = (msgId: string) => {
    setExpandedEvidence(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Helper to format text with bold (**text**), line breaks, and bullet items
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} style={{ height: '8px' }} />;
      }

      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().replace(/^[-•*]\s+/, '') : line;

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
            <span style={{ color: '#16A34A', fontWeight: 800, marginTop: '-1px' }}>•</span>
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

  // Filter chat history based on search query
  const filteredHistory = chatHistory.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 110px)',
      minHeight: '680px',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
      position: 'relative'
    }}>
      {/* 1. LEFT SIDEBAR (airLabs Clean Theme with Real Chat History) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="airlabs-chat-sidebar"
            style={{
              width: '280px',
              backgroundColor: '#F8FAFC',
              borderRight: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexShrink: 0,
              zIndex: 30,
              height: '100%'
            }}
          >
            {/* Top Header & Search */}
            <div style={{ padding: '18px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AirlabsEmblem size={24} />
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display, Outfit, sans-serif)',
                    letterSpacing: '-0.01em'
                  }}>
                    airLabs Chats
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Toggle sidebar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>

              {/* Search Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '7px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chat history..."
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: '#0F172A',
                    fontSize: '0.8rem',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Scrollable Chat History List (No Folders, Pure Chat History) */}
            <div className="airlabs-chat-sidebar-scroll" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 12px 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Chat History ({filteredHistory.length})
                </span>
              </div>

              {filteredHistory.length === 0 ? (
                <div style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: '#94A3B8',
                  fontSize: '0.78rem'
                }}>
                  No past conversations found. Ask a question to start your first inquiry!
                </div>
              ) : (
                filteredHistory.map(session => {
                  const isActive = activeSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '12px',
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        border: isActive ? '1px solid #CBD5E1' : '1px solid transparent',
                        boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#F1F5F9';
                          e.currentTarget.style.borderColor = '#E2E8F0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', overflow: 'hidden' }}>
                        <MessageSquare
                          size={14}
                          color={isActive ? '#16A34A' : '#64748B'}
                          style={{ marginTop: '3px', flexShrink: 0 }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: isActive ? 800 : 600,
                            color: isActive ? '#0F172A' : '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {session.title}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: '#94A3B8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '2px'
                          }}>
                            {session.preview}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#CBD5E1', marginTop: '2px' }}>
                            {session.timestamp}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete chat"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#CBD5E1',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Vibrant Green "New chat" Button */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <button
                onClick={handleNewChat}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)',
                  transition: 'background-color 0.15s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <span>New chat</span>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <Plus size={15} strokeWidth={2.8} />
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. MAIN WORKSPACE AREA (airLabs Clean Light Canvas) */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Workspace Top Header Bar */}
        <div style={{
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          zIndex: 20
        }}>
          {/* Left: Back button + Model pill badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open Sidebar"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <SlidersHorizontal size={16} />
              </button>
            )}

            <button
              onClick={onBackToDashboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            {/* airLabs Model Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '9999px',
              padding: '3px 10px',
              fontSize: '0.725rem',
              fontWeight: 800,
              color: '#15803D'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#16A34A'
              }} />
              <span>airLabs AI • Grounded RAG</span>
            </div>
          </div>

          {/* Right Action Icons: Bookmark & Share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              title={bookmarked ? 'Bookmarked' : 'Bookmark Inquiry'}
              style={{
                background: 'transparent',
                border: 'none',
                color: bookmarked ? '#16A34A' : '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#16A34A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = bookmarked ? '#16A34A' : '#64748B'; }}
            >
              <Bookmark size={17} fill={bookmarked ? '#16A34A' : 'none'} />
            </button>
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              title="Share or Copy Link"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
            >
              <Share2 size={17} />
            </button>
          </div>
        </div>

        {/* 3. CENTER CONTENT WORKSPACE */}
        {messages.length === 0 ? (
          /* ========================================================
             EMPTY / WELCOME STATE: FLOATING HERO CARD (airLabs Theme)
             ======================================================== */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="airlabs-chat-hero-card"
              style={{
                width: '100%',
                maxWidth: '740px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '24px',
                padding: '36px 36px 30px 36px',
                boxShadow: '0 8px 32px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              {/* Centered airLabs Emblem */}
              <div style={{ marginBottom: '16px' }}>
                <AirlabsEmblem size={46} />
              </div>

              {/* Headline in Outfit */}
              <h1 className="airlabs-chat-hero-title" style={{
                fontFamily: 'var(--font-display, Outfit, sans-serif)',
                fontSize: '2.1rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em'
              }}>
                How can I help you today?
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: '0.9rem',
                color: '#64748B',
                maxWidth: '520px',
                margin: '0 auto 28px auto',
                lineHeight: 1.55
              }}>
                Real-time atmospheric intelligence, 24-hour predictive PM2.5 trajectories, and statutory health guidance for Pakistan.
              </p>

              {/* 3 Specific airLabs Action Cards */}
              <div className="airlabs-hero-actions-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                width: '100%',
                marginBottom: '26px'
              }}>
                {/* Action Card 1: 24h Forecast Trajectory */}
                <div
                  className="airlabs-chat-action-card"
                  onClick={() => handleSend('What is the 24-hour PM2.5 forecast for Lahore and Karachi? Will air improve tomorrow?')}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '20px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    marginBottom: '10px'
                  }}>
                    <TrendingUp size={20} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                    24h Forecast Trajectory
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', lineHeight: 1.45 }}>
                    Predictive ML trajectory with 80% conformal uncertainty intervals.
                  </div>
                </div>

                {/* Action Card 2: Health & Outdoor Safety */}
                <div
                  className="airlabs-chat-action-card"
                  onClick={() => handleSend('Is it safe to go jogging or exercise outdoors today? What precautions should I take?')}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '20px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    marginBottom: '10px'
                  }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                    Health & Outdoor Safety
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', lineHeight: 1.45 }}>
                    Actionable N95 masking advisories and safe jogger workout windows.
                  </div>
                </div>

                {/* Action Card 3: School & Smog Regulations */}
                <div
                  className="airlabs-chat-action-card"
                  onClick={() => handleSend('What are the government school rules and mask requirements for smog in Punjab and Sindh?')}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '20px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    marginBottom: '10px'
                  }}>
                    <School size={20} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                    School & Smog Protocols
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', lineHeight: 1.45 }}>
                    Official Clean Air emergency action triggers and assembly rules.
                  </div>
                </div>
              </div>

              {/* Filter Tabs Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '22px',
                flexWrap: 'wrap'
              }}>
                {FILTER_TAGS.map(tag => {
                  const isActive = activeFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(tag)}
                      style={{
                        background: isActive ? '#10B981' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#475569',
                        border: 'none',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '5px 14px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Hero Input Pill Bar */}
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '16px',
                padding: '6px 8px 6px 16px',
                boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                transition: 'border-color 0.2s ease'
              }}>
                <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                  <AirlabsEmblem size={22} />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about air quality, 24h smog forecasts, or outdoor safety..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.925rem',
                    color: '#0F172A',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  type="button"
                  title="Voice input"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Mic size={17} />
                </button>
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || loading}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: input.trim() && !loading ? '#10B981' : '#E2E8F0',
                    color: input.trim() && !loading ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>

            {/* Bottom Disclaimer */}
            <p style={{
              fontSize: '0.72rem',
              color: '#94A3B8',
              marginTop: '16px',
              textAlign: 'center'
            }}>
              airLabs AI verifies telemetry against live PAQI ground stations and official Pak-EPA NEQS standards.
            </p>
          </div>
        ) : (
          /* ========================================================
             ACTIVE CONVERSATION STATE: CLEAN AIRLABS CHAT STREAM
             ======================================================== */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Messages Scroll Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                        gap: '12px',
                        alignItems: 'flex-start',
                        justifyContent: isUser ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {!isUser && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          <AirlabsEmblem size={20} />
                        </div>
                      )}

                      <div style={{
                        maxWidth: isUser ? '75%' : '86%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {/* Bubble Container */}
                        <div style={{
                          backgroundColor: isUser ? '#0F172A' : '#FFFFFF',
                          border: isUser ? 'none' : '1px solid #E2E8F0',
                          color: isUser ? '#FFFFFF' : '#1E293B',
                          padding: isUser ? '12px 18px' : '18px 22px',
                          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          boxShadow: isUser ? '0 4px 12px rgba(15, 23, 42, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.03)'
                        }}>
                          {isUser ? (
                            <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.5, color: '#FFFFFF' }}>
                              {msg.text}
                            </p>
                          ) : (
                            renderMessageContent(msg.text)
                          )}
                        </div>

                        {/* Metadata Citations & Grounding Evidence for Assistant */}
                        {!isUser && resp && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
                            {/* Citations */}
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

                            {/* Collapsible Telemetry Evidence Accordion */}
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
                                      color: '#34D399',
                                      fontSize: '0.7rem',
                                      fontFamily: 'var(--font-mono, monospace)',
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
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16A34A'
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
            </div>

            {/* Bottom Docked Input Bar in Active Chat */}
            <div style={{
              padding: '14px 24px 18px 24px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF'
            }}>
              <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '16px',
                  padding: '6px 8px 6px 16px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  transition: 'border-color 0.2s ease'
                }}>
                  <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                    <AirlabsEmblem size={22} />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Lahore or Karachi air, smog forecasts, school rules..."
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.925rem',
                      color: '#0F172A',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    type="button"
                    title="Voice input"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Mic size={17} />
                  </button>
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || loading}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: input.trim() && !loading ? '#10B981' : '#E2E8F0',
                      color: input.trim() && !loading ? '#FFFFFF' : '#94A3B8',
                      border: 'none',
                      cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  fontSize: '0.675rem',
                  color: '#94A3B8'
                }}>
                  <span>Grounded in PAQI ground telemetry & official Pak-EPA NEQS standards.</span>
                  <span>airLabs AI can make mistakes. Consider checking important information.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
