import React, { useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import OpenAI from 'openai';
import { API_KEYS } from '../config/api-keys';
import guideAvatar from '../guide_avatar.png';
import { textToSpeech } from '../utils/elevenlabs';
import { fetchGuideResponse } from '../utils/api';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true
});

function RecordButton({ onRequestComplete, location, lat, lng, selectedLandmarks, isFirstRequest, isExploreMode }) {
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
    setStatus('Consulting Vagabond...');
    
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
        userQuery: transcribedText
      };

      textToSpeech(apiResponse.speech);
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
           <div style={{ color: 'var(--primary-accent)', fontWeight: '600', marginBottom: '4px' }}>
             {status || 'Processing...'}
           </div>
           {transcribedText && (
             <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>"{transcribedText}"</div>
           )}
        </div>
      )}

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Cool Pulse Effect Background */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
          transform: 'scale(1.4)',
          filter: 'blur(10px)',
          transition: 'all 0.3s ease',
          zIndex: -1
        }} />

        <button
          onMouseDown={handleRecordStart}
          onMouseUp={handleRecordStop}
          onTouchStart={(e) => { e.preventDefault(); handleRecordStart(); }}
          onTouchEnd={handleRecordStop}
          disabled={isTranscribing || isSending}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '24px', // Squircle
            border: 'none',
            // Cool Gradient
            background: isRecording 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: isRecording 
              ? '0 12px 24px -8px rgba(239, 68, 68, 0.5), 0 4px 6px -4px rgba(239, 68, 68, 0.3)' 
              : '0 12px 24px -8px rgba(37, 99, 235, 0.5), 0 4px 6px -4px rgba(37, 99, 235, 0.3)',
            color: '#fff',
            fontSize: '28px',
            cursor: isTranscribing || isSending ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy transition
            transform: isRecording ? 'scale(0.95) rotate(5deg)' : 'scale(1) rotate(0deg)',
          }}
        >
          {isTranscribing || isSending ? (
             <div className="spinner" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Spinner Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RecordButton; 