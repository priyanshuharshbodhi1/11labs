import React, { useEffect, useRef } from 'react';
import '../../App.css';

const ChatHistory = ({ history, isOpen, onClose, onClear, isMobile }) => {
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  // Get the last sherpa response for the floating bubble
  const lastSherpaResponse = [...history].reverse().find(msg => msg.role === 'assistant');

  return (
    <>
      {/* Floating Chat Panel */}
      <div style={{
        position: isMobile ? 'fixed' : 'absolute',
        top: isMobile ? 0 : '100px',
        left: isMobile ? 0 : '20px',
        right: isMobile ? 0 : 'auto',
        bottom: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : '300px',
        maxHeight: isMobile ? '100vh' : '400px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
        animation: isMobile ? 'fadeIn 0.3s ease' : 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        background: isMobile ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isMobile ? 0 : '20px',
        border: isMobile ? 'none' : '1px solid rgba(100, 150, 255, 0.15)',
        boxShadow: isMobile ? 'none' : '0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', // Reduced padding
          borderBottom: '1px solid rgba(100, 150, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '0.9rem', // Smaller font
            color: '#e2e8f0', 
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1rem' }}>💬</span>
            Conversation
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={onClear}
              title="Clear History"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#f87171';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>

            <button 
              onClick={onClose}
              title="Close Conversation"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="custom-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px', // Reduced padding
          display: 'flex',
          flexDirection: 'column',
          gap: '10px', // Reduced gap
          minHeight: '150px',
          maxHeight: '300px', // Explicit limit
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
          borderRadius: '0 0 20px 20px' // Added proper border radius since footer is gone
        }}>
          {history.length === 0 ? (
            <div style={{ 
              color: '#64748b', 
              textAlign: 'center', 
              marginTop: '40px', 
              fontSize: '0.9rem',
              animation: 'fadeIn 0.5s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>🏔️</div>
              <p style={{ margin: 0, color: '#94a3b8' }}>No conversations yet.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Hold the mic button to talk to Sherpa!
              </p>
            </div>
          ) : (
            history.map((msg, index) => (
              <div 
                key={index} 
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
                  borderBottomLeftRadius: msg.role === 'user' ? '14px' : '4px',
                  boxShadow: msg.role === 'user' 
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  animation: 'messageSlideIn 0.3s ease',
                  border: msg.role === 'assistant' ? '1px solid rgba(100, 150, 255, 0.1)' : 'none'
                }}
              >
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: msg.role === 'user' ? '#38bdf8' : '#fb923c', // Sky blue for User, Orange for Sherpa
                  marginBottom: '4px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {msg.role === 'user' ? 'You' : 'Sherpa'}
                </div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  lineHeight: '1.5',
                  color: msg.role === 'user' ? '#fff' : '#e2e8f0',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Custom Scrollbar Styles */
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
};


export default ChatHistory;
