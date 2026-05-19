# backend/run_simulation.py
import asyncio
import os
import sys
import mock_engine

# Force UTF-8 encoding for clean Unicode graphics
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

async def main():
    print("🚀 Starting Standalone AuraFarm Telemetry Simulation...")
    print("Press Ctrl+C to stop.\n")
    await asyncio.sleep(1)

    try:
        # Consume the async telemetry generator from the mock engine
        async for payload in mock_engine.telemetry_generator():
            # Clear console for live-updating dashboard feel
            os.system('cls' if os.name == 'nt' else 'clear')
            
            timestamp = payload.get("timestamp", 0)
            telemetry = payload.get("farm_telemetry", {})
            sensors = telemetry.get("sensors", {})
            actuators = telemetry.get("actuators", {})
            alerts = payload.get("alerts", [])
            cv_data = payload.get("cv_data")
            
            print("┌────────────────────────────────────────────────────────┐")
            print("│            🌱  AURAFARM LIVE SIMULATOR DASHBOARD       │")
            print("└────────────────────────────────────────────────────────┘")
            print(f"  [Time] {mock_engine.datetime.fromtimestamp(timestamp/1000).strftime('%Y-%m-%d %I:%M:%S %p')}")
            print(f"  [Mode] {'🟢 Automated Mode' if mock_engine.SHARED_OVERRIDE.get('autoMode') else '🟡 Manual Override Mode'}")
            print(f"  [Active Drama] {mock_engine.SHARED_OVERRIDE.get('drama') or '🟢 Nominal Baseline'}")
            print("──────────────────────────────────────────────────────────")
            
            print("  📊 SENSORS:")
            print(f"    🌡️  Temperature : {sensors.get('temperature_c', 0.0):>5}°C")
            print(f"    💧  Humidity    : {sensors.get('humidity_pct', 0.0):>5}%")
            print(f"    🌾  Moisture    : {sensors.get('moisture_pct', 0.0):>5}%")
            print(f"    🧪  pH Level    : {sensors.get('ph_level', 0.0):>5}")
            print(f"    ⚡  EC Level    : {sensors.get('ec_us_cm', 0):>5} µS/cm")
            print(f"    🛢️  Tank Level  : {sensors.get('tank_level_pct', 0.0):>5}%")
            print(f"    [NPK Ratio]     : N: {sensors.get('nitrogen_mg_l', 0.0)} | P: {sensors.get('phosphorus_mg_l', 0.0)} | K: {sensors.get('potassium_mg_l', 0.0)}")
            print("──────────────────────────────────────────────────────────")
            
            print("  ⚙️  ACTUATORS:")
            print(f"    🌬️  Cooling Fan  : {'🟢 ON' if actuators.get('cooling_fan') == 'on' else '🔴 OFF'}")
            print(f"    💨  Mister Fan   : {'🟢 ON' if actuators.get('exhaust_fan') == 'on' else '🔴 OFF'}")
            print(f"    🔌  Water Pump   : {'🟢 ON' if actuators.get('water_pump') == 'on' else '🔴 OFF'}")
            print(f"    💡  LED Lights   : {mock_engine.SHARED_OVERRIDE.get('led_mode').upper()} ({actuators.get('led_intensity_pct')}% Power)")
            print("──────────────────────────────────────────────────────────")
            
            print("  🚨 ACTIVE TACTICAL ALERTS:")
            if alerts:
                for alert in alerts:
                    severity_tag = "🔴 CRITICAL" if alert.get("severity") == "critical" else "🟡 WARNING"
                    print(f"    • [{severity_tag}] {alert.get('message')}")
            else:
                print("    🟢 All systems nominal. No active alerts.")
            print("──────────────────────────────────────────────────────────")
            
            if cv_data:
                print("  📸 LATEST VISION CV RESULT:")
                print(f"    Health Status : {cv_data.get('overall_health', 'unknown').upper()}")
                print(f"    Growth Stage  : {cv_data.get('growth_stage', 'unknown').upper()}")
                if cv_data.get("diseases_detected"):
                    print(f"    Detected      : {cv_data['diseases_detected'][0]['name']} ({cv_data['diseases_detected'][0]['confidence']*100:.0f}% confidence)")
            
            print("└────────────────────────────────────────────────────────┘")
            print("\n  Tip: You can trigger events via the React frontend debug panel!")
            
    except KeyboardInterrupt:
        print("\n👋 Simulation stopped by user.")

if __name__ == "__main__":
    asyncio.run(main())
