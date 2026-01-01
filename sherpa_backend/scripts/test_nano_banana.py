
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from vertexai.generative_models import GenerativeModel
import os

project_id = os.getenv("GCP_PROJECT_ID", "project-34320a6d-6ed6-4151-8c6")
location = "us-central1"

vertexai.init(project=project_id, location=location)

print("--- Testing Image Generation Models ---")
image_models = [
    "imagen-3.0-fast-generate-001",
    "imagen-3.0-generate-001",
    "gemini-2.5-flash-image-001",
    "nano-banana",
    "imagegeneration@006"
]

for model_name in image_models:
    print(f"Testing {model_name}...")
    try:
        model = ImageGenerationModel.from_pretrained(model_name)
        # Just init isn't enough, need to try generate usually to fail authorization/existence sometimes?
        # But from_pretrained usually validates existence.
        print(f"  [SUCCESS] Model '{model_name}' instantiated.")
    except Exception as e:
        print(f"  [FAILED] {e}")

print("\n--- Testing Generative Models (Gemini) ---")
gemini_models = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash-image-001",
    "gemini-2.5-flash-001",
    "gemini-2.0-flash-exp"
]

for model_name in gemini_models:
    print(f"Testing {model_name}...")
    try:
        model = GenerativeModel(model_name)
        print(f"  [SUCCESS] GenerativeModel '{model_name}' instantiated.")
    except Exception as e:
        print(f"  [FAILED] {e}")
