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

# --- Local imports ---
from schemas import (
    Alert, Severity,
    CropSwitchPayload, CropSwitchResponse,
    ProcurementPayload, ProcurementResponse,
    LendingResponse, AllocationLedger, AllocationLedgerAllocation
)
import mock_engine
from mock_engine import SHARED_OVERRIDE, ACTIVE_ALERTS, ALERT_COOLDOWNS, STATE_CHANGED_EVENT
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

    print(f"🎬 Demo scenario triggered: {type}")
    try:
        with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now()}] TRIGGER_SCENARIO: type={type}\n")
    except Exception:
        pass
    
    # Clear previous drama
    SHARED_OVERRIDE["drama"] = type
    await asyncio.sleep(0.1)
    
    # Scenario-specific logic
    if type == "biological_threat":
        # Auto-load pre-analyzed CV response
        cv_result = DEMO_CV_CACHE.get("bacterial_leaf_spot", DEMO_CV_CACHE["healthy"])
        mock_engine.LATEST_CV_DATA = cv_result.copy()
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

    elif type == "ph_drop":
        async def run_ph_simulation():
            import mock_engine
            # Stage 1: pH Drop
            try:
                with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
                    f.write(f"[{datetime.now()}] run_ph_simulation: Starting drop to 4.8\n")
            except Exception:
                pass
            mock_engine.SIM_STATE["ph"] = 4.8
            mock_engine.SHARED_ACTIONS.append("Alert: pH dropped to 4.8! Alerting automation controller...")
            mock_engine.STATE_CHANGED_EVENT.set()
            
            # Stage 2: 6s later, activate pump
            await asyncio.sleep(6.0)
            drama_cur = mock_engine.SHARED_OVERRIDE.get("drama")
            try:
                with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
                    f.write(f"[{datetime.now()}] run_ph_simulation: Woke up after 6s. Active drama={drama_cur}\n")
            except Exception:
                pass
            if drama_cur != "ph_drop":
                try:
                    with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
                        f.write(f"[{datetime.now()}] run_ph_simulation: Interrupted/cancelled because drama={drama_cur}\n")
                except Exception:
                    pass
                return # Scenario reset/interrupted
            mock_engine.SHARED_OVERRIDE["valveAlkaline"] = True
            mock_engine.SHARED_ACTIONS.append("Dosing pump active: Injecting Alkaline buffer...")
            mock_engine.STATE_CHANGED_EVENT.set()
            
            # Smoothly recover pH over 6 seconds (12 steps of 0.5 seconds each)
            steps = 12
            for i in range(steps):
                await asyncio.sleep(0.5)
                drama_cur = mock_engine.SHARED_OVERRIDE.get("drama")
                if drama_cur != "ph_drop":
                    try:
                        with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
                            f.write(f"[{datetime.now()}] run_ph_simulation: Interrupted in drift step {i} because drama={drama_cur}\n")
                    except Exception:
                        pass
                    return # Scenario reset/interrupted
                mock_engine.SIM_STATE["ph"] = round(4.8 + (6.2 - 4.8) * (i + 1) / steps, 2)
                mock_engine.STATE_CHANGED_EVENT.set()
            
            # Stage 3: After it reaches 6.2, stabilize
            mock_engine.SHARED_OVERRIDE["valveAlkaline"] = False
            mock_engine.SHARED_ACTIONS.append("pH stabilized at 6.2! Number is normal.")
            try:
                with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
                    f.write(f"[{datetime.now()}] run_ph_simulation: Stabilized pH at 6.2 successfully.\n")
            except Exception:
                pass
            if mock_engine.SHARED_OVERRIDE.get("drama") == "ph_drop":
                mock_engine.SHARED_OVERRIDE["drama"] = None
            mock_engine.STATE_CHANGED_EVENT.set()

        asyncio.create_task(run_ph_simulation())

    elif type in ["nitrogen_depletion", "phosphorus_depletion", "potassium_depletion"]:
        nutrient = type.split("_")[0]  # nitrogen, phosphorus, potassium
        cap_name = nutrient.capitalize()
        cap_letter = "N" if nutrient == "nitrogen" else "P" if nutrient == "phosphorus" else "K"
        valve_key = "valveN" if nutrient == "nitrogen" else "valveP" if nutrient == "phosphorus" else "valveK"
        
        async def run_nutrient_simulation():
            import mock_engine
            # Set the initial low level for telemetry
            start_val = 45.0 if nutrient == "nitrogen" else 10.0 if nutrient == "phosphorus" else 60.0
            target_val = 120.0 if nutrient == "nitrogen" else 40.0 if nutrient == "phosphorus" else 180.0
            
            mock_engine.SIM_STATE[nutrient] = start_val
            
            # Stage 1: Depletion detected
            # Set deficiency in mock_engine.LATEST_CV_DATA
            if not mock_engine.LATEST_CV_DATA:
                mock_engine.LATEST_CV_DATA = {
                    "crop_type": "lettuce",
                    "overall_health": "healthy",
                    "growth_stage": "vegetative",
                    "nutrient_deficiencies": {
                        "nitrogen": {"detected": False, "confidence": 0, "severity_score": 0},
                        "phosphorus": {"detected": False, "confidence": 0, "severity_score": 0},
                        "potassium": {"detected": False, "confidence": 0, "severity_score": 0}
                    },
                    "diseases_detected": [],
                    "visual_symptoms": [],
                    "recommendations": []
                }
            
            mock_engine.LATEST_CV_DATA["nutrient_deficiencies"] = mock_engine.LATEST_CV_DATA.get("nutrient_deficiencies", {})
            mock_engine.LATEST_CV_DATA["nutrient_deficiencies"][nutrient] = {
                "detected": True,
                "confidence": 0.91,
                "severity_score": 0.85
            }
            mock_engine.SHARED_ACTIONS.append(f"Alert: Low {cap_name} levels detected!")
            mock_engine.STATE_CHANGED_EVENT.set()
            
            # Stage 2: 6s later, activate dosing pump
            await asyncio.sleep(6.0)
            if mock_engine.SHARED_OVERRIDE.get("drama") != type:
                return # Interrupted
            mock_engine.SHARED_OVERRIDE[valve_key] = True
            mock_engine.SHARED_ACTIONS.append(f"Dosing pump {cap_letter} active: Adding {cap_name if nutrient != 'nitrogen' else 'N'} solution...")
            mock_engine.STATE_CHANGED_EVENT.set()
            
            # Smoothly recover nutrient over 6 seconds (12 steps of 0.5 seconds each)
            steps = 12
            for i in range(steps):
                await asyncio.sleep(0.5)
                if mock_engine.SHARED_OVERRIDE.get("drama") != type:
                    return # Interrupted
                mock_engine.SIM_STATE[nutrient] = round(start_val + (target_val - start_val) * (i + 1) / steps, 1)
                mock_engine.STATE_CHANGED_EVENT.set()
            
            # Stage 3: After it reaches target, stabilize
            mock_engine.LATEST_CV_DATA["nutrient_deficiencies"][nutrient] = {
                "detected": False,
                "confidence": 0.99,
                "severity_score": 0
            }
            mock_engine.SHARED_OVERRIDE[valve_key] = False
            mock_engine.SHARED_ACTIONS.append(f"{cap_name} stabilized: Normal already! Veggies color restored.")
            if mock_engine.SHARED_OVERRIDE.get("drama") == type:
                mock_engine.SHARED_OVERRIDE["drama"] = None
            mock_engine.STATE_CHANGED_EVENT.set()
            
        asyncio.create_task(run_nutrient_simulation())

    SHARED_OVERRIDE["drama"] = type
    # Always fire the event so the generator wakes and picks up the new drama state.
    # The generator clears it after waking, so no race condition.
    STATE_CHANGED_EVENT.set()
    
    return {
        "status": "scenario_queued", 
        "scenario": type,
        "cv_auto_scanned": type == "biological_threat",
        "image_url": mock_engine.LATEST_CV_DATA.get("image_url") if mock_engine.LATEST_CV_DATA else None
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
        mock_engine.LATEST_CV_DATA = None
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
            
    STATE_CHANGED_EVENT.set()
    STATE_CHANGED_EVENT.clear()
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
        
    STATE_CHANGED_EVENT.set()
    STATE_CHANGED_EVENT.clear()
    return {"status": "success", "override": SHARED_OVERRIDE}

# --- Dynamic Web3 Ledger Allocation Helpers ---
def generate_allocation_ledger(crop: str) -> AllocationLedger:
    crop_upper = crop.upper()[:3]
    symbol = f"AURA-{crop_upper}"
    
    if crop == "lettuce":
        allocations = [
            AllocationLedgerAllocation(
                type="wholesale_distributor",
                entity="FAMA (Federal Agricultural Marketing Authority)",
                tokens=25000,
                use_case="Pre-harvest wholesale distribution",
                status="escrowed"
            ),
            AllocationLedgerAllocation(
                type="retail_partner",
                entity="Jaya Grocer (Klang Valley)",
                tokens=15000,
                use_case="Premium organic sales channel",
                status="locked"
            ),
            AllocationLedgerAllocation(
                type="institutional_lender",
                entity="Agrobank Malaysia",
                tokens=10000,
                use_case="Forward-purchase yield collateral",
                status="active"
            )
        ]
    elif crop == "basil":
        allocations = [
            AllocationLedgerAllocation(
                type="restaurant_consortium",
                entity="Malaysian F&B Association",
                tokens=30000,
                use_case="Direct farm-to-table culinary logistics",
                status="escrowed"
            ),
            AllocationLedgerAllocation(
                type="retail_partner",
                entity="Village Grocer",
                tokens=12000,
                use_case="Gourmet herb shelf allocations",
                status="locked"
            ),
            AllocationLedgerAllocation(
                type="export_escrow",
                entity="Singapore Agri-Food Logistics",
                tokens=8000,
                use_case="Cross-border premium supply lock",
                status="active"
            )
        ]
    else:  # tomato
        allocations = [
            AllocationLedgerAllocation(
                type="wholesale_distributor",
                entity="FAMA (Federal Agricultural Marketing Authority)",
                tokens=20000,
                use_case="National food security supply distribution",
                status="escrowed"
            ),
            AllocationLedgerAllocation(
                type="retail_partner",
                entity="AEON Supermarkets Malaysia",
                tokens=20000,
                use_case="Direct farm-fresh premium series placement",
                status="locked"
            ),
            AllocationLedgerAllocation(
                type="institutional_lender",
                entity="CIMB Islamic Agtech",
                tokens=10000,
                use_case="Shariah-compliant Murabahah supply lock",
                status="active"
            )
        ]
        
    return AllocationLedger(
        token_symbol=symbol,
        total_minted_tokens=50000,
        allocation_percentage=100,
        allocations=allocations,
        log_message=f"Smart contract minted {symbol} token supply for pre-harvest allocation on Arbitrum Sepolia."
    )

# --- AI Recommendation Endpoint ---
@app.get("/api/ai/recommend")
async def get_ai_recommendation():
    """
    Generates dynamic agronomy recommendation using Gemini 2.5 Flash
    incorporating active crop profile targets and live telemetry.
    """
    import random
    
    # Fetch active targets & current simulation values
    crop_id = mock_engine.ACTIVE_CROP_ID
    profiles = load_plant_profiles()
    crop_name = profiles.get(crop_id, {}).get("name", "Butterhead Lettuce")
    targets = mock_engine.get_active_crop_targets()
    
    current_temp = mock_engine.SIM_STATE["temp"]
    current_ph = mock_engine.SIM_STATE["ph"]
    current_moisture = mock_engine.SIM_STATE["moisture"]
    current_humidity = mock_engine.SIM_STATE["humidity"]
    current_n = mock_engine.SIM_STATE["nitrogen"]
    current_p = mock_engine.SIM_STATE["phosphorus"]
    current_k = mock_engine.SIM_STATE["potassium"]
    
    active_alerts_list = [alert.message for alert in mock_engine.ACTIVE_ALERTS.values()]
    alerts_str = ", ".join(active_alerts_list) if active_alerts_list else "None"
    
    drama_type = SHARED_OVERRIDE.get("drama")
    
    prompt = f"""
    You are an expert agronomist advising on a state-of-the-art vertical hydroponic farming system (AuraFarm) in Malaysia.
    
    Active Crop: {crop_name}
    
    Live Sensor Telemetry:
    - Temperature: {current_temp}°C (Target: {targets['temp_min']}°C - {targets['temp_max']}°C, Optimal: {targets['temp_optimal']}°C)
    - pH Level: {current_ph} (Target: {targets['ph_min']} - {targets['ph_max']}, Optimal: {targets['ph_optimal']})
    - Moisture: {current_moisture}% (Target: {targets['moisture_min']}% - {targets['moisture_max']}%, Optimal: {targets['moisture_optimal']}%)
    - Humidity: {current_humidity}% (Target: {targets['humidity_min']}% - {targets['humidity_max']}%, Optimal: {targets['humidity_optimal']}%)
    - N-P-K Levels (mg/L): N: {current_n} (Target: {targets['nitrogen_ppm']}), P: {current_p} (Target: {targets['phosphorus_ppm']}), K: {current_k} (Target: {targets['potassium_ppm']})
    
    Active System Alerts:
    {alerts_str}
    
    Active Demo Scenario:
    {drama_type if drama_type else 'Normal operation'}
    
    Task:
    Provide a highly realistic, concise (1-2 sentences) agronomic prescription and recommendations for the grower.
    Keep the tone highly professional, precise, and practical.
    If there are any alerts (e.g. nutrient depletion, environmental breach, pH drift), mention them directly and provide clear mitigation instructions matching the Malaysian context (referencing MARDI or local agrotech practices if appropriate).
    
    Your response must be clean text without any markdown or formatting.
    """
    
    # Fallback dynamic generator (if Gemini client is not initialized or fails)
    def generate_fallback_recommendation():
        if drama_type == "ph_drop" or current_ph < targets["ph_min"]:
            return f"Alert: pH has drifted below optimal range to {current_ph}. Dosing pump alkaline injection is active to restore equilibrium. Monitor EC closely to prevent nutrient lockout."
        elif drama_type == "nitrogen_depletion" or current_n < targets["nitrogen_ppm"] - 15:
            return f"Low Nitrogen ({current_n} mg/L) detected in nutrient loop. Automation controller has initiated dosing valve N; expect stabilization shortly. Ensure water temperature remains below 24°C for optimal uptake."
        elif drama_type == "phosphorus_depletion" or current_p < targets["phosphorus_ppm"] - 5:
            return f"Phosphorus deficiency alert: level at {current_p} mg/L. Automated P-dosing has been triggered. Ensure adequate root aeration is maintained to support healthy root expansion."
        elif drama_type == "potassium_depletion" or current_k < targets["potassium_ppm"] - 20:
            return f"Potassium depletion detected: current reading is {current_k} mg/L. Dosing valve K is open to stabilize the crop's cell walls. Ideal for ensuring robust stomatal conductance."
        elif drama_type == "biological" or "Rust" in alerts_str:
            return f"Critical Alert: Leaf Rust fungal spores detected on Rack 3. Immediate isolative pruning and organic biological treatment required. Lower room humidity slightly to inhibit spore propagation."
        elif drama_type == "depletion" or current_moisture < targets["moisture_min"]:
            return f"Emergency: Water reservoir low ({mock_engine.SIM_STATE['tank_level']}%). System dry-run protection has disabled water pumps to preserve hardware. Refill immediately."
        elif drama_type == "failure" or "failure" in alerts_str:
            return "Mechanical Failure: Fan 1 has stopped responding. Cooling loop compromised; check exhaust venting immediately to prevent local thermal spikes."
        elif drama_type == "breach" or "breach" in alerts_str:
            return f"Severe Environmental Breach: Ambient temperatures at {current_temp}°C exceed safe thresholds. Exhaust vents opened and grow lighting intensity reduced to cool the canopy."
        else:
            if crop_id == "lettuce":
                return f"Crop development is outstanding. Current microclimate ({current_temp}°C, pH {current_ph}) is in sweet spot for Butterhead Lettuce. Continue regular irrigation cycles and check root oxygenation."
            elif crop_id == "basil":
                return f"Sweet Basil is thriving under the {mock_engine.SHARED_OVERRIDE.get('led_mode', 'full')} spectrum. Current temperature of {current_temp}°C promotes volatile oils production. Maintain short watering pulses."
            else:  # tomato
                return f"Fruiting stage initialized for Cherry Tomato. Nutrient loop NPK ratios are aligned. Ensure LED spectrum is fully set to bloom profile to maximize flower-to-fruit conversion."

    if not gemini_client:
        print("⚠️ Gemini client not ready. Returning dynamic local prescription.")
        return {
            "text": generate_fallback_recommendation(),
            "confidence": 95 if not drama_type else 80,
            "context": f"Localized dynamic agronomist ruleset for {crop_name}"
        }
        
    try:
        response = gemini_client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )
        recommendation_text = response.text.strip()
        confidence = 92 if not drama_type else 85
        return {
            "text": recommendation_text,
            "confidence": confidence,
            "context": f"gemini-3.1-flash-lite agronomist evaluation for {crop_name}"
        }
    except Exception as e:
        print(f"⚠️ Gemini API failed during agronomist recommendation: {e}")
        return {
            "text": generate_fallback_recommendation(),
            "confidence": 88,
            "context": f"Fallback agronomist ruleset for {crop_name} (Gemini failed)"
        }

