import json
import pydantic
import requests
import time
import os
from typing import List, Optional
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from utils.tts import TTSManager
from utils.config import Config

load_dotenv()

def extract_json_from_response(text):
    """Extract JSON from response that might be wrapped in markdown code blocks"""
    if not text:
        return None
    
    # Remove markdown code blocks if present
    text = text.strip()
    
    # Check for ```json ... ``` or ``` ... ``` format
    if text.startswith('```'):
        # Find the actual JSON content
        lines = text.split('\n')
        # Remove first line (```json or ```)
        if lines[0].strip() in ['```json', '```']:
            lines = lines[1:]
        # Remove last line (```)
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        text = '\n'.join(lines)
    
    return text.strip()

def call_gemini(model, system_prompt, messages=None, temperature=0.7, max_tokens=4000):
    """Helper function to call Vertex AI Gemini with proper message formatting."""
    # Simple rate limiting for experimental models to avoid Quota Exceeded
    time.sleep(5)

    # Build the prompt combining system and messages
    prompt_parts = []
    
    if system_prompt:
        prompt_parts.append(system_prompt)
    
    if messages:
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                prompt_parts.append(f"User: {content}")
            elif role == 'assistant':
                prompt_parts.append(f"Assistant: {content}")
    
    full_prompt = "\n\n".join(prompt_parts)
    
    # Configure generation settings
    generation_config = GenerationConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    
    # Make the API call
    response = model.generate_content(
        full_prompt,
        generation_config=generation_config
    )
    
    return response.text


class Location(pydantic.BaseModel):
    latitude: float
    longitude: float
    displayName: str
    rating: float


class DisplayNames(pydantic.BaseModel):
    text: str
    languageCode: str


class CityWalkResponse(pydantic.BaseModel):
    locations: List[Location]
    speech: str
    audio_url: Optional[str] = None

class InformationSeeking(pydantic.BaseModel):
    prediction: bool
    location: str

poi = [
'tourist_attraction',
]

class Preferences(pydantic.BaseModel):
    likes: List[str]
    dislikes: List[str]
    age: str
    education: str
    profession: str
    visited: List[str]

class Language(pydantic.BaseModel):
    language: str

class Translation(pydantic.BaseModel):
    translated_text: str

