# backend/mock_engine.py
import asyncio, random, time
from datetime import datetime, timezone
from schemas import Sensors, Actuators, FarmTelemetry, Alert, Severity

# Shared state reference (will be updated by main.py)
SHARED_OVERRIDE = {
    "led_mode": "full",
    "fan": "off",
    "pump": "off",
    "mist": "off",
    "drama": None,  # Used for demo scenarios
    "autoMode": True,
    "valveN": False,
    "valveP": False,
    "valveK": False,
    "valveAcidic": False,
    "valveAlkaline": False,
}

SHARED_ACTIONS = []
ACTIVE_ALERTS = {}
ALERT_COOLDOWNS = {}
STATE_CHANGED_EVENT = asyncio.Event()
LATEST_CV_DATA = None

SIM_STATE = {
    "temp": 23.0,
    "ph": 6.2,
    "moisture": 50.0,
    "humidity": 60.0,
    "tank_level": 85.0,
    "nitrogen": 120.0,
    "phosphorus": 40.0,
    "potassium": 180.0,
}

def create_alert(
    alert_type: str,
    severity: str,
    message: str,
    action_required: bool = True,
    target: str = None,
    rack_id: int = None,
    shelf: int = None
) -> Alert:
    """Helper function to create properly formatted Alert objects"""
    alert_id = f"{alert_type}_{rack_id if rack_id else 'all'}_{shelf if shelf else 'all'}"
    
    return Alert(
        id=alert_id,
        severity=Severity.critical if severity == "critical" else Severity.warning,
        type=alert_type,
        message=message,
        actionRequired=action_required,
        resolved=False,
        timestamp=int(time.time() * 1000),  # Unix epoch milliseconds
        target=target,
        rackId=rack_id,
        shelf=shelf
    )

async def auto_clear_alert(alert_id: str, delay: int):
    await asyncio.sleep(delay)
    if alert_id in ACTIVE_ALERTS:
        ACTIVE_ALERTS.pop(alert_id, None)
        print(f"✅ Auto-cleared alert: {alert_id}")

