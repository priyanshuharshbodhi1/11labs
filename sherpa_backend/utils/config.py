
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Story Mode Configuration
    STORY_IMAGE_COUNT = 2  # Default number of images to generate
    IMAGE_GENERATION_MODEL = "imageoptim-1/imagen-3.0-generate-001" # Or "image-3.0-generate-001" check available models
    # Note: Vertex AI model IDs can be 'imagegeneration@006', 'imagen-3.0-generate-001', etc.
    # We will try the standard endpoint.
    
    # Text Generation
    TEXT_MODEL = "gemini-2.0-flash-exp"
    
    # Storytelling Voice (ElevenLabs)
    # Using a specific storytelling voice if available, else default
    STORY_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb" # George (Warm, Safe)
    
    # Mock Data Toggle
    USE_MOCK_DATA = True
