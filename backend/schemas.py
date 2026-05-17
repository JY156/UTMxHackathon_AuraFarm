from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AlertType(str, Enum):
    resource_depletion = "resource_depletion"
    mechanical_failure = "mechanical_failure"
    biological_threat = "biological_threat"
    critical_breach = "critical_breach"

class Severity(str, Enum):
    warning = "warning"
    critical = "critical"

# ✅ NEW: Sensors model (unchanged)
class Sensors(BaseModel):
    temperature_c: float
    humidity_pct: float
    moisture_pct: float
    ph_level: float
    ec_us_cm: float
    light_lux: float
    tank_level_pct: float

# ✅ NEW: Actuators model (unchanged)
class Actuators(BaseModel):
    cooling_fan: str = Field(..., description="on/off")
    exhaust_fan: str
    water_pump: str
    led_intensity_pct: int

# ✅ NEW: FarmTelemetry nests sensors + actuators together
class FarmTelemetry(BaseModel):
    sensors: Sensors
    actuators: Actuators

class RedDotAlert(BaseModel):
    alert_id: str
    type: AlertType
    severity: Severity
    component: str
    message: str
    requires_human_action: bool = True

class AIRecommendation(BaseModel):
    recommendation: str
    reasoning: str
    action_steps: List[str]
    confidence_score: float

class ImpactMetrics(BaseModel):
    water_saved_liters: float
    energy_saved_kwh: float
    cost_saved_my_r: float

class WebSocketPayload(BaseModel):
    timestamp: datetime
    message_type: str = Field(..., description="state_update | alert | ai_insight | drama_trigger")
    farm_telemetry: Optional[FarmTelemetry] = None
    red_dot_alerts: List[RedDotAlert] = []
    ai_agronomist: Optional[AIRecommendation] = None
    impact_metrics: Optional[ImpactMetrics] = None