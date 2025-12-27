import { GoogleMap, LoadScript, DirectionsRenderer, Marker, OverlayView } from '@react-google-maps/api';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import AudioRecorder from './AudioRecorder';
import ChatHistory from './ChatHistory';
import useLocation from '../hooks/useLocation';
import { mapOptions, mapContainerStyle } from '../styles/mapStyles';
import { API_KEYS } from '../config/api-keys';
import { textToSpeech } from '../utils/elevenlabs';
import { fetchGuideResponse, fetchStory } from '../utils/sherpaClient';
import StoryModal from './StoryModal';
import { TOGGLES } from '../config/toggles';
import avatarImage from '../narrator_avatar.png';
import './CityMap.css';

// Toggle for Instant Fetch (Disabled by default as per request to save API cost)
// const ENABLE_PREFETCH = false; // Moved to toggles.js

function CityMap() {
  const [isFirstRequest, setIsFirstRequest] = useState(true);
  const [isLocating, setIsLocating] = useState(true); // Add locating state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { location, handleMapLoad: handleLocationMapLoad, lat, lng } = useLocation();

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  
  // Refs for audio control
  const currentAudioRef = useRef(null);
  const wordTimerRef = useRef(null);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

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
          setIsLocating(false); // Location found
        },
        (error) => {
          console.log('Geolocation error:', error);
          setIsLocating(false); // Failed, stick to default
        }
      );
    } else {
      setIsLocating(false); // Not supported
    }
  }, []);

  const [selectedLandmarks, setSelectedLandmarks] = useState([]);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [tellMeAboutLandmark, setTellMeAboutLandmark] = useState(null);
  
  // Story Mode State
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyScenes, setStoryScenes] = useState([]);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [storyMonumentName, setStoryMonumentName] = useState('');

  // Play audio with synchronized word-by-word captions
  const [isExpanded, setIsExpanded] = useState(false);  
  const playAudioWithCaptions = useCallback((audioUrl, speechText) => {
    // Stop any currently playing audio first
    stopAudio();

    const words = speechText.split(' ');
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio; // Store ref
    
    // Reset caption state
    setCurrentSpeech(speechText);
    setDisplayedWordCount(0);
    setIsSpeaking(true);
    
    audio.onloadedmetadata = () => {
      const duration = audio.duration * 1000; // Convert to ms
      const wordInterval = duration / words.length;
      
      let wordIndex = 0;
      const timer = setInterval(() => {
        wordIndex++;
        setDisplayedWordCount(wordIndex);
        if (wordIndex >= words.length) {
          clearInterval(timer);
        }
      }, wordInterval);
      wordTimerRef.current = timer; // Store ref
    };
    
    audio.onended = () => {
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
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
      setLastResponse(response.speech); // Ensure text shows immediately
      
      // Play audio from backend with synchronized captions
      if (response.audio_url) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const fullAudioUrl = `${backendUrl}${response.audio_url}`;
        playAudioWithCaptions(fullAudioUrl, response.speech);
      } else {
        // Fallback - no captions for direct TTS
        stopAudio();
        textToSpeech(response.speech).then(result => {
          if (result && result.audio) {
            currentAudioRef.current = result.audio;
            result.audio.onended = () => {
              currentAudioRef.current = null;
            };
          }
        });
      }
      
      // Don't auto-open history - let caption show first
    }
    setHistory(newHistory);

    if (response.parsedLandmarks && response.parsedLandmarks.length > 0) {
      // If exploring new area, update mode but don't force reset if just chatting
      setSelectedLandmarks(response.parsedLandmarks);
      setIsExploreMode(true);
      
      // Pre-fetch logic
      if (TOGGLES.ENABLE_PREFETCH) {
        preFetchLandmarkDetails(response.parsedLandmarks);
      }
    }
  };
  
  const preFetchLandmarkDetails = async (landmarks) => {
    console.log("Pre-fetching details for", landmarks.length, "landmarks...");
    landmarks.forEach(async (landmark) => {
       try {
         const prompt = `In three sentences, tell me about ${landmark.displayName || landmark.name} by sourcing wikipedia.`;
         // We fire and forget, utilizing internal caching or state updates if we wanted to be more complex.
         // However, standard browser caching for GET requests or internal React Query would be best.
         // Since fetchGuideResponse doesn't cache internally in frontend memory (except via react-query which isn't here),
         // we would ideally update the selectedLandmarks state with the description.
         
         const apiResponse = await fetchGuideResponse(prompt, location, lat, lng, isFirstRequest);
         
         // Update the specific landmark in state with its description
         setSelectedLandmarks(prev => prev.map(l => 
           l.name === landmark.name ? { ...l, description: apiResponse.speech } : l
         ));
         
       } catch (e) {
         console.error("Prefetch failed for", landmark.name, e);
       }
    });
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

  const handleStoryClick = async (e, landmark) => {
    e.stopPropagation();
    if (isStoryLoading) return;
    
    setStoryMonumentName(landmark.displayName || landmark.name);
    setIsStoryLoading(true);
    
    // Stop any other audio
    stopAudio();

    try {
      const response = await fetchStory(landmark.displayName || landmark.name, location);
      if (response && response.scenes) {
        setStoryScenes(response.scenes);
        setIsStoryOpen(true);
        setIsExpanded(false); // Minify the popup
      }
    } catch (error) {
      console.error("Story generation failed:", error);
      // Optional: Show error toast
    } finally {
      setIsStoryLoading(false);
    }
  };

  const handleMarkerClick = async (landmark) => {
    stopAudio(); // Stop any existing audio immediately
    setSelectedMarker(landmark);
    setIsExpanded(false); // Reset expansion state
    
    // Use pre-fetched description if available
    if (landmark.description) {
        setTellMeAboutLandmark(landmark.description);
        // Do NOT add to history on subsequent clicks, just show the modal
        return; 
    }

    try {
      const prompt = `In three sentences, tell me about ${landmark.displayName || landmark.name} by sourcing wikipedia.`;
      const apiResponse = await fetchGuideResponse(prompt, location, lat, lng, isFirstRequest);
      
      setTellMeAboutLandmark(apiResponse.speech);
      
      // Lazy Cache: Update the specific landmark in state
      setSelectedLandmarks(prev => prev.map(l => 
        l.name === landmark.name ? { ...l, description: apiResponse.speech } : l
      ));
      
      // Removed audio playback logic as per request - only show text
      
      // Add to history
      setHistory(prev => [
        ...prev, 
        { role: 'user', text: `Tell me about ${landmark.displayName || landmark.name}` },
        { role: 'assistant', text: apiResponse.speech }
      ]);
      // setIsHistoryOpen(true); // Optional: keep history closed to focus on map popup
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
        top: isMobile ? 10 : 20,
        left: isMobile ? 10 : 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '6px' : '10px',
        maxWidth: isMobile ? 'calc(100vw - 20px)' : '400px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '10px' : '15px'
        }}>
           {/* Hide avatar on mobile */}
           {!isMobile && (
             <div style={{ borderRadius: '50%', border: '3px solid #1a365d', overflow: 'hidden' }}>
               <img src={avatarImage} alt="Sherpa" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
             </div>
           )}
           <img 
             src="/Sherpa_landingpage-removebg.png" 
             alt="SHERPA" 
             style={{ 
               height: isMobile ? '60px' : '110px',
               objectFit: 'contain',
               filter: 'drop-shadow(0 2px 4px rgba(255,255,255,0.9))'
             }} 
           />
        </div>
        
        {/* Speech Caption Bubble - Dark theme, hidden when chat history is open */}
        {hasReceivedResponse && !isHistoryOpen && (lastResponse || (isSpeaking && currentSpeech)) && (
          <div>
            <div className="custom-scroll speech-bubble-container">
              <div style={{ 
                color: '#94a3b8', 
                fontSize: isMobile ? '0.6rem' : '0.7rem', 
                marginBottom: isMobile ? '4px' : '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🗣️ SHERPA SAYS
              </div>
              
                <p style={{
                  margin: 0,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  lineHeight: '1.5',
                  color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                  textAlign: 'left'
                }}>
                  {isSpeaking && currentSpeech 
                    ? currentSpeech.split(' ').slice(0, displayedWordCount).join(' ')
                    : lastResponse
                  }
                </p>
              </div>

              {/* Chats Button - Hidden on mobile via CSS */}
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
          isMobile={isMobile}
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
          onClick={() => setSelectedMarker(null)}
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
              mapPaneName="floatPane"
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height - 20 // Shift up above the marker
              })}
            >
              <div 
                className="glass-panel" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: isMobile 
                    ? (isExpanded ? 'calc(100vw - 40px)' : '220px')
                    : (isExpanded ? '400px' : '260px'), 
                  maxWidth: isMobile ? 'calc(100vw - 40px)' : '400px',
                  maxHeight: isExpanded ? (isMobile ? '300px' : '400px') : 'auto',
                  overflowY: isExpanded ? 'auto' : 'visible',
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                  padding: isMobile ? '10px' : '12px',
                  zIndex: 900,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slightly more opaque
                  backdropFilter: 'blur(12px)',
                  borderRadius: isMobile ? '12px' : '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  display: 'flex',
                  gap: isMobile ? '8px' : '12px',
                  color: '#fff',
                  transform: 'translateY(-10px)', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition for size changes
                  animation: 'fadeIn 0.2s ease-out',
                  pointerEvents: 'auto'
              }}>
                <style>{`
                  .glass-panel::-webkit-scrollbar { display: none; }
                `}</style>
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
                  
                  <div style={{ marginBottom: '6px', textAlign: 'left' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ fontSize: '0.8rem', color: i < (selectedMarker.rating || 0) ? '#f59e0b' : '#475569' }}>★</span>
                      ))}
                  </div>
                  
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.85rem', // Slightly larger text
                    color: '#e2e8f0', // Brighter text
                    lineHeight: '1.5', 
                    textAlign: 'left', // Explicit left align
                    display: '-webkit-box', 
                    WebkitLineClamp: isExpanded ? 'unset' : 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {tellMeAboutLandmark || 'Loading details...'}
                  </p>
                  
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                     <button
                       onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                       style={{
                         background: 'transparent',
                         border: '1px solid rgba(255,255,255,0.2)',
                         borderRadius: '4px',
                         color: '#a78bfa',
                         fontSize: '0.7rem',
                         padding: '2px 6px',
                         cursor: 'pointer'
                       }}
                     >
                       {isExpanded ? 'Show Less' : 'Show More'}
                     </button>
                     
                     {TOGGLES.ENABLE_ANIMATION && (
                       <button
                         onClick={(e) => handleStoryClick(e, selectedMarker)}
                         disabled={isStoryLoading}
                         style={{
                           background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                           border: 'none',
                           borderRadius: '4px',
                           color: '#fff',
                           fontSize: '0.7rem',
                           padding: '2px 8px',
                           cursor: isStoryLoading ? 'wait' : 'pointer',
                           marginLeft: '8px',
                           opacity: isStoryLoading ? 0.7 : 1,
                           fontWeight: '600',
                           boxShadow: '0 2px 5px rgba(168, 85, 247, 0.4)'
                         }}
                       >
                         {isStoryLoading ? 'Creating...' : '✨ Story'}
                       </button>
                     )}
                  </div>

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
        bottom: isMobile ? '20px' : '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <AudioRecorder 
          onRequestComplete={handleRequestComplete}
          onRecordStart={stopAudio}
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
          isLocating={isLocating}
          isMobile={isMobile}
        />
      </div>
      
      <StoryModal 
        isOpen={isStoryOpen} 
        onClose={() => setIsStoryOpen(false)}
        scenes={storyScenes}
        monumentName={storyMonumentName}
      />
    </div>
  );
}

export default CityMap;