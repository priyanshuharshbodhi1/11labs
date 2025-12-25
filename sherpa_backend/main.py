from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from city_walk_agent import CityWalkAgent, CityWalkResponse

# 加载环境变量
load_dotenv()

# 设置OpenAI API密钥

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = CityWalkAgent()

class Landmark(BaseModel):
    name: str
    latitude: float
    longitude: float

class City(BaseModel):
    name: str
    latitude: float
    longitude: float

class MetaData(BaseModel):
    city: City
    is_first_request: bool

@app.get("/")
def read_root():
    return {"status": "Sherpa Backend Running With no errors"}

@app.post("/answer", response_model=CityWalkResponse)
async def answer(query: str, metadata: MetaData = None) -> CityWalkResponse:
    """
    调用CityWalkAgent回答问题
    """
    try:
        if metadata.is_first_request:
            agent.conversation_reset()
        response = agent.answer(query, metadata, metadata.is_first_request)
        
        # Ensure we got a valid response
        if response is None or not isinstance(response, dict):
            print(f"Agent returned invalid response: {response}")
            return {
                'locations': [],
                'speech': "I apologize, I'm having technical difficulties. Please try again."
            }
        
        return response
    except Exception as e:
        print(f"Error talking to agent: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return a valid response instead of HTTPException
        return {
            'locations': [],
            'speech': "I apologize, I'm experiencing some technical issues. Could you please try asking your question again?"
        }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)