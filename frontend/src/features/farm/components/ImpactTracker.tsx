import { motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Droplets, Zap, DollarSign } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function AnimatedTotal({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const springValue = useSpring(value, { stiffness: 120, damping: 18 })
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    springValue.set(value)
  }, [springValue, value])

  useMotionValueEvent(springValue, 'change', (latest) => {
    setDisplayValue(Number(latest.toFixed(decimals)))
  })

  return <span>{displayValue.toFixed(decimals)}</span>
}

function ImpactTracker() {
  const impact = useFarmStore(useShallow((state) => state.impact))

  const baseline = { waterSaved: 12, energySaved: 9, costSaved: 48 }
  

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Efficiency Metrics</p>
          <h2 className="text-lg font-semibold text-white">Resource savings vs baseline</h2>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          Automated mode
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Water saved', value: impact.waterSaved, baseline: baseline.waterSaved, unit: 'L', icon: Droplets, color: 'text-cyan-400' },
          { label: 'Energy saved', value: impact.energySaved, baseline: baseline.energySaved, unit: 'kWh', icon: Zap, color: 'text-amber-400' },
          { label: 'Cost saved', value: impact.costSaved, baseline: baseline.costSaved, unit: 'RM', icon: DollarSign, color: 'text-emerald-400' },
        ].map((item) => {
          const IconComponent = item.icon
          const isPositive = item.value >= item.baseline
          const arrow = isPositive ? '↑' : '↓'
          const trendColor = isPositive ? 'text-emerald-400' : 'text-amber-400'
          const pct = isPositive 
            ? Math.round(((item.value - item.baseline) / item.baseline) * 100)
            : Math.round(((item.baseline - item.value) / item.baseline) * 100)

          return (
            <motion.div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 hover:border-emerald-400/30 transition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-500">{item.label}</div>
                <div className={`p-1.5 rounded-full ${item.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                  <IconComponent size={16} className={item.color} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-3xl font-semibold text-white">
                  <AnimatedTotal value={item.value} decimals={1} />
                </div>
                <span className="text-sm text-slate-400">{item.unit}</span>
              </div>

              <div className={`mt-3 flex items-center gap-1 font-semibold ${trendColor}`}>
                <span className="text-xl">{arrow}</span>
                <span className="text-sm">{pct}% vs baseline</span>
              </div>

              <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <motion.div
                  className={`h-full ${isPositive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.abs(pct))}%` }}
                  transition={{ delay: 0.2, duration: 1 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default ImpactTracker
