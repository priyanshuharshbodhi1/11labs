
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Story Mode Configuration
    # Story Mode Configuration
    STORY_IMAGE_COUNT = 2  # Number of images to generate (1 per scene for the first 2 scenes, or split)
    # Using Imagen 3 Fast (comparable to "Nano Banana" efficiency)
    IMAGE_GENERATION_MODEL = "imagen-3.0-fast-generate-001" 
    
    # Text Generation
    TEXT_MODEL = "gemini-2.0-flash-exp"
    
    # Storytelling Voice (ElevenLabs)
    # Using a specific storytelling voice if available, else default
    STORY_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb" # George (Warm, Safe)
    
    # Mock Data Toggle
    USE_MOCK_DATA = False
