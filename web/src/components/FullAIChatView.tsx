import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Folder,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles
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

interface FullAIChatViewProps {
  onBackToDashboard: () => void;
  forecasts: Record<string, ForecastCityData> | null;
  quality: any;
  metrics?: any;
  selectedCity: 'Lahore' | 'Karachi';
  onSelectCity?: (city: 'Lahore' | 'Karachi') => void;
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
  query: string;
}

interface PresetChat {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  category: string;
}

const FOLDERS: FolderItem[] = [
  {
    id: 'folder-live',
    name: 'Live Sensor Telemetry',
    color: '#10B981', // Emerald
    query: 'What are the exact live PM2.5 readings for Lahore and Karachi right now? Compare their air quality levels.'
  },
  {
    id: 'folder-forecast',
    name: '24h Forecast Trajectory',
    color: '#A855F7', // Purple
    query: 'What is the 24-hour predictive PM2.5 forecast for Lahore and Karachi? Will air improve tomorrow?'
  },
  {
    id: 'folder-rules',
    name: 'School & Smog Protocols',
    color: '#F59E0B', // Amber
    query: 'What are the official government school closure rules and emergency smog orders in Punjab and Sindh?'
  },
  {
    id: 'folder-health',
    name: 'Health, Masks & Exercise',
    color: '#EC4899', // Pink
    query: 'Is it safe to go jogging or exercise outdoors today? What masking precautions are required?'
  }
];

const PRESET_CHATS: PresetChat[] = [
  {
    id: 'chat-compare',
    title: 'Compare Lahore & Karachi',
    subtitle: 'Which city has worse air right now and why? Live sensor comparison...',
    query: 'Compare Lahore and Karachi air quality right now. Which city is worse and why?',
    category: 'Compare'
  },
  {
    id: 'chat-forecast',
    title: 'Tomorrow’s 24h Forecast',
    subtitle: 'Will pollution rise or fall over the next 24 hours? ML trajectory...',
    query: 'What is the 24-hour PM2.5 forecast for Lahore and Karachi? Will air improve tomorrow?',
    category: 'Forecasts'
  },
  {
    id: 'chat-smog',
    title: 'Punjab Smog Protocols',
    subtitle: 'Official criteria for outdoor sports, school closures & odd-even rules...',
    query: 'What are the government school rules and mask requirements for smog in Punjab and Sindh?',
    category: 'Regulations'
  },
  {
    id: 'chat-exercise',
    title: 'Outdoor Exercise Safety',
    subtitle: 'Can I go jogging or send kids out to play today? Health guidelines...',
    query: 'Is it safe to go jogging or exercise outdoors today? What precautions should I take?',
    category: 'Health'
  },
  {
    id: 'chat-sensor',
    title: 'Sensor Reliability & Truth',
    subtitle: 'Audit trail, PAQI network, zero synthetic hallucinations...',
    query: 'How reliable is this sensor data? How do you prevent fake or hallucinated readings?',
    category: 'Sensors'
  }
];

const FILTER_TAGS = ['All', 'Forecasts', 'Health', 'Regulations', 'Sensors', 'Compare'];

