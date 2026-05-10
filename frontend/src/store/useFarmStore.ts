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
  target?: 'rack' | 'tank' | 'fan' | 'environment'
  rackId?: number
  shelf?: number
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
  fanSpeed?: number
  lightLevel?: number
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

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info'
}

export interface FarmState {
  sensors: FarmSensors
  actuators: FarmActuators
  autoMode: boolean
  automationLog: string[]
  alerts: Alert[]
  toasts: Toast[]
  profile: FarmProfile | null
  history: FarmHistoryPoint[]
  impact: FarmImpact
  aiRec: AIRecommendation
  inspectedId: string | null
  updateData: (data: FarmUpdatePayload) => void
  toggleActuator: (actuator: 'fan' | 'pump' | 'mist') => void
  setLedMode: (mode: LedMode) => void
  toggleAutoMode: () => void
  addAlert: (alert: Omit<Alert, 'id' | 'resolved' | 'timestamp'>) => void
  resolveAlert: (id: string) => void
  addToast: (message: string, type?: 'success' | 'info') => void
  removeToast: (id: string) => void
  loadProfile: (profile: FarmProfile) => void
  fetchAI: () => Promise<void>
  setInspectedId: (id: string | null) => void
}

const createId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)

export const useFarmStore = create<FarmState>((set, get) => ({
  sensors: { temp: 22, humidity: 65, moisture: 50, ph: 6.0 },
  actuators: { fan: false, pump: false, mist: false, led: 'full' },
  autoMode: true,
  automationLog: [],
  alerts: [],
  toasts: [],
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
  inspectedId: null,
  updateData: (data) =>
    set((state) => {
      const nextImpact = {
        waterSaved: data.impact?.waterSaved ?? state.impact.waterSaved,
        energySaved: data.impact?.energySaved ?? state.impact.energySaved,
        costSaved: data.impact?.costSaved ?? state.impact.costSaved,
      }

      return {
        sensors: data.sensors ? { ...state.sensors, ...data.sensors } : state.sensors,
        actuators: data.actuators ? { ...state.actuators, ...data.actuators } : state.actuators,
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
            ...state.sensors,
            ...data.sensors,
          },
        ].slice(-30),
      }
    }),
  toggleActuator: (actuator) =>
    set((state) => {
      const newVal = !state.actuators[actuator]

      if (newVal) {
        // Prevent activation if there's a hardware failure or resource depletion
        const isFanBroken = actuator === 'fan' && state.alerts.some(a => !a.resolved && a.target === 'fan' && a.severity === 'critical')
        const isPumpBlocked = (actuator === 'pump' || actuator === 'mist') && state.alerts.some(a => !a.resolved && a.target === 'tank' && a.severity === 'critical')
        
        if (isFanBroken) {
          return {
            toasts: [
              ...state.toasts,
              { id: createId(), message: 'Cannot activate FAN: Mechanical Failure detected.', type: 'info' }
            ]
          }
        }
        
        if (isPumpBlocked) {
          return {
            toasts: [
              ...state.toasts,
              { id: createId(), message: `Cannot activate ${actuator.toUpperCase()}: Water reservoir is empty.`, type: 'info' }
            ]
          }
        }
      }

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
  addAlert: (alert) => {
    if (alert.severity === 'critical' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        let speechText = `Critical alert: ${alert.message}`
        if (alert.type === 'resource_depletion') {
          speechText = 'Critical alert: water tank empty.'
        } else if (alert.type === 'mechanical_failure') {
          speechText = 'Critical alert: fan is broken, requires manual fix now.'
        } else if (alert.type === 'biological_threat') {
          speechText = `Critical alert: detected leaf rust on rack ${alert.rackId || 3}, remove the plant now before disease spread.`
        }

        const utterance = new SpeechSynthesisUtterance(speechText)
        
        // Elderly friendly settings: slower rate, slightly lower pitch for clarity
        utterance.rate = 0.8 
        utterance.pitch = 0.9

        // Try to find a Malaysian voice (en-MY or ms-MY)
        const voices = window.speechSynthesis.getVoices()
        const myVoice = voices.find(v => v.lang === 'en-MY' || v.lang === 'ms-MY') || 
                        voices.find(v => v.name.toLowerCase().includes('malaysia') || v.name.toLowerCase().includes('melayu'))
        
        if (myVoice) {
          utterance.voice = myVoice
        }

        window.speechSynthesis.cancel() // Cancel any ongoing speech to prioritize the new critical alert
        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.warn('TTS announcement failed', err)
      }
    }

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
    }))
  },
  resolveAlert: (id) =>
    set((state) => {
      const alertToResolve = state.alerts.find(a => a.id === id)
      if (!alertToResolve) return state

      const message = `${alertToResolve.type.replace('_', ' ').toUpperCase()} RESOLVED`
      
      return {
        alerts: state.alerts.map((alert) =>
          alert.id === id ? { ...alert, resolved: true } : alert,
        ),
        toasts: [...state.toasts, { id: createId(), message, type: 'success' }]
      }
    }),
  addToast: (message, type = 'info') => 
    set((state) => ({
      toasts: [...state.toasts, { id: createId(), message, type }]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
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
  setInspectedId: (id) => set({ inspectedId: id }),
}))
