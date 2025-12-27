
import os
import sys
import unittest
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.story_agent import StoryAgent
from utils.config import Config

class TestStoryFeature(unittest.TestCase):
    def setUp(self):
        load_dotenv()
        self.agent = StoryAgent()
        
    def test_generate_story(self):
        print("\n--- Testing Story Generation ---")
        monument = "Eiffel Tower"
        location = "Paris"
        
        print(f"Generating story for {monument} in {location}...")
        results = self.agent.generate_story(monument, location)
        
        self.assertIsNotNone(results, "Story generation returned None")
        self.assertTrue(len(results) > 0, "No scenes generated")
        self.assertEqual(len(results), Config.STORY_IMAGE_COUNT, f"Expected {Config.STORY_IMAGE_COUNT} scenes, got {len(results)}")
        
        for i, scene in enumerate(results):
            print(f"\nScene {i+1}:")
            print(f"  Text: {scene.get('text', 'N/A')[:50]}...")
            print(f"  Audio: {scene.get('audio_url', 'N/A')}")
            print(f"  Image: {scene.get('image_url', 'N/A')}")
            
            self.assertIn("text", scene)
            self.assertIn("audio_url", scene)
            
            # Image check - might be skipped if auth fails, but we expect it if configured
            if self.agent.image_gen_available:
                self.assertIn("image_url", scene, "Image URL missing despite image gen being available")
                
        print("\n--- Test Passed ---")

if __name__ == '__main__':
    unittest.main()
