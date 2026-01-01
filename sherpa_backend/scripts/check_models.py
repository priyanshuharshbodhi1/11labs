
import vertexai
from vertexai.generative_models import GenerativeModel
import os

project_id = os.getenv("GCP_PROJECT_ID", "project-34320a6d-6ed6-4151-8c6")
location = "us-central1"

vertexai.init(project=project_id, location=location)

print("Attempting to list models/check availability...")

models_to_test = [
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-1.0-pro",
    "gemini-1.0-pro-001",
]

for model_name in models_to_test:
    print(f"Testing {model_name}...")
    try:
        model = GenerativeModel(model_name)
        response = model.generate_content("Hello")
        print(f"SUCCESS: {model_name} works!")
    except Exception as e:
        print(f"FAILED: {model_name} - {e}")
