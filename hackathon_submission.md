# Sherpa - Project Story

## 💡 Inspiration
We all love traveling, but we hate looking like tourists. You know the feeling: standing in front of a magnificent 500-year-old monument, staring down at a Wikipedia article on your phone, trying to piece together why it matters. The magic of the moment is lost in the screen.

We wanted to build something that feels less like a tool and more like a local friend. A companion that walks *with* you, sees what you see, and tells you the stories that matter—not just dates and dry facts, but the drama, the history, and the emotion of a place. **Sherpa** was born from the desire to turn every walk into a cinematic documentary.

## 🚀 What it does
**Sherpa** is an immersive AI travel partner that transforms the way you explore cities. It doesn't just give you a route; it curates an experience.

*   **🗣️ Interactive Audio Tours**: Speak to Sherpa naturally. It answers questions about your surroundings with human-like warmth using **ElevenLabs'** ultra-realistic voices.
*   **📍 Intelligent Routing**: Using real-time geolocation, Sherpa dynamically plans optimized walking tours based on your interests (e.g., "I love hidden gems" or "Show me architecture").
*   **🖼️ Visual Time Travel**: Standing at a ruin? Sherpa's **Story Mode** uses generative AI to visualize what the monument looked like in its prime, accompanied by a narrated historical reenactment.
*   **🌍 Multi-Lingual & Adaptive**: Sherpa detects your language and adapts its personality to be your perfect guide, whether you're in New York, Delhi, or Paris.

## ⚙️ How we built it
Sherpa is a sophisticated multi-agent system orchestrating state-of-the-art AI models:

*   **Frontend**: Built with **React** and **Leaflet** for a responsive, map-centric interface that works seamlessly on mobile devices.
*   **Backend**: A high-performance **FastAPI** server hosted on **Google Cloud Run**.
*   **The Brain (Agents)**:
    *   **CityWalkAgent**: Powered by **Vertex AI (Gemini 1.5 Flash)**, this agent handles routing, context awareness, and user intent detection. It integrates with **Google Places API** for real-time data and **Wikipedia API** for historical accuracy.
    *   **StoryAgent**: A specialized agent that "directs" a scene. It uses **Gemini** to script a narrative and **Vertex AI (Imagen)** to generate photorealistic historical reconstructions.
*   **The Voice**: We integrated **ElevenLabs TTS** to give Sherpa a soul. We implemented an aggressive audio caching layer to ensure near-instant playback, making conversation feel real-time.

## 🚧 Challenges we ran into
*   **Audio Latency**: The biggest hurdle was making the voice interaction feel natural. Waiting 5 seconds for a response breaks the immersion. We solved this by implementing parallel processing—generating the text and pre-fetching the audio stream while the UI updates.
*   **Hallucinations vs. Fact**: AI loves to be creative, but a tour guide needs to be accurate. We implemented a RAG (Retrieval-Augmented Generation) pipeline that grounds Sherpa's responses in real-time data from Google Maps and Wikipedia, significantly reducing hallucinations.
*   **Context Switching**: Users are unpredictable. They might start a tour in Delhi but ask about food in Mumbai. We had to build robust "guardrails" in our agent logic to detect context shifts and handle them gracefully without breaking the session state.

## 🏆 Accomplishments that we're proud of
*   **The "Vibes"**: We didn't just build a chatbot; we built a personality. The combination of the dark "Glassmorphism" UI, the glowing orb animation, and the emotive ElevenLabs voice creates a genuinely premium feel.
*   **Visual Storytelling**: Getting the Story Agent to consistently generate accurate *and* beautiful historical images based on just a location name was a complex prompt engineering challenge we cracked.
*   **Seamless Deployment**: We successfully containerized the entire stack and deployed it to Cloud Run, making it scalable from day one.

## 🧠 What we learned
*   **Voice is the future of travel**: Text-based interfaces force you to look away from the world. Voice interfaces let you stay present.
*   **Latency matters more than quality**: In a conversation, speed is trust. Optimizing our backend for millisecond-level response times was crucial for the "companion" illusion.
*   **The power of Multi-Agent Systems**: Separating the "Navigator" (CityWalkAgent) from the "Storyteller" (StoryAgent) allowed us to optimize each for their specific tasks—one for logic/speed, and one for creativity/depth.

## 🔮 What's next for Sherpa
*   **AR Integration**: Overlaying the generated historical images onto the camera feed for a true Augmented Reality experience.
*   **Social Tours**: Allowing users to share their generated walking routes and "Sherpa Stories" with the community.
*   **Personalized Memory**: Making Sherpa remember your past trips ("Remember that cafe we loved in Paris? Find something like that here.").