# --- Crop SWITCH Orchestration Endpoint ---
@app.post("/api/crop/switch", response_model=CropSwitchResponse)
async def switch_crop(payload: CropSwitchPayload):
    crop_id = payload.crop.lower()
    profiles = load_plant_profiles()
    if crop_id not in profiles:
        raise HTTPException(status_code=400, detail=f"Crop '{crop_id}' profile not found.")
    
    # 1. Update mock engine's active crop
    mock_engine.ACTIVE_CROP_ID = crop_id
    
    # 2. Trigger instant simulation re-alignment to new targets
    targets = mock_engine.get_active_crop_targets()
    mock_engine.SIM_STATE["temp"] = round(targets["temp_optimal"] + 1.2, 1)
    mock_engine.SIM_STATE["ph"] = round(targets["ph_optimal"] - 0.12, 2)
    mock_engine.SIM_STATE["moisture"] = round(targets["moisture_optimal"] - 4.5, 1)
    mock_engine.SIM_STATE["humidity"] = round(targets["humidity_optimal"] + 2.5, 1)
    mock_engine.SIM_STATE["nitrogen"] = round(targets["nitrogen_ppm"] - 12.0, 1)
    mock_engine.SIM_STATE["phosphorus"] = round(targets["phosphorus_ppm"] - 3.5, 1)
    mock_engine.SIM_STATE["potassium"] = round(targets["potassium_ppm"] - 18.0, 1)
    
    # Broadcast shifting presets message to Action center
    mock_engine.SHARED_ACTIONS.append(f"System: Orchestration profiles shifted to {profiles[crop_id]['name']}.")
    mock_engine.STATE_CHANGED_EVENT.set()
    mock_engine.STATE_CHANGED_EVENT.clear()
    
    ledger = generate_allocation_ledger(crop_id)
    
    log_msg = f"[MARDI Orchestration] Crop preset switched to {profiles[crop_id]['name']} (optimal temp: {targets['temp_min']}°C-{targets['temp_max']}°C, pH: {targets['ph_min']}-{targets['ph_max']}). Recalibrating dosing pumps & closed-loop HVAC thresholds."
    
    return CropSwitchResponse(
        profile=profiles[crop_id],
        log_message=log_msg,
        allocation_ledger=ledger
    )

