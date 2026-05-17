import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, X, AlertTriangle, ShieldCheck, RefreshCw, Command } from 'lucide-react'
import { useFarmStore } from '../../../store/useFarmStore'

function DemoController() {
  const resolveAlert = useFarmStore((state) => state.resolveAlert)
  const addToast = useFarmStore((state) => state.addToast)
  const [open, setOpen] = useState(false)

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

  const scenarioDepletion = () => triggerScenario('depletion')
  const scenarioFailure = () => triggerScenario('failure')
  const scenarioBiological = () => triggerScenario('biological')
  const scenarioBreach = () => triggerScenario('breach')
  
  const calm = () => triggerScenario('normal')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -20 }}
          className="fixed bottom-8 left-8 z-[100] w-80 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-3xl"
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
            <div className="flex flex-col gap-2 p-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
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
  )
}

export default DemoController