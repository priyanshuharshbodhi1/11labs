#!/usr/bin/env python3
"""Simple test to verify Groq Whisper API endpoint is accessible"""
import os
from dotenv import load_dotenv
from groq import Groq
import wave
import struct
import math

# Load environment variables
load_dotenv()

print("=" * 60)
print("Testing Groq Whisper API (Speech-to-Text)")
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

# Create a simple test audio file (1 second of 440Hz sine wave)
print("\n" + "=" * 60)
print("Creating test audio file...")
print("=" * 60)

try:
    audio_file_path = "/tmp/test_tone.wav"
    
    # Audio parameters
    sample_rate = 16000  # 16kHz
    duration = 1  # 1 second
    frequency = 440  # A4 note
    
    # Generate sine wave
    num_samples = sample_rate * duration
    
    # Create WAV file
    with wave.open(audio_file_path, 'w') as wav_file:
        # Set parameters: 1 channel, 2 bytes per sample, sample rate
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        # Generate and write samples
        for i in range(num_samples):
            # Generate sine wave sample
            sample = int(32767 * 0.3 * math.sin(2 * math.pi * frequency * i / sample_rate))
            # Pack as 16-bit signed integer
            wav_file.writeframes(struct.pack('h', sample))
    
    print(f"✅ Created test audio file: {audio_file_path}")
    
except Exception as e:
    print(f"❌ Failed to create audio file: {e}")
    exit(1)

# Test transcription
print("\n" + "=" * 60)
print("Testing Groq Whisper Transcription...")
print("=" * 60)

try:
    with open(audio_file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(audio_file_path, audio_file.read()),
            model="whisper-large-v3-turbo",
            response_format="json"
        )
    
    transcribed_text = transcription.text
    
    print(f"✅ Transcription API call successful!")
    print(f"\nTranscribed text (from tone):")
    print(f"  '{transcribed_text}'")
    print(f"\n  Note: Since this is just a tone, transcription may be empty or noise.")
    print(f"  The important thing is the API is working!")
    
    # Clean up
    os.remove(audio_file_path)
    
except Exception as e:
    print(f"❌ Transcription failed: {e}")
    print(f"\nError details: {str(e)}")
    if os.path.exists(audio_file_path):
        os.remove(audio_file_path)
    exit(1)

# Summary
print("\n" + "=" * 60)
print("✅ GROQ WHISPER API TEST PASSED!")
print("=" * 60)
print("Key findings:")
print("  - Groq API key is valid")
print("  - Whisper endpoint is accessible")
print("  - Audio file upload works")
print("  - Transcription pipeline is functional")
print("\nYour frontend will be able to use Groq Whisper for STT!")
print("=" * 60)
