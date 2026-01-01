
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import os

project_id = os.getenv("GCP_PROJECT_ID", "project-34320a6d-6ed6-4151-8c6")
location = "us-central1"
vertexai.init(project=project_id, location=location)

model_name = "gemini-2.5-flash-image-001"
print(f"Testing generation with {model_name}...")

try:
    model = GenerativeModel(model_name)
    response = model.generate_content("Generate an image of a futuristic city skyline.")
    
    print("Response received.")
    print(response)
    
    # Check for image parts
    # Usually images come as parts with mime_type image/png or similar
    # Or strict JSON for Imagen
    
except Exception as e:
    print(f"Generation failed: {e}")
