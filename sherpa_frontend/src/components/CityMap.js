import { GoogleMap, LoadScript, DirectionsRenderer, Marker, OverlayView } from '@react-google-maps/api';
import React, { useState, useCallback, useEffect } from 'react';
import AudioRecorder from './AudioRecorder';
import ChatHistory from './ChatHistory';
import useLocation from '../hooks/useLocation';
import { mapOptions, mapContainerStyle } from '../styles/mapStyles';
import { API_KEYS } from '../config/api-keys';
import { textToSpeech } from '../utils/elevenlabs';
import { fetchGuideResponse } from '../utils/sherpaClient';
import avatarImage from '../narrator_avatar.png';
import './CityMap.css';

function CityMap() {
  const [isFirstRequest, setIsFirstRequest] = useState(true);
  const { location, handleMapLoad: handleLocationMapLoad, lat, lng } = useLocation();
  const [directions, setDirections] = useState(null);
  
  // Chat History State
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasReceivedResponse, setHasReceivedResponse] = useState(false);

  // Persistence removed as per user request

  // State for synchronized speech captions
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [displayedWordCount, setDisplayedWordCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState(''); // Persist last response

  // State for map center
  const [mapCenter, setMapCenter] = useState({
    lat: 28.6139,
    lng: 77.2090
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);

  const [selectedLandmarks, setSelectedLandmarks] = useState([]);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [tellMeAboutLandmark, setTellMeAboutLandmark] = useState(null);

  // Play audio with synchronized word-by-word captions
  const playAudioWithCaptions = useCallback((audioUrl, speechText) => {
    const words = speechText.split(' ');
    const audio = new Audio(audioUrl);
    
    // Reset caption state
    setCurrentSpeech(speechText);
    setDisplayedWordCount(0);
    setIsSpeaking(true);
    
    let wordTimer = null;
    
    audio.onloadedmetadata = () => {
      const duration = audio.duration * 1000; // Convert to ms
      const wordInterval = duration / words.length;
      
      let wordIndex = 0;
      wordTimer = setInterval(() => {
        wordIndex++;
        setDisplayedWordCount(wordIndex);
        if (wordIndex >= words.length) {
          clearInterval(wordTimer);
        }
      }, wordInterval);
    };
    
    audio.onended = () => {
      if (wordTimer) clearInterval(wordTimer);
      setDisplayedWordCount(words.length); // Show all words
      setLastResponse(speechText); // Persist the response
      // Keep speaking state for a moment, then stop
      setTimeout(() => {
        setIsSpeaking(false);
      }, 1000);
    };
    
    audio.onerror = (e) => {
      console.error("Error playing audio:", e);
      setIsSpeaking(false);
    };
    
    audio.play().catch(e => {
      console.error("Error playing audio:", e);
      setIsSpeaking(false);
    });
  }, []);

  useEffect(() => {
    requestDirections(selectedLandmarks);
  }, [selectedLandmarks]);

  const handleRequestComplete = (response) => {
    setIsFirstRequest(false);

    // Update History
    const newHistory = [...history];
    if (response.userQuery) {
      newHistory.push({ role: 'user', text: response.userQuery });
    }
    if (response.speech) {
      newHistory.push({ role: 'assistant', text: response.speech });
      setHasReceivedResponse(true);
      
      // Play audio from backend with synchronized captions
      if (response.audio_url) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const fullAudioUrl = `${backendUrl}${response.audio_url}`;
        playAudioWithCaptions(fullAudioUrl, response.speech);
      } else {
        // Fallback - no captions for direct TTS
        textToSpeech(response.speech);
      }
      
      // Don't auto-open history - let caption show first
    }
    setHistory(newHistory);

    if (response.parsedLandmarks && response.parsedLandmarks.length > 0) {
      // If exploring new area, update mode but don't force reset if just chatting
      setSelectedLandmarks(response.parsedLandmarks);
      setIsExploreMode(true);
    }
  };

  const requestDirections = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 2) return;

    const directionsService = new window.google.maps.DirectionsService();
    const origin = landmarks[0].location;
    const destination = landmarks[landmarks.length - 1].location;
    const waypoints = landmarks.slice(1, -1).map(landmark => ({
      location: landmark.location,
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, []);

  const handleMarkerClick = async (landmark) => {
    setSelectedMarker(landmark);
    try {
      const prompt = `In three sentences, tell me about ${landmark.displayName || landmark.name} by sourcing wikipedia.`;
      const apiResponse = await fetchGuideResponse(prompt, location, lat, lng, isFirstRequest);
      
      setTellMeAboutLandmark(apiResponse.speech);
      
      if (apiResponse.audio_url) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const fullAudioUrl = `${backendUrl}${apiResponse.audio_url}`;
        playAudioWithCaptions(fullAudioUrl, apiResponse.speech);
      } else {
        textToSpeech(apiResponse.speech);
      }
      
      // Add to history
      setHistory(prev => [
        ...prev, 
        { role: 'user', text: `Tell me about ${landmark.displayName || landmark.name}` },
        { role: 'assistant', text: apiResponse.speech }
      ]);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error('Error fetching landmark description:', error);
    }
  };

  const removeLandmark = (landmarkToRemove) => {
    setSelectedLandmarks(prev => prev.filter(landmark => landmark.name !== landmarkToRemove.name));
    setSelectedMarker(null);
  };

  const handleGoogleMapLoad = useCallback((map) => {
    handleLocationMapLoad(map);
  }, [handleLocationMapLoad]);

  return (
    <div style={mapContainerStyle}>
      {/* Top Bar / Header with Caption */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
           <div style={{ borderRadius: '50%', border: '3px solid #1a365d', overflow: 'hidden' }}>
             <img src={avatarImage} alt="Sherpa" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
           </div>
           <h1 style={{ 
              margin: 0, 
              fontSize: '2rem', 
              fontWeight: '700', 
              fontFamily: "'Poppins', sans-serif",
              color: '#1a365d',
              textShadow: '0 2px 4px rgba(255,255,255,0.9)',
              letterSpacing: '2px'
           }}>SHERPA</h1>
        </div>
        
        {/* Speech Caption Bubble - Dark theme, hidden when chat history is open */}
        {hasReceivedResponse && !isHistoryOpen && (lastResponse || (isSpeaking && currentSpeech)) && (
          <div>
            <div className="custom-scroll speech-bubble-container">
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '0.7rem', 
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🗣️ SHERPA SAYS
              </div>
              
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                  textAlign: 'left'
                }}>
                  {isSpeaking && currentSpeech 
                    ? currentSpeech.split(' ').slice(0, displayedWordCount).join(' ')
                    : lastResponse
                  }
                  {isSpeaking && displayedWordCount < (currentSpeech?.split(' ')?.length || 0) && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '1em',
                      backgroundColor: '#fff',
                      marginLeft: '2px',
                      animation: 'blink 0.8s infinite'
                    }} />
                  )}
                </p>
              </div>

              {/* Chats Button - Below the bubble with gap */}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="chats-button"
                >
                  <span>💬</span>Show Chats
                </button>
              </div>
          </div>
        )}
      </div>

      {hasReceivedResponse && (
        <ChatHistory 
          history={history} 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)}
          onClear={() => setHistory([])}
        />
      )}

      {/* Info Card moved to OverlayView inside GoogleMap */}

      <LoadScript 
        googleMapsApiKey={API_KEYS.GOOGLE}
        libraries={['places']}
      >
        <GoogleMap
          mapContainerStyle={{ height: '100vh', width: '100vw' }}
          center={selectedLandmarks[0]?.location || mapCenter}
          zoom={16}
          onLoad={handleGoogleMapLoad}
          options={{ ...mapOptions, gestureHandling: 'greedy' }}
        >
          {selectedLandmarks.map((landmark, index) => (
            <Marker
              key={index}
              position={landmark.location}
              onClick={() => handleMarkerClick(landmark)}
              label={{
                text: (index + 1).toString(),
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 14, 
                fillColor: '#00f3ff',
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: '#fff',
              }} 
            />
          ))}

          {selectedMarker && (
            <OverlayView
              position={selectedMarker.location}
              mapPaneName={OverlayView.OVERLAY_FLOAT_PANE}
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height - 20 // Shift up above the marker
              })}
            >
              <div className="glass-panel" style={{
                  width: '260px', 
                  padding: '12px',
                  zIndex: 900,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  display: 'flex',
                  gap: '10px',
                  color: '#fff',
                  transform: 'translateY(-10px)', 
                  transition: 'opacity 0.2s ease',
                  animation: 'fadeIn 0.2s ease-out',
                  pointerEvents: 'auto'
              }}>
                <img 
                  src={selectedMarker.photoUrl} 
                  alt={selectedMarker.name}
                  style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ 
                      margin: '0 0 4px 0', 
                      color: '#fff', 
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {selectedMarker.displayName || selectedMarker.name}
                    </h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeLandmark(selectedMarker); }}
                      style={{ 
                        background: 'rgba(255,255,255,0.1)', 
                        border: 'none', 
                        color: '#fff', 
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        marginLeft: '5px'
                      }}
                    >✕</button>
                  </div>
                  
                  <div style={{ marginBottom: '6px' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ fontSize: '0.8rem', color: i < (selectedMarker.rating || 0) ? '#f59e0b' : '#475569' }}>★</span>
                      ))}
                  </div>
                  
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {tellMeAboutLandmark || 'Translating location data...'}
                  </p>
                </div>
                
                {/* Little triangle arrow at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid rgba(15, 23, 42, 0.9)'
                }} />
              </div>
            </OverlayView>
          )}

          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#bc13fe', // Purple route
                  strokeWeight: 5,
                  strokeOpacity: 0.7
                }
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
      
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <AudioRecorder 
          onRequestComplete={handleRequestComplete}
          location={location}
          isFirstRequest={isFirstRequest}
          lat={lat}
          lng={lng}
          selectedLandmarks={selectedLandmarks}
          isExploreMode={isExploreMode}
          isHistoryOpen={isHistoryOpen}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          hasReceivedResponse={hasReceivedResponse}
          isSpeaking={isSpeaking}
        />
      </div>
    </div>
  );
}

export default CityMap;