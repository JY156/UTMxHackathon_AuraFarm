import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, X, AlertTriangle, ShieldCheck, RefreshCw, Command } from 'lucide-react'
import { useFarmStore } from '../../../store/useFarmStore'

function DemoController() {
  const updateData = useFarmStore((state) => state.updateData)
  const addAlert = useFarmStore((state) => state.addAlert)
  const resolveAlert = useFarmStore((state) => state.resolveAlert)
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

  const spike = () => {
    const current = useFarmStore.getState()
    updateData({
      sensors: {
        temp: current.sensors.temp + 4.5,
        humidity: current.sensors.humidity - 8,
        moisture: current.sensors.moisture - 12,
        ph: current.sensors.ph - 0.2,
      },
<<<<<<< HEAD
      actuators: { fan: true, pump: true, mist: true, led: 'red' },
      actions: ['🎭 Demo spike injected → Fan, pump and mist forced on'],
=======
      actuators: { fan: true, pump: true, led: 'red', fanSpeed: 100, lightLevel: 20 },
      actions: ['🎭 Demo spike injected → Fan and pump forced on'],
>>>>>>> e8fc9a56255f8e2fb7f193435e98979803bd0294
      impact: {
        waterSaved: current.impact.waterSaved + 1.2,
        energySaved: current.impact.energySaved + 0.1,
        costSaved: current.impact.costSaved + 2.4,
      },
    })

    addAlert({
      severity: 'critical',
      type: 'demo_spike',
      message: 'Demo spike injected. Sensors are intentionally out of band.',
      actionRequired: true,
      rackId: 2, // Highlight rack 2 for demo purposes
      shelf: 1,
    })
  }

  const calm = () => {
    updateData({
      sensors: { temp: 23, humidity: 66, moisture: 51, ph: 6.1 },
<<<<<<< HEAD
      actuators: { fan: false, pump: false, mist: false, led: 'full' },
=======
      actuators: { fan: false, pump: false, led: 'full', fanSpeed: 50, lightLevel: 100 },
>>>>>>> e8fc9a56255f8e2fb7f193435e98979803bd0294
      actions: ['🧯 Demo reset → back to stable baseline'],
      impact: useFarmStore.getState().impact,
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 right-6 z-[100] w-80 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 p-1 shadow-2xl backdrop-blur-2xl"
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
                onClick={spike}
                className="group relative flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 transition-all hover:bg-rose-500/10"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-rose-100">Inject Spike</span>
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