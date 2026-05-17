import os
import json
import asyncio
from schemas import FarmTelemetry, Sensors, Actuators
import mock_engine

# Flag to toggle between mock and real hardware. Default to True.
USE_MOCK = os.getenv("USE_MOCK_DATA", "True").lower() == "true"

class MQTTClient:
    def __init__(self):
        self.latest_payload = None
        self.client = None
        self._setup()
        
    def _setup(self):
        try:
            import paho.mqtt.client as mqtt
            self.client = mqtt.Client()
            self.client.on_connect = self.on_connect
            self.client.on_message = self.on_message
            # TODO: Uncomment for production hardware integration
            # self.client.connect("localhost", 1883, 60)
            # self.client.loop_start()
        except ImportError:
            print("⚠️ paho-mqtt not installed, MQTT Client disabled")

    def on_connect(self, client, userdata, flags, rc):
        print(f"🔌 MQTT Connected with result code {rc}")
        client.subscribe("aurafarm/+/sensors")

    def on_message(self, client, userdata, msg):
        try:
            # We receive raw hardware payloads and store the latest
            self.latest_payload = json.loads(msg.payload.decode())
            print(f"📥 MQTT: {self.latest_payload}")
        except Exception as e:
            print(f"❌ MQTT parse error: {e}")

    def fetch_latest(self):
        """Converts the latest hardware payload into our standardized app dictionary"""
        if not self.latest_payload:
            return None
            
        # Hardware transformation logic goes here. 
        # You'll map self.latest_payload fields -> expected app fields.
        # Below is a conceptual fallback.
        return {
            "message_type": "state_update",
            "farm_telemetry": {
                "sensors": {
                    "temperature_c": self.latest_payload.get("temp", 24.0),
                    # map other fields...
                },
                "actuators": {
                    # map actuators...
                }
            }
        }

mqtt_client = MQTTClient() if not USE_MOCK else None

class DataSource:
    """Central data abstraction separating simulation from hardware"""
    
    async def telemetry_stream(self):
        """Async generator yielding telemetry payloads for websockets"""
        if USE_MOCK:
            print("🌱 Using MOCK data source")
            # Directly yield the stream from our mock generator
            async for payload in mock_engine.telemetry_generator():
                yield payload
        else:
            print("📡 Using MQTT hardware data source")
            while True:
                # Poll the MQTT client for the latest hardware data
                payload = mqtt_client.fetch_latest()
                if payload:
                    yield payload
                await asyncio.sleep(2)  # Emit every 2 seconds
