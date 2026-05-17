# backend/main.py
from fastapi import FastAPI, WebSocket, Request, Form, UploadFile, File, HTTPException
import sys
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, List
import io
import google.generativeai as genai
from PIL import Image
from twilio.rest import Client
from schemas import WebSocketPayload
from mock_engine import SHARED_OVERRIDE, ACTIVE_ALERTS, ALERT_COOLDOWNS
from data_source import DataSource
import json
import time
import asyncio
import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

# --- Robust .env Loading ---
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# API Keys
groq_key = os.getenv("GROQ_API_KEY")
twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
twilio_token = os.getenv("TWILIO_AUTH_TOKEN")

# Initialize Clients
client_groq = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1") if groq_key else None
twilio_client = Client(twilio_sid, twilio_token) if twilio_sid and twilio_token else None

gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

if not groq_key: print("⚠️ GROQ_API_KEY missing")
if not twilio_client: print("⚠️ TWILIO credentials missing")
else: print("✅ All systems initialized.")

app = FastAPI(title="AuraFarm Backend")

PLANT_PROFILE_PATH = os.path.join(os.path.dirname(__file__), "plant_profiles.json")


def load_plant_profiles() -> dict[str, Any]:
    with open(PLANT_PROFILE_PATH, "r", encoding="utf-8") as file:
        return json.load(file)

# Allow Frontend to Connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
LATEST_STATE = {"temp": 24.0, "ph": 6.1, "moisture": 52.0, "status": "All systems nominal"}

@app.get("/")
def root(): return {"status": "🟢 Backend running"}

@app.post("/api/demo/scenario")
async def trigger_scenario(type: str):
    print(f"🎬 Demo scenario triggered: {type}")
    SHARED_OVERRIDE["drama"] = type
    
    return {"status": "scenario_queued", "scenario": type}

class AlertResolve(BaseModel):
    id: str

@app.post("/api/alert/resolve")
async def resolve_alert(payload: AlertResolve):
    if payload.id in ACTIVE_ALERTS:
        ACTIVE_ALERTS.remove(payload.id)
    # Add to cooldown
    ALERT_COOLDOWNS[payload.id] = time.time()
    
    # Check if resolving biological threat
    if payload.id.startswith("biological_threat"):
        if SHARED_OVERRIDE.get("drama") == "biological":
            SHARED_OVERRIDE["drama"] = None
            print("🎬 Biological threat resolved, returned to baseline.")
            
    # Check if resolving resource depletion (refill tank)
    if payload.id.startswith("resource_depletion"):
        import mock_engine
        mock_engine.SIM_STATE["tank_level"] = 85.0
        if SHARED_OVERRIDE.get("drama") == "depletion":
            SHARED_OVERRIDE["drama"] = None
        print("🎬 Tank refilled, resource depletion resolved.")
            
    return {"status": "success"}

class ControlPayload(BaseModel):
    actuator: str | None = None
    state: str | None = None
    led_mode: str | None = None
    autoMode: bool | None = None

@app.post("/api/control")
async def update_control(payload: ControlPayload):
    if payload.autoMode is not None:
        SHARED_OVERRIDE["autoMode"] = payload.autoMode
    
    if payload.actuator and payload.state:
        # Check if this clears a mechanical failure
        if payload.actuator == "fan" and SHARED_OVERRIDE.get("drama") == "failure":
            SHARED_OVERRIDE["drama"] = None
            print("🎬 Fan reset, mechanical failure resolved.")
        elif payload.actuator == "mist" and SHARED_OVERRIDE.get("drama") == "breach":
            SHARED_OVERRIDE["drama"] = None
            print("🎬 Mist activated, environmental breach resolved.")
            
        SHARED_OVERRIDE[payload.actuator] = payload.state
        
    if payload.led_mode:
        if payload.led_mode == "off" and SHARED_OVERRIDE.get("drama") == "breach":
            SHARED_OVERRIDE["drama"] = None
            print("🎬 LED reduced, environmental breach resolved.")
            
        SHARED_OVERRIDE["led_mode"] = payload.led_mode
        
    return {"status": "success", "override": SHARED_OVERRIDE}

@app.get("/api/ai/recommend")
async def get_ai_recommendation():
    # Return a mocked recommendation for now (could be wired up to Groq later)
    return {
        "text": "Increase calcium by 10% and keep irrigation in short pulses for steadier uptake. Current EC levels suggest nutrient imbalance—consider adjusting phosphorus ratio.",
        "confidence": 87,
        "context": "Based on current sensor readings and crop profile"
    }

class CropProfile(BaseModel):
    id: str
    name: str
    optimal_ph: list[float]
    optimal_temp: list[float]

