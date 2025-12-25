import React, { useEffect, useRef } from 'react';
import '../App.css';

const ChatHistory = ({ history, isOpen, onClose, onClear }) => {
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      top: '0',
      right: '0',
      width: '320px',
      height: '100vh',
      maxWidth: '85vw',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderLeft: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '0', // Full height sidebar
      boxShadow: '-4px 0 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700' }}>Mission Log</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: '#f8fafc'
      }}>
        {history.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px', fontSize: '0.95rem' }}>
            <p style={{ margin: 0 }}>No records found.</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>Start exploring the world!</p>
          </div>
        ) : (
          history.map((msg, index) => (
            <div key={index} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              background: msg.role === 'user' ? '#2563eb' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#1e293b',
              padding: '12px 16px',
              borderRadius: '16px',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderBottomLeftRadius: msg.role === 'user' ? '16px' : '4px',
              boxShadow: msg.role === 'user' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
              border: msg.role === 'assistant' ? '1px solid rgba(0,0,0,0.05)' : 'none'
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : '#64748b',
                marginBottom: '4px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                {msg.role === 'user' ? 'YOU' : 'VAGABOND'}
              </div>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'center',
        background: '#fff'
      }}>
        <button 
          onClick={onClear}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onMouseOver={e => {
            e.target.style.borderColor = '#cbd5e1';
            e.target.style.color = '#475569';
          }}
          onMouseOut={e => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.color = '#64748b';
          }}
        >
          Clear History
        </button>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};


export default ChatHistory;
