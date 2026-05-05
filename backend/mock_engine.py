import asyncio, random
from datetime import datetime, timezone
from schemas import Sensors, Actuators, FarmTelemetry, WebSocketPayload, RedDotAlert, AlertType, Severity, ImpactMetrics

async def telemetry_generator():
    # Start with realistic baseline values for lettuce
    temp = 23.0
    ph = 6.2
    moisture = 50.0
    
    while True:
        # Realistic sensor drift (random walk)
        temp = round(max(18, min(32, temp + random.uniform(-0.4, 0.6))), 1)  # Clamp 18-32°C
        ph = round(max(5.5, min(7.0, ph + random.uniform(-0.08, 0.08))), 2)  # Clamp 5.5-7.0
        moisture = round(max(30, min(70, moisture + random.uniform(-2, 3))), 1)  # Clamp 30-70%
        
        # Rule-based actuator logic
        actuators = Actuators(
            cooling_fan="on" if temp > 26.0 else "off",
            exhaust_fan="on" if random.random() > 0.85 else "off",  # Simulate periodic air exchange
            water_pump="on" if moisture < 45.0 else "off",
            led_intensity_pct=80 if 6 <= datetime.now().hour < 20 else 20  # Day/night cycle
        )
        
        # ✅ CORRECT: Nest sensors + actuators inside FarmTelemetry
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
        
        # Optional: Inject Red Dot alerts for demo (Phase 3)
        alerts = []
        # Example: Mechanical failure scenario
        if temp > 28.0 and actuators.cooling_fan == "on" and random.random() > 0.95:
            alerts.append(RedDotAlert(
                alert_id=f"alert_{datetime.now().timestamp()}",
                type=AlertType.mechanical_failure,
                severity=Severity.critical,
                component="cooling_fan",
                message=f"Temp {temp}°C > 28°C despite fan ON. Hardware unresponsive.",
                requires_human_action=True
            ))
        
        payload = WebSocketPayload(
            timestamp=datetime.now(timezone.utc),
            message_type="state_update",
            farm_telemetry=telemetry,  # ← Now properly nested!
            red_dot_alerts=alerts,
            ai_agronomist=None,  # Will be populated by AI endpoint later
            impact_metrics=ImpactMetrics(
                water_saved_liters=round(12.4 + random.uniform(0, 0.5), 1),
                energy_saved_kwh=round(0.8 + random.uniform(0, 0.2), 2),
                cost_saved_my_r=round(15.2 + random.uniform(0, 1), 2)
            )
        )
        
        yield payload
        await asyncio.sleep(2)  # 2-second update interval