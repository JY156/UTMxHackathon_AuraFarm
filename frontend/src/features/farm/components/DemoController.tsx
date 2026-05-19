import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, X, AlertTriangle, ShieldCheck, RefreshCw, Command, ChevronDown, ChevronRight } from 'lucide-react'
import { useFarmStore } from '../../../store/useFarmStore'

function DemoController() {
  const resolveAlert = useFarmStore((state) => state.resolveAlert)
  const addToast = useFarmStore((state) => state.addToast)
  const [open, setOpen] = useState(false)
  const [autoOpen, setAutoOpen] = useState(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const triggerScenario = async (type: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/demo/scenario?type=${type}`, { method: 'POST' })
      const data = await response.json()
      if (data.status !== 'scenario_queued') {
        addToast(`Requested scenario: ${type.toUpperCase()}`, 'success')
      }
    } catch (err) {
      addToast(`Failed to trigger scenario: ${type}`, 'error')
    }
  }

  const scenarioDepletion = () => {
    triggerScenario('depletion')
    useFarmStore.setState((state) => {
      if (!state.sensors || !state.actuators) return {}
      const alertId = "resource_depletion_all_all"
      const hasAlert = state.alerts.some(a => a.id === alertId && !a.resolved)
      const newAlerts = hasAlert ? state.alerts : [
        ...state.alerts.filter(a => a.id !== alertId),
        {
          id: alertId,
          severity: 'critical' as const,
          type: 'resource_depletion',
          message: 'Water reservoir critical! Tank level is 0%. Mist and pump system disabled (dry-run protection). Refill immediately.',
          actionRequired: true,
          resolved: false,
          timestamp: Date.now(),
          target: 'tank' as const
        }
      ]
      return {
        sensors: { ...state.sensors, tankLevel: 0.0, moisture: 15.0 },
        actuators: { ...state.actuators, pump: false },
        alerts: newAlerts,
        toasts: [...state.toasts, { id: Math.random().toString(), message: "Alert: Water reservoir depletion! Pump disabled for dry-run protection.", type: 'error' }]
      }
    })
  }

  const scenarioFailure = () => {
    triggerScenario('failure')
    useFarmStore.setState((state) => {
      if (!state.sensors || !state.actuators) return {}
      const alertId = "mechanical_failure_all_all"
      const hasAlert = state.alerts.some(a => a.id === alertId && !a.resolved)
      const newAlerts = hasAlert ? state.alerts : [
        ...state.alerts.filter(a => a.id !== alertId),
        {
          id: alertId,
          severity: 'critical' as const,
          type: 'mechanical_failure',
          message: 'Hardware failure: Fan 1 unresponsive. Check fuse or motor.',
          actionRequired: true,
          resolved: false,
          timestamp: Date.now(),
          target: 'fan' as const
        }
      ]
      return {
        sensors: { ...state.sensors, temp: 32.0, humidity: 80.0 },
        actuators: { ...state.actuators, fan: false },
        alerts: newAlerts,
        toasts: [...state.toasts, { id: Math.random().toString(), message: "cooling_fan motor/fuse unresponsive!", type: 'error' }]
      }
    })
  }

  const scenarioBiological = async () => {
    setOpen(false)
    try {
      const res = await fetch('http://localhost:8000/api/demo/auto-scan', { method: 'POST' })
      const data = await res.json()
      useFarmStore.getState().setCvData(data)

      // Automated biological response: turn on fan + mist as preventive spray
      // Add a local alert scoped ONLY to Rack 3
      useFarmStore.setState((state) => {
        const alertId = `biological_threat_3_0`
        const hasAlert = state.alerts.some(a => a.id === alertId && !a.resolved)
        const newAlerts = hasAlert ? state.alerts : [
          ...state.alerts.filter(a => a.id !== alertId),
          {
            id: alertId,
            severity: 'critical' as const,
            type: 'biological_threat',
            message: 'Leaf Rust detected on Rack 3. Prune and treat immediately.',
            actionRequired: true,
            resolved: false,
            timestamp: Date.now(),
            target: 'rack' as const,
            rackId: 3,
            shelf: 0,
          }
        ]
        return {
          alerts: newAlerts,
          actuators: state.actuators ? { ...state.actuators, fan: true, mist: true } : state.actuators,
          toasts: [
            ...state.toasts,
            { id: Math.random().toString(), message: '🔴 Alert: Leaf Rust detected on Rack 3!', type: 'error' as const },
            { id: Math.random().toString(), message: '💨 Auto-response: Fan ON — reducing humidity to slow spore spread.', type: 'info' as const },
            { id: Math.random().toString(), message: '💧 Auto-response: Mist ON — pathogen suppression spray activated.', type: 'info' as const },
          ]
        }
      })
      // Also sync fan + mist state to backend so it persists over WebSocket
      fetch('http://localhost:8000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actuator: 'fan', state: 'on', autoMode: false })
      }).catch(() => null)
      fetch('http://localhost:8000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actuator: 'mist', state: 'on', autoMode: false })
      }).catch(() => null)
    } catch (err) {
      console.error('Failed to trigger auto-scan:', err)
      addToast('Failed to trigger Leaf Rust scenario', 'error')
    }
  }

  const scenarioBreach = () => {
    triggerScenario('breach')
    useFarmStore.setState((state) => {
      if (!state.sensors) return {}
      const alertId = "environmental_breach_all_all"
      const hasAlert = state.alerts.some(a => a.id === alertId && !a.resolved)
      const newAlerts = hasAlert ? state.alerts : [
        ...state.alerts.filter(a => a.id !== alertId),
        {
          id: alertId,
          severity: 'critical' as const,
          type: 'environmental_breach',
          message: 'HVAC failure: Temperature and humidity beyond hardware compensation limits.',
          actionRequired: true,
          resolved: false,
          timestamp: Date.now(),
          target: 'environment' as const
        }
      ]
      return {
        sensors: { ...state.sensors, temp: 38.0, humidity: 90.0 },
        alerts: newAlerts,
        toasts: [...state.toasts, { id: Math.random().toString(), message: "Alert: HVAC failure detected!", type: 'error' }]
      }
    })
  }

  const calm = () => {
    triggerScenario('normal')
    useFarmStore.setState((state) => {
      if (!state.sensors) return {}
      return {
        sensors: { ...state.sensors, temp: 24.3, humidity: 65.2, ph: 6.18, tankLevel: 85 },
        cvData: state.cvData ? {
          ...state.cvData,
          diseases_detected: [],
          nutrient_deficiencies: {
            nitrogen: { detected: false, confidence: 0, severity_score: 0 },
            phosphorus: { detected: false, confidence: 0, severity_score: 0 },
            potassium: { detected: false, confidence: 0, severity_score: 0 }
          }
        } : null,
        alerts: [],
        toasts: [...state.toasts, { id: Math.random().toString(), message: "System baseline successfully restored.", type: 'success' }]
      }
    })
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="fixed bottom-8 left-8 z-[100] w-80 max-h-[85vh] overflow-y-auto custom-scrollbar rounded-[32px] border border-white/10 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between bg-white/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Settings2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Simulator</h4>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
                      <Command size={10} /> Shift + D
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-2 p-4">
                <button
                  onClick={scenarioDepletion}
                  className="group relative flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 transition-all hover:bg-blue-500/10"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-blue-100">Empty Tank</span>
                      <span className="text-[10px] text-blue-400/70">Resource Depletion</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={scenarioFailure}
                  className="group relative flex items-center justify-between rounded-2xl border border-orange-500/20 bg-orange-500/5 px-4 py-4 transition-all hover:bg-orange-500/10"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-orange-400 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-orange-100">Broken Fan</span>
                      <span className="text-[10px] text-orange-400/70">Mechanical Failure</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={scenarioBiological}
                  className="group relative flex items-center justify-between rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-4 transition-all hover:bg-purple-500/10"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-purple-100">Leaf Rust</span>
                      <span className="text-[10px] text-purple-400/70">Biological Threat</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={scenarioBreach}
                  className="group relative flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 transition-all hover:bg-rose-500/10"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-rose-400 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-rose-100">HVAC Failure</span>
                      <span className="text-[10px] text-rose-400/70">Environmental Breach</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                </button>

                {/* Collapsible Automated Task Section */}
                <div className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
                  <button
                    onClick={() => setAutoOpen(!autoOpen)}
                    className="flex w-full items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">Automated Tasks</span>
                    {autoOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>

                  <div className={`${autoOpen ? 'flex' : 'hidden'} flex-col gap-2 p-3 border-t border-white/5 bg-black/40`}>
                    <button
                      onClick={() => useFarmStore.getState().triggerLocalPHDrop()}
                      className="group relative flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-3 transition-all hover:bg-indigo-500/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold text-indigo-100">pH Drop Simulation</span>
                          <span className="text-[9px] text-indigo-400/70">Triggers auto-dosing recovery</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => useFarmStore.getState().triggerNutrientDepletion('nitrogen')}
                      className="group flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-3 transition-all hover:bg-amber-500/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
                        <div className="flex flex-col items-start">
                          <span className="text-[11px] font-bold text-amber-100">Deplete N</span>
                          <span className="text-[8px] text-amber-400/70">Auto recovery</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => useFarmStore.getState().triggerNutrientDepletion('phosphorus')}
                      className="group flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-3 transition-all hover:bg-purple-500/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-purple-400 group-hover:scale-110 transition-transform animate-pulse" />
                        <div className="flex flex-col items-start">
                          <span className="text-[11px] font-bold text-purple-100">Deplete P</span>
                          <span className="text-[8px] text-purple-400/70">Auto recovery</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => useFarmStore.getState().triggerNutrientDepletion('potassium')}
                      className="group flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-3 transition-all hover:bg-orange-500/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-orange-400 group-hover:scale-110 transition-transform animate-pulse" />
                        <div className="flex flex-col items-start">
                          <span className="text-[11px] font-bold text-orange-100">Deplete K</span>
                          <span className="text-[8px] text-orange-400/70">Auto recovery</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={calm}
                  className="group relative flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 transition-all hover:bg-emerald-500/10"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-emerald-100">Reset Baseline</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    useFarmStore.getState().alerts.forEach((alert) => resolveAlert(alert.id))
                  }}
                  className="group relative flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-4 transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-sm font-bold text-slate-200">Clear Alerts</span>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="bg-white/5 px-5 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">AuraFarm Debug Mode</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}

export default DemoController