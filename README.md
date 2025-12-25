# Sherpa - AI Tour Guide 🗺️🤖

An intelligent voice-activated tour guide powered by AI that helps you discover tourist attractions with personalized recommendations.

## 🎯 Features

- 🎤 **Voice Interaction** - Speak naturally to Sherpa
- 🤖 **AI-Powered Recommendations** - Intelligent suggestions using Google Gemini
- 📍 **Interactive Maps** - Visual route planning
- 🖼️ **Landmark Images** - Auto-fetched photos
- 🔊 **Natural Speech** - Sherpa speaks back to you
- 🌍 **Multilingual** - Supports multiple languages

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ and npm
- Python 3.8+
- API Keys (see Environment Setup)

### Installation & Running

#### 1. Backend (Terminal 1)

```bash
cd sherpa_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Backend runs on: `http://localhost:8000`

#### 2. Frontend (Terminal 2)

```bash
cd sherpa_frontend
npm install
npm start
```

Frontend opens at: `http://localhost:3000`

## 🔑 Environment Setup

### Backend `.env` (sherpa_backend/.env)
```env
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend `.env` (sherpa_frontend/.env)
```env
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
REACT_APP_GROQ_API_KEY=your_groq_api_key
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_key
REACT_APP_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

## 📖 How to Use

1. Open `http://localhost:3000` in your browser
2. Allow microphone access when prompted
3. Click and **hold** the microphone button
4. Speak: "Show me tourist attractions in [city name]"
5. Release the button
6. Watch Sherpa plan your tour!

## 🛠️ Technology Stack

**Backend:**
- FastAPI + Uvicorn
- Google Gemini 2.0 Flash (LLM)
- Google Places API
- Python 3.12

**Frontend:**
- React 19
- Groq Whisper (Speech-to-Text)
- Google Maps React
- ElevenLabs (Text-to-Speech)

## 💰 Cost

**FREE** for hackathon/development using free tiers:
- Gemini: Free (LLM - 15 req/min, 1M tokens/day)
- Groq: Free (Whisper STT)
- Google Cloud: $200 monthly credit
- ElevenLabs: 10k chars/month free

## 📝 API Testing

Test all APIs are working:
```bash
cd sherpa_backend
source venv/bin/activate
python test_all_apis.py
```

## 🔧 Troubleshooting

### Ports Already in Use

If you get "address already in use" errors:

**Kill processes on port 8000 (backend):**
```bash
# Find and kill
lsof -ti:8000 | xargs kill -9

# Or kill by name
pkill -f "python main.py"
```

**Kill processes on port 3000 (frontend):**
```bash
# Find and kill
lsof -ti:3000 | xargs kill -9

# Or kill by name  
pkill -f "npm start"
pkill -f "react-scripts"
```

**Kill both at once:**
```bash
lsof -ti:3000,8000 | xargs kill -9
```

### No Audio from Sherpa

If ElevenLabs API works but you hear no sound:
1. Check browser console for errors
2. Ensure browser allows autoplay (click somewhere on the page first)
3. Check system volume and browser tab isn't muted
4. Verify `REACT_APP_ELEVENLABS_API_KEY` in `.env`

### Map Not Loading

1. Check `REACT_APP_GOOGLE_API_KEY` in `sherpa_frontend/.env`
2. Verify Maps JavaScript API is enabled in Google Cloud Console
3. Allow location permission when browser prompts

## 🚀 Deployment

To deploy both backend and frontend automatically (reflecting all local changes):
```bash
./deploy.sh
```
This script will:
1. Deploy the backend to Cloud Run (including your local `.env` variables).
2. Capture the new Backend URL.
3. Update the frontend configuration.
4. Deploy the frontend to Cloud Run.

### Manual Deployment
If you prefer manual control:

## 🎓 Hackathon Submission

Built for: [AI Partner Catalyst Hackathon](https://ai-partner-catalyst.devpost.com/)

**Technologies Used:**
- Google Cloud (Maps, Places)
- Google Gemini (LLM)
- Groq (Whisper STT)
- ElevenLabs (TTS)

## 📄 License

MIT License

## 👥 Authors

Priyanshu - Hackathon Project 2024
