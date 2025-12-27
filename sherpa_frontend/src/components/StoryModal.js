
import React, { useState, useEffect, useRef } from 'react';
import './StoryModal.css';

const StoryModal = ({ isOpen, onClose, scenes, monumentName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Auto-advance logic
  useEffect(() => {
    if (!isOpen || !scenes || scenes.length === 0) return;

    const currentScene = scenes[currentIndex];
    
    // Play Audio
    if (currentScene.audio_url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = new Audio(process.env.REACT_APP_BACKEND_URL + currentScene.audio_url);
        audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        setIsPlaying(true);
        
        audioRef.current.ontimeupdate = () => {
             if (audioRef.current.duration) {
                 setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
             }
        };

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          // Wait 2 seconds then next slide
          setTimeout(() => {
            if (currentIndex < scenes.length - 1) {
              setCurrentIndex(prev => prev + 1);
              setProgress(0);
            } else {
               // Story finished
            }
          }, 2000);
        };
      }
    } else {
      // Fallback if no audio: Wait 5 seconds
      const timer = setTimeout(() => {
         if (currentIndex < scenes.length - 1) {
              setCurrentIndex(prev => prev + 1);
          }
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentIndex, isOpen, scenes]);
  
  // Background Music Logic
  const bgMusicRef = useRef(null);
  
  useEffect(() => {
     if (isOpen) {
         // Using a royalty-free ambient track
         bgMusicRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3'); 
         bgMusicRef.current.loop = true;
         bgMusicRef.current.volume = 0.2; // Low background volume
         bgMusicRef.current.play().catch(e => console.log("BG Music Auto-play blocked", e));
     } else {
         if (bgMusicRef.current) {
             bgMusicRef.current.pause();
             bgMusicRef.current = null;
         }
     }
     
     return () => {
         if (bgMusicRef.current) {
             bgMusicRef.current.pause();
             bgMusicRef.current = null;
         }
     };
  }, [isOpen]);


  // Clean up on unmount or close
  useEffect(() => {
      if (!isOpen && audioRef.current) {
          audioRef.current.pause();
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentScene = scenes[currentIndex];

  return (
    <div className="story-modal-overlay">
      <div className="story-modal-content glass-panel-premium">
        
        {/* Header */}
        <div className="story-header">
           <h2>{monumentName}</h2>
           <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="story-body">
            {/* Image (Left/Center) */}
            <div className="story-image-container">
                {currentScene?.image_url ? (
                    <img 
                      src={process.env.REACT_APP_BACKEND_URL + currentScene.image_url} 
                      alt={`Scene ${currentIndex + 1}`} 
                      className="story-image fade-in-image"
                    />
                ) : (
                    <div className="placeholder-image">
                        <span>Generating Visuals...</span>
                    </div>
                )}
            </div>

            {/* Text & Captions (Below or Overlay) */}
            <div className="story-text-container">
                <p className="story-narration">
                    {currentScene?.text}
                </p>
            </div>
        </div>

        {/* Progress Indicators */}
        <div className="story-footer">
            <div className="scene-indicators">
                {scenes.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`indicator-dot ${idx === currentIndex ? 'active' : ''} ${idx < currentIndex ? 'completed' : ''}`}
                    />
                ))}
            </div>
            {/* Audio Progress Bar */}
             <div className="audio-progress-bar">
                <div className="audio-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;
