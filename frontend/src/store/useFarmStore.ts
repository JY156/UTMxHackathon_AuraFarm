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
  imageUrl?: string
}

export interface FarmSensors {
  temp: number
  humidity: number
  moisture: number
  ph: number
  tankLevel: number
}

export interface FarmActuators {
  fan: boolean
  pump: boolean
  mist: boolean
  led: LedMode
  valveN: boolean
  valveP: boolean
  valveK: boolean
  valveAcidic: boolean
  valveAlkaline: boolean
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
  tankLevel: number
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

export interface WebSocketPayload {
  timestamp: number
  message_type: string
  sensors?: FarmSensors
  actuators?: FarmActuators
  actions?: string[]
  alerts?: Alert[]
  impact?: FarmImpact
  aiRec?: AIRecommendation
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'error'
}

export interface CVData {
  crop_type: string
  overall_health: string
  diseases_detected: Array<{ name: string; confidence: number; severity: string }>
  nutrient_deficiencies: {
    nitrogen: { detected: boolean; confidence: number; severity_score: number }
    phosphorus: { detected: boolean; confidence: number; severity_score: number }
    potassium: { detected: boolean; confidence: number; severity_score: number }
  }
  visual_symptoms: string[]
  recommendations: string[]
}


export interface FarmState {
  // Backend Synced State (Placeholders)
  sensors: FarmSensors | null
  actuators: FarmActuators | null
  automationLog: string[]
  alerts: Alert[]
  impact: FarmImpact | null
  aiRec: AIRecommendation | null
  history: FarmHistoryPoint[]
  
  // UI-only State
  autoMode: boolean
  toasts: Toast[]
  profile: FarmProfile | null
  inspectedId: string | null
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  connectionAttempts: number
  cvData: CVData | null

  // Actions
  syncFromBackend: (payload: WebSocketPayload) => void
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting', attempts?: number) => void
  toggleActuator: (actuator: Actuator) => void
  setLedMode: (mode: LedMode) => void
  toggleAutoMode: () => void
  resolveAlert: (id: string) => void
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void
  removeToast: (id: string) => void
  loadProfile: (profile: FarmProfile) => void
  fetchAI: () => Promise<void>
  setInspectedId: (id: string | null) => void
  triggerLocalPHDrop: () => void
  setCvData: (data: CVData | null) => void
  triggerNutrientFix: (type?: 'nitrogen' | 'phosphorus' | 'potassium') => void
  triggerNutrientDepletion: (type?: 'nitrogen' | 'phosphorus' | 'potassium') => void
}

const createId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)

const demoSensors: FarmSensors = {
  temp: 24.3,
  humidity: 65.2,
  moisture: 48.1,
  ph: 6.18,
  tankLevel: 85,
}

const demoActuators: FarmActuators = {
  fan: false,
  pump: true,
  mist: true,
  led: 'full',
}