@app.get("/api/profiles", response_model=List[CropProfile])
async def get_crop_profiles():
    """Returns optimal growing parameters for different crops"""
    profiles = load_plant_profiles()
    return [
        {
            "id": profile_id,
            "name": profile["name"],
            "optimal_ph": [
                profile["summary"]["ideal_conditions"]["ph_level"]["min"],
                profile["summary"]["ideal_conditions"]["ph_level"]["max"],
            ],
            "optimal_temp": [
                profile["summary"]["ideal_conditions"]["temperature_c"]["min"],
                profile["summary"]["ideal_conditions"]["temperature_c"]["max"],
            ],
        }
        for profile_id, profile in profiles.items()
    ]


@app.get("/api/profiles/full")
async def get_full_crop_profiles():
    """Returns the stage-by-stage crop truth tables used by the backend and AI."""
    return load_plant_profiles()

@app.post("/api/vision/analyze")
async def analyze_plant_vision(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    if not os.getenv("GEMINI_API_KEY"):
        # Mock response if no API key
        return {
            "disease": "Leaf Rust",
            "confidence": 0.92,
            "growth_stage": "vegetative",
            "nutrient_deficiency": "potassium"
        }
        
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = """
        Analyze this plant image and return a JSON object with exactly these fields:
        {
            "disease": "name of disease or null",
            "confidence": float between 0.0 and 1.0,
            "growth_stage": "seedling, vegetative, flowering, or harvest",
            "nutrient_deficiency": "name of deficiency or null"
        }
        Return ONLY valid JSON. Do not use Markdown formatting blocks.
        """
        response = model.generate_content([prompt, image])
        response_text = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(response_text)
    except Exception as e:
        print(f"Vision API Error: {e}")
        # Fallback to mock on error
        return {
            "disease": "Unknown",
            "confidence": 0.5,
            "growth_stage": "unknown",
            "nutrient_deficiency": None,
            "error": str(e)
        }

@app.post("/whatsapp")
async def whatsapp_webhook(
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(None), 
    NumMedia: int = Form(0), 
    MediaUrl0: str = Form(None),
    MediaContentType0: str = Form(None)
):
    print(f"📥 Message from: {From}")
    incoming_msg = (Body or "").lower()

    # 1. Voice Transcription
    if NumMedia > 0 and "audio" in (MediaContentType0 or ""):
        try:
            print("⏬ Downloading audio...")
            audio_response = requests.get(MediaUrl0, auth=(twilio_sid, twilio_token), timeout=10)
            with open("temp_voice.ogg", "wb") as f: f.write(audio_response.content)
            with open("temp_voice.ogg", "rb") as f:
                transcript = client_groq.audio.transcriptions.create(model="whisper-large-v3", file=("voice.ogg", f))
            incoming_msg = transcript.text.lower()
            print(f"✨ Voice: {incoming_msg}")
        except Exception as e:
            print(f"💥 Voice error: {e}")

    # 2. Command Logic
    reply_text = ""
    if "status" in incoming_msg:
        reply_text = (
            f"🌱 *AuraFarm Status Update*\n"
            f"🌡️ Temp: {LATEST_STATE['temp']}°C\n"
            f"🧪 pH: {LATEST_STATE['ph']}\n"
            f"💧 Moisture: {LATEST_STATE['moisture']}%\n"
            f"✅ Status: {LATEST_STATE['status']}"
        )
    elif any(word in incoming_msg for word in ["light", "led", "purple", "lamp"]):
        if "purple" in incoming_msg:
            SHARED_OVERRIDE["led_mode"] = "purple"
            LATEST_STATE["status"] = "Purple mode active"
            reply_text = "🟣 *Purple mode activated.*"
        elif "off" in incoming_msg:
            SHARED_OVERRIDE["led_mode"] = "off"
            LATEST_STATE["status"] = "Lights OFF"
            reply_text = "🌑 *Lights deactivated.*"
        else:
            SHARED_OVERRIDE["led_mode"] = "full"
            LATEST_STATE["status"] = "Full Spectrum active"
            reply_text = "💡 *Full Spectrum activated.*"
    else:
        reply_text = "👋 Hello Farmer! Try: *'Status'* or *'Purple lights'*."

    # 3. Direct Push Response (Most Reliable)
    if twilio_client and reply_text:
        try:
            print(f"📤 Pushing reply to {From}...")
            twilio_client.messages.create(
                body=reply_text,
                from_=To, # This is your Twilio WhatsApp number
                to=From   # This is your personal phone number
            )
            print("✅ Message pushed successfully!")
        except Exception as e:
            print(f"❌ Failed to push message: {e}")

    return Response(content="OK", media_type="text/plain")

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("🔌 WebSocket Connected")
    data_source = DataSource()
    try:
        async for payload in data_source.telemetry_stream():
            sensors = payload["farm_telemetry"]["sensors"]
            LATEST_STATE["temp"], LATEST_STATE["ph"], LATEST_STATE["moisture"] = sensors["temperature_c"], sensors["ph_level"], sensors["moisture_pct"]
            await ws.send_json(payload)
    except Exception as e:
        print(f"🔌 WebSocket Disconnected: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)