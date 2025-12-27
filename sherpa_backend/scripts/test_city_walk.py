
import os
import sys
import unittest
import json
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.city_walk_agent import CityWalkAgent

# Mock classes to avoid importing from main.py
class City:
    def __init__(self, latitude, longitude, name):
        self.latitude = latitude
        self.longitude = longitude
        self.name = name
    def dict(self):
        return {"latitude": self.latitude, "longitude": self.longitude, "name": self.name}

class MetaData:
    def __init__(self, city, is_first_request):
        self.city = city
        self.is_first_request = is_first_request

class TestCityWalkAgent(unittest.TestCase):
    def setUp(self):
        load_dotenv()
        self.agent = CityWalkAgent()
        # Mock city data
        self.city_ny = City(latitude=40.7128, longitude=-74.0060, name="New York")
        self.metadata_ny = MetaData(city=self.city_ny, is_first_request=True)

    def test_language_detection(self):
        print("\n--- Testing Language Detection ---")
        lang = self.agent.language_detection("Hola, ¿cómo estás?")
        print(f"Detected: {lang}")
        # Expect Spanish or similar
        self.assertIn(lang.lower(), ["spanish", "español"], "Language detection failed for Spanish")

    def test_basic_answer(self):
        print("\n--- Testing Basic Answer (New York) ---")
        query = "What are the top 3 places to visit?"
        response = self.agent.answer(query, self.metadata_ny, first_request=True)
        
        print(f"Speech: {response.get('speech', '')[:100]}...")
        locations = response.get('locations', [])
        print(f"Locations found: {len(locations)}")
        
        self.assertIsNotNone(response)
        self.assertTrue(len(locations) > 0, "No locations returned")
        self.assertIn('speech', response)

    def test_preference_inference(self):
        print("\n--- Testing Preference Inference ---")
        # seed conversation
        self.agent.conversation = [
             {"role": "user", "content": "I love art museums and quiet cafes."},
             {"role": "assistant", "content": "Noted!"}
        ]
        prefs = self.agent.infer_user_preferences()
        print(f"Inferred Prefs: {prefs}")
        
        has_museum = any("museum" in like.lower() for like in prefs.get('likes', []))
        has_art = any("art" in like.lower() for like in prefs.get('likes', []))
        self.assertTrue(has_museum or has_art, "Failed to infer art/museum preference")

if __name__ == '__main__':
    unittest.main()