class CityWalkAgent:
    def __init__(self):
        self.memory = {}
        self.language = "English"
        self.conversation = {}
        
        # Configure Vertex AI
        vertexai.init(project=Config.GCP_PROJECT_ID, location="us-central1")
        # Using Gemini 3 Flash Preview - Latest Dec 2025 model
        self.client = GenerativeModel(Config.TEXT_MODEL)
        self.tts = TTSManager()
        
        self.system_prompt =  {
            "role": "system",
            "content": """
            You are Sherpa, a multilingual professional Personal Tour Guide. 
            You are taking a visitor on a city walk.
            Your speech response should ALWAYS be in the language of {language}. 
            You will be provided with a list of information about the city and the visitor's interests.
            
            INPUT CONTEXT EXPLANATION:
            You will receive inputs containing:
            - "user_physical_location": The user's current GPS location.
            - "tour_search_location": The location used to search for landmarks.
            - "landmarks_for_tour_location": A list of landmarks found in the "tour_search_location".
            
            HANDLING LOCATION MISMATCHES:
            If "user_physical_location" is different from "tour_search_location":
            1. You MUST acknowledge this discrepancy in your speech.
            2. If the user's intent is ambiguous (e.g. "I want to tour" but vague), ask for clarification: 
               "I see you are in [Physical City], but asking about [Target City]. Do you want to plan a tour for [Target City]?"
            3. If the user's intent is clear (e.g. "I am moving to [Target City]"), you can proceed to provide the plan immediately, 
               but still acknowledge the context: "Since you are moving to [Target City] from [Physical City]..."

            You will need to use this information to answer the visitor's questions and provide them with a memorable experience.
            You should always ask some clarifying questions to understand the visitor's interests and preferences.
            Whenever you provide a recommendation, you must provide a list of locations and a speech response, locations shouldn't be too far from the starting point.
            Try your best to provide the list of locations that provide the best route for the visitor to take, so they don't have to backtrack.
            Since the visitor will be able to visualize on locations you are recommending, keep the your speech short, informative, and engaging; but the locations should be detailed and accurate. 
            Here are some examples of the types of responses you might provide:
            Make sure the tone is relaxed and friendly, some jokes or light-hearted comments are always welcome.
            
            for information seeking queries, you should provide about 5 sentences of information about the location, guide the visitor to ask more questions if they want to know more.

            ADDITIONAL INFORMATION:
            {additional_info}

            JSON example 1: location recommnedations:
            {{
                "locations": [
                    {{
                        "displayName": "Golden Gate Bridge",
                        "latitude": 37.8199,
                        "longitude": -122.4783,
                        "rating": 4.8
                    }},
                    {{
                        "displayName": "Fishermans Wharf",
                        "latitude": 37.8080,
                        "longitude": -122.4177,
                        "rating": 4.5
                    }},
                    {{
                        "displayName": "Alcatraz Island",
                        "latitude": 37.8267,
                        "longitude": -122.4230,
                        "rating": 4.7
                    }}
                ],
                "speech": "Based on your preferences, what about try talking a walk from Golden Gate Bridge to Alcatraz Island? it should take you about 2 hours and you will see some interesting places on the way."
            }}

            JSON example 2: clarifying questions: the goal is to get more information from the visitor to refine the recommendations
            {{
                "locations": [],
                "speech": "to get started, could you tell me a bit more about what you are interested in seeing? or how much time you would like to spent?"
            }}
            
            JSON examples 3: general information: providing information about the point of interest
            {{
                "locations": [],
                "speech": "Great Mall is built in 1992 and is the largest shopping mall in the city. It has over 200 stores and a food court with a variety of options."
            }}
            
            IMPORTANT: 
            - locations must ALWAYS be an array of objects with "displayName", "latitude", "longitude", and "rating" fields
            - displayName is the human-readable name of the place
            - latitude and longitude are decimal numbers (not strings)
            - rating is a decimal number from 0.0 to 5.0 (use 4.0 if unknown)
            - NEVER return locations as an array of strings like ["place1", "place2"]
            - NEVER use "name" field, always use "displayName"
            - Each location object must have exact coordinates
            - Return ONLY valid JSON, no additional text before or after

            JSON examples 4: greeting: greeting the visitor
            {{
                "locations": [],
                "speech": "Hello! I will help you explore the city and find the best places to visit. What would you like to see today?"
            }}

            JSON examples 5: revised recommendations: providing revised recommendations based on the visitor's feedback
            !important: make sure the revised recommendations are similar to the original recommendations, but with some changes based on the visitor's feedback
            !important: avoid making drastic changes to the recommendations
            {{
                "locations": ['location 1', 'location 2', 'location 3', ..., 'location N'], # it's important to keep the order of the locations similar to the original recommendations
                "speech": "Based on what your preferences, I think you would enjoy visiting location 1, location 2, and location N. Would you like to know more about these places?"
            }}

            JSON examples 7: location clarification:
            If the visitor's query mentions a city/location DIFFERENT from their current physical location (which you know from the context), you MUST ask for clarification before generating a plan.
            Example: User is in "Hyderabad" but asks "Plan a tour for Delhi".
            {{
                "locations": [],
                "speech": "I see you are currently in Hyderabad, but you asked for a tour of Delhi. Would you like me to plan a tour for Delhi, or would you like to explore Hyderabad first?"
            }}

                "speech": "Sure! Let's start over. What would you like to see today?"
            }}

            """
        }
        self.conversation = []

    def conversation_reset(self):
        self.conversation = []

        
    def get_wikipedia_article(self, query):
        try:
            # Step 1: Perform the search to get article snippets
            search_url = "https://en.wikipedia.org/w/api.php"
            search_params = {
                'action': 'query',
                'list': 'search',
                'srsearch': query,
                'format': 'json'
            }
            # Wikipedia requires a User-Agent
            headers = {
                'User-Agent': 'SherpaTourGuide/1.0 (contact@example.com)'
            }

            # Reduced timeout to 2.0s to avoid blocking the user experience too long
            search_response = requests.get(search_url, params=search_params, headers=headers, timeout=2.0)
            
            # Check if response is valid JSON
            try:
                search_data = search_response.json()
            except ValueError:
                print(f"Wikipedia search returned non-JSON response for '{query}'")
                return ""

            # Check if search results are available
            if search_data.get('query') and search_data['query'].get('search'):
                first_result = search_data['query']['search'][0]
                pageid = first_result['pageid']
                
                # Step 2: Retrieve the full article content using the pageid
                article_url = "https://en.wikipedia.org/w/api.php"
                article_params = {
                    'action': 'query',
                    'prop': 'extracts',
                    'pageids': pageid,
                    'explaintext': True,
                    'format': 'json',
                    'exintro': True, # Only get the intro to be faster/smaller
                }
                
                article_response = requests.get(article_url, params=article_params, headers=headers, timeout=2.0)
                article_data = article_response.json()
                
                # The extract is contained in the pages object, with the key as the pageid
                full_article = article_data['query']['pages'][str(pageid)].get('extract', '')
                return full_article
            else:
                return ""
        except Exception as e:
            # Silent fail or just print simple error to not clutter logs
            print(f"Wikipedia API skipped for '{query}': {e}")
            return ""



    def language_detection(self, query):
        # use the query to determine the language
        system_prompt = """
            You will be provided with the user query.
            based on the user query. Classify the language of the user query.

            return the language type in the following json format:
            {{
                "language": "language"
            }}

            USER QUERY:
            {query}
            
            IMPORTANT: Return ONLY valid JSON, no additional text.
        """

        response_text = call_gemini(
            model=self.client,
            system_prompt=system_prompt.format(query=query),
            messages=None,
            temperature=0.3,
            max_tokens=100
        )
        try:
            cleaned_text = extract_json_from_response(response_text)
            parsed = json.loads(cleaned_text)
            return parsed.get('language', 'English')
        except json.JSONDecodeError:
            print(f"Failed to parse language detection response: {response_text}")
            return "English"

    def get_nearby_landmarks(self, city):

        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': os.getenv('GOOGLE_API_KEY'),
            'X-Goog-FieldMask': 'places.displayName,places.location,places.rating',
        }

        json_data = {
            'includedTypes': [
                poi
            ],
            'maxResultCount': 20,
            'locationRestriction': {
                'circle': {
                    'center': {
                        'latitude': city['latitude'],
                        'longitude': city['longitude'],
                    },
                    'radius': 5000.0,
                },
            },
        }

        response = requests.post('https://places.googleapis.com/v1/places:searchNearby', headers=headers, json=json_data)
        if 'places' not in response.json():
            return []
        places = response.json()['places']
        # pop location and repopulate with values
        for place in places:
            location = place.pop('location')
            rating = place.pop('rating', 0)
            displayName = place.pop('displayName')
            place['location'] = location
            place['location']['displayName'] = displayName
            place['location']['rating'] = rating
        return places

    def detect_target_city(self, query):
        """Detect if user wants to tour a specific city from their query."""
        system_prompt = """
            You are a location extraction assistant. Analyze the user's query and extract ANY city or location they mention wanting to tour, visit, explore, or learn about.
            
            IMPORTANT: Be VERY aggressive about detecting locations. If the user mentions ANY city name (like Paris, Mumbai, Tokyo, New York, Hyderabad, Bangalore, London, etc.), extract it.
            
            Examples of queries that SHOULD return a city:
            - "I want to tour Hyderabad" -> "Hyderabad, India"
            - "Plan a trip to Mumbai" -> "Mumbai, India"  
            - "Show me places in Paris" -> "Paris, France"
            - "What can I see in Tokyo?" -> "Tokyo, Japan"
            - "Recommend places in New York" -> "New York, USA"
            - "I'm going to London" -> "London, UK"
            - "Tour Barcelona" -> "Barcelona, Spain"
            - "Explore Singapore" -> "Singapore"
            - "I want to visit Jaipur" -> "Jaipur, India"
            - "Places to see in Rome" -> "Rome, Italy"
            
            Only return is_target_city: false if:
            - The query is completely generic like "hello" or "hi"
            - The query asks about a specific monument without a city context
            - The query is a follow-up question about already-displayed places
            
            CONVERSATION HISTORY:
            {conversations}
            
            USER QUERY:
            {query}
            
            Return JSON:
            {{
                "is_target_city": true/false,
                "target_city": "City Name, Country" or null
            }}
            
            IMPORTANT: Return ONLY valid JSON, no additional text.
        """
        
        response_text = call_gemini(
            model=self.client,
            system_prompt=system_prompt.format(conversations=json.dumps(self.conversation), query=query),
            messages=None,
            temperature=0.3,
            max_tokens=200
        )
        try:
            cleaned_text = extract_json_from_response(response_text)
            parsed = json.loads(cleaned_text)
            result = {
                'is_different_city': parsed.get('is_target_city', False),
                'target_city': parsed.get('target_city', None)
            }
            print(f"[City Detection] Query: '{query}' -> Detected: {result}")
            return result
        except json.JSONDecodeError:
            print(f"Failed to parse target city detection response: {response_text}")
            return {'is_different_city': False, 'target_city': None}

    def get_city_coordinates(self, city_name):
        """Geocode a city name to get its latitude and longitude."""
        try:
            # Use Google Geocoding API
            params = {
                'address': city_name,
                'key': os.getenv('GOOGLE_API_KEY')
            }
            response = requests.get('https://maps.googleapis.com/maps/api/geocode/json', params=params, timeout=5)
            data = response.json()
            
            if data.get('status') == 'OK' and data.get('results'):
                location = data['results'][0]['geometry']['location']
                print(f"Geocoded '{city_name}' to: {location}")
                return {
                    'lat': location['lat'],
                    'lng': location['lng']
                }
            else:
                print(f"Geocoding failed for '{city_name}': {data.get('status')}")
                return None
        except Exception as e:
            print(f"Geocoding error for '{city_name}': {e}")
            return None
    
    def infer_user_preferences(self):
        # use the conversation to infer the user preferences
        system_prompt = """
            You are a professional Personal Tour Guide. You are taking a visitor on a city walk.
            You will be provided the entire conversation history between the visitor and the assistant.
            You will need to use this information to infer the visitor's interests and preferences.
            collect the information from the conversation history and provide a list of preferences.
            The preferences should be a list of strings that represent the visitor's interests.
            For example, if the visitor mentioned that they like museums, you should include "museum" in the list of preferences.
            If the visitor mentioned that they like to walk, you should include "walking" in the list of preferences.
            In case the visitor mentioned that they did something in the past, you should a short summary of the activity.
            For example, if the visitor mentioned that they visited a museum in the past, you should include "visited museum" in the list of preferences.
            In case the visitor mentions about their age, education, or profession, etc., you should include those information in the list of preferences.
            The visitor might express things like they are visiting new york and don't want to go times square, you should include "dislikes times square" in the list of preferences, as well as like to visit unique places/hidden gems.
            Make sure the extract preferences are based on explicit and clear, and avoid making assumptions.
            Preference should be predicted based only on what user said/query, not what user data provided. Locations listed in user turn shouldn't be included in preferences.
            When making recommendations, provide a very simple explanations for why you are recommending a particular location based on the inferred preferences.


            Here are some examples of the preferences you might infer:
            {{
                "likes": ["museums", "walking"],
                "dislikes": ["crowded places", "loud music"],
                "age": "30",
                "education": "PhD",
                "profession": "engineer",
                "visited": ["museum", "park", "restaurant"]
            }}

            CONVERSATION HISTORY:
            {conversations}
            
            IMPORTANT: Return ONLY valid JSON in the exact format shown above, no additional text.

        """
    
        system_turn = [{
            "role": "system",
            "content": system_prompt.format(conversations=json.dumps(self.conversation))
        }]

        response_text = call_gemini(
            model=self.client,
            system_prompt=system_prompt.format(conversations=json.dumps(self.conversation)),
            messages=None,
            temperature=0.5,
            max_tokens=2000
        )
        try:
            cleaned_text = extract_json_from_response(response_text)
            parsed = json.loads(cleaned_text)
            # Ensure all required fields exist
            return {
                'likes': parsed.get('likes', []),
                'dislikes': parsed.get('dislikes', []),
                'age': parsed.get('age', ''),
                'education': parsed.get('education', ''),
                'profession': parsed.get('profession', ''),
                'visited': parsed.get('visited', [])
            }
        except json.JSONDecodeError:
            print(f"Failed to parse preferences response: {response_text}")
            return {'likes': [], 'dislikes': [], 'age': '', 'education': '', 'profession': '', 'visited': []}

    def search_location(self, location_name):

        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': os.getenv('GOOGLE_API_KEY'),
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.priceLevel,places.id,places.reviews,places.generativeSummary',
        }

        json_data = {
            'textQuery': location_name,
        }

        response = requests.post('https://places.googleapis.com/v1/places:searchText', headers=headers, json=json_data)

        return response.json()['places'][0]



    def is_location_information_seeking(self, query):
        # use the query to determine if the user is seeking information

        system_prompt = """
            You will be provided with the user query and the conversation history between the visitor and the assistant.
            based on the last user query and the conversation history, you need to determine if the user is seeking information.
            if the user is seeking information about a specific location, you should return True, otherwise, return False.
            when true, you should also return the location name that the user is seeking information about if multiple locations are mentioned in the query, return the most specific location.
            Positive examples of the types of queries that the user might ask:
            - Tell me about the history of the city.
            - Introduction to the city.
            - Who lives in this place?
            - Tell me about place X in location Y.  #! important location X is the most specific location in the city so return location X

            Negative examples of the types of queries that the user might ask:
            - What are some interesting places to visit in the city?
            - Can you recommend some good restaurants in the city?
            - What are the best places to visit in the city?
        
            CONVERSATION HISTORY:
            {conversations}

            USER QUERY:
            {query}

            response in the following JSON format:
            {{
                "prediction": true,
                "location": "location name"
            }}
            OR
            {{
                "prediction": false,
                "location": null
            }}
            
            IMPORTANT: Return ONLY valid JSON, no additional text.
        """
        response_text = call_gemini(
            model=self.client,
            system_prompt=system_prompt.format(conversations=json.dumps(self.conversation), query=query),
            messages=None,
            temperature=0.3,
            max_tokens=500
        )
        try:
            cleaned_text = extract_json_from_response(response_text)
            parsed = json.loads(cleaned_text)
            return {
                'prediction': parsed.get('prediction', False),
                'location': parsed.get('location', None)
            }
        except json.JSONDecodeError:
            print(f"Failed to parse location seeking response: {response_text}")
            return {'prediction': False, 'location': None}

    def translate(self, text):
        # translate the text to the user language
        system_prompt = """
            You will be provided with the text that needs to be translated to the target language.
            Translate the text to the language of the user query.

            return the translated text in the following json format:
            {{
                "translated_text": "translated text"
            }}

            TARGET LANGUAGE:
            {target_language}

            TEXT TO TRANSLATE:
            {text}
            
            IMPORTANT: Return ONLY valid JSON, no additional text.
        """

        response_text = call_gemini(
            model=self.client,
            system_prompt=system_prompt.format(text=text, target_language=self.language),
            messages=None,
            temperature=0.3,
            max_tokens=500
        )
        try:
            cleaned_text = extract_json_from_response(response_text)
            parsed = json.loads(cleaned_text)
            return parsed.get('translated_text', text)
        except json.JSONDecodeError:
            print(f"Failed to parse translation response: {response_text}")
            return text


    def answer(self, query, metadata, first_request):
        if first_request:
            self.language = self.language_detection(query)
            # Reset conversation on first request to be safe
            self.conversation = [] 
        else:
            query = self.translate(query)
        
        city = metadata.city.dict()
        original_city = city.copy()
        
        # Detect City Change to clear context (Fix for "Stuck in Delhi" issue)
        # We store the last city name in self.memory or a new attribute
        current_city_name = city.get('name', '')
        last_city_name = getattr(self, 'last_city_name', '')
        
        # If city name changes significantly (and neither is empty), clear conversation history
        if current_city_name and last_city_name and current_city_name != last_city_name:
            print(f"City changed from {last_city_name} to {current_city_name}. Clearing conversation history.")
            self.conversation = []
            
        self.last_city_name = current_city_name

        # Detect if user wants to tour a different city than their current location
        target_city_info = self.detect_target_city(query)
        if target_city_info.get('is_different_city') and target_city_info.get('target_city'):
            target_city_name = target_city_info['target_city']
            print(f"[Location Override] User wants to tour: {target_city_name}")
            target_coords = self.get_city_coordinates(target_city_name)
            if target_coords:
                # Override city with target city coordinates for search
                city = {
                    'name': target_city_name,
                    'latitude': target_coords['lat'],
                    'longitude': target_coords['lng']
                }
                print(f"[Location Override] Successfully geocoded to: lat={city['latitude']}, lng={city['longitude']}")
            else:
                print(f"[Location Override] WARNING: Failed to geocode '{target_city_name}', using original location: {original_city}")
        else:
            print(f"[Location] Using map center location: {city.get('name', 'Unknown')}")

        # time to get the landmarks
        start = time.time()
        landmarks = self.get_nearby_landmarks(city)
        end = time.time()
        print(f"[Landmarks] Found {len(landmarks)} landmarks in {end-start:.2f}s for location: {city.get('name', 'Unknown')}")
        # time to get the response
        start = time.time()
        new_message = {
                "role": "user",
                "content": json.dumps({
                    "user_physical_location": original_city,
                    "tour_search_location": city,
                    "landmarks_for_tour_location": landmarks,
                    "new_query": query
                })
            }
        
        loc_info = self.is_location_information_seeking(query)

        additional_info = {}

        if loc_info['prediction']:
            location = loc_info['location']
            location_info = self.search_location(location)
            additional_info['location_info'] = {location: location_info}
            additional_info['location_info']['wikipedia'] = self.get_wikipedia_article(location)
        else:
            additional_info['general_info'] = {'wikipedia': self.get_wikipedia_article(query)}
        new_system_prompt = {
            "role": "system",
            "content": self.system_prompt['content']
        }
        new_system_prompt['content'] = new_system_prompt['content'].format(additional_info=json.dumps(additional_info), language=self.language)

            

        # Combine system prompt with conversation history and new message
        all_messages = self.conversation + [new_message]
        response_text = call_gemini(
            model=self.client,
            system_prompt=new_system_prompt['content'],
            messages=all_messages,
            temperature=0.7,
            max_tokens=4000
        )
        end = time.time()
        try:
            cleaned_text = extract_json_from_response(response_text)
            response = json.loads(cleaned_text)
            # Ensure response has required fields
            if 'locations' not in response:
                response['locations'] = []
            if 'speech' not in response:
                response['speech'] = "I apologize, I'm having trouble processing that request. Could you try asking again?"
        except json.JSONDecodeError:
            print(f"Failed to parse main agent response: {response_text}")
            response = {
                'locations': [],
                'speech': "I apologize, I'm having trouble processing that request. Could you try asking again?"
            }
        
        new_response = {
            "role": "assistant",
            "content": response['speech']
        }
        self.conversation.append(new_message)
        self.conversation.append(new_response)

        try:
            self.preferences = self.infer_user_preferences()
        except Exception as e:
            print(f"Failed to infer preferences: {e}")
            pass
        
        # Generate Audio with language-specific voice
        try:
            audio_path = self.tts.generate_audio(response['speech'], language=self.language)
            if audio_path:
                response['audio_url'] = f"/audio/{os.path.basename(audio_path)}"
        except Exception as e:
            print(f"Failed to generate audio: {e}")
            response['audio_url'] = None

        return response
    


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    agent = CityWalkAgent()
    landmarks = agent.get_nearby_landmarks(city={"latitude": 40.7128, "longitude": -74.0060})
    print(landmarks)
    from pydantic import BaseModel
    class City(BaseModel):
        latitude: float
        longitude: float
    class MetaData(BaseModel):
        city: City
        is_first_request: bool

    city = City(latitude=40.7128, longitude=-74.0060)
    metadata = MetaData(city=city, is_first_request=True)

    response = agent.answer("What are some interesting places to visit in New York?", metadata=metadata)
    print(response)