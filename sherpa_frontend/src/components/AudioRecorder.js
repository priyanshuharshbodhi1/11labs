import React, { useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import OpenAI from 'openai';
import { API_KEYS } from '../config/api-keys';
import guideAvatar from '../guide_avatar.png';
import { textToSpeech } from '../utils/elevenlabs';
import { fetchGuideResponse } from '../utils/sherpaClient';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true
});

// Update props to accept isSpeaking
function AudioRecorder({ onRequestComplete, onRecordStart, location, lat, lng, selectedLandmarks, isFirstRequest, isExploreMode, isHistoryOpen, onToggleHistory, hasReceivedResponse, isSpeaking, isLocating, isMobile }) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [transcribedText, setTranscribedText] = React.useState('');
  
  const {
    status: recordingStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl: recorderMediaBlobUrl
  } = useReactMediaRecorder({ audio: true });

  const transcribeAudio = async (audioUrl) => {
    setIsTranscribing(true);
    setStatus('Analyzing audio...');
    try {
      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
      });
      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const searchImageUrlForLandmark = async (query) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${API_KEYS.GOOGLE}&cx=${API_KEYS.GOOGLE_SEARCH_ENGINE_ID}&q=${query}&searchType=image&num=1`
      );
      if (!response.ok) throw new Error('Image search failed');
      const data = await response.json();
      return data.items[0].link;
    } catch (error) {
      console.error("Error searching for image:", error);
      return null;
    }
  };

  const planTourWithGuide = async (transcribedText) => {
    setIsSending(true);
    setStatus('Consulting Sherpa...');
    
    try {
      const apiResponse = await fetchGuideResponse(transcribedText, location, lat, lng, isFirstRequest);
      
      const landmarksWithImages = await Promise.all(
        apiResponse.locations.map(async (landmark) => {
          const photoUrl = await searchImageUrlForLandmark(landmark.displayName);
          return {
            name: landmark.displayName,
            location: { lat: landmark.latitude, lng: landmark.longitude },
            photoUrl: photoUrl,
            rating: landmark.rating
          };
        })
      );

      const data = {
        response: JSON.stringify({
          explanation: apiResponse.speech,
          landmarks: apiResponse.locations
        }),
        parsedLandmarks: landmarksWithImages,
        userQuery: transcribedText,
        speech: apiResponse.speech,
        audio_url: apiResponse.audio_url
      };

      onRequestComplete(data);
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setIsSending(false);
      setStatus('');
    }
  };

  const handleNewRecording = async () => {
    try {
      const text = await transcribeAudio(recorderMediaBlobUrl);
      setTranscribedText(text);
      await planTourWithGuide(text);
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error: ' + error);
    }
  };

  const handleRecordStart = () => {
    if (onRecordStart) onRecordStart();
    setIsRecording(true);
    setStatus('Listening...');
    startRecording();
    setTranscribedText('');
  };

  const handleRecordStop = () => {
    setIsRecording(false);
    stopRecording();
  };

  React.useEffect(() => {
    if (recorderMediaBlobUrl && !isRecording) {
      handleNewRecording();
    }
  }, [recorderMediaBlobUrl]);

  const isThinking = isTranscribing || isSending || isLocating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
      
      {/* Status Bubbles - Light Glass */}
      {(status || transcribedText) && (
        <div className="glass-panel" style={{
          padding: '12px 24px',
          marginBottom: '10px',
          maxWidth: '80vw',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-in',
          background: 'rgba(15, 23, 42, 0.6)', // Darker, semi-transparent background
          backdropFilter: 'blur(12px)',        // stronger blur
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', // subtle border
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', // deeper shadow
          color: '#fff' // White text for contrast
        }}>
           <div style={{ 
             color: '#38bdf8', // Light blue accent for status text
             fontWeight: '600', 
             marginBottom: '4px',
             textTransform: 'uppercase',
             fontSize: '0.65rem', // Smaller status text
             letterSpacing: '0.5px'
           }}>
             {isLocating ? 'LOCATING...' : status || 'PROCESSING...'}
           </div>
           {transcribedText && (
             <div style={{ 
               fontSize: '0.95rem', // Smaller transcript text
               color: '#fff', 
               fontWeight: '500',
               lineHeight: '1.4'
             }}>
               "{transcribedText}"
             </div>
           )}
        </div>
      )}


      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Microphone Button with Recording Animation */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onMouseDown={handleRecordStart}
            onMouseUp={handleRecordStop}
            onTouchStart={(e) => { e.preventDefault(); handleRecordStart(); }}
            onTouchEnd={handleRecordStop}
            disabled={isThinking}
            className="orb-button" // Use class for complex animations
            style={{
              width: isMobile ? '65px' : '80px',
              height: isMobile ? '65px' : '80px',
              borderRadius: '50%',
              border: 'none',
              cursor: isThinking ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 10,
              overflow: 'hidden',
              boxShadow: isRecording
                ? '0 0 40px rgba(99, 102, 241, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.5)'
                : isThinking
                  ? '0 0 50px rgba(192, 132, 252, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.6)'
                  : isSpeaking
                    ? '0 0 60px rgba(56, 189, 248, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.4)'
                    : '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
              transform: isRecording ? 'scale(1.1)' : isThinking ? 'scale(1.05)' : 'scale(1)',
              animation: isRecording 
                ? 'pulse-orb 2s infinite' 
                : isThinking
                  ? 'pulse-orb 1.5s infinite reverse' 
                  : isSpeaking
                    ? 'none' // Stable when speaking (no float)
                    : 'float 6s ease-in-out infinite'
            }}
          >
            {/* Orb Gradients */}
            <div className={`orb-gradient ${isRecording ? 'fast-spin' : isThinking ? 'hyper-spin' : 'slow-spin'}`} />
            
            {/* Secondary Intertwining Gradient - Visible when Speaking */}
            <div 
                className={`orb-gradient-2 ${isSpeaking ? 'reverse-spin' : ''}`}
                style={{ opacity: isSpeaking ? 0.8 : 0 }} 
            />
            
            {/* Icons / Status Indicators */}
            <div style={{ zIndex: 20, position: 'relative', color: '#fff' }}>
              {isThinking ? (
                 <div style={{ opacity: 0 }} /> 
              ) : isRecording ? (
                <div className="recording-bars">
                  <span /><span /><span /><span />
                </div>
              ) : isSpeaking ? (
                 // Clean look for speaking - just the orb spinning
                 <div style={{ opacity: 0 }} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .orb-button {
          background: #000;
        }

        /* Scale Mic on Hover */
        .orb-button:hover svg {
          transform: scale(1.2);
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.6));
        }
        
        .orb-gradient {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            ${props => props.isSpeaking ? `
              #fcd34d 0%, #fbbf24 15%, #ffffff 30%, #f59e0b 45%, #fcd34d 60%, #fbbf24 75%, #ffffff 90%, #fcd34d 100%
            ` : `
              #3b82f6 0%, #60a5fa 15%, #ffffff 30%, #2563eb 45%, #3b82f6 60%, #60a5fa 75%, #ffffff 90%, #3b82f6 100%
            `}
          );
          filter: blur(12px); /* Reduced blur for more distinct "strands" */
          opacity: 0.95;
        }

        /* Secondary Gradient for Intertwining Effect */
        .orb-gradient-2 {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(
                from 180deg,
                ${props => props.isSpeaking ? `
                  #ffffff 0%, #fef3c7 20%, #fcd34d 40%, #ffffff 60%, #fbbf24 80%, #ffffff 100%
                ` : `
                  #ffffff 0%, #dbeafe 20%, #60a5fa 40%, #ffffff 60%, #3b82f6 80%, #ffffff 100%
                `}
            );
            filter: blur(15px);
            mix-blend-mode: overlay;
            transition: opacity 0.5s ease;
        }

        .slow-spin { animation: spin-gradient 30s linear infinite; }
        .fast-spin { animation: spin-gradient 2s linear infinite; }
        .hyper-spin { animation: spin-gradient 0.8s linear infinite; }
        .reverse-spin { animation: spin-gradient 3s linear infinite reverse; } /* Counter-rotation */

        @keyframes spin-gradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-orb {
          0% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.5); transform: scale(1.1); }
          50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.8); transform: scale(1.15); }
          100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.5); transform: scale(1.1); }
        }

        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }

        .recording-bars {
          display: flex;
          gap: 4px;
          align-items: center;
          height: 24px;
        }
        .recording-bars span {
          width: 4px;
          background: #fff;
          border-radius: 2px;
          box-shadow: 0 0 4px rgba(255,255,255,0.8);
          animation: bars 0.8s ease-in-out infinite;
        }
        .recording-bars span:nth-child(1) { height: 8px; animation-delay: 0s; }
        .recording-bars span:nth-child(2) { height: 16px; animation-delay: 0.1s; }
        .recording-bars span:nth-child(3) { height: 12px; animation-delay: 0.2s; }
        .recording-bars span:nth-child(4) { height: 20px; animation-delay: 0.3s; }
        @keyframes bars {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
      <style>{`
        .orb-gradient {
            background: conic-gradient(
                from 0deg,
                #3b82f6 0%, #60a5fa 15%, #ffffff 30%, #2563eb 45%, #3b82f6 60%, #60a5fa 75%, #ffffff 90%, #3b82f6 100%
            ) !important;
        }
        .orb-gradient-2 {
            background: conic-gradient(
                from 180deg,
                #ffffff 0%, #dbeafe 20%, #60a5fa 40%, #ffffff 60%, #3b82f6 80%, #ffffff 100%
            ) !important;
        }
      `}</style>
    </div>
  );
}

export default AudioRecorder;