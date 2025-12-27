import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-bg"></div>
      
      <div className="landing-content">
        {/* Navigation / Header */}
        <motion.nav 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/Sherpa_landingpage-removebg.png" alt="Sherpa" style={{ height: '100px', objectFit: 'contain' }} />
          </div>
        </motion.nav>

        {/* Hero Section */}
        <motion.header 
          className="hero-section"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="hero-badge">
            Next Gen AI Travel Guide
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            Meet <span>SHERPA</span> <br />
            Your AI Travel Companion
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Sherpa transforms the way you explore. Powered by ElevenLabs voice technology and Google Gemini AI, 
            Sherpa provides real-time audio narration, instant monument descriptions, personalized travel routes, 
            and immersive visual storytelling—all through natural voice conversations.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '700px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <span style={{ fontSize: '1.2rem' }}>🎤</span>
              <span style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: '500' }}>Voice-First Interface</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <span style={{ fontSize: '1.2rem' }}>🗺️</span>
              <span style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: '500' }}>Smart Route Planning</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <span style={{ fontSize: '1.2rem' }}>🌍</span>
              <span style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: '500' }}>Multilingual Support</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <span style={{ fontSize: '1.2rem' }}>🏛️</span>
              <span style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: '500' }}>Monument Animations</span>
            </div>
          </motion.div>
          
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cta-button"
            onClick={() => navigate('/app')}
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber/Gold gradient to match new theme
              boxShadow: '0 10px 30px -10px rgba(217, 119, 6, 0.6)'
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Talk to Sherpa</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="M12 5l7 7-7 7"/>
            </svg>
          </motion.button>
        </motion.header>

        {/* Features Section */}
        <motion.section 
          className="features-section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Intelligent Features</h2>
            <p style={{ color: 'var(--lp-text-dim)' }}>Everything you need for a perfect journey.</p>
          </div>

          <div className="features-grid">
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="feature-icon">🎙️</div>
              <h3 className="feature-title">Voice-Powered Exploration</h3>
              <p className="feature-desc">Simply speak to Sherpa. Ask questions, request routes, or inquire about landmarks—all hands-free using ElevenLabs TTS for natural, lifelike responses.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="feature-icon">🧭</div>
              <h3 className="feature-title">Intelligent Itineraries</h3>
              <p className="feature-desc">Sherpa creates personalized multi-stop routes based on your preferences, time constraints, and location. Optimized walking paths with Google Maps integration.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Visual Story Generator</h3>
              <p className="feature-desc">Experience monuments through AI-generated visual narratives. Each landmark comes alive with illustrated stories and historical reconstructions.</p>
            </motion.div>

             <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">Powered by Gemini AI</h3>
              <p className="feature-desc">Google Gemini 2.0 Flash drives intelligent conversations, contextual understanding, and real-time Wikipedia integration for accurate information.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 Sherpa AI. Your journey begins here.</p>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
