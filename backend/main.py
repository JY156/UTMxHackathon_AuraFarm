# backend/main.py
from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
from schemas import WebSocketPayload
from mock_engine import telemetry_generator
import json
import asyncio

app = FastAPI(title="AuraFarm Backend")

# Load plant profiles (the "recipe" for AI)
try:
    with open("plant_profiles.json", "r") as f:
        PLANT_PROFILES = json.load(f)
except FileNotFoundError:
    PLANT_PROFILES = {}

# ✅ Root endpoint - so you don't get 404
@app.get("/")
def root():
    return {
        "status": "🟢 Backend running",
        "docs": "http://localhost:8000/docs",
        "websocket": "ws://localhost:8000/ws",
        "plant_profiles": "http://localhost:8000/api/plant-profiles"
    }

# ✅ Plant profiles endpoint for AI Agronomist
@app.get("/api/plant-profiles")
def get_plant_profiles():
    return JSONResponse(content=PLANT_PROFILES)

# ✅ WebSocket endpoint for real-time telemetry
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        async for payload in telemetry_generator():
            # Convert Pydantic → JSON-serializable dict
            await ws.send_json(payload.model_dump(mode="json"))
    except Exception as e:
        print(f"WebSocket disconnected: {e}")
        pass  # Client disconnected - normal during dev

# ✅ Health check for frontend polling (optional backup)
@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": asyncio.get_event_loop().time()}

if __name__ == "__main__":
    import uvicorn
    # host="0.0.0.0" allows external connections (for demo/testing)
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)