# --- Web3 Blockchain Endpoints ---
@app.post("/api/blockchain/prebook-allocation", response_model=AllocationLedger)
async def prebook_allocation(payload: dict):
    crop = payload.get("crop", mock_engine.ACTIVE_CROP_ID).lower()
    return generate_allocation_ledger(crop)

@app.post("/api/blockchain/procure", response_model=ProcurementResponse)
async def procure_item(payload: ProcurementPayload):
    import random
    # For the hackathon demo, we use a real, validated transaction hash on Arbitrum Sepolia 
    # to ensure that clicking "Explorer" loads a live, successful transaction page on Arbiscan 
    # instead of a "Transaction Not Found" 404 error.
    tx_hash = "0x95d75352afcbe2fc1986b549ea86e4d396fe40c20a36201643a6da2302326b11"
    contract_address = "0x" + "".join(random.choices("0123456789abcdef", k=40))
    explorer_url = f"https://sepolia.arbiscan.io/tx/{tx_hash}"
    
    log_message = f"[Arbitrum Web3] Smart escrow contract successfully deployed at {contract_address[:10]}... for item '{payload.item_id}'. Locked MYR {payload.cost_myr:.2f}."
    
    mock_engine.SHARED_ACTIONS.append(f"Web3: Escrow contract deployed for item {payload.item_id}.")
    mock_engine.STATE_CHANGED_EVENT.set()
    mock_engine.STATE_CHANGED_EVENT.clear()
    
    return ProcurementResponse(
        status="success",
        tx_hash=tx_hash,
        contract_address=contract_address,
        log_message=log_message,
        supplier_notified=True,
        explorer_url=explorer_url
    )

