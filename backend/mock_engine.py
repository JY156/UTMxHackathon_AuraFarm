import asyncio, random
from datetime import datetime, timezone
from schemas import Sensors, Actuators, FarmTelemetry

# Shared state reference (will be updated by main.py)
SHARED_OVERRIDE = {
    "led_mode": "full",
    "fan": "off",
    "pump": "off",
    "mist": "off",
    "drama": None, # Used for demo scenarios
    "autoMode": True,
}

ACTIVE_ALERTS = set()
ALERT_COOLDOWNS = {}

SIM_STATE = {
    "temp": 23.0,
    "ph": 6.2,
    "moisture": 50.0,
    "humidity": 60.0,
    "tank_level": 85.0,
}

async def telemetry_generator():
    while True:
        drama_type = SHARED_OVERRIDE.get("drama")
        alerts = []
        actions = []
        
        # Calculate current pump logic early for tank drain physics
        auto_mode = SHARED_OVERRIDE.get("autoMode", True)
        if not auto_mode:
            current_pump = SHARED_OVERRIDE.get("pump", "off")
        else:
            current_pump = "on" if SIM_STATE["moisture"] < 45.0 else "off"
            if drama_type == "depletion":
                current_pump = "on"
            if drama_type == "breach":
                current_pump = "on"

        # 1. Drain Logic
        if drama_type == "depletion":
            SIM_STATE["tank_level"] = max(0.0, SIM_STATE["tank_level"] - 35.0)
        elif current_pump == "on":
            SIM_STATE["tank_level"] = max(0.0, SIM_STATE["tank_level"] - 0.5)

        # 2. Dry-Run Protection: Forcibly override the pump to OFF if level is too low
        if SIM_STATE["tank_level"] < 10.0:
            current_pump = "off"

        # 3. Dynamic Alert Trigger
        if SIM_STATE["tank_level"] <= 15.0:
            alerts.append({
                "severity": "critical",
                "type": "resource_depletion",
                "message": "Water reservoir critical. Dry-run protection active. Refill required.",
                "actionRequired": True,
                "target": "tank"
            })
            
        # 4. Auto-Resolve when refilled
        alert_id_depletion = "resource_depletion_all_all"
        if alert_id_depletion in ACTIVE_ALERTS and SIM_STATE["tank_level"] > 25.0:
            ACTIVE_ALERTS.remove(alert_id_depletion)
            actions.append(f"RESOLVE_ALERT:{alert_id_depletion}")
        
        if drama_type == "breach":
            # Instant spike to show immediate effect for pitching
            SIM_STATE["temp"] = 38.0
            SIM_STATE["humidity"] = 90.0
            alerts.append({
                "severity": "critical",
                "type": "environmental_breach",
                "message": "HVAC failure: Temperature and humidity beyond hardware compensation limits.",
                "actionRequired": True,
                "target": "environment"
            })
        elif drama_type == "failure":
            # Instant spike to show immediate effect for pitching
            SIM_STATE["temp"] = 32.0
            SIM_STATE["humidity"] = 80.0
            alerts.append({
                "severity": "critical",
                "type": "mechanical_failure",
                "message": "Hardware failure: Fan 1 unresponsive. Check fuse or motor.",
                "actionRequired": True,
                "target": "fan"
            })
        elif drama_type == "depletion":
            # Tank drains rapidly (handled above), but let's also drop moisture since pump is off due to dry-run
            SIM_STATE["moisture"] = round(max(10.0, SIM_STATE["moisture"] - random.uniform(1.0, 3.0)), 1)
            SIM_STATE["ph"] = round(min(7.5, SIM_STATE["ph"] + random.uniform(0.05, 0.15)), 2)
        elif drama_type == "biological":
            alerts.append({
                "severity": "critical",
                "type": "biological_threat",
                "message": "Leaf Rust / Aphids detected. Quarantine and treat immediately.",
                "actionRequired": True,
                "target": "rack",
                "rackId": 3,
                "shelf": 0
            })
        elif drama_type == "normal":
            # Normal recovery - reset tank to 85.0 directly as simulated manual refill
            SIM_STATE["tank_level"] = 85.0
            
            SIM_STATE["temp"] = round(max(18.0, min(32.0, SIM_STATE["temp"] + random.uniform(-0.4, 0.6))), 1)
            SIM_STATE["ph"] = round(max(5.5, min(7.0, SIM_STATE["ph"] + random.uniform(-0.08, 0.08))), 2)
            SIM_STATE["moisture"] = round(max(30.0, min(70.0, SIM_STATE["moisture"] + random.uniform(-2, 3))), 1)
            SIM_STATE["humidity"] = round(max(50.0, min(70.0, SIM_STATE["humidity"] + random.uniform(-2, 2))), 1)
                
            if random.random() > 0.98:
                alerts.append({
                    "severity": "info",
                    "type": "ec_drift",
                    "message": "EC trending upward. Watch for salt stress.",
                    "actionRequired": False
                })
        else:
            # When None, just do normal
            SIM_STATE["temp"] = round(max(18.0, min(32.0, SIM_STATE["temp"] + random.uniform(-0.4, 0.6))), 1)
            SIM_STATE["ph"] = round(max(5.5, min(7.0, SIM_STATE["ph"] + random.uniform(-0.08, 0.08))), 2)
            SIM_STATE["moisture"] = round(max(30.0, min(70.0, SIM_STATE["moisture"] + random.uniform(-2, 3))), 1)
            SIM_STATE["humidity"] = round(max(50.0, min(70.0, SIM_STATE["humidity"] + random.uniform(-2, 2))), 1)
                
        # Deduplication and Cooldown Logic
        new_alerts = []
        current_time = datetime.now(timezone.utc).timestamp()
        for alert in alerts:
            alert_id = f"{alert['type']}_{alert.get('rackId', 'all')}_{alert.get('shelf', 'all')}"
            
            # Check cooldown
            if alert_id in ALERT_COOLDOWNS:
                if current_time - ALERT_COOLDOWNS[alert_id] < 30:
                    continue
                else:
                    del ALERT_COOLDOWNS[alert_id]
            
            # Check active
            if alert_id not in ACTIVE_ALERTS:
                ACTIVE_ALERTS.add(alert_id)
                alert["id"] = alert_id
                new_alerts.append(alert)
        
        alerts = new_alerts
        
        # Actuator state setup based on drama
        led_mode = SHARED_OVERRIDE.get("led_mode", "full")
        
        # Determine baseline actuator states
        if not auto_mode:
            fan_state = SHARED_OVERRIDE.get("fan", "off")
            mist_state = SHARED_OVERRIDE.get("mist", "off")
        else:
            fan_state = "on" if SIM_STATE["temp"] > 26.0 else "off"
            mist_state = "on" if random.random() > 0.85 else "off"
            
        # Drama forces actuators ON regardless of auto_mode to show crisis
        if drama_type == "failure":
            fan_state = "on" # Fan is ON but broken (temp spikes)
        if drama_type == "breach":
            fan_state = "on"
            mist_state = "on"
            current_pump = "on" # Ensure pump is also running to try to compensate

        actuators = Actuators(
            cooling_fan=fan_state,
            exhaust_fan=mist_state,
            water_pump=current_pump, # Note: Overridden by dry-run protection earlier if tank is empty
            led_intensity_pct=100 if led_mode != "off" else 0
        )
        
        telemetry = FarmTelemetry(
            sensors=Sensors(
                temperature_c=SIM_STATE["temp"],
                humidity_pct=SIM_STATE["humidity"],
                moisture_pct=SIM_STATE["moisture"],
                ph_level=SIM_STATE["ph"],
                ec_us_cm=round(850 + random.uniform(-50, 50)),
                light_lux=round(15000 + random.uniform(-2000, 2000)),
                tank_level_pct=round(SIM_STATE["tank_level"], 1)
            ),
            actuators=actuators
        )
        
        payload_dict = {
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
            "message_type": "state_update",
            "farm_telemetry": telemetry.model_dump(),
            "led_mode": led_mode,
            "alerts": alerts,
            "actions": actions,
            "impact_metrics": {
                "water_saved_liters": round(12.4 + random.uniform(0, 0.5), 1),
                "energy_saved_kwh": round(0.8 + random.uniform(0, 0.2), 2),
                "cost_saved_my_r": round(15.2 + random.uniform(0, 1), 2)
            }
        }
        
        yield payload_dict
        await asyncio.sleep(2)