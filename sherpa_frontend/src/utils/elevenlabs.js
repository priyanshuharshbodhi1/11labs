/**
 * Converts text to speech using ElevenLabs API and plays the audio
 * @param {string} text - The text to convert to speech
 * @returns {Promise<string>} - Promise resolving to the audio URL
 */
export const textToSpeech = async (text) => {
  try {
    const apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
    const voiceId = process.env.REACT_APP_ELEVENLABS_VOICE_ID;

    if (!apiKey) {
      console.error('ElevenLabs API key not found in environment variables');
      return;
    }

    if (!voiceId) {
      console.error('ElevenLabs Voice ID not found in environment variables');
      return;
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.00
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error (${response.status}):`, errorText);
      throw new Error(`ElevenLabs API call failed: ${response.statusText}`);
    }

    // Convert to ArrayBuffer first, then to Blob with explicit MIME type
    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create and play audio
    const audio = new Audio(audioUrl);
    
    // Play audio (must be triggered by user interaction)
    try {
      console.log('Playing audio from ElevenLabs...');
      await audio.play();
      console.log('Audio playing successfully!');
    } catch (error) {
      // If autoplay blocked, log detailed error
      if (error.name === 'NotAllowedError') {
        console.error('Audio autoplay blocked by browser. User must interact with the page first.');
        console.log('Try clicking the microphone button before speaking to enable audio.');
      } else {
        console.error('Audio playback error:', error);
      }
      throw error;
    }
    
    return { audioUrl, audio };
  } catch (error) {
    console.error('Text-to-speech error:', error);
    // [David] swallowed error, app should not crash when running out of 11labs credits
  }
}; 