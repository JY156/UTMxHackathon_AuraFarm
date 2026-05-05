import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function AlertSystem() {
  const { alerts, resolveAlert } = useFarmStore(
    useShallow((state) => ({ alerts: state.alerts, resolveAlert: state.resolveAlert })),
  )
  const [snoozedIds, setSnoozedIds] = useState<string[]>([])

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !alert.resolved && !snoozedIds.includes(alert.id)),
    [alerts, snoozedIds],
  )

  const criticalAlerts = useMemo(() => visibleAlerts.filter((a) => a.severity === 'critical').slice(0, 3), [visibleAlerts])
  const latestCritical = useMemo(() => criticalAlerts.at(-1) ?? null, [criticalAlerts])

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Alert System</p>
          <h2 className="text-lg font-semibold text-white">Critical events</h2>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-mono text-rose-200">
          {criticalAlerts.length} CRITICAL
        </div>
      </div>

      <AnimatePresence>
        {latestCritical ? (
          <motion.div
            key={latestCritical.id}
            className="mb-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-300">Latest event</div>
                <div className="mt-1 text-sm text-white">{latestCritical.message}</div>
              </div>
              <span className="mt-1 h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.95)]" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
        {criticalAlerts.length ? (
          criticalAlerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-rose-500/30 bg-rose-950/25 p-3">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{alert.type.replace('_', ' ')}</div>
                  <div className="mt-1 text-sm text-white">{alert.message}</div>
                </div>
                <div className="rounded-md border border-rose-500/50 bg-rose-500/20 px-2 py-1 text-[10px] font-mono uppercase text-rose-300">
                  critical
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 hover:border-rose-500/70"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolve
                </button>
                <button
                  type="button"
                  className="border border-slate-500/50 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:border-slate-400/70"
                  onClick={() => setSnoozedIds((current) => [...current, alert.id])}
                >
                  Snooze
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 flex items-center gap-2">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span>All systems nominal</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default AlertSystem
