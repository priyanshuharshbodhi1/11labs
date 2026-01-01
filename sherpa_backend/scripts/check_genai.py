
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: GOOGLE_API_KEY not found in environment.")
    exit(1)

genai.configure(api_key=api_key)

models_to_test = [
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp"
]

print(f"Testing with API Key: {api_key[:5]}...")

for model_name in models_to_test:
    print(f"Testing {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello")
        print(f"SUCCESS: {model_name} works! Response: {response.text}")
    except Exception as e:
        print(f"FAILED: {model_name} - {e}")
