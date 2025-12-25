import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';
import React, { useState, useCallback, useEffect } from 'react';
import RecordButton from './RecordButton';
import ChatHistory from './ChatHistory';
import useLocation from '../hooks/useLocation';
import { mapOptions, mapContainerStyle } from '../styles/mapStyles';
import { API_KEYS } from '../config/api-keys';
import { textToSpeech } from '../utils/elevenlabs';
import { fetchGuideResponse } from '../utils/api';
import avatarImage from '../narrator_avatar.png';

function Map() {
  const [isFirstRequest, setIsFirstRequest] = useState(true);
  const { location, handleMapLoad: handleLocationMapLoad, lat, lng } = useLocation();
  const [directions, setDirections] = useState(null);
  
  // Chat History State
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Persistence removed as per user request


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
      // Open history panel when new message arrives
      setIsHistoryOpen(true);
    }
    setHistory(newHistory);

    if (response.parsedLandmarks && response.parsedLandmarks.length > 0) {
      // If exploring new area, update mode but don't force reset if just chatting
      setSelectedLandmarks(response.parsedLandmarks);
      setIsExploreMode(true);
    }
    
    // Add marker for the response location if strictly related? 
    // For now we just keep the general landmarks.
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
      textToSpeech(apiResponse.speech);
      
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
      {/* Top Bar / Header */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
         <div className="glass-panel" style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#fff' }}>
            <img src={avatarImage} alt="Vagabond" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
         </div>
         <h1 style={{ 
            margin: 0, 
            fontSize: '1.8rem', 
            fontWeight: '800', 
            color: 'var(--text-primary)',
            textShadow: '0 2px 4px rgba(255,255,255,0.8)'
         }}>VAGABOND</h1>
         
         <button 
           onClick={() => setIsHistoryOpen(!isHistoryOpen)}
           className="glass-panel"
           style={{
             padding: '10px 16px',
             cursor: 'pointer',
             color: 'var(--primary-accent)',
             fontWeight: '600',
             border: '1px solid var(--glass-border)'
           }}
         >
           {isHistoryOpen ? 'Hide Log' : 'Show Log'}
         </button>
      </div>

      <ChatHistory 
        history={history} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onClear={() => setHistory([])}
      />

      {selectedMarker && (
        <div className="glass-panel" style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '500px',
            padding: '20px',
            zIndex: 1000,
            display: 'flex',
            gap: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}>
          <img 
            src={selectedMarker.photoUrl} 
            alt={selectedMarker.name}
            style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{selectedMarker.displayName || selectedMarker.name}</h4>
              <button 
                onClick={() => removeLandmark(selectedMarker)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              >✕</button>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: i < (selectedMarker.rating || 0) ? '#f59e0b' : '#cbd5e1' }}>★</span>
                ))}
            </div>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {tellMeAboutLandmark || 'Translating location data...'}
            </p>
          </div>
        </div>
      )}

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
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#00f3ff',
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: '#fff',
              }} 
            />
          ))}

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
        zIndex: 1000
      }}>
        <RecordButton 
          onRequestComplete={handleRequestComplete}
          location={location}
          isFirstRequest={isFirstRequest}
          lat={lat}
          lng={lng}
          selectedLandmarks={selectedLandmarks}
          isExploreMode={isExploreMode}
        />
      </div>
    </div>
  );
}

export default Map; 