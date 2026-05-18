from fastapi import FastAPI, WebSocket, Request, Form, UploadFile, File, HTTPException
import sys
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, List, Optional
import io
import json
import time
import asyncio
import os
from datetime import datetime, timedelta
import requests
from PIL import Image
from twilio.rest import Client
from openai import OpenAI
from dotenv import load_dotenv

# --- NEW: Google GenAI (replaces deprecated google.generativeai) ---
from google import genai
from google.genai import types

# --- Local imports ---
from schemas import WebSocketPayload, Alert, Severity
from mock_engine import SHARED_OVERRIDE, ACTIVE_ALERTS, ALERT_COOLDOWNS, LATEST_CV_DATA
from data_source import DataSource
from demo_cv_cache import DEMO_CV_CACHE  # ← Your pre-analyzed demo responses

# --- Robust .env Loading ---
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# --- API Keys ---
groq_key = os.getenv("GROQ_API_KEY")
twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
gemini_key = os.getenv("GEMINI_API_KEY")

# --- Initialize Clients ---
client_groq = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1") if groq_key else None
twilio_client = Client(twilio_sid, twilio_token) if twilio_sid and twilio_token else None

# Initialize Gemini client (NEW PACKAGE)
gemini_client = None
if gemini_key:
    try:
        gemini_client = genai.Client(api_key=gemini_key)
        print("✅ Gemini client initialized")
    except Exception as e:
        print(f"⚠️ Gemini init failed: {e}")

# Status checks
if not groq_key: print("⚠️ GROQ_API_KEY missing")
if not twilio_client: print("⚠️ TWILIO credentials missing")
else: print("✅ Twilio client initialized.")

app = FastAPI(title="AuraFarm Backend")

PLANT_PROFILE_PATH = os.path.join(os.path.dirname(__file__), "plant_profiles.json")

