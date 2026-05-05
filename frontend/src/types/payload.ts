// ============================================================================
// 🌐 AuraFarm WebSocket Payload Types
// ============================================================================
// Backend: FastAPI + Pydantic (Python)
// Frontend: React + TypeScript + Zustand
// WebSocket: ws://localhost:8000/ws
// Update Frequency: Every 2 seconds
// ============================================================================

/**
 * 📦 Main WebSocket payload structure
 * Received every 2 seconds from backend mock_engine.py
 */
export interface FarmTelemetryPayload {
  /** ISO 8601 timestamp (e.g., "2026-05-05T10:46:36.472310Z") */
  timestamp: string;
  
  /** Message type for routing logic in frontend */
  message_type: "state_update" | "alert" | "drama_trigger";
  
  /** 🌡️ Sensor readings + ⚙️ Actuator states */
  farm_telemetry: {
    /** Environmental sensors (all values drift realistically in mock) */
    sensors: {
      temperature_c: number;    // °C | Range: 18-32 | Optimal for lettuce: 18-24
      humidity_pct: number;     // %  | Range: 40-80 | Optimal: 50-70
      moisture_pct: number;     // %  | Range: 30-70 | Optimal: 40-60
      ph_level: number;         // pH | Range: 5.5-7.0 | Optimal: 6.0-6.5 ⭐ HERO METRIC
      ec_us_cm: number;         // μS/cm | Range: 800-1200 | Nutrient concentration
      light_lux: number;        // lux | Range: 12000-20000 | LED intensity
    };
    
    /** Automated actuator states (driven by rule engine) */
    actuators: {
      cooling_fan: "on" | "off";      // Triggers 3D fan animation
      exhaust_fan: "on" | "off";      // Air exchange for humidity control
      water_pump: "on" | "off";       // Triggers water flow particles
      led_intensity_pct: number;      // 0-100 | Controls LED glow brightness
    };
  };
  
  /** 🔴 Red Dot alerts requiring HUMAN intervention */
  red_dot_alerts: RedDotAlert[];  // Empty array [] = all systems normal
  
  /** 🤖 AI Agronomist recommendations (Phase 3 - initially null) */
  ai_agronomist: AIRecommendation | null;
  
  /** 💰 Live impact metrics for "Ringgit Saved" dashboard */
  impact_metrics: ImpactMetrics;
}

// ============================================================================
// 🔴 Red Dot Alert Types (Human Intervention Required)
// ============================================================================

export interface RedDotAlert {
  /** Unique ID for dismissing/handling alert */
  alert_id: string;
  
  /** Alert category - maps to specific UI icon + sound */
  type: 
    | "resource_depletion"    // 🪣 Reservoir empty, nutrient bottle depleted
    | "mechanical_failure"    // 🔧 Fan/pump commanded ON but no effect
    | "biological_threat"    // 🐛 Pest/disease detected by AI camera
    | "critical_breach";     // 🚨 Temp/humidity beyond hardware limits
  
  /** Severity level - controls alert styling */
  severity: "warning" | "critical";  // critical = red pulse animation + audio
  
  /** Which component failed (for 3D highlighting) */
  component: string;  // e.g., "cooling_fan", "ph_sensor", "water_pump"
  
  /** Human-readable message for notification toast */
  message: string;    // e.g., "Temp 29.8°C despite fan ON"
  
  /** Always true for Red Dots - automation cannot fix this */
  requires_human_action: boolean;
}

// ============================================================================
// 🤖 AI Agronomist Recommendation Types (Phase 3)
// ============================================================================

export interface AIRecommendation {
  /** Short actionable headline */
  recommendation: string;  // e.g., "Adjust pH to 6.2"
  
  /** Reasoning based on plant profile + current sensors */
  reasoning: string;       // e.g., "pH drifting below lettuce optimal range..."
  
  /** Step-by-step instructions for user */
  action_steps: string[];  // ["Add 2ml pH Up", "Wait 10 mins", "Recheck"]
  
  /** Confidence score from OpenAI API (0.0 - 1.0) */
  confidence_score: number;  // Show as progress bar or badge
}

// ============================================================================
// 💰 Impact Metrics Types (Resource Tracker)
// ============================================================================

export interface ImpactMetrics {
  /** Liters of water saved vs traditional farming */
  water_saved_liters: number;    // Incremental counter
  
  /** kWh of electricity saved vs traditional farming */
  energy_saved_kwh: number;      // Incremental counter
  
  /** Malaysian Ringgit saved (calculated from water + energy) */
  cost_saved_my_r: number;       // Display as "RM XX.XX Saved" 🇲🇾
}

// ============================================================================
// 🎯 Helper Type Guards (Optional but Recommended)
// ============================================================================

/**
 * Type guard to check if payload has critical alerts
 * Usage: if (hasCriticalAlerts(payload)) { showEmergencyUI(); }
 */
export function hasCriticalAlerts(payload: FarmTelemetryPayload): boolean {
  return payload.red_dot_alerts.some(
    alert => alert.severity === "critical" && alert.requires_human_action
  );
}

/**
 * Type guard to check if pH is in optimal range for lettuce
 * Usage: if (!isPHOptimal(payload.farm_telemetry.sensors)) { showWarning(); }
 */
export function isPHOptimal(sensors: FarmTelemetryPayload["farm_telemetry"]["sensors"]): boolean {
  return sensors.ph_level >= 6.0 && sensors.ph_level <= 6.5;
}

/**
 * Type guard to check if temperature is safe
 * Usage: if (!isTempSafe(payload.farm_telemetry.sensors)) { activateEmergencyCooling(); }
 */
export function isTempSafe(sensors: FarmTelemetryPayload["farm_telemetry"]["sensors"]): boolean {
  return sensors.temperature_c <= 28; // Red Dot threshold
}