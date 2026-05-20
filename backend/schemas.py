# backend/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# --- Alert Types ---
class AlertType(str, Enum):
    resource_depletion = "resource_depletion"
    mechanical_failure = "mechanical_failure"
    biological_threat = "biological_threat"
    critical_breach = "critical_breach"
    nutrient_deficiency = "nutrient_deficiency"
    ph_drift = "ph_drift"
    thermal_spike = "thermal_spike"

# --- Severity Enum (added 'info') ---
class Severity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"

# --- ✅ NEW: Alert class for frontend compatibility ---
# This matches the Alert interface in useFarmStore.ts
class Alert(BaseModel):
    id: str
    severity: Severity
    type: str  # Can be AlertType value or custom string
    message: str
    actionRequired: bool
    resolved: bool = False
    timestamp: int  # Unix epoch milliseconds
    target: Optional[Literal['rack', 'tank', 'fan', 'environment']] = None
    rackId: Optional[int] = None
    shelf: Optional[int] = None

# --- ✅ Existing: RedDotAlert (keep for backward compatibility) ---
class RedDotAlert(BaseModel):
    alert_id: str
    type: AlertType
    severity: Severity
    component: str
    message: str
    requires_human_action: bool = True

# --- ✅ Sensors model (with NPK) ---
class Sensors(BaseModel):
    temperature_c: float
    humidity_pct: float
    moisture_pct: float
    ph_level: float
    ec_us_cm: float
    light_lux: float
    tank_level_pct: float
    nitrogen_mg_l: float
    phosphorus_mg_l: float
    potassium_mg_l: float

# --- ✅ Actuators model ---
class Actuators(BaseModel):
    cooling_fan: str = Field(..., description="on/off")
    exhaust_fan: str
    water_pump: str
    led_intensity_pct: int
    # Optional valve controls for NPK dosing
    valveN: Optional[bool] = False
    valveP: Optional[bool] = False
    valveK: Optional[bool] = False
    valveAcidic: Optional[bool] = False
    valveAlkaline: Optional[bool] = False

# --- ✅ FarmTelemetry nests sensors + actuators ---
class FarmTelemetry(BaseModel):
    sensors: Sensors
    actuators: Actuators

# --- ✅ AI & Impact Models ---
class AIRecommendation(BaseModel):
    recommendation: str
    reasoning: str
    action_steps: List[str]
    confidence_score: float

class ImpactMetrics(BaseModel):
    water_saved_liters: float
    energy_saved_kwh: float
    cost_saved_my_r: float

# --- ✅ WebSocket Payload (supports both old and new alert formats) ---
class WebSocketPayload(BaseModel):
    timestamp: int  # Unix epoch milliseconds (changed from datetime for frontend compatibility)
    message_type: Literal["state_update", "alert", "ai_insight", "drama_trigger", "cv_update"] = "state_update"
    farm_telemetry: Optional[FarmTelemetry] = None
    # Support both alert formats:
    alerts: Optional[List[Alert]] = []  # New format for frontend
    red_dot_alerts: Optional[List[RedDotAlert]] = []  # Legacy format
    ai_agronomist: Optional[AIRecommendation] = None
    impact_metrics: Optional[ImpactMetrics] = None
    cv_data: Optional[dict] = None  # For Vision AI results

# --- ✅ Request/Response Models for API Endpoints ---
class AlertResolve(BaseModel):
    id: str

class ControlPayload(BaseModel):
    actuator: Optional[str] = None
    state: Optional[str] = None
    led_mode: Optional[str] = None  # "full", "purple", "off"
    autoMode: Optional[bool] = None

class VisionAnalysisResponse(BaseModel):
    crop_type: str
    overall_health: Literal["healthy", "stressed", "diseased"]
    growth_stage: Optional[Literal["seedling", "vegetative", "mature"]] = None
    nutrient_deficiencies: Optional[dict] = None
    diseases_detected: Optional[List[dict]] = None
    visual_symptoms: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    image_url: Optional[str] = None

# --- ✅ Web3 & Crop PRESENTS / Switch API Models ---
class AllocationLedgerAllocation(BaseModel):
    type: str
    entity: str
    tokens: int
    use_case: str
    status: str

class AllocationLedger(BaseModel):
    token_symbol: str
    total_minted_tokens: int
    allocation_percentage: int
    allocations: List[AllocationLedgerAllocation]
    log_message: str

class CropSwitchPayload(BaseModel):
    crop: str
    params: Optional[dict] = None

class CropSwitchResponse(BaseModel):
    profile: dict
    log_message: str
    allocation_ledger: Optional[AllocationLedger] = None

class ProcurementPayload(BaseModel):
    item_id: str
    supplier_id: str
    cost_myr: float

class ProcurementResponse(BaseModel):
    status: str
    tx_hash: str
    contract_address: str
    log_message: str
    supplier_notified: bool
    explorer_url: Optional[str] = None

class LendingResponse(BaseModel):
    status: str
    credit_limit_myr: float
    usdc_equivalent: float
    log_message: str