@app.post("/api/blockchain/agro-lend", response_model=LendingResponse)
async def evaluate_agro_lend():
    active_alerts_count = len(mock_engine.ACTIVE_ALERTS)
    
    if active_alerts_count == 0:
        stability_score = 98.5
        credit_limit = 150000.00
        offer_name = "Agrobank Malaysia - Young Entrepreneur Agrotech Fund (Special Tier A)"
    elif active_alerts_count == 1:
        stability_score = 75.0
        credit_limit = 50000.00
        offer_name = "CIMB Islamic Agtech Micro-Financing Scheme"
    else:
        stability_score = 35.2
        credit_limit = 10000.00
        offer_name = "Agrobank Emergency Crop Micro-Lend"
        
    usdc_rate = 4.45
    usdc_eq = credit_limit / usdc_rate
    
    log_message = (
        f"[Agri-Underwriter] Underwriting audit complete. Stability Score: {stability_score}%. "
        f"Approved for {offer_name} with credit limit of RM {credit_limit:,.2f} ({usdc_eq:,.2f} USDC)."
    )
    
    return LendingResponse(
        status="approved" if stability_score > 50.0 else "conditional_approval",
        credit_limit_myr=credit_limit,
        usdc_equivalent=round(usdc_eq, 2),
        log_message=log_message
    )

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
        
        # Generate with Gemini 3.5 Flash
        response = gemini_client.models.generate_content(
            model="gemini-3.1-flash-lite",
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
    mock_engine.LATEST_CV_DATA = payload
    SHARED_OVERRIDE["cv_data"] = payload
    return {"status": "success", "message": "CV data ingested"}

# --- Auto-Scan Endpoint (Demo Flow) ---
@app.post("/api/demo/auto-scan")
async def auto_scan(
    rack_id: int = Form(default=3),
    shelf: int = Form(default=1),
    scenario: str = Form(default="bacterial_leaf_spot")
):
    # Get pre-analyzed response
    mock_cv = DEMO_CV_CACHE.get(scenario, DEMO_CV_CACHE["healthy"]).copy()
    
    # Store for WebSocket broadcast
    mock_engine.LATEST_CV_DATA = mock_cv
    
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
            if mock_engine.LATEST_CV_DATA:
                payload["cv_data"] = mock_engine.LATEST_CV_DATA
            
            if "alerts" not in payload:
                payload["alerts"] = []

            await ws.send_json(payload)
            
    except Exception as e:
        print(f"🔌 WebSocket Disconnected: {e}")

# --- Run Server ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)