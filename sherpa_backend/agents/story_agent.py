
import os
import json
import base64
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
import google.generativeai as genai
from utils.config import Config
from utils.tts import TTSManager
from dotenv import load_dotenv

load_dotenv()

class StoryAgent:
    def __init__(self):
        # Initialize Gemini for text
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.text_model = genai.GenerativeModel(Config.TEXT_MODEL)
        
        # Initialize Vertex AI for images (Imagen)
        # Note: Requires GOOGLE_APPLICATION_CREDENTIALS or gcloud auth to be set up in environment
        # If running locally with user credentials, it might just work if gcloud auth login was done.
        try:
            # We assume project is set in standard ways or via gcloud init
            # Initialize vertexai is often needed with location
            # vertexai.init(location="us-central1") # Common default
            # self.image_model = ImageGenerationModel.from_pretrained(Config.IMAGE_GENERATION_MODEL)
            self.image_gen_available = False # Temporarily disabled due to auth issues and deprecation warnings
            print("Vertex AI Image Generation disabled (using placeholders/mock).")
        except Exception as e:
            print(f"Warning: Vertex AI Image Generation init failed: {e}")
            self.image_gen_available = False

        self.tts = TTSManager()
        
    def generate_story(self, monument_name, location_context):
        """
        Generates a 5-scene story about the monument.
        Returns a list of scene objects: { text, audio_url, image_url, image_base64 }
        """
        
        # MOCK MODE check
        if Config.USE_MOCK_DATA:
            print(f"MOCK MODE ENABLED: Returning pre-generated story for {monument_name}")
            return self._get_mock_story(monument_name)

        # 1. Generate Story Script
        prompt = f"""
        Create a vivid, storytelling narration about {monument_name} in {location_context}.
        It should be exactly {Config.STORY_IMAGE_COUNT} short scenes (paragraphs).
        The goal is to make the user want to visit.
        Focus on history, emotions, and interesting facts.
        
        For each scene, provide:
        1. 'narration': The text to be spoken (keep it under 30 words per scene for pacing).
        2. 'image_prompt': A detailed prompt to generate a photorealistic, cinematic image for this scene.
        
        Output valid JSON format:
        [
            {{ "narration": "...", "image_prompt": "..." }},
            ...
        ]
        """
        
        print(f"Generating story script for {monument_name}...")
        try:
            response = self.text_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            scenes_data = json.loads(response.text)
        except Exception as e:
            print(f"Error generating story script: {e}")
            return []
            
        final_scenes = []
        
        # 2. Process each scene
        for index, scene in enumerate(scenes_data):
            narration = scene.get('narration', '')
            image_prompt = scene.get('image_prompt', '')
            
            scene_result = {
                "text": narration,
                "scene_index": index
            }
            
            # Generate Audio
            try:
                audio_path = self.tts.generate_audio(
                    narration, 
                    voice_id=Config.STORY_VOICE_ID
                )
                if audio_path:
                    # Conversion for frontend URL access (assuming backend mounts /audio)
                    scene_result["audio_url"] = f"/audio/{os.path.basename(audio_path)}"
            except Exception as e:
                print(f"Error generating audio for scene {index}: {e}")
            
            # Generate Image (only if configured and available)
            if self.image_gen_available and image_prompt:
                print(f"Generating image for scene {index}...")
                try:
                    # Generate 1 image per scene
                    images = self.image_model.generate_images(
                        prompt=image_prompt + ", photorealistic, cinematic lighting, high quality, 4k",
                        number_of_images=1,
                        language="en",
                        aspect_ratio="16:9",
                        safety_filter_level="block_some",
                        person_generation="allow_adult"
                    )
                    
                    if images:
                        # Convert to base64 for easy transport (or save to disk and serve URL)
                        # Saving to disk is better for caching, but for now we'll use base64 or save.
                        # Let's save to disk to be consistent with audio
                        
                        image_filename = f"story_{monument_name.replace(' ', '_')}_{index}.png"
                        image_path = os.path.join("audio_cache", image_filename) # Reusing audio_cache dir for simplicity or make new one
                        
                        images[0].save(location=image_path, include_generation_parameters=False)
                        scene_result["image_url"] = f"/audio/{image_filename}" # Serving from same static mount
                        
                except Exception as e:
                    print(f"Error generating image for scene {index}: {e}")
                    # Fallback or placeholder could be handled on frontend
            
            final_scenes.append(scene_result)
            

    def _get_mock_story(self, monument_name):
        """Returns a fixed 5-scene story for Taj Mahal (or generic fallback)"""
        # Hardcoded Taj Mahal story as requested
        scenes = [
             {
                "text": "The Taj Mahal, a symphony in white marble, stands as an eternal testament to Emperor Shah Jahan's undying love for his wife Mumtaz Mahal.",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/1200px-Taj_Mahal_%28Edited%29.jpeg" 
            },
           {
                "text": "Built over 22 years by 20,000 artisans, its pristine white marble was transported from Makrana, Rajasthan, by a fleet of 1,000 elephants.",
                "image_url": "https://whc.unesco.org/uploads/thumbs/site_0252_0008-750-750-20151104113424.jpg"
            },
            {
                "text": "As the sun rises, the marble changes color from soft pink to dazzling white, reflecting the changing moods of the Emperor's grief.",
                "image_url": "https://cdn.britannica.com/86/170586-050-AB7FE091/Taj-Mahal-Agra-India.jpg"
            },
             {
                "text": "The complex is perfectly symmetrical, except for one thing: Shah Jahan's cenotaph, placed beside Mumtaz's, breaking the symmetry in death as in life.",
                "image_url": "https://www.travelandleisure.com/thmb/wdUcyB5U4vB8Iu7g9m4c7a_0k4c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/taj-mahal-agra-india-TAJ0217-9eab8f20d11d439b901365cc1149f157.jpg"
            },
            {
                "text": "A visit to the Taj is not just a sightseeing tour; it is a pilgrimage to the heart of India's history and the world's greatest monument to love.",
                "image_url": "https://images.adsttc.com/media/images/5f38/5910/b357/655c/1500/0172/large_jpg/Taj_Mahal_Agra_India.jpg?1597532423"
            }
        ]
        
        final_scenes = []
        for index, scene in enumerate(scenes):
            scene_data = {
                "text": scene['text'],
                "scene_index": index,
                "image_url": scene.get('image_url') # Using public URLs for mock
            }
            
            # Generate Real Audio for the Mock Text (so it sounds good)
            try:
                 audio_path = self.tts.generate_audio(
                    scene['text'], 
                    voice_id=Config.STORY_VOICE_ID
                )
                 if audio_path:
                    scene_data["audio_url"] = f"/audio/{os.path.basename(audio_path)}"
            except Exception as e:
                print(f"Mock Audio Gen Error: {e}")
            
            final_scenes.append(scene_data)
            
        return final_scenes