async def telemetry_generator():
    while True:
        drama_type = SHARED_OVERRIDE.get("drama")
        try:
            with open("c:\\Users\\user\\Desktop\\My Files\\code\\3 hackathon\\UTMxHackathon_AuraFarm\\debug.log", "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now()}] TELEMETRY_TICK: drama={drama_type}, ph={SIM_STATE['ph']}, N={SIM_STATE['nitrogen']}, valveAlkaline={SHARED_OVERRIDE.get('valveAlkaline')}\n")
        except Exception as e:
            pass
        alerts = []
        # Collect and clear shared actions
        actions = list(SHARED_ACTIONS)        # Collect and clear shared actions
        actions = list(SHARED_ACTIONS)
        SHARED_ACTIONS.clear()
        
        # 1. Retrieve mode and overrides
        auto_mode = SHARED_OVERRIDE.get("autoMode", True)
        led_mode = SHARED_OVERRIDE.get("led_mode", "full")

        # 2. Automated Controller Closed-Loop Decision Matrix (if autoMode is active)
        if auto_mode:
            # Temperature regulation (target 21.0 - 24.0°C)
            if SIM_STATE["temp"] > 24.5:
                SHARED_OVERRIDE["fan"] = "on"
            elif SIM_STATE["temp"] <= 22.0:
                SHARED_OVERRIDE["fan"] = "off"
                
            # Soil moisture regulation (target 45% - 60%)
            if SIM_STATE["moisture"] < 45.0:
                SHARED_OVERRIDE["pump"] = "on"
            elif SIM_STATE["moisture"] >= 60.0:
                SHARED_OVERRIDE["pump"] = "off"
                
            # Relative humidity regulation (target 55% - 65%)
            if SIM_STATE["humidity"] < 55.0:
                SHARED_OVERRIDE["mist"] = "on"
            elif SIM_STATE["humidity"] >= 65.0:
                SHARED_OVERRIDE["mist"] = "off"

            # Hydroponic pH regulation (target 6.0 - 6.4)
            if SIM_STATE["ph"] > 6.4:
                SHARED_OVERRIDE["valveAcidic"] = True
                SHARED_OVERRIDE["valveAlkaline"] = False
            elif SIM_STATE["ph"] < 6.0:
                SHARED_OVERRIDE["valveAcidic"] = False
                SHARED_OVERRIDE["valveAlkaline"] = True
            else:
                SHARED_OVERRIDE["valveAcidic"] = False
                SHARED_OVERRIDE["valveAlkaline"] = False

            # Dosing Valves Regulation for Crop Nutrition (NPK)
            if SIM_STATE["nitrogen"] < 100.0:
                SHARED_OVERRIDE["valveN"] = True
            elif SIM_STATE["nitrogen"] >= 120.0:
                SHARED_OVERRIDE["valveN"] = False

            if SIM_STATE["phosphorus"] < 35.0:
                SHARED_OVERRIDE["valveP"] = True
            elif SIM_STATE["phosphorus"] >= 40.0:
                SHARED_OVERRIDE["valveP"] = False

            if SIM_STATE["potassium"] < 155.0:
                SHARED_OVERRIDE["valveK"] = True
            elif SIM_STATE["potassium"] >= 180.0:
                SHARED_OVERRIDE["valveK"] = False

        # 3. Retrieve resolved actuator baseline states
        if not auto_mode:
            fan_state = SHARED_OVERRIDE.get("fan", "off")
            mist_state = SHARED_OVERRIDE.get("mist", "off")
            current_pump = SHARED_OVERRIDE.get("pump", "off")
        else:
            fan_state = SHARED_OVERRIDE.get("fan", "off")
            mist_state = SHARED_OVERRIDE.get("mist", "off")
            current_pump = SHARED_OVERRIDE.get("pump", "off")
            
        # 4. Scenario-specific overrides
        if drama_type == "depletion":
            current_pump = "on"
        elif drama_type == "breach":
            fan_state = "on"
            mist_state = "on"
            current_pump = "on"
        elif drama_type == "failure":
            fan_state = "off"  # Fan is unresponsive

        # 5. Reservoir Drain Physics & Pump protection
        if drama_type == "depletion":
            SIM_STATE["tank_level"] = max(0.0, SIM_STATE["tank_level"] - 35.0)
        elif current_pump == "on":
            SIM_STATE["tank_level"] = max(0.0, SIM_STATE["tank_level"] - 0.5)

        # Dry-run protection
        if SIM_STATE["tank_level"] < 10.0:
            if current_pump == "on":
                actions.append("Alert: Dry-run protection active. Pump disabled.")
            current_pump = "off"

        # 6. Reservoir Alerts Trigger
        if SIM_STATE["tank_level"] <= 15.0:
            alert = create_alert(
                alert_type="resource_depletion",
                severity="critical",
                message="Water reservoir critical. Dry-run protection active. Refill required.",
                action_required=True,
                target="tank"
            )
            alerts.append(alert)

        # Auto-Resolve when refilled
        alert_id_depletion = "resource_depletion_all_all"
        if alert_id_depletion in ACTIVE_ALERTS and SIM_STATE["tank_level"] > 25.0:
            ACTIVE_ALERTS.pop(alert_id_depletion, None)
            actions.append(f"RESOLVE_ALERT:{alert_id_depletion}")

        # 7. Scenario overrides to Sensor readings (e.g. breach, failure, biological)
        if drama_type == "breach":
            SIM_STATE["temp"] = 38.0
            SIM_STATE["humidity"] = 90.0
            alert = create_alert(
                alert_type="environmental_breach",
                severity="critical",
                message="HVAC failure: Temperature and humidity beyond hardware compensation limits.",
                action_required=True,
                target="environment"
            )
            alerts.append(alert)
        elif drama_type == "failure":
            SIM_STATE["temp"] = 32.0
            SIM_STATE["humidity"] = 80.0
            alert = create_alert(
                alert_type="mechanical_failure",
                severity="critical",
                message="Hardware failure: Fan 1 unresponsive. Check fuse or motor.",
                action_required=True,
                target="fan"
            )
            alerts.append(alert)
        elif drama_type == "depletion":
            SIM_STATE["moisture"] = round(max(10.0, SIM_STATE["moisture"] - random.uniform(1.0, 3.0)), 1)
            SIM_STATE["ph"] = round(min(7.5, SIM_STATE["ph"] + random.uniform(0.05, 0.15)), 2)
        elif drama_type == "biological":
            alert = create_alert(
                alert_type="biological_threat",
                severity="critical",
                message="Leaf Rust detected on Rack 3. Prune and treat immediately.",
                action_required=True,
                target="rack",
                rack_id=3,
                shelf=0
            )
            alerts.append(alert)
        elif drama_type == "normal":
            # Normal recovery - reset all simulation variables instantly
            global LATEST_CV_DATA
            SIM_STATE["tank_level"] = 85.0
            SIM_STATE["temp"] = 23.0
            SIM_STATE["ph"] = 6.2
            SIM_STATE["moisture"] = 50.0
            SIM_STATE["humidity"] = 60.0
            SIM_STATE["nitrogen"] = 120.0
            SIM_STATE["phosphorus"] = 40.0
            SIM_STATE["potassium"] = 180.0
            ACTIVE_ALERTS.clear()
            LATEST_CV_DATA = None
            SHARED_OVERRIDE["drama"] = None  # Complete scenario
            SHARED_OVERRIDE["valveN"] = False
            SHARED_OVERRIDE["valveP"] = False
            SHARED_OVERRIDE["valveK"] = False
            SHARED_OVERRIDE["valveAcidic"] = False
            SHARED_OVERRIDE["valveAlkaline"] = False
        else:
            # --- HIGH FIDELITY PHYSICS FEEDBACK SIMULATOR ---
            # Handles natural drift AND response physics when actuators are on or off!
            
            # A. Temperature physics:
            # - If fan is ON: cools down toward 21.5°C
            # - If fan is OFF: heats up from grow lights towards 29.5°C
            t_current = SIM_STATE["temp"]
            if fan_state == "on":
                t_target = 21.5
                t_delta = -0.15
            else:
                t_target = 29.5
                t_delta = 0.1
            t_new = t_current + (t_target - t_current) * 0.04 + t_delta + random.uniform(-0.07, 0.07)
            SIM_STATE["temp"] = round(max(15.0, min(38.0, t_new)), 1)

            # B. Moisture physics:
            # - If pump is ON: moisture rises towards 75.0%
            # - If pump is OFF: moisture dries out towards 30.0%
            m_current = SIM_STATE["moisture"]
            if current_pump == "on":
                m_target = 75.0
                m_delta = 0.9
            else:
                m_target = 30.0
                m_delta = -0.2
            m_new = m_current + (m_target - m_current) * 0.04 + m_delta + random.uniform(-0.15, 0.15)
            SIM_STATE["moisture"] = round(max(10.0, min(90.0, m_new)), 1)

            # C. Humidity physics:
            # - If mist is ON: humidity rises towards 85.0%
            # - If mist is OFF: humidity dries towards 42.0%
            h_current = SIM_STATE["humidity"]
            if mist_state == "on":
                h_target = 85.0
                h_delta = 0.6
            else:
                h_target = 42.0
                h_delta = -0.3
            h_new = h_current + (h_target - h_current) * 0.04 + h_delta + random.uniform(-0.1, 0.1)
            SIM_STATE["humidity"] = round(max(25.0, min(95.0, h_new)), 1)

            # D. pH physics (only apply physics if NOT running the active "ph_drop" simulation sequence):
            # - If valveAcidic is ON: pH drops towards 5.4
            # - If valveAlkaline is ON: pH rises towards 7.2
            # - If both OFF: pH slowly drifts upwards towards 6.8
            if drama_type != "ph_drop":
                ph_current = SIM_STATE["ph"]
                if SHARED_OVERRIDE.get("valveAcidic", False):
                    ph_target = 5.4
                    ph_delta = -0.045
                elif SHARED_OVERRIDE.get("valveAlkaline", False):
                    ph_target = 7.2
                    ph_delta = 0.045
                else:
                    ph_target = 6.8
                    ph_delta = 0.005  # natural alkaline drift
                ph_new = ph_current + (ph_target - ph_current) * 0.03 + ph_delta + random.uniform(-0.005, 0.005)
                SIM_STATE["ph"] = round(max(4.2, min(8.8, ph_new)), 2)

            # E. Nutrient (N-P-K) physics (only apply physics if NOT running the specific nutrient depletion scenario sequence):
            # Nitrogen (N)
            if drama_type != "nitrogen_depletion":
                n_current = SIM_STATE["nitrogen"]
                if SHARED_OVERRIDE.get("valveN", False):
                    n_target = 125.0
                    n_delta = 1.25
                else:
                    n_target = 30.0
                    n_delta = -0.15  # continuous crop consumption
                n_new = n_current + (n_target - n_current) * 0.03 + n_delta
                SIM_STATE["nitrogen"] = round(max(20.0, min(150.0, n_new)), 1)

            # Phosphorus (P)
            if drama_type != "phosphorus_depletion":
                p_current = SIM_STATE["phosphorus"]
                if SHARED_OVERRIDE.get("valveP", False):
                    p_target = 42.0
                    p_delta = 0.5
                else:
                    p_target = 8.0
                    p_delta = -0.05
                p_new = p_current + (p_target - p_current) * 0.03 + p_delta
                SIM_STATE["phosphorus"] = round(max(5.0, min(55.0, p_new)), 1)

            # Potassium (K)
            if drama_type != "potassium_depletion":
                k_current = SIM_STATE["potassium"]
                if SHARED_OVERRIDE.get("valveK", False):
                    k_target = 185.0
                    k_delta = 1.75
                else:
                    k_target = 50.0
                    k_delta = -0.2
                k_new = k_current + (k_target - k_current) * 0.03 + k_delta
                SIM_STATE["potassium"] = round(max(30.0, min(220.0, k_new)), 1)

        # Auto-clear mechanical/environmental alerts after 60 seconds
        for alert in alerts:
            if hasattr(alert, "type") and alert.type in ['mechanical_failure', 'environmental_breach']:
                alert_id = alert.id
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(auto_clear_alert(alert_id, 60))
                except RuntimeError:
                    pass
            
        # Deduplication and Cooldown Logic
        new_alerts = []
        current_time = time.time()
        for alert in alerts:
            alert_id = alert.id if hasattr(alert, "id") else alert.get("id")
            
            # Check cooldown
            if alert_id in ALERT_COOLDOWNS:
                if current_time - ALERT_COOLDOWNS[alert_id] < 30:
                    continue
                else:
                    del ALERT_COOLDOWNS[alert_id]
            
            # Check active
            if alert_id not in ACTIVE_ALERTS:
                ACTIVE_ALERTS[alert_id] = alert
                new_alerts.append(alert)
                SHARED_ACTIONS.append(f"Alert: New critical issue - {alert.message if hasattr(alert, 'message') else alert.get('message')}")
        alerts = new_alerts
        
        # Actuator state setup
        actuators = Actuators(
            cooling_fan=fan_state,
            exhaust_fan=mist_state,
            water_pump=current_pump,  # Overridden by dry-run protection earlier if tank is empty
            led_intensity_pct=100 if led_mode != "off" else 0,
            valveN=SHARED_OVERRIDE.get("valveN", False),
            valveP=SHARED_OVERRIDE.get("valveP", False),
            valveK=SHARED_OVERRIDE.get("valveK", False),
            valveAcidic=SHARED_OVERRIDE.get("valveAcidic", False),
            valveAlkaline=SHARED_OVERRIDE.get("valveAlkaline", False),
        )
        
        telemetry = FarmTelemetry(
            sensors=Sensors(
                temperature_c=SIM_STATE["temp"],
                humidity_pct=SIM_STATE["humidity"],
                moisture_pct=SIM_STATE["moisture"],
                ph_level=SIM_STATE["ph"],
                ec_us_cm=round(850 + random.uniform(-50, 50)),
                light_lux=round(15000 + random.uniform(-2000, 2000)),
                tank_level_pct=round(SIM_STATE["tank_level"], 1),
                # Suppress noise during active nutrient scenarios so readings are clean and stable
                nitrogen_mg_l=round(SIM_STATE["nitrogen"] + (0 if drama_type == "nitrogen_depletion" else random.uniform(-2, 2)), 1),
                phosphorus_mg_l=round(SIM_STATE["phosphorus"] + (0 if drama_type == "phosphorus_depletion" else random.uniform(-1, 1)), 1),
                potassium_mg_l=round(SIM_STATE["potassium"] + (0 if drama_type == "potassium_depletion" else random.uniform(-3, 3)), 1)
            ),
            actuators=actuators
        )
        
        # Build payload with proper serialization
        payload_dict = {
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
            "message_type": "state_update",
            "farm_telemetry": telemetry.model_dump(),
            "led_mode": led_mode,
            "alerts": [
                alert.model_dump() if hasattr(alert, "model_dump") else alert 
                for alert in list(ACTIVE_ALERTS.values())
            ],  # Serialize Alert objects
            "actions": actions,
            "cv_data": LATEST_CV_DATA,
            "impact_metrics": {
                "water_saved_liters": round(12.4 + random.uniform(0, 0.5), 1),
                "energy_saved_kwh": round(0.8 + random.uniform(0, 0.2), 2),
                "cost_saved_my_r": round(15.2 + random.uniform(0, 1), 2)
            }
        }
        
        yield payload_dict
        try:
            await asyncio.wait_for(STATE_CHANGED_EVENT.wait(), timeout=2.0)
            STATE_CHANGED_EVENT.clear()  # Consume the event after waking
        except asyncio.TimeoutError:
            pass