
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from vertexai.generative_models import GenerativeModel
import os

project_id = os.getenv("GCP_PROJECT_ID", "project-34320a6d-6ed6-4151-8c6")
location = "us-central1"
vertexai.init(project=project_id, location=location)

print("--- Testing Imagen 3 Fast (Image Generation) ---")
try:
    model = ImageGenerationModel.from_pretrained("imagen-3.0-fast-generate-001")
    # Generate 1 image
    images = model.generate_images(
        prompt="A cute robot tour guide in a cyber city",
        number_of_images=1,
        language="en",
        aspect_ratio="1:1"
    )
    print("  [SUCCESS] Imagen 3 Fast generated an image.")
except Exception as e:
    print(f"  [FAILED] Imagen 3 Fast: {e}")

print("\n--- Testing Gemini 3 Flash Preview (Text Generation) ---")
try:
    model = GenerativeModel("gemini-3-flash-preview")
    response = model.generate_content("Hello, introduce yourself briefly.")
    print(f"  [SUCCESS] Gemini 3 Flash response: {response.text}")
except Exception as e:
    print(f"  [FAILED] Gemini 3 Flash: {e}")

print("\n--- Testing Gemini 2.0 Flash Exp (Fallback) ---")
try:
    model = GenerativeModel("gemini-2.0-flash-exp")
    response = model.generate_content("Hello")
    print(f"  [SUCCESS] Gemini 2.0 Flash Exp response: {response.text}")
except Exception as e:
    print(f"  [FAILED] Gemini 2.0 Flash Exp: {e}")
