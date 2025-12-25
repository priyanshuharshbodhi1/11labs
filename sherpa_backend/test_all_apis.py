#!/usr/bin/env python3
"""Final comprehensive API test - checking all keys including frontend ones"""
import os
from dotenv import load_dotenv

import requests
import json

# Load backend .env
load_dotenv()

print("=" * 70)
print("FINAL COMPREHENSIVE API VERIFICATION")
print("=" * 70)

# Try to load frontend .env too
frontend_env_path = '../sherpa_frontend/.env'
if os.path.exists(frontend_env_path):
    print(f"Loading frontend .env from: {frontend_env_path}")
    load_dotenv(frontend_env_path, override=True)
    
results = {}

# ============================================================================
# Test 1: Google Places API (Backend)
# ============================================================================
print("\n[1/5] Testing Google Places API (Backend)...")
print("-" * 70)

google_key = os.getenv('GOOGLE_API_KEY') or os.getenv('REACT_APP_GOOGLE_API_KEY')
if google_key:
    try:
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': google_key,
            'X-Goog-FieldMask': 'places.displayName',
        }
        json_data = {
            'includedTypes': ['tourist_attraction'],
            'maxResultCount': 3,
            'locationRestriction': {
                'circle': {
                    'center': {'latitude': 37.7749, 'longitude': -122.4194},
                    'radius': 5000.0,
                },
            },
        }
        response = requests.post(
            'https://places.googleapis.com/v1/places:searchNearby',
            headers=headers,
            json=json_data,
            timeout=10
        )
        if response.status_code == 200 and 'places' in response.json():
            print(f"✅ Google Places API WORKING")
            results['google_places'] = 'PASSED'
        else:
            print(f"❌ Error: {response.status_code}")
            results['google_places'] = 'FAILED'
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}")
        results['google_places'] = 'FAILED'
else:
    print("❌ Google API key not found")
    results['google_places'] = 'MISSING'

# ============================================================================
# Test 2: Google Custom Search (Frontend)
# ============================================================================
print("\n[2/5] Testing Google Custom Search API (Frontend)...")
print("-" * 70)

search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID') or os.getenv('REACT_APP_GOOGLE_SEARCH_ENGINE_ID')

if google_key and search_engine_id:
    print(f"✓ Google Key: {google_key[:15]}...")
    print(f"✓ Search Engine ID: {search_engine_id[:15]}...")
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': google_key,
            'cx': search_engine_id,
            'q': 'Golden Gate Bridge',
            'searchType': 'image',
            'num': 1
        }
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200 and 'items' in response.json():
            print(f"✅ Google Custom Search WORKING")
            print(f"   Found image: {response.json()['items'][0]['link'][:50]}...")
            results['google_search'] = 'PASSED'
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            results['google_search'] = 'FAILED'
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}")
        results['google_search'] = 'FAILED'
else:
    print(f"❌ Missing: Google Key={bool(google_key)}, Search ID={bool(search_engine_id)}")
    results['google_search'] = 'MISSING'

# ============================================================================
# Test 3: Gemini LLM (Backend)
# ============================================================================
print("\n[3/5] Testing Gemini LLM API (Backend)...")
print("-" * 70)

gemini_key = os.getenv('GEMINI_API_KEY')
if gemini_key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content("Say 'test ok'")
        if response.text:
            print(f"✅ Gemini LLM WORKING")
            results['gemini_llm'] = 'PASSED'
        else:
            print(f"❌ Gemini returned empty response")
            results['gemini_llm'] = 'FAILED'
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}")
        results['gemini_llm'] = 'FAILED'
else:
    print("❌ Gemini key not found")
    results['gemini_llm'] = 'MISSING'

# ============================================================================
# Test 4: Groq Whisper (Frontend STT)
# ============================================================================
print("\n[4/5] Checking Groq Whisper Key (Frontend)...")
print("-" * 70)

groq_key = os.getenv('GROQ_API_KEY') or os.getenv('REACT_APP_GROQ_API_KEY')
if groq_key:
    print(f"✅ Groq Key for Whisper Present")
    results['groq_whisper'] = 'PASSED'
else:
    print("❌ Groq key not found (Required for Frontend Whisper STT)")
    results['groq_whisper'] = 'MISSING'

# ============================================================================
# Test 5: ElevenLabs TTS (Frontend)
# ============================================================================
print("\n[5/5] Testing ElevenLabs TTS API (Frontend)...")
print("-" * 70)

elevenlabs_key = os.getenv('ELEVENLABS_API_KEY') or os.getenv('REACT_APP_ELEVENLABS_API_KEY')

if elevenlabs_key:
    print(f"✓ ElevenLabs Key: {elevenlabs_key[:15]}...")
    try:
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            'xi-api-key': elevenlabs_key,
            'Content-Type': 'application/json'
        }
        data = {'text': 'Test', 'model_id': 'eleven_monolingual_v1'}
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        if response.status_code == 200:
            print(f"✅ ElevenLabs TTS WORKING")
            print(f"   Generated {len(response.content)} bytes of audio")
            results['elevenlabs'] = 'PASSED'
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            results['elevenlabs'] = 'FAILED'
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}")
        results['elevenlabs'] = 'FAILED'
else:
    print("❌ ElevenLabs key not found")
    results['elevenlabs'] = 'MISSING'

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "=" * 70)
print("FINAL API STATUS SUMMARY")
print("=" * 70)

status_icons = {
    'PASSED': '✅',
    'FAILED': '❌',
    'MISSING': '⚠️'
}

for api_name, status in results.items():
    icon = status_icons.get(status, '❓')
    print(f"{icon} {api_name.upper().replace('_', ' ')}: {status}")

all_passed = all(status == 'PASSED' for status in results.values())

print("\n" + "=" * 70)
if all_passed:
    print("🎉🎉🎉 ALL APIs ARE WORKING! READY FOR HACKATHON! 🎉🎉🎉")
else:
    failed = [k for k, v in results.items() if v != 'PASSED']
    print(f"⚠️  Some APIs need attention: {', '.join(failed)}")
print("=" * 70)
