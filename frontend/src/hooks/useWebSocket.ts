import { useEffect } from 'react'
import { useFarmStore } from '../store/useFarmStore'

export const useWebSocket = () => {
  const syncFromBackend = useFarmStore((state) => state.syncFromBackend)
  const setConnectionStatus = useFarmStore((state) => state.setConnectionStatus)

  useEffect(() => {
    let active = true
    let ws: WebSocket | null = null
    let reconnectTimer: number | null = null
    let attemptCount = 0
    const MAX_ATTEMPTS = 10

    const connect = () => {
      if (!active) return

      try {
        ws = new WebSocket('ws://localhost:8000/ws')

        ws.onopen = () => {
          if (!active) return
          setConnectionStatus('connected', 0)
          attemptCount = 0
          console.log('🔌 WebSocket Connected')
        }

        ws.onmessage = (event) => {
          if (!active) return
          try {
            const raw = JSON.parse(event.data)
            
            if (raw.message_type === 'state_update' && raw.farm_telemetry) {
              const telemetry = raw.farm_telemetry
              const sensors = telemetry.sensors
              const actuators = telemetry.actuators
              
              syncFromBackend({
                timestamp: raw.timestamp,
                message_type: raw.message_type,
                sensors: {
                  temp: sensors.temperature_c,
                  humidity: sensors.humidity_pct,
                  moisture: sensors.moisture_pct,
                  ph: sensors.ph_level,
                  tankLevel: sensors.tank_level_pct,
                  nitrogen: sensors.nitrogen_mg_l,
                  phosphorus: sensors.phosphorus_mg_l,
                  potassium: sensors.potassium_mg_l,
                },
                actuators: {
                  fan: actuators.cooling_fan === 'on',
                  pump: actuators.water_pump === 'on',
                  mist: actuators.exhaust_fan === 'on', 
                  led: raw.led_mode || (actuators.led_intensity_pct > 0 ? 'full' : 'off'),
                  valveN: actuators.valveN !== undefined ? actuators.valveN : (useFarmStore.getState().actuators?.valveN || false),
                  valveP: actuators.valveP !== undefined ? actuators.valveP : (useFarmStore.getState().actuators?.valveP || false),
                  valveK: actuators.valveK !== undefined ? actuators.valveK : (useFarmStore.getState().actuators?.valveK || false),
                  valveAcidic: actuators.valveAcidic !== undefined ? actuators.valveAcidic : (useFarmStore.getState().actuators?.valveAcidic || false),
                  valveAlkaline: actuators.valveAlkaline !== undefined ? actuators.valveAlkaline : (useFarmStore.getState().actuators?.valveAlkaline || false),
                },
                impact: {
                  waterSaved: raw.impact_metrics?.water_saved_liters,
                  energySaved: raw.impact_metrics?.energy_saved_kwh,
                  costSaved: raw.impact_metrics?.cost_saved_my_r,
                },
                alerts: raw.alerts || [],
                cv_data: raw.cv_data
              })
            }
          } catch (e) {
            console.warn('Failed to parse WebSocket message:', e)
          }
        }

        ws.onclose = () => {
          if (!active) return
          console.warn('WebSocket disconnected. Attempting to reconnect...')
          attemptReconnect()
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          // onclose will fire next and handle the reconnect
        }
      } catch (e) {
        console.error('Failed to create WebSocket:', e)
        attemptReconnect()
      }
    }

    const attemptReconnect = () => {
      if (attemptCount < MAX_ATTEMPTS) {
        attemptCount++
        setConnectionStatus('reconnecting', attemptCount)
        reconnectTimer = window.setTimeout(connect, 5000)
      } else {
        setConnectionStatus('disconnected', attemptCount)
        console.error('Max WebSocket reconnect attempts reached.')
      }
    }

    // Initial connection
    connect()

    return () => {
      active = false
      if (ws) {
        ws.close()
      }
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
      }
    }
  }, [syncFromBackend, setConnectionStatus])
}