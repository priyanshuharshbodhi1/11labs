import os
import hashlib
from pathlib import Path
from elevenlabs import ElevenLabs

class TTSManager:
    # Language to voice ID mapping for native-sounding voices
    # English uses default George voice, other languages use native speakers
    LANGUAGE_VOICE_MAP = {
        # Default English voice
        "english": "JBFqnCBsd6RMkjVDRZzb",  # George (English)
        
        # Indian languages
        "hindi": "IvLWq57RKibBrqZGpQrC",     # Leo (Energetic Hindi)
        
        # European languages  
        "spanish": "pFZP5JQG7iQjIQuC4Bku",   # Lily (Spanish)
        "french": "IKne3meq5aSn9XLyUdCD",    # Charlie (French)
        "german": "zcAOhNBS3c14rBihAFp1",   # Daniel (German)
        "italian": "g5CIjZEefAph4nQFvHAz",   # Adam (Italian)
        "portuguese": "ErXwobaYiN019PkySvjV", # Antoni (Portuguese)
        
        # Asian languages
        "japanese": "Xb7hH8MSUJpSbSDYk0k2",  # River (Japanese)
        "korean": "EXAVITQu4vr4xnSDxMaL",    # Bella (Korean)
        "chinese": "onwK4e9ZLuTAKqWW03F9",   # Daniel (Chinese)
        
        # Other languages
        "arabic": "pNInz6obpgDQGcFmaJgB",    # Adam (Arabic)
        "russian": "yoZ06aMxZJJ28mfd3POQ",   # Dave (Russian)
    }
    
    def __init__(self, cache_dir="audio_cache"):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            print("Warning: ELEVENLABS_API_KEY not found in environment variables.")
        
        self.client = ElevenLabs(api_key=self.api_key)
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def _get_cache_path(self, text, voice_id):
        # Create a unique filename based on text and voice_id
        content_hash = hashlib.md5(f"{text}:{voice_id}".encode()).hexdigest()
        return self.cache_dir / f"{content_hash}.mp3"
    
    def _get_voice_for_language(self, language):
        """Get the appropriate voice ID for the given language."""
        if not language:
            return self.LANGUAGE_VOICE_MAP["english"]
        
        # Normalize language to lowercase
        lang_lower = language.lower().strip()
        
        # Check for exact match or partial match
        for lang_key, voice_id in self.LANGUAGE_VOICE_MAP.items():
            if lang_key in lang_lower or lang_lower in lang_key:
                return voice_id
        
        # Default to English voice for unknown languages
        return self.LANGUAGE_VOICE_MAP["english"]

    def generate_audio(self, text, language=None, voice_id=None):
        """
        Generates audio for the given text using ElevenLabs API.
        Checks cache first. Returns path to the audio file.
        
        Args:
            text: The text to convert to speech
            language: The language of the text (e.g., "Hindi", "English")
            voice_id: Optional override for voice ID (uses language mapping if not provided)
        """
        if not text:
            return None
        
        # Determine voice ID based on language if not explicitly provided
        if voice_id is None:
            voice_id = self._get_voice_for_language(language)
        
        # Use multilingual model for non-English, monolingual for English
        is_english = language is None or language.lower().strip() in ["english", "en"]
        model_id = "eleven_monolingual_v1" if is_english else "eleven_multilingual_v2"

        cache_path = self._get_cache_path(text, voice_id)

        # Check cache
        if cache_path.exists():
            print(f"TTS Cache hit for: '{text[:20]}...'")
            return str(cache_path)

        # Generate fresh audio using the new SDK method
        print(f"TTS Generating ({language or 'English'}) for: '{text[:20]}...'")
        try:
            audio = self.client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id=model_id,
                voice_settings={
                    "stability": 0.5,
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "speed": 1.20  # Max allowed speed
                }
            )
            
            # Save to cache - audio is now bytes directly
            with open(cache_path, "wb") as f:
                for chunk in audio:
                    f.write(chunk)
            
            return str(cache_path)
            
        except Exception as e:
            print(f"Error generating TTS: {e}")
            return None

