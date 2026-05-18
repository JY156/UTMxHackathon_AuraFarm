// frontend/src/features/farm/components/AlertSystem.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, ShieldAlert, BellOff, Info, Camera, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

function AlertSystem() {
  const alertContainer = useRef<HTMLDivElement>(null)

  // Get alerts, cvData, and actions from store
  const { alerts, cvData, resolveAlert, setCvData } = useFarmStore(
    useShallow((state) => ({
      alerts: state.alerts,
      cvData: state.cvData,
      resolveAlert: state.resolveAlert,
      setCvData: state.setCvData
    })),
  )

  const [snoozedIds, setSnoozedIds] = useState<string[]>([])

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !alert.resolved && !snoozedIds.includes(alert.id)),
    [alerts, snoozedIds],
  )

  const criticalAlerts = useMemo(() => visibleAlerts.slice(0, 3), [visibleAlerts])

  // GSAP emergency flare animation
  useGSAP(() => {
    if (criticalAlerts.length > 0) {
      gsap.to('.emergency-flare', {
        opacity: [0, 0.3, 0],
        scale: [0.8, 1.2, 0.8],
        duration: 1.5,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: 0.5
      })
    }
  }, { dependencies: [criticalAlerts.length], scope: alertContainer })

  // Handle acknowledging CV analysis
  const handleAcknowledgeCV = () => {
    // Clear CV data from store
    setCvData(null)
    // Optionally resolve any associated biological alerts
    alerts.forEach(alert => {
      if (alert.type === 'biological_threat' && !alert.resolved) {
        resolveAlert(alert.id)
      }
    })
  }

  return (
    <section ref={alertContainer} className="flex flex-col gap-4 relative">
      {/* GSAP Emergency Flare Layer */}
      {criticalAlerts.length > 0 && (
        <div className="emergency-flare absolute -inset-4 z-0 rounded-[40px] bg-rose-500/10 blur-3xl pointer-events-none opacity-0" />
      )}

      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
          {criticalAlerts.length > 0 || cvData?.overall_health === 'diseased' ? 'Tactical Alerts' : 'System Health'}
        </h3>
        {criticalAlerts.length > 1 && (
          <div className="flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-bold text-rose-400 ring-1 ring-rose-500/30">
            <ShieldAlert size={12} /> {criticalAlerts.length} Issues
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">

          {/* === CV ANALYSIS RESULTS (Show at TOP when diseased) === */}
          {(cvData && cvData.overall_health === 'diseased') && (alerts.some(a => a.type === 'biological_threat' && !a.resolved)) && (<motion.div
            key="cv-analysis"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group relative overflow-hidden rounded-3xl border border-rose-500/30 bg-black/60 p-5 backdrop-blur-xl"
          >
            {/* Background Glow */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/20">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80">
                    AI Vision Analysis
                  </p>
                  <p className="text-xs text-slate-400">Automated Plant Health Scan</p>
                </div>
              </div>

              {/* Disease Name & Confidence */}
              {cvData.diseases_detected?.[0] && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-white">
                    {cvData.diseases_detected[0].name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Confidence: {(cvData.diseases_detected[0].confidence * 100).toFixed(0)}%
                    {cvData.diseases_detected[0].severity && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${cvData.diseases_detected[0].severity === 'severe' ? 'bg-rose-500/20 text-rose-400' :
                        cvData.diseases_detected[0].severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                        {cvData.diseases_detected[0].severity.toUpperCase()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Image Preview (if available) */}
              {cvData.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={cvData.image_url}
                    alt="Analyzed plant"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Visual Symptoms */}
              {cvData.visual_symptoms && cvData.visual_symptoms.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80 mb-2">
                    Visual Symptoms
                  </p>
                  <ul className="space-y-1">
                    {cvData.visual_symptoms.map((symptom: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-rose-400 mt-0.5">•</span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nutrient Deficiencies */}
              {cvData.nutrient_deficiencies && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80 mb-2">
                    Nutrient Status
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(cvData.nutrient_deficiencies).map(([nutrient, data]: [string, any]) => (
                      <div key={nutrient} className={`p-2 rounded-lg border ${data.detected ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/20 bg-emerald-500/5'
                        }`}>
                        <p className="text-[10px] font-bold uppercase text-slate-400">{nutrient.toUpperCase()}</p>
                        <p className={`text-xs font-bold ${data.detected ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {data.detected ? 'LOW' : 'OK'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {cvData.recommendations && cvData.recommendations.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80 mb-2">
                    Recommended Actions
                  </p>
                  <ul className="space-y-1">
                    {cvData.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs text-emerald-300 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={handleAcknowledgeCV}
                  className="flex-1 rounded-xl bg-rose-500 py-2 text-xs font-bold text-white transition-all hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/20"
                >
                  Acknowledge & Fix
                </button>
                <button
                  onClick={() => setCvData(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
          )}

          {/* === REGULAR ALERTS === */}
          {criticalAlerts.length ? (
            criticalAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                animate={{
                  boxShadow: ["0 0 15px rgba(244,63,94,0.1)", "0 0 30px rgba(244,63,94,0.25)", "0 0 15px rgba(244,63,94,0.1)"]
                }}
                transition={{
                  layout: { type: 'spring', damping: 25, stiffness: 200 },
                  boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                className="group relative overflow-hidden rounded-3xl border border-rose-500/30 bg-black/60 p-5 backdrop-blur-xl"
              >
                {/* Background Glow */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />

                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/20">
                    <AlertTriangle size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80">
                        {alert.type.replace('_', ' ')}
                      </p>
                      <button
                        onClick={() => setSnoozedIds(prev => [...prev, alert.id])}
                        className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
                      >
                        <BellOff size={14} />
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-200">
                      {alert.message}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="flex-1 rounded-xl bg-rose-500 py-2 text-xs font-bold text-white transition-all hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/20"
                      >
                        Acknowledge & Fix
                      </button>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : !cvData || cvData.overall_health !== 'diseased' ? (
            /* === ALL SYSTEMS NOMINAL (only show if no CV alert) === */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 rounded-[32px] border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">All Systems Nominal</p>
                <p className="text-xs text-slate-400 mt-0.5">No critical issues detected in the rack.</p>
              </div>
            </motion.div>
          ) : null}

        </AnimatePresence>
      </div>
    </section>
  )
}

export default AlertSystem