def load_plant_profiles() -> dict[str, Any]:
    try:
        with open(PLANT_PROFILE_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return {}

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State ---
LATEST_STATE = {
    "temp": 24.0, 
    "ph": 6.1, 
    "moisture": 52.0, 
    "status": "All systems nominal",
    "cv_data": None
}

# --- Root Endpoint ---
@app.get("/")
def root(): 
    return {"status": "🟢 Backend running", "gemini_ready": gemini_client is not None}

# --- Demo Scenario Trigger ---
@app.post("/api/demo/scenario")
async def trigger_scenario(type: str):
    """Triggers predefined drama scenarios for demo purposes"""

    global LATEST_CV_DATA

    print(f"🎬 Demo scenario triggered: {type}")
    
    # Clear previous drama
    SHARED_OVERRIDE["drama"] = None
    await asyncio.sleep(0.1)
    
    # Scenario-specific logic
    if type == "biological_threat":
        # Auto-load pre-analyzed CV response
        cv_result = DEMO_CV_CACHE.get("bacterial_leaf_spot", DEMO_CV_CACHE["healthy"])
        LATEST_CV_DATA = cv_result.copy()
        SHARED_OVERRIDE["cv_data"] = cv_result
        
        # Auto-create alert if disease detected
        for disease in cv_result.get("diseases_detected", []):
            if disease.get("confidence", 0) > 0.7:
                alert = Alert(
                    id=f"biological_threat_{int(time.time())}",
                    severity=Severity.critical if disease.get("severity") == "severe" else Severity.warning,
                    type="biological_threat",
                    message=f"{disease['name']} detected ({disease['confidence']*100:.0f}% confidence)",
                    actionRequired=True,
                    resolved=False,
                    timestamp=int(time.time() * 1000),
                    target="rack",
                    rackId=3,
                    shelf=1
                )
                ACTIVE_ALERTS[alert.id] = alert
                
                # Auto-send WhatsApp alert
                if twilio_client:
                    try:
                        alert_number = os.getenv("ALERT_WHATSAPP_NUMBER")
                        if alert_number:
                            twilio_client.messages.create(
                                body=f"🔴 ALERT: {alert.message}\nRack {alert.rackId}, Shelf {alert.shelf}",
                                from_=f"whatsapp:{os.getenv('TWILIO_WHATSAPP', '+14155238886')}",
                                to=f"whatsapp:{alert_number}"
                            )
                    except Exception as e:
                        print(f"⚠️ WhatsApp alert failed: {e}")
    
    elif type == "resource_depletion":
        import mock_engine
        mock_engine.SIM_STATE["tank_level"] = 8.0
        mock_engine.SIM_STATE["moisture"] = 12.0
        
    elif type == "mechanical_failure":
        import mock_engine
        mock_engine.SIM_STATE["temp"] = 32.0
        
    elif type == "environmental_breach":
        import mock_engine
        mock_engine.SIM_STATE["temp"] = 38.0
        mock_engine.SIM_STATE["humidity"] = 92.0
    
    SHARED_OVERRIDE["drama"] = type
    
    return {
        "status": "scenario_queued", 
        "scenario": type,
        "cv_auto_scanned": type == "biological_threat",
        "image_url": LATEST_CV_DATA.get("image_url") if LATEST_CV_DATA else None
    }

# --- Alert Resolution ---
class AlertResolve(BaseModel):
    id: str

@app.post("/api/alert/resolve")
async def resolve_alert(payload: AlertResolve):
    if payload.id in ACTIVE_ALERTS:
        ACTIVE_ALERTS.pop(payload.id, None)
    
    ALERT_COOLDOWNS[payload.id] = time.time()
    
    # Check if resolving biological threat
    if payload.id.startswith("biological_threat") or payload.id.startswith("auto_scan_") or payload.id.startswith("vision_"):
        if SHARED_OVERRIDE.get("drama") in ["biological", "biological_threat"]:
            SHARED_OVERRIDE["drama"] = None
            print("🎬 Biological threat resolved, returned to baseline.")
            
    # Check if resolving resource depletion
    if payload.id.startswith("resource_depletion"):
        import mock_engine
        mock_engine.SIM_STATE["tank_level"] = 85.0
        if SHARED_OVERRIDE.get("drama") in ["depletion", "resource_depletion"]:
            SHARED_OVERRIDE["drama"] = None
        print("🎬 Tank refilled, resource depletion resolved.")
            
    return {"status": "success"}

# --- Actuator Control ---
class ControlPayload(BaseModel):
    actuator: Optional[str] = None
    state: Optional[str] = None
    led_mode: Optional[str] = None
    autoMode: Optional[bool] = None

@app.post("/api/control")
async def update_control(payload: ControlPayload):
    if payload.autoMode is not None:
        SHARED_OVERRIDE["autoMode"] = payload.autoMode
    
    if payload.actuator and payload.state:
        # Check if this clears a mechanical failure
        if payload.actuator == "fan" and SHARED_OVERRIDE.get("drama") in ["failure", "mechanical_failure"]:
            SHARED_OVERRIDE["drama"] = None
            print("🎬 Fan reset, mechanical failure resolved.")
        elif payload.actuator == "mist" and SHARED_OVERRIDE.get("drama") in ["breach", "environmental_breach"]:
            SHARED_OVERRIDE["drama"] = None
            print("🎬 Mist activated, environmental breach resolved.")
            
        SHARED_OVERRIDE[payload.actuator] = payload.state
        
    if payload.led_mode:
        if payload.led_mode == "off" and SHARED_OVERRIDE.get("drama") in ["breach", "environmental_breach"]:
            SHARED_OVERRIDE["drama"] = None
            print("🎬 LED reduced, environmental breach resolved.")
        SHARED_OVERRIDE["led_mode"] = payload.led_mode
        
    return {"status": "success", "override": SHARED_OVERRIDE}

# --- AI Recommendation Endpoint ---
@app.get("/api/ai/recommend")
async def get_ai_recommendation():
    return {
        "text": "Increase calcium by 10% and keep irrigation in short pulses for steadier uptake. Current EC levels suggest nutrient imbalance—consider adjusting phosphorus ratio.",
        "confidence": 87,
        "context": "Based on current sensor readings and crop profile"
    }

# --- Crop Profiles Endpoints ---
class CropProfile(BaseModel):
    id: str
    name: str
    optimal_ph: list[float]
    optimal_temp: list[float]

@app.get("/api/profiles", response_model=List[CropProfile])
async def get_crop_profiles():
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
    return load_plant_profiles()

# --- Vision Analysis Endpoint (GEMINI 2.5 FLASH) ---
@app.post("/api/vision/analyze")
async def analyze_plant_vision(
    file: UploadFile = File(...),
    crop_type: str = Form(default="lettuce")
):
    """
    Analyzes plant image using Gemini Vision API.
    Returns structured JSON with disease/nutrient analysis.
    Falls back to demo cache if API fails.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Fallback response if API unavailable
    fallback_response = DEMO_CV_CACHE.get("bacterial_leaf_spot", {
        "crop_type": crop_type,
        "overall_health": "healthy",
        "growth_stage": "vegetative",
        "nutrient_deficiencies": {
            "nitrogen": {"detected": False, "confidence": 0.95, "severity_score": 0.05},
            "phosphorus": {"detected": False, "confidence": 0.93, "severity_score": 0.08},
            "potassium": {"detected": False, "confidence": 0.91, "severity_score": 0.10}
        },
        "diseases_detected": [],
        "visual_symptoms": [],
        "recommendations": ["Continue current care regimen"]
    })
    
    # If no Gemini key, return fallback immediately
    if not gemini_client:
        print("⚠️ No Gemini client, returning fallback")
        return fallback_response
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Multi-crop prompt
        prompt = f"""
        You are an agricultural AI expert analyzing {crop_type}.
        
        Return ONLY valid JSON with this exact structure:
        {{
            "crop_type": "{crop_type}",
            "overall_health": "healthy" | "stressed" | "diseased",
            "growth_stage": "seedling" | "vegetative" | "mature",
            "diseases_detected": [
                {{"name": "disease name", "confidence": 0.0-1.0, "severity": "mild"|"moderate"|"severe"}}
            ],
            "nutrient_deficiencies": {{
                "nitrogen": {{"detected": bool, "confidence": 0.0-1.0, "severity_score": 0.0-1.0}},
                "phosphorus": {{"detected": bool, "confidence": 0.0-1.0, "severity_score": 0.0-1.0}},
                "potassium": {{"detected": bool, "confidence": 0.0-1.0, "severity_score": 0.0-1.0}}
            }},
            "visual_symptoms": ["symptom 1", "symptom 2"],
            "recommendations": ["action 1", "action 2"]
        }}
        
        Common {crop_type} issues:
        - Bacterial: leaf spot, soft rot
        - Fungal: downy mildew, powdery mildew
        - Nutrient: nitrogen deficiency (yellowing), potassium deficiency (leaf edge burn)
        
        Only report if confidence >= 0.65.
        Return ONLY JSON, no markdown formatting.
        """
        
        # Generate with Gemini 2.5 Flash
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",  # ← Correct model name
            contents=[prompt, image]
        )
        
        # Clean and parse JSON response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        result = json.loads(response_text.strip())
        
        # Auto-trigger alert if disease detected with high confidence
        if result.get("diseases_detected"):
            for disease in result["diseases_detected"]:
                if disease.get("confidence", 0) > 0.7:
                    alert_id = f"vision_{disease['name'].lower().replace(' ', '_')}_{int(time.time())}"
                    alert = Alert(
                        id=alert_id,
                        severity=Severity.critical,
                        type="biological_threat",
                        message=f"{disease['name']} detected ({disease['confidence']*100:.0f}% confidence)",
                        actionRequired=True,
                        resolved=False,
                        timestamp=int(time.time() * 1000),
                        target="rack",
                        rackId=3,
                        shelf=1
                    )
                    ACTIVE_ALERTS[alert_id] = alert
                    print(f"🔔 Auto-alert created: {disease['name']}")
        
        return result
        
    except Exception as e:
        print(f"⚠️ Gemini API failed: {e}")
        # Return fallback to ensure demo never breaks
        return fallback_response

# --- Vision Webhook (for external CV systems) ---
@app.post("/api/vision/webhook")
async def vision_webhook(payload: dict):
    """Accepts pre-processed CV data from external systems"""
    global LATEST_CV_DATA
    LATEST_CV_DATA = payload
    SHARED_OVERRIDE["cv_data"] = payload
    return {"status": "success", "message": "CV data ingested"}

# --- Auto-Scan Endpoint (Demo Flow) ---
@app.post("/api/demo/auto-scan")
async def auto_scan(
    rack_id: int = Form(default=3),
    shelf: int = Form(default=1),
    scenario: str = Form(default="bacterial_leaf_spot")
):
    global LATEST_CV_DATA
    
    # Get pre-analyzed response
    mock_cv = DEMO_CV_CACHE.get(scenario, DEMO_CV_CACHE["healthy"]).copy()
    
    # Store for WebSocket broadcast
    LATEST_CV_DATA = mock_cv
    
    # Auto-create alert
    if mock_cv.get("overall_health") == "diseased":
        for disease in mock_cv.get("diseases_detected", []):
            if disease.get("confidence", 0) > 0.7:
                alert = Alert(
                    id=f"auto_scan_{int(time.time())}",
                    severity=Severity.critical,
                    type="biological_threat",
                    message=f"{disease['name']} detected ({disease['confidence']*100:.0f}% confidence)",
                    actionRequired=True,
                    resolved=False,
                    timestamp=int(time.time() * 1000),
                    target="rack",
                    rackId=rack_id,
                    shelf=shelf
                )
                ACTIVE_ALERTS[alert.id] = alert
    
    return mock_cv

# --- AI Insights Endpoint ---
@app.get("/api/ai/insights")
async def get_ai_insights():
    """Returns AI-generated insights for dashboard"""
    return {
        "growth_stage": "vegetative",
        "health_score": 85,
        "harvest_data": {
            "days_remaining": 14,
            "estimated_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        },
        "predicted_yield": {
            "value": 120,
            "unit": "kg"
        },
        "recommendations": [
            "Increase calcium by 10%",
            "Keep irrigation in short pulses",
            "Monitor for Leaf Rust given current humidity"
        ],
        "demand_analysis": {
            "peak_days": ["Friday", "Saturday"],
            "suggested_harvest_day": "Thursday",
            "revenue_estimate": "2400 MYR"
        }
    }

# --- WhatsApp Webhook ---
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

    # Voice transcription via Groq Whisper
    if NumMedia > 0 and "audio" in (MediaContentType0 or "") and client_groq:
        try:
            print("⏬ Downloading audio...")
            audio_response = requests.get(MediaUrl0, auth=(twilio_sid, twilio_token), timeout=10)
            with open("temp_voice.ogg", "wb") as f: 
                f.write(audio_response.content)
            with open("temp_voice.ogg", "rb") as f:
                transcript = client_groq.audio.transcriptions.create(
                    model="whisper-large-v3", 
                    file=("voice.ogg", f)
                )
            incoming_msg = transcript.text.lower()
            print(f"✨ Voice transcript: {incoming_msg}")
        except Exception as e:
            print(f"💥 Voice error: {e}")

    # Command logic
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
    elif "alert" in incoming_msg or "problem" in incoming_msg:
        if ACTIVE_ALERTS:
            reply_text = f"🔴 {len(ACTIVE_ALERTS)} active alert(s):\n"
            for alert_id in list(ACTIVE_ALERTS.keys())[:3]:
                reply_text += f"• {alert_id}\n"
        else:
            reply_text = "✅ No active alerts. All systems nominal."
    else:
        reply_text = "👋 Hello Farmer! Try: *'Status'*, *'Purple lights'*, or *'Alerts'*."

    # Send reply via Twilio
    if twilio_client and reply_text:
        try:
            print(f"📤 Pushing reply to {From}...")
            twilio_client.messages.create(
                body=reply_text,
                from_=To,
                to=From
            )
            print("✅ Message pushed successfully!")
        except Exception as e:
            print(f"❌ Failed to push message: {e}")

    return Response(content="OK", media_type="text/plain")

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("🔌 WebSocket Connected")
    
    data_source = DataSource()
    
    try:
        async for payload in data_source.telemetry_stream():
            # Update global state for WhatsApp/etc
            sensors = payload.get("farm_telemetry", {}).get("sensors", {})
            if sensors:
                LATEST_STATE["temp"] = sensors.get("temperature_c", LATEST_STATE["temp"])
                LATEST_STATE["ph"] = sensors.get("ph_level", LATEST_STATE["ph"])
                LATEST_STATE["moisture"] = sensors.get("moisture_pct", LATEST_STATE["moisture"])
            
            # Include CV data in payload
            if LATEST_CV_DATA:
                payload["cv_data"] = LATEST_CV_DATA
            
            if "alerts" not in payload:
                payload["alerts"] = []

            await ws.send_json(payload)
            
    except Exception as e:
        print(f"🔌 WebSocket Disconnected: {e}")

# --- Run Server ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)