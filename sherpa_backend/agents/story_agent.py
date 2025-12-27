
import os
import json
import base64
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from vertexai.generative_models import GenerativeModel
from utils.config import Config
from utils.tts import TTSManager
from dotenv import load_dotenv

load_dotenv()

class StoryAgent:
    def __init__(self):
        # Initialize Vertex AI for both text and images
        # Ensure project is set (re-using context if already initialized, but explicit is safer for independence)
        vertexai.init(project="beaming-talent-396906", location="us-central1")
        
        # Initialize Text Model (Vertex AI)
        self.text_model = GenerativeModel(Config.TEXT_MODEL)
        
        try:
            # Initialize vertexai - using specific project ID provided by user
            # This ensures this feature works independently of global default credentials if they differ
            vertexai.init(project="beaming-talent-396906", location="us-central1") 
            self.image_model = ImageGenerationModel.from_pretrained(Config.IMAGE_GENERATION_MODEL)
            self.image_gen_available = True
            print(f"Vertex AI Image Generation initialized with model: {Config.IMAGE_GENERATION_MODEL}")
        except Exception as e:
            print(f"Warning: Vertex AI Image Generation init failed: {e}")
            self.image_gen_available = False

        self.tts = TTSManager()
        
    def generate_story(self, monument_name, location_context):
        """
        Generates a 5-scene story about the monument.
        Returns a list of scene objects: { text, audio_url, image_url, image_base64 }
        """
        
        # 1. Generate Story Script
        prompt = f"""
        Create a vivid, storytelling narration about {monument_name} in {location_context}.
        It must be exactly {Config.STORY_IMAGE_COUNT} short scenes (paragraphs).
        
        Structure the story to strictly follow this arc:
        Scene 1: "The Origin & Purpose". Describe HOW and WHY it was built. Mention the construction effort, the vision, or the historical need.
        Scene 2: "The Visitor Experience". Describe what it feels like to stand there today. Explain why it is an unmissable destination and worth the journey.
        
        The goal is to deeply persuade the user to visit by connecting them to its creation and its present-day majesty.
        Focus on emotion, grandeur, and human effort.
        
        For each scene, provide:
        1. 'narration': The text to be spoken (keep it under 40 words per scene for impact).
        2. 'image_prompt': A detailed prompt to generate a photorealistic, cinematic image corresponding to that specific angle (e.g., workers building it, or a wide shot of the finished marvel).
        
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
            
        return final_scenes