// airLabs stylized glowing flower/wind emblem matching screenshot
const AirlabsEmblem: React.FC<{ size?: number; glow?: boolean }> = ({ size = 26, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      filter: glow ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.75))' : 'none',
      flexShrink: 0
    }}
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
      stroke="#34D399"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const FullAIChatView: React.FC<FullAIChatViewProps> = ({
  onBackToDashboard,
  forecasts,
  quality,
  metrics,
  selectedCity: _selectedCity,
  onSelectCity: _onSelectCity
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [showFolders, setShowFolders] = useState(true);
  const [showChats, setShowChats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. Evaluate with local unified grounded RAG engine
      const evaluated = evaluateQueryGrounded(text, forecasts, quality, metrics, messages);

      // 2. Attempt remote Gemini 2.5 Flash if available
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
    setMessages([]);
    setInput('');
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
            <strong key={pIdx} style={{ color: '#F8FAFC', fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0 4px 8px' }}>
            <span style={{ color: '#10B981', fontWeight: 800, marginTop: '-1px' }}>•</span>
            <span style={{ fontSize: '0.925rem', lineHeight: 1.6, color: '#E2E8F0' }}>{renderedParts}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} style={{ margin: '4px 0', fontSize: '0.925rem', lineHeight: 1.6, color: '#E2E8F0' }}>
          {renderedParts}
        </p>
      );
    });
  };

  // Filtered chats based on search input
  const filteredChats = PRESET_CHATS.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === 'All' || c.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredFolders = FOLDERS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 110px)',
      minHeight: '680px',
      backgroundColor: '#0A0D12',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid #1E2530',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
      position: 'relative'
    }}>
      {/* 1. LEFT SIDEBAR (Matching User Template) */}
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
              backgroundColor: '#11161C',
              borderRight: '1px solid #1D242E',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexShrink: 0,
              zIndex: 30,
              height: '100%'
            }}
          >
            {/* Top Header & Search */}
            <div style={{ padding: '16px 14px 10px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Header: Title + Sliders Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AirlabsEmblem size={22} glow />
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display, Outfit, sans-serif)',
                    letterSpacing: '-0.01em'
                  }}>
                    My Chats
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Toggle sidebar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>

              {/* Search Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#181F27',
                border: '1px solid #242D38',
                borderRadius: '12px',
                padding: '7px 12px'
              }}>
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Scrollable Center: Folders & Chats */}
            <div className="airlabs-chat-sidebar-scroll" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 10px 10px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Folders Section */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  marginBottom: '6px'
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.04em'
                  }}>
                    Folders
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={handleNewChat}
                      title="New Folder / Chat"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => setShowFolders(!showFolders)}
                      title="Toggle Folders"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                    >
                      <ChevronDown size={13} style={{ transform: showFolders ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s ease' }} />
                    </button>
                  </div>
                </div>

                {showFolders && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {filteredFolders.map(folder => (
                      <div
                        key={folder.id}
                        onClick={() => handleSend(folder.query)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '10px',
                          backgroundColor: '#151C23',
                          border: '1px solid #1F2733',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1C2430';
                          e.currentTarget.style.borderColor = '#2B3746';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#151C23';
                          e.currentTarget.style.borderColor = '#1F2733';
                        }}
                      >
                        {/* Colored Left Accent Strip */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3.5px',
                          backgroundColor: folder.color
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px', overflow: 'hidden' }}>
                          <Folder size={14} color="#94A3B8" />
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#E2E8F0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {folder.name}
                          </span>
                        </div>
                        <MoreHorizontal size={13} color="#64748B" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chats Section */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  marginBottom: '6px'
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.04em'
                  }}>
                    Chats
                  </span>
                  <button
                    onClick={() => setShowChats(!showChats)}
                    title="Toggle Chats"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                  >
                    <ChevronDown size={13} style={{ transform: showChats ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s ease' }} />
                  </button>
                </div>

                {showChats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {filteredChats.map(chat => (
                      <div
                        key={chat.id}
                        onClick={() => handleSend(chat.query)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          backgroundColor: '#151C23',
                          border: '1px solid #1F2733',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1C2430';
                          e.currentTarget.style.borderColor = '#2B3746';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#151C23';
                          e.currentTarget.style.borderColor = '#1F2733';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', overflow: 'hidden' }}>
                          <MessageSquare size={14} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#F1F5F9',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {chat.title}
                            </div>
                            <div style={{
                              fontSize: '0.68rem',
                              color: '#64748B',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {chat.subtitle}
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal size={13} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bright Emerald "New chat" Button (Exact Screenshot Match) */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #1D242E' }}>
              <button
                onClick={handleNewChat}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#10B981',
                  color: '#042F2E',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '9px 12px 9px 16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
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
                <span style={{ color: '#042F2E', fontWeight: 800 }}>New chat</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <Plus size={16} strokeWidth={2.5} />
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. MAIN WORKSPACE AREA */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0A0D12',
        backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 55%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Workspace Top Navigation Bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: 'rgba(10, 13, 18, 0.85)',
          backdropFilter: 'blur(12px)',
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
                  color: '#94A3B8',
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
                color: '#94A3B8',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            {/* Model Badge Pill (Screenshot GPT-4.0 replica with airLabs theme) */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#064E3B',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '9999px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#34D399',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981'
              }} />
              <span>airLabs AI • RAG</span>
            </div>
          </div>

          {/* Right Action Icons: Bookmark & Share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              title={bookmarked ? 'Remove Bookmark' : 'Bookmark Inquiry'}
              style={{
                background: 'transparent',
                border: 'none',
                color: bookmarked ? '#10B981' : '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#10B981'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = bookmarked ? '#10B981' : '#94A3B8'; }}
            >
              <Bookmark size={17} fill={bookmarked ? '#10B981' : 'none'} />
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
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
            >
              <Share2 size={17} />
            </button>
          </div>
        </div>

        {/* 3. CENTER CONTENT WORKSPACE */}
        {messages.length === 0 ? (
          /* ========================================================
             EMPTY / WELCOME STATE: FLOATING HERO CARD (Screenshot Replica)
             ======================================================== */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="airlabs-chat-hero-card"
              style={{
                width: '100%',
                maxWidth: '740px',
                backgroundColor: '#141A23',
                border: '1px solid #232C3A',
                borderRadius: '26px',
                padding: '36px 36px 30px 36px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              {/* Centered Glowing Logo */}
              <div style={{ marginBottom: '18px' }}>
                <AirlabsEmblem size={44} glow />
              </div>

              {/* Headline */}
              <h1 className="airlabs-chat-hero-title" style={{
                fontFamily: 'var(--font-display, Outfit, sans-serif)',
                fontSize: '2.1rem',
                fontWeight: 600,
                color: '#FFFFFF',
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em'
              }}>
                How can I help you today?
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: '0.875rem',
                color: '#94A3B8',
                maxWidth: '520px',
                margin: '0 auto 28px auto',
                lineHeight: 1.5
              }}>
                Real-time atmospheric intelligence, 24-hour predictive PM2.5 trajectories, and statutory health guidance for Pakistan.
              </p>

              {/* 3 Action Cards (Horizontal Row) */}
              <div className="airlabs-hero-actions-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                width: '100%',
                marginBottom: '26px'
              }}>
                {/* Action Card 1: Saved Prompt Templates */}
                <div
                  className="airlabs-chat-action-card"
                  onClick={() => handleSend('Compare Lahore and Karachi air quality right now. Which city is worse and why?')}
                  style={{
                    backgroundColor: '#19212C',
                    border: '1px solid #242E3C',
                    borderRadius: '16px',
                    padding: '18px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    marginBottom: '10px'
                  }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>
                    Saved Prompt Templates
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Users save and reuse prompt templates for faster responses.
                  </div>
                </div>

                {/* Action Card 2: Live Telemetry */}
                <div
                  className="airlabs-chat-action-card"
                  onClick={() => handleSend('What is the 24-hour PM2.5 forecast for Lahore and Karachi? Will air improve tomorrow?')}
                  style={{
                    backgroundColor: '#19212C',
                    border: '1px solid #242E3C',
                    borderRadius: '16px',
                    padding: '18px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    marginBottom: '10px'
                  }}>
                    <SlidersHorizontal size={20} />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>
                    Media & Trajectory Selection
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Users select media type for tailored interactions.
                  </div>
                </div>

                {/* Action Card 3: Multilingual & Health Support */}
                <div
                  className="airlabs-chat-action-card"
                  onClick={() => handleSend('What are the government school rules and mask requirements for smog in Punjab and Sindh?')}
                  style={{
                    backgroundColor: '#19212C',
                    border: '1px solid #242E3C',
                    borderRadius: '16px',
                    padding: '18px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    marginBottom: '10px'
                  }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>
                    Multilingual Support
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Choose language for better interaction and health rules.
                  </div>
                </div>
              </div>

              {/* Filter Tabs Row (Matching Screenshot: All Text Image Video Music Analytics) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '18px',
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                {FILTER_TAGS.map(tag => {
                  const isActive = activeFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(tag)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isActive ? '#10B981' : '#94A3B8',
                        fontSize: '0.825rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        padding: '4px 2px',
                        borderBottom: isActive ? '2px solid #10B981' : '2px solid transparent',
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
                backgroundColor: '#1A232E',
                border: '1px solid #283444',
                borderRadius: '16px',
                padding: '7px 8px 7px 16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                transition: 'border-color 0.2s ease'
              }}>
                <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                  <AirlabsEmblem size={22} glow />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your prompt here..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.925rem',
                    color: '#F8FAFC',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  type="button"
                  title="Voice input (mock)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
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
                    backgroundColor: input.trim() && !loading ? '#10B981' : '#2A3646',
                    color: input.trim() && !loading ? '#042F2E' : '#64748B',
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
              color: '#64748B',
              marginTop: '16px',
              textAlign: 'center'
            }}>
              airLabs AI can make mistakes. Consider checking important information.
            </p>
          </div>
        ) : (
          /* ========================================================
             ACTIVE CONVERSATION STATE: DISCLUTTERED DARK CHAT STREAM
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
                          backgroundColor: '#122421',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          <AirlabsEmblem size={18} glow />
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
                          backgroundColor: isUser ? '#1C2430' : '#141A23',
                          border: isUser ? '1px solid #2B3746' : '1px solid #232C3A',
                          color: '#F8FAFC',
                          padding: isUser ? '12px 18px' : '18px 22px',
                          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                        }}>
                          {isUser ? (
                            <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.5, color: '#F8FAFC' }}>
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
                                      backgroundColor: '#064E3B',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      color: '#34D399'
                                    }}
                                  >
                                    <BookOpen size={11} color="#10B981" />
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
                                    color: '#94A3B8',
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
                                      backgroundColor: '#0F141C',
                                      border: '1px solid #1E2734',
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
                          color: '#64748B',
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
                          backgroundColor: '#1E2530',
                          border: '1px solid #2F3946',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#F8FAFC',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8', fontSize: '0.825rem' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: '#122421',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981'
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
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundColor: 'rgba(10, 13, 18, 0.95)',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1A232E',
                  border: '1px solid #283444',
                  borderRadius: '16px',
                  padding: '7px 8px 7px 16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                  transition: 'border-color 0.2s ease'
                }}>
                  <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                    <AirlabsEmblem size={22} glow />
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
                      color: '#F8FAFC',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    type="button"
                    title="Voice input"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
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
                      backgroundColor: input.trim() && !loading ? '#10B981' : '#2A3646',
                      color: input.trim() && !loading ? '#042F2E' : '#64748B',
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
                  color: '#64748B'
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
