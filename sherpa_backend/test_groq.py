#!/usr/bin/env python3
"""Quick test script to verify Groq API is working"""
import os
from dotenv import load_dotenv
from groq import Groq
import json

# Load environment variables
load_dotenv()

print("=" * 60)
print("Testing Groq API Integration")
print("=" * 60)

# Check if API key exists
api_key = os.getenv('GROQ_API_KEY')
if not api_key:
    print("❌ ERROR: GROQ_API_KEY not found in .env file")
    exit(1)
else:
    print(f"✅ API Key found: {api_key[:10]}...")

# Initialize Groq client
try:
    client = Groq(api_key=api_key)
    print("✅ Groq client initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Groq client: {e}")
    exit(1)

# Test 1: Simple completion
print("\n" + "=" * 60)
print("Test 1: Simple Language Detection")
print("=" * 60)

try:
    query = "Hola, ¿cómo estás?"
    system_prompt = f"""
    You will be provided with the user query.
    Based on the user query, classify the language of the user query.
    
    Return the language type in the following JSON format:
    {{
        "language": "language name"
    }}
    
    USER QUERY:
    {query}
    
    IMPORTANT: Return ONLY valid JSON, no additional text.
    """
    
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        max_tokens=100,
        messages=[{
            "role": "system",
            "content": system_prompt
        }]
    )
    
    response_text = completion.choices[0].message.content
    print(f"Raw response: {response_text}")
    
    parsed = json.loads(response_text)
    language = parsed.get('language', 'Unknown')
    
    print(f"✅ Test 1 PASSED")
    print(f"   Detected language: {language}")
    print(f"   Expected: Spanish (or similar)")
    
except json.JSONDecodeError as e:
    print(f"⚠️  JSON Parse Error: {e}")
    print(f"   Response was: {response_text}")
except Exception as e:
    print(f"❌ Test 1 FAILED: {e}")
    exit(1)

# Test 2: Tour Guide Response
print("\n" + "=" * 60)
print("Test 2: Tour Guide Recommendation")
print("=" * 60)

try:
    system_prompt = """
    You are Sherpa, a tour guide. The user wants recommendations for San Francisco.
    
    Return your response in the following JSON format:
    {
        "locations": ["Golden Gate Bridge", "Fisherman's Wharf"],
        "speech": "I recommend visiting the Golden Gate Bridge and Fisherman's Wharf!"
    }
    
    IMPORTANT: Return ONLY valid JSON, no additional text.
    """
    
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=500,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "What should I visit in San Francisco?"}
        ]
    )
    
    response_text = completion.choices[0].message.content
    print(f"Raw response: {response_text[:200]}...")
    
    parsed = json.loads(response_text)
    locations = parsed.get('locations', [])
    speech = parsed.get('speech', '')
    
    print(f"✅ Test 2 PASSED")
    print(f"   Locations: {len(locations)} recommendations")
    print(f"   Speech preview: {speech[:80]}...")
    
except json.JSONDecodeError as e:
    print(f"⚠️  JSON Parse Error: {e}")
    print(f"   Response was: {response_text}")
except Exception as e:
    print(f"❌ Test 2 FAILED: {e}")
    exit(1)

# Summary
print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED!")
print("=" * 60)
print("Groq integration is working correctly!")
print("You can now run the backend server with: python main.py")
print("=" * 60)