export const useFarmStore = create<FarmState>((set, get) => ({
  // Seed with a live-demo baseline so the dashboard renders before the backend connects.
  sensors: demoSensors,
  actuators: demoActuators,
  automationLog: [],
  alerts: [],
  impact: null,
  aiRec: {
    text: '',
    confidence: 0,
    loading: false,
    timestamp: 0,
    context: '',
    triggeredBy: 'scheduled',
  },
  history: [],

  // UI-only State Initialized to defaults
  autoMode: true,
  toasts: [],
  profile: null,
  inspectedId: null,
  connectionStatus: 'disconnected',
  connectionAttempts: 0,
  cvData: {
    crop_type: "cabbage",
    overall_health: "healthy",
    diseases_detected: [],
    nutrient_deficiencies: {
      nitrogen: { detected: true, confidence: 0.91, severity_score: 0.85 },
      phosphorus: { detected: false, confidence: 0, severity_score: 0 },
      potassium: { detected: false, confidence: 0, severity_score: 0 }
    },
    visual_symptoms: [],
    recommendations: []
  },

  syncFromBackend: (payload) =>
    set((state) => {
      // Defensive parsing: keep previous value if payload field is missing
      const nextSensors = payload.sensors || state.sensors
      const nextActuators = payload.actuators || state.actuators
      const nextImpact = payload.impact || state.impact
      const newActions = payload.actions || []
      
      const newHistory = nextSensors ? [
        ...state.history,
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ...nextSensors,
        },
      ].slice(-30) : state.history

      // Handle alerts merging
      let nextAlerts = state.alerts
      if (payload.alerts && Array.isArray(payload.alerts)) {
          const existingIds = new Set(state.alerts.map(a => a.id))
          const newAlerts = payload.alerts.filter(a => !existingIds.has(a.id)).map(a => ({
            ...a,
            id: a.id || createId(),
            resolved: false,
            timestamp: Date.now()
          }))
          
          // Trigger TTS for new critical alerts
          newAlerts.forEach(alert => {
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
                utterance.rate = 0.8 
                utterance.pitch = 0.9
        
                const voices = window.speechSynthesis.getVoices()
                const myVoice = voices.find(v => v.lang === 'en-MY' || v.lang === 'ms-MY') || 
                                voices.find(v => v.name.toLowerCase().includes('malaysia') || v.name.toLowerCase().includes('melayu'))
                
                if (myVoice) utterance.voice = myVoice
        
                window.speechSynthesis.cancel()
                window.speechSynthesis.speak(utterance)
              } catch (err) {
                console.warn('TTS announcement failed', err)
              }
            }
          })
          
          nextAlerts = [...state.alerts, ...newAlerts]
      }

      // Handle server-issued actions
      if (payload.actions && Array.isArray(payload.actions)) {
        payload.actions.forEach(action => {
          if (typeof action === 'string' && action.startsWith('RESOLVE_ALERT:')) {
            const idToResolve = action.split(':')[1]
            nextAlerts = nextAlerts.map(alert => 
              alert.id === idToResolve ? { ...alert, resolved: true } : alert
            )
          }
        })
      }

      return {
        sensors: nextSensors,
        actuators: nextActuators,
        impact: nextImpact,
        history: newHistory,
        automationLog: newActions.length > 0 
            ? [...state.automationLog, ...newActions].slice(-5) 
            : state.automationLog,
        alerts: nextAlerts
      }
    }),

  setConnectionStatus: (status, attempts = 0) => set({ connectionStatus: status, connectionAttempts: attempts }),

  toggleActuator: (actuator) => {
    set((state) => {
      // Optimistic UI update. Real sync logic should send POST to backend.
      if (!state.actuators) return state
      
      const newVal = !state.actuators[actuator]
      
      fetch('http://localhost:8000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actuator, state: newVal ? 'on' : 'off', autoMode: false })
      }).catch(console.error)
      
      return {
        actuators: { ...state.actuators, [actuator]: newVal },
        autoMode: false,
        automationLog: [
          ...state.automationLog,
          `⚡ Manual override requested for: ${actuator.toUpperCase()}`
        ].slice(-5)
      }
    })
  },

  setLedMode: (mode) => {
    set((state) => {
      if (!state.actuators) return state

      fetch('http://localhost:8000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ led_mode: mode, autoMode: false })
      }).catch(console.error)

      return {
        actuators: { ...state.actuators, led: mode },
        autoMode: false,
        automationLog: [
          ...state.automationLog,
          `💡 LED mode override requested: ${mode.toUpperCase()}`
        ].slice(-5)
      }
    })
  },

  toggleAutoMode: () => {
    set((state) => {
      const newMode = !state.autoMode
      fetch('http://localhost:8000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMode: newMode })
      }).catch(console.error)
      return { autoMode: newMode }
    })
  },

  resolveAlert: (id) => {
    fetch('http://localhost:8000/api/alert/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(console.error)

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
    })
  },

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
    set((state) => ({ aiRec: state.aiRec ? { ...state.aiRec, loading: true } : null }))

    try {
      const response = await fetch('http://localhost:8000/api/ai/recommend')
      if (!response.ok) throw new Error('Failed to fetch AI recommendation')
      const data = await response.json()
      
      set({
        aiRec: {
          text: data.text,
          confidence: data.confidence,
          context: data.context,
          loading: false,
          timestamp: Date.now(),
          triggeredBy: 'manual',
        },
      })
    } catch (error) {
      console.error(error)
      set((state) => ({
        aiRec: state.aiRec ? { ...state.aiRec, loading: false } : null,
        toasts: [...state.toasts, { id: createId(), message: 'Failed to reach AI Engine', type: 'error' }]
      }))
    }
  },

  setInspectedId: (id) => set({ inspectedId: id }),

  triggerLocalPHDrop: () => {
    set((state) => {
      if (!state.sensors || !state.actuators) return state
      
      return {
        sensors: { ...state.sensors, ph: 4.8 },
        actuators: { ...state.actuators, valveAlkaline: true },
        automationLog: [
          ...state.automationLog,
          `[SYSTEM] pH drop detected. Activating Alkaline dosing valve. Re-evaluating in 5 mins.`
        ].slice(-5),
        toasts: [...state.toasts, { id: createId(), message: `Alert: pH dropped to 4.8!`, type: 'error' }, { id: createId(), message: `Dosing pump active: Injecting Alkaline buffer`, type: 'info' }]
      }
    })
    
    // Auto resolve after 8 seconds
    setTimeout(() => {
      useFarmStore.setState((state) => {
        if (!state.sensors || !state.actuators) return state
        return {
          sensors: { ...state.sensors, ph: 6.2 },
          actuators: { ...state.actuators, valveAlkaline: false },
          automationLog: [
            ...state.automationLog,
            `[SYSTEM] pH stabilized at 6.2. Alkaline valve closed.`
          ].slice(-5),
          toasts: [...state.toasts, { id: createId(), message: `pH stabilized at 6.2!`, type: 'success' }]
        }
      })
    }, 8000)
  },
  
  setCvData: (data) => set({ cvData: data }),

  triggerNutrientDepletion: (type = 'nitrogen') => {
    set((state) => {
      if (!state.cvData) return state
      const capName = type.charAt(0).toUpperCase() + type.slice(1)
      return {
        cvData: {
          ...state.cvData,
          nutrient_deficiencies: {
            ...state.cvData.nutrient_deficiencies,
            [type]: { detected: true, confidence: 0.91, severity_score: 0.85 }
          }
        },
        automationLog: [
          ...state.automationLog,
          `[CV ALGORITHM] Systemic low ${capName} levels detected in reservoir solution.`
        ].slice(-5),
        toasts: [...state.toasts, { id: createId(), message: `Alert: Low ${capName} levels detected!`, type: 'error' }]
      }
    })

    // Automatically trigger the dosing recovery system after 6 seconds!
    setTimeout(() => {
      const state = useFarmStore.getState()
      const isDeficient = state.cvData?.nutrient_deficiencies?.[type]?.detected
      if (isDeficient) {
        state.triggerNutrientFix(type)
      }
    }, 6000)
  },

  triggerNutrientFix: (type = 'nitrogen') => {
    const valveKey = type === 'nitrogen' ? 'valveN' : type === 'phosphorus' ? 'valveP' : 'valveK'
    const capName = type.charAt(0).toUpperCase() + type.slice(1)
    const capLetter = type === 'nitrogen' ? 'N' : type === 'phosphorus' ? 'P' : 'K'
    const solName = type === 'nitrogen' ? 'Nitrate' : type === 'phosphorus' ? 'Phosphate' : 'Potash'
    const targetPpm = type === 'nitrogen' ? '820 ppm' : type === 'phosphorus' ? '280 ppm' : '650 ppm'
    
    set((state) => {
      if (!state.sensors || !state.actuators || !state.cvData) return state
      return {
        actuators: { ...state.actuators, [valveKey]: true },
        automationLog: [
          ...state.automationLog,
          `[SYSTEM] Dosing pump ${capLetter} active. Injecting ${solName} solution to central loop.`
        ].slice(-5),
        toasts: [...state.toasts, { id: createId(), message: `Dosing pump ${capLetter} active: Injecting ${solName}`, type: 'info' }]
      }
    })

    setTimeout(() => {
      useFarmStore.setState((state) => {
        if (!state.sensors || !state.actuators || !state.cvData) return state
        return {
          cvData: {
            ...state.cvData,
            nutrient_deficiencies: {
              ...state.cvData.nutrient_deficiencies,
              [type]: { detected: false, confidence: 0.99, severity_score: 0 }
            }
          },
          actuators: { ...state.actuators, [valveKey]: false },
          automationLog: [
            ...state.automationLog,
            `[SYSTEM] Central reservoir ${capName} levels stabilized at ${targetPpm}.`
          ].slice(-5),
          toasts: [...state.toasts, { id: createId(), message: `${capName} levels stabilized: All crops healthy!`, type: 'success' }]
        }
      })
    }, 4000)
  }
}))
