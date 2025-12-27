import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 60, damping: 20 }
    }
  };

  return (
    <div className="landing-page-container">
      {/* Background with Stars & Nebulas */}
      <div className="space-background">
        <div className="stars"></div>
        <div className="nebula-glow"></div>
      </div>
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon-box">
            <span className="logo-icon">🏔️</span>
          </div>
          <span className="logo-text">Sherpa<span className="logo-suffix">AI</span></span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#advantages">Advantages</a>
          <a href="#reviews">Reviews</a>
          <button className="nav-cta-outline" onClick={() => navigate('/app')}>Try now</button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="hero-content">
          <h1 className="hero-title">
            Your Personal AI Guide:<br />
            <span className="text-glow">Effortless Travel Magic</span>
          </h1>
          
          <p className="hero-subtitle">
            Expand your world by making your journeys multilingual and immersive in a snap.
          </p>

          <motion.button 
            className="cta-button-glow"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/app')}
          >
            Get started
          </motion.button>
        </motion.div>

        {/* Visual / Abstract Representation of AI Tour Guide */}
        {/* We use a glowing glass sphere/map concept to represent 'Global AI' */}
        <motion.div variants={itemVariants} className="hero-visual-container">
           <div className="planet-container">
              <div className="planet"></div>
              <div className="orbit orbit-1"></div>
              <div className="orbit orbit-2"></div>
              <div className="orbit orbit-3"></div>
              <div className="floating-card c1">
                  <span>🗼</span> Paris
              </div>
              <div className="floating-card c2">
                  <span>🗽</span> NYC
              </div>
              <div className="floating-card c3">
                  <span>⛩️</span> Tokyo
              </div>
           </div>
        </motion.div>

        <div className="scroll-indicator">
           <span>AI Features</span>
           <div className="line"></div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section 
        className="features-section" 
        id="features"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
          <div className="section-header-box">
            <h2>Capabilities AI Tools</h2>
            <p>Experience seamless exploration as our tools simplify complexity for you</p>
          </div>

          <div className="features-grid">
              {/* Card 1: Voice */}
              <div className="feature-card-dark">
                  <div className="card-image-placeholder glow-purple">
                      <span style={{ fontSize: '3rem' }}>▶️</span>
                  </div>
                  <h3>Voice & Talk</h3>
                  <p>Start conversing with your surroundings with the power of ElevenLabs AI.</p>
              </div>

              {/* Card 2: Visuals */}
              <div className="feature-card-dark">
                  <div className="card-image-placeholder glow-blue">
                      <span style={{ fontSize: '3rem' }}>💻</span>
                  </div>
                  <h3>Visual History</h3>
                  <p>Generate accurate historical reconstructions of ruins in real-time.</p>
              </div>

              {/* Card 3: Multilingual */}
              <div className="feature-card-dark">
                  <div className="card-image-placeholder glow-pink">
                      <span style={{ fontSize: '3rem' }}>文</span>
                  </div>
                  <h3>Multilingual</h3>
                  <p>Translate the world effortlessly to reach deep cultural understanding.</p>
              </div>
          </div>
      </motion.section>

      {/* Footer */}
      <footer className="landing-footer-dark">
          <p>© 2025 Sherpa AI. The Future of Travel.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
