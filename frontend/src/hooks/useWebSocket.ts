import { useEffect, useRef } from 'react'
import { useFarmStore } from '../store/useFarmStore'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const generateMockFrame = () => {
  const state = useFarmStore.getState()
  const { sensors, impact, actuators, autoMode } = state
  
  const temp = clamp(sensors.temp + (Math.random() - 0.5) * 1.2, 18, 34)
  const humidity = clamp(sensors.humidity + (Math.random() - 0.5) * 4, 35, 92)
  const moisture = clamp(sensors.moisture + (Math.random() - 0.5) * 5, 15, 88)
  const ph = clamp(sensors.ph + (Math.random() - 0.5) * 0.08, 5.2, 7.4)
  
  let nextActuators = { ...actuators }
  let actions = []

  if (autoMode) {
    const fan = temp > 26 || humidity > 80
    const pump = moisture < 36
    const mist = humidity < 50
    const led = ph < 5.8 ? 'purple' : 'full'
    
    nextActuators = { fan, pump, mist, led }
    actions = [
      fan ? '🌡️ Temp drift detected → Fan activated' : '🌿 Climate within target band',
      pump ? '💧 Moisture dipped below guardrail → Pump queued' : '💧 Root zone moisture stable',
      led === 'purple' ? '🧪 pH alert mapped to purple LED state' : '💡 LED set for growth mode',
    ]
  }

  useFarmStore.getState().updateData({
    sensors: { temp, humidity, moisture, ph },
    ...(autoMode ? { actuators: nextActuators } : {}),
    actions,
    impact: {
      waterSaved: impact.waterSaved + (nextActuators.pump ? 0.8 : 0.15),
      energySaved: impact.energySaved + (nextActuators.fan ? 0.2 : 0.45),
      costSaved: impact.costSaved + 1.6,
    },
  })

  const roll = Math.random()
  if (roll > 0.78) {
    // Diverse alert types to prevent duplicate messages
    const alertTypes = [
      { severity: 'critical' as const, type: 'ph_drift', message: `pH dropped to ${ph.toFixed(1)} — nutrient lockup risk`, actionRequired: true },
      { severity: 'warning' as const, type: 'thermal_spike', message: 'Canopy temp exceeded 28°C. Increase airflow.', actionRequired: true },
      { severity: 'warning' as const, type: 'humidity_high', message: 'Humidity above 85% — monitor for mold risk', actionRequired: true },
      { severity: 'warning' as const, type: 'moisture_low', message: 'Root zone below 35%. Pump cycle queued.', actionRequired: true },
      { severity: 'info' as const, type: 'ec_drift', message: 'EC trending upward. Watch for salt stress.', actionRequired: false },
    ]
    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    useFarmStore.getState().addAlert(alert)
  }
}

export const useWebSocket = () => {
  const updateData = useFarmStore((state) => state.updateData)
  const addAlert = useFarmStore((state) => state.addAlert)
  const fallbackStarted = useRef(false)
  const fallbackTimer = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    let ws: WebSocket | null = null

    const startFallback = () => {
      if (!active || fallbackStarted.current) {
        return
      }

      fallbackStarted.current = true
      fallbackTimer.current = window.setInterval(generateMockFrame, 2800)
    }

    try {
      ws = new WebSocket('ws://localhost:8000/ws')

      ws.onmessage = (event) => {
        const raw = JSON.parse(event.data)
        
        // Handle both mock fallback and real backend formats
        if (raw.farm_telemetry) {
          const telemetry = raw.farm_telemetry
          const sensors = telemetry.sensors
          const actuators = telemetry.actuators
          const autoMode = useFarmStore.getState().autoMode
          
          updateData({
            sensors: {
              temp: sensors.temperature_c,
              humidity: sensors.humidity_pct,
              moisture: sensors.moisture_pct,
              ph: sensors.ph_level,
            },
            ...(autoMode ? {
              actuators: {
                fan: actuators.cooling_fan === 'on',
                pump: actuators.water_pump === 'on',
                mist: actuators.exhaust_fan === 'on', // Mapping exhaust to mist for demo
                led: raw.led_mode || (actuators.led_intensity_pct > 0 ? 'full' : 'off'),
              }
            } : {}),
            impact: {
              waterSaved: raw.impact_metrics?.water_saved_liters,
              energySaved: raw.impact_metrics?.energy_saved_kwh,
              costSaved: raw.impact_metrics?.cost_saved_my_r,
            },
          })
        } else if (raw.sensors && raw.actuators) {
          const autoMode = useFarmStore.getState().autoMode
          // Legacy/Fallback format
          updateData({
            sensors: raw.sensors,
            ...(autoMode ? { actuators: raw.actuators } : {}),
            actions: raw.actions,
            impact: raw.impact,
          })
        }

        if (raw.alerts?.length) {
          raw.alerts.forEach((alert: any) => addAlert(alert))
        }
      }

      ws.onerror = () => {
        console.warn('WS fallback to mock data')
        startFallback()
      }

      ws.onclose = () => {
        startFallback()
      }
    } catch {
      startFallback()
    }

    return () => {
      active = false
      ws?.close()

      if (fallbackTimer.current !== null) {
        window.clearInterval(fallbackTimer.current)
      }
    }
  }, [addAlert, updateData])
}