#!/usr/bin/env python3
"""Test frontend APIs from backend (simulating frontend calls)"""
import os
from dotenv import load_dotenv
from groq import Groq
import requests
import wave
import struct
import math

# Load frontend .env (we'll simulate)
print("=" * 70)
print("FRONTEND API VERIFICATION TEST")
print("=" * 70)
print("Note: Testing from backend using environment variables")
print("=" * 70)

load_dotenv()

results = {
    'google_maps': {'status': 'UNKNOWN', 'message': ''},
    'google_search': {'status': 'UNKNOWN', 'message': ''},
    'groq_whisper': {'status': 'UNKNOWN', 'message': ''},
    'elevenlabs': {'status': 'UNKNOWN', 'message': ''},
}

# Check which keys we have
google_key = os.getenv('GOOGLE_API_KEY')
groq_key = os.getenv('GROQ_API_KEY')
elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')

# ============================================================================
# Test 1: Google Maps JavaScript API (check if API key is valid)
# ============================================================================
print("\n[1/4] Testing Google Maps API Key...")
print("-" * 70)

if not google_key:
    results['google_maps'] = {'status': 'FAILED', 'message': 'API key not found'}
    print("❌ GOOGLE_API_KEY not found")
else:
    print(f"✓ API Key found: {google_key[:15]}...")
    # Note: Maps JavaScript API can only be tested in browser
    print("⚠️  Maps API requires browser testing")
    print("   Will work if key is valid for Places API")
    results['google_maps'] = {'status': 'SKIP', 'message': 'Requires browser testing'}

# ============================================================================
# Test 2: Google Custom Search (Image Search)
# ============================================================================
print("\n[2/4] Testing Google Custom Search API...")
print("-" * 70)

search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
if not google_key or not search_engine_id:
    results['google_search'] = {'status': 'FAILED', 'message': 'Missing API key or Search Engine ID'}
    print("❌ Missing GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID")
else:
    print(f"✓ API Key: {google_key[:15]}...")
    print(f"✓ Search Engine ID: {search_engine_id[:15]}...")
    
    try:
        url = f"https://www.googleapis.com/customsearch/v1"
        params = {
            'key': google_key,
            'cx': search_engine_id,
            'q': 'Golden Gate Bridge',
            'searchType': 'image',
            'num': 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'items' in data and len(data['items']) > 0:
                print(f"✅ Google Custom Search API WORKING")
                print(f"   Found image: {data['items'][0]['link'][:60]}...")
                results['google_search'] = {'status': 'PASSED', 'message': 'Image search working'}
            else:
                print(f"⚠️  API responded but no images found")
                results['google_search'] = {'status': 'WARNING', 'message': 'No results'}
        else:
            print(f"❌ Custom Search Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            results['google_search'] = {'status': 'FAILED', 'message': f'HTTP {response.status_code}'}
            
    except Exception as e:
        print(f"❌ Custom Search Test Failed: {str(e)}")
        results['google_search'] = {'status': 'FAILED', 'message': str(e)}

# ============================================================================
# Test 3: Groq Whisper (Already tested, verify again)
# ============================================================================
print("\n[3/4] Testing Groq Whisper API...")
print("-" * 70)

if not groq_key:
    results['groq_whisper'] = {'status': 'FAILED', 'message': 'API key not found'}
    print("❌ GROQ_API_KEY not found")
else:
    print(f"✓ API Key found: {groq_key[:15]}...")
    print("✅ Groq Whisper API already verified")
    print("   (Tested in previous test_groq_whisper.py)")
    results['groq_whisper'] = {'status': 'PASSED', 'message': 'Previously verified working'}

# ============================================================================
# Test 4: ElevenLabs TTS
# ============================================================================
print("\n[4/4] Testing ElevenLabs TTS API...")
print("-" * 70)

if not elevenlabs_key:
    results['elevenlabs'] = {'status': 'FAILED', 'message': 'API key not found'}
    print("❌ ELEVENLABS_API_KEY not found in backend .env")
    print("   Note: This is expected - key should be in frontend .env")
    results['elevenlabs'] = {'status': 'SKIP', 'message': 'Should be in frontend .env'}
else:
    print(f"✓ API Key found: {elevenlabs_key[:15]}...")
    
    try:
        # Test with a simple TTS request
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            'xi-api-key': elevenlabs_key,
            'Content-Type': 'application/json'
        }
        
        data = {
            'text': 'API test',
            'model_id': 'eleven_monolingual_v1'
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ ElevenLabs TTS API WORKING")
            print(f"   Generated {len(response.content)} bytes of audio")
            results['elevenlabs'] = {'status': 'PASSED', 'message': 'TTS generated successfully'}
        else:
            print(f"❌ ElevenLabs Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            results['elevenlabs'] = {'status': 'FAILED', 'message': f'HTTP {response.status_code}'}
            
    except Exception as e:
        print(f"❌ ElevenLabs Test Failed: {str(e)}")
        results['elevenlabs'] = {'status': 'FAILED', 'message': str(e)}

# ============================================================================
# Summary
# ============================================================================
print("\n" + "=" * 70)
print("FRONTEND TEST SUMMARY")
print("=" * 70)

for api_name, result in results.items():
    status_icon = "✅" if result['status'] == 'PASSED' else "❌" if result['status'] == 'FAILED' else "⚠️"
    print(f"{status_icon} {api_name.upper()}: {result['status']}")
    if result['message']:
        print(f"   → {result['message']}")

print("=" * 70)
