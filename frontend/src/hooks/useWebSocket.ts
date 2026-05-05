import { useEffect, useRef } from 'react'
import { useFarmStore } from '../store/useFarmStore'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const generateMockFrame = () => {
  const { sensors, impact } = useFarmStore.getState()
  const temp = clamp(sensors.temp + (Math.random() - 0.5) * 1.2, 18, 34)
  const humidity = clamp(sensors.humidity + (Math.random() - 0.5) * 4, 35, 92)
  const moisture = clamp(sensors.moisture + (Math.random() - 0.5) * 5, 15, 88)
  const ph = clamp(sensors.ph + (Math.random() - 0.5) * 0.08, 5.2, 7.4)
  const fan = temp > 26 || humidity > 80
  const pump = moisture < 36
  const led = ph < 5.8 ? 'red' : fan ? 'blue' : 'full'
  const actions = [
    fan ? '🌡️ Temp drift detected → Fan activated' : '🌿 Climate within target band',
    pump ? '💧 Moisture dipped below guardrail → Pump queued' : '💧 Root zone moisture stable',
    led === 'red' ? '🧪 pH alert mapped to red LED state' : '💡 LED set for growth mode',
  ]

  useFarmStore.getState().updateData({
    sensors: { temp, humidity, moisture, ph },
    actuators: { fan, pump, led },
    actions,
    impact: {
      waterSaved: impact.waterSaved + (pump ? 0.8 : 0.15),
      energySaved: impact.energySaved + (fan ? 0.2 : 0.45),
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
        const data = JSON.parse(event.data) as {
          sensors?: { temp: number; humidity: number; moisture: number; ph: number }
          actuators?: { fan: boolean; pump: boolean; led: 'full' | 'blue' | 'red' | 'off' }
          actions?: string[]
          alerts?: Array<{
            severity: 'info' | 'warning' | 'critical'
            type: string
            message: string
            actionRequired: boolean
          }>
          impact?: { waterSaved?: number; energySaved?: number; costSaved?: number }
        }

        if (data.sensors && data.actuators) {
          updateData({
            sensors: data.sensors,
            actuators: data.actuators,
            actions: data.actions,
            impact: data.impact,
          })
        }

        if (data.alerts?.length) {
          data.alerts.forEach((alert) => addAlert(alert))
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