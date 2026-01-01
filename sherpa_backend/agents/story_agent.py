
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
    # In-memory cache for generated stories (persists during server runtime)
    _story_cache = {}
    
    def __init__(self):
        # Initialize Vertex AI for both text and images
        # Ensure project is set (re-using context if already initialized, but explicit is safer for independence)
        vertexai.init(project=Config.GCP_PROJECT_ID, location="us-central1")
        
        # Initialize Text Model (Vertex AI)
        self.text_model = GenerativeModel(Config.TEXT_MODEL)
        
        try:
            # Initialize vertexai - using specific project ID provided by user
            # This ensures this feature works independently of global default credentials if they differ
            vertexai.init(project=Config.GCP_PROJECT_ID, location="us-central1") 
            self.image_model = ImageGenerationModel.from_pretrained(Config.IMAGE_GENERATION_MODEL)
            self.image_gen_available = True
            print(f"Vertex AI Image Generation initialized with model: {Config.IMAGE_GENERATION_MODEL}")
        except Exception as e:
            print(f"Warning: Vertex AI Image Generation init failed: {e}")
            self.image_gen_available = False

        self.tts = TTSManager()
    
    def _get_cache_key(self, monument_name):
        """Generate a cache key from monument name"""
        return "".join(x for x in monument_name if x.isalnum() or x in (' ', '_', '-')).strip().replace(' ', '_').lower()
        
    def _process_scene(self, scene, index, monument_name):
        """Process a single scene: Generate Audio and Image"""
        narration = scene.get('narration', '')
        image_prompt = scene.get('image_prompt', '')
        
        scene_result = {
            "text": narration,
            "scene_index": index
        }
        
        # Sanitize monument name for filenames (remove special chars)
        safe_name = "".join(x for x in monument_name if x.isalnum() or x in (' ', '_', '-')).strip().replace(' ', '_')
        
        # Generate Audio
        try:
            audio_path = self.tts.generate_audio(
                narration, 
                voice_id=Config.STORY_VOICE_ID
            )
            if audio_path:
                # Store absolute path usage or move if needed? 
                # TTS saves to audio_cache by default.
                # We need to ensure the filename is web-safe if we were naming it ourselves, 
                # but TTSManager handles naming. We just need the basename.
                scene_result["audio_url"] = f"/audio/{os.path.basename(audio_path)}"
        except Exception as e:
            print(f"Error generating audio for scene {index}: {e}")
        
        # Generate Image (only if configured and available)
        if self.image_gen_available and image_prompt:
            image_filename = f"story_{safe_name}_{index}.png"
            image_path = os.path.join("audio_cache", image_filename)
            
            # Check if image already exists on disk (disk cache)
            if os.path.exists(image_path):
                print(f"Image cache HIT for scene {index} - using existing image")
                scene_result["image_url"] = f"/audio/{image_filename}"
            else:
                print(f"Image cache MISS - generating image for scene {index}...")
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
                        images[0].save(location=image_path, include_generation_parameters=False)
                        scene_result["image_url"] = f"/audio/{image_filename}"
                        
                except Exception as e:
                    print(f"Error generating image for scene {index}: {e}")
        
        return scene_result

    def generate_story(self, monument_name, location_context):
        """
        Generates a story about the monument with caching for speed.
        Returns a list of scene objects: { text, audio_url, image_url }
        """
        
        # Check cache first for instant response
        cache_key = self._get_cache_key(monument_name)
        if cache_key in StoryAgent._story_cache:
            print(f"Cache HIT for {monument_name} - returning cached story")
            return StoryAgent._story_cache[cache_key]
        
        print(f"Cache MISS for {monument_name} - generating new story...")
        
        # 1. Generate Story Script
        prompt = f"""
        Create a vivid, storytelling narration about {monument_name} in {location_context}.
        It must be exactly {Config.STORY_IMAGE_COUNT} short scene(s).
        
        For the scene, describe: The essence and majesty of this place - why it was built, what makes it special, and why it's worth visiting. Create an emotional connection.
        
        The goal is to deeply persuade the user to visit by connecting them to its creation and its present-day majesty.
        Focus on emotion, grandeur, and human effort.
        
        For each scene, provide:
        1. 'narration': The text to be spoken (keep it under 50 words for impact).
        2. 'image_prompt': A detailed prompt to generate a photorealistic, cinematic image of the monument in its full glory.
        
        Output valid JSON format:
        [
            {{ "narration": "...", "image_prompt": "..." }}
        ]
        """
        
        print(f"Generating story script for {monument_name}...")
        try:
            response = self.text_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            scenes_data = json.loads(response.text)
        except Exception as e:
            print(f"Error generating story script: {e}")
            return []
            
        # 2. Process all scenes in parallel
        import concurrent.futures
        
        # Limit to 5 workers (one per scene usually)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Map the helper function to the data
            futures = [
                executor.submit(self._process_scene, scene, index, monument_name)
                for index, scene in enumerate(scenes_data)
            ]
            
            # Retrieve results as they complete (order matters for the list though)
            # We want to preserve order, so we iterate over futures in creation order
            final_scenes = []
            for future in futures:
                try:
                    final_scenes.append(future.result())
                except Exception as e:
                    print(f"Error processing scene future: {e}")
        
        # Cache the result for future requests
        StoryAgent._story_cache[cache_key] = final_scenes
        print(f"Cached story for {monument_name}")
            
        return final_scenes



