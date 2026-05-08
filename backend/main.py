# backend/main.py
from fastapi import FastAPI, WebSocket, Request, Form
from fastapi.responses import JSONResponse, Response
from twilio.rest import Client
from schemas import WebSocketPayload
from mock_engine import telemetry_generator, SHARED_OVERRIDE
import json
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

if not groq_key: print("⚠️ GROQ_API_KEY missing")
if not twilio_client: print("⚠️ TWILIO credentials missing")
else: print("✅ All systems initialized.")

app = FastAPI(title="AuraFarm Backend")

# Global state
LATEST_STATE = {"temp": 24.0, "ph": 6.1, "moisture": 52.0, "status": "All systems nominal"}

@app.get("/")
def root(): return {"status": "🟢 Backend running"}

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
    try:
        async for payload in telemetry_generator():
            sensors = payload["farm_telemetry"]["sensors"]
            LATEST_STATE["temp"], LATEST_STATE["ph"], LATEST_STATE["moisture"] = sensors["temperature_c"], sensors["ph_level"], sensors["moisture_pct"]
            await ws.send_json(payload)
    except Exception: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)