
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Story Mode Configuration
    # Story Mode Configuration
    STORY_IMAGE_COUNT = 1  # Number of images to generate (reduced to 1 for speed)
    # Using Imagen 3 Fast (comparable to "Nano Banana" efficiency)
    IMAGE_GENERATION_MODEL = "imagen-3.0-fast-generate-001" 
    
    # Text Generation
    TEXT_MODEL = "gemini-2.0-flash-exp"
    
    # Storytelling Voice (ElevenLabs)
    # Using a specific storytelling voice if available, else default
    STORY_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb" # George (Warm, Safe)
    
    # Mock Data Toggle
    USE_MOCK_DATA = False

    # Google Cloud Project ID
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "project-34320a6d-6ed6-4151-8c6")
