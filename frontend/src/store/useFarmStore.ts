import { create } from 'zustand'

export type Severity = 'info' | 'warning' | 'critical'
export type Actuator = 'fan' | 'pump' | 'mist' | 'led'
export type LedMode = 'full' | 'purple' | 'off'

export interface Alert {
  id: string
  severity: Severity
  type: string
  message: string
  actionRequired: boolean
  resolved: boolean
  timestamp: number
}

export interface FarmSensors {
  temp: number
  humidity: number
  moisture: number
  ph: number
}

export interface FarmActuators {
  fan: boolean
  pump: boolean
  mist: boolean
  led: LedMode
}

export interface FarmProfile {
  name: string
  optimal: Record<string, [number, number]>
}

export interface FarmHistoryPoint {
  time: string
  temp: number
  humidity: number
  moisture: number
  ph: number
}

export interface FarmImpact {
  waterSaved: number
  energySaved: number
  costSaved: number
}

export interface AIRecommendation {
  text: string
  confidence: number
  loading: boolean
  timestamp: number
  context: string
  triggeredBy: 'scheduled' | 'alert' | 'manual' | 'profile'
}

export interface FarmUpdatePayload {
  sensors: FarmSensors
  actuators: FarmActuators
  actions?: string[]
  alerts?: Array<Omit<Alert, 'id' | 'resolved' | 'timestamp'>>
  impact?: Partial<FarmImpact>
}

interface FarmState {
  sensors: FarmSensors
  actuators: FarmActuators
  autoMode: boolean
  automationLog: string[]
  alerts: Alert[]
  profile: FarmProfile | null
  history: FarmHistoryPoint[]
  impact: FarmImpact
  aiRec: AIRecommendation
  updateData: (data: FarmUpdatePayload) => void
  toggleActuator: (actuator: 'fan' | 'pump' | 'mist') => void
  setLedMode: (mode: LedMode) => void
  toggleAutoMode: () => void
  addAlert: (alert: Omit<Alert, 'id' | 'resolved' | 'timestamp'>) => void
  resolveAlert: (id: string) => void
  loadProfile: (profile: FarmProfile) => void
  fetchAI: () => Promise<void>
}

const createId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)

export const useFarmStore = create<FarmState>((set, get) => ({
  sensors: { temp: 22, humidity: 65, moisture: 50, ph: 6.0 },
  actuators: { fan: false, pump: false, mist: false, led: 'full' },
  autoMode: true,
  automationLog: [],
  alerts: [],
  profile: null,
  history: [],
  impact: { waterSaved: 0, energySaved: 0, costSaved: 0 },
  aiRec: {
    text: '',
    confidence: 0,
    loading: false,
    timestamp: 0,
    context: '',
    triggeredBy: 'scheduled',
  },
  updateData: (data) =>
    set((state) => {
      const nextImpact = {
        waterSaved: data.impact?.waterSaved ?? state.impact.waterSaved,
        energySaved: data.impact?.energySaved ?? state.impact.energySaved,
        costSaved: data.impact?.costSaved ?? state.impact.costSaved,
      }

      return {
        sensors: data.sensors,
        actuators: data.actuators,
        automationLog: data.actions
          ? [...state.automationLog, ...data.actions].slice(-5)
          : state.automationLog,
        alerts: data.alerts
          ? [
              ...state.alerts,
              ...data.alerts.map((alert) => ({
                ...alert,
                id: createId(),
                resolved: false,
                timestamp: Date.now(),
              })),
            ]
          : state.alerts,
        impact: nextImpact,
        history: [
          ...state.history,
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...data.sensors,
          },
        ].slice(-30),
      }
    }),
  toggleActuator: (actuator) =>
    set((state) => {
      const newVal = !state.actuators[actuator]
      return {
        actuators: { ...state.actuators, [actuator]: newVal },
        autoMode: false,
        automationLog: [
          ...state.automationLog,
          `⚡ Manual override: ${actuator.toUpperCase()} turned ${newVal ? 'ON' : 'OFF'}`
        ].slice(-5)
      }
    }),
  setLedMode: (mode) =>
    set((state) => ({
      actuators: { ...state.actuators, led: mode },
      autoMode: false,
      automationLog: [
        ...state.automationLog,
        `💡 LED mode adjusted: ${mode.toUpperCase()}`
      ].slice(-5)
    })),
  toggleAutoMode: () => set((state) => ({ autoMode: !state.autoMode })),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: createId(),
          resolved: false,
          timestamp: Date.now(),
        },
      ],
    })),
  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, resolved: true } : alert,
      ),
    })),
  loadProfile: (profile) => set({ profile }),
  fetchAI: async () => {
    set({ aiRec: { ...get().aiRec, loading: true } })

    window.setTimeout(() => {
      set({
        aiRec: {
          text: 'Increase calcium by 10% and keep irrigation in short pulses for steadier uptake. Current EC levels suggest nutrient imbalance—consider adjusting phosphorus ratio.',
          confidence: 87,
          loading: false,
          timestamp: Date.now(),
          context: 'Based on current sensor readings and crop profile',
          triggeredBy: 'scheduled',
        },
      })
    }, 1500)
  },
}))
