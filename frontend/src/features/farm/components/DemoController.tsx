import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, X, AlertTriangle, ShieldCheck, RefreshCw, Command } from 'lucide-react'
import { useFarmStore } from '../../../store/useFarmStore'

function DemoController() {
  const resolveAlert = useFarmStore((state) => state.resolveAlert)
  const addToast = useFarmStore((state) => state.addToast)
  const [open, setOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)

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

  const scenarioBiological = async () => {
    setOpen(false)
    setIsScanning(true)
    setScanResult(null)

    await new Promise(r => setTimeout(r, 2000))

    try {
      const res = await fetch('http://localhost:8000/api/demo/auto-scan', { method: 'POST' })
      const data = await res.json()
      setIsScanning(false)
      setScanResult(data)
    } catch (err) {
      setIsScanning(false)
    }
  }

  const scenarioBreach = () => triggerScenario('breach')

  const calm = () => triggerScenario('normal')

  return (
    <>
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
                  onClick={() => useFarmStore.getState().triggerLocalPHDrop()}
                  className="group relative flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-4 transition-all hover:bg-indigo-500/10"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-indigo-100">pH Drop</span>
                      <span className="text-[10px] text-indigo-400/70">Auto-fix Demo</span>
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

      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-8 shadow-2xl">
              <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" style={{ width: '64px', height: '64px' }} />
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20" />
                </div>
                <p className="text-xl font-bold tracking-[0.2em] uppercase text-emerald-400 animate-pulse">
                  📸 Camera scanning Rack 3...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-rose-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-rose-500/20 bg-rose-500/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider">Biological Threat Detected</h3>
                    <p className="text-xs text-rose-400">Automated Vision Analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setScanResult(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col md:flex-row gap-6 p-6">
                {/* Image */}
                <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src={scanResult.image_url}
                    alt="Plant scan"
                    className="w-full h-full object-cover aspect-video md:aspect-square"
                  />
                  <div className="absolute inset-0 bg-rose-500/10 mix-blend-overlay pointer-events-none" />
                </div>

                {/* Details */}
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                  <div className="rounded-xl bg-black/40 p-4 border border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Analysis Result</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Disease</span>
                        <span className="font-bold text-rose-400">{scanResult.diseases_detected?.[0]?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Confidence</span>
                        <span className="font-bold text-white">
                          {((scanResult.diseases_detected?.[0]?.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Growth Stage</span>
                        <span className="font-bold text-emerald-400 capitalize">{scanResult.growth_stage}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/40 p-4 border border-white/5 flex-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recommendations</h4>
                    <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                      {scanResult.recommendations?.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default DemoController