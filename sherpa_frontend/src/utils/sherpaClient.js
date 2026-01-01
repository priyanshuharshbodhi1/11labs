import { TOGGLES } from '../config/toggles';
import { mockStoryScenes } from '../data/mockStoryData';

/**
 * Makes a request to the Voice View backend API
 * @param {string} query - The query or prompt to send
 * @param {string} name - address of the current map location
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {boolean} isFirstRequest - Whether this is the first request in the session
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
export const fetchGuideResponse = async (query, locationName, latitude, longitude, isFirstRequest = false) => {
  const payload = {
    city: {
      name: locationName, 
      latitude, 
      longitude
    },
    is_first_request: isFirstRequest
  };
  
  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/answer?query=${encodeURIComponent(query)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from backend:', error);
    throw error;
  }
};

/**
 * Fetches the generated story for a monument
 * @param {string} monumentName - Name of the monument
 * @param {string} locationContext - Context like "New Delhi, India"
 * @returns {Promise<Object>} - Promise resolving to { scenes: [] }
 */
export const fetchStory = async (monumentName, locationContext) => {
  // Return mock data if toggle is enabled to save API costs
  if (TOGGLES.USE_MOCK_STORY) {
    console.log('Using mock story data (USE_MOCK_STORY is enabled)');
    return { scenes: mockStoryScenes };
  }

  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/generate_story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monument_name: monumentName,
        location_context: locationContext
      })
    });

    if (!response.ok) {
      throw new Error(`Story API failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
};