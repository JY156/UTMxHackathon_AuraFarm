import asyncio, random
from datetime import datetime, timezone
from schemas import Sensors, Actuators, FarmTelemetry, WebSocketPayload, RedDotAlert, AlertType, Severity, ImpactMetrics

# Shared state reference (will be updated by main.py)
SHARED_OVERRIDE = {
    "led_mode": "full",
    "fan": None,
    "pump": None
}

async def telemetry_generator():
    temp = 23.0
    ph = 6.2
    moisture = 50.0
    
    while True:
        temp = round(max(18, min(32, temp + random.uniform(-0.4, 0.6))), 1)
        ph = round(max(5.5, min(7.0, ph + random.uniform(-0.08, 0.08))), 2)
        moisture = round(max(30, min(70, moisture + random.uniform(-2, 3))), 1)
        
        # Use SHARED_OVERRIDE if set, otherwise use auto-logic
        led_mode = SHARED_OVERRIDE["led_mode"]
        
        actuators = Actuators(
            cooling_fan="on" if temp > 26.0 else "off",
            exhaust_fan="on" if random.random() > 0.85 else "off",
            water_pump="on" if moisture < 45.0 else "off",
            led_intensity_pct=100 if led_mode != "off" else 0
        )
        
        telemetry = FarmTelemetry(
            sensors=Sensors(
                temperature_c=temp,
                humidity_pct=round(60 + random.uniform(-10, 10), 1),
                moisture_pct=moisture,
                ph_level=ph,
                ec_us_cm=round(850 + random.uniform(-50, 50)),
                light_lux=round(15000 + random.uniform(-2000, 2000))
            ),
            actuators=actuators
        )
        
        # Add custom field for LED mode to the payload (needed for the 3D sync)
        payload_dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_type": "state_update",
            "farm_telemetry": telemetry.model_dump(),
            "led_mode": led_mode, # Pass the current mode (full/purple/off)
            "red_dot_alerts": [],
            "impact_metrics": {
                "water_saved_liters": round(12.4 + random.uniform(0, 0.5), 1),
                "energy_saved_kwh": round(0.8 + random.uniform(0, 0.2), 2),
                "cost_saved_my_r": round(15.2 + random.uniform(0, 1), 2)
            }
        }
        
        yield payload_dict
        await asyncio.sleep(2)