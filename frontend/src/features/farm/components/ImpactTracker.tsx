import { motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Droplets, Zap, DollarSign, TrendingUp, Sparkles, Leaf } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function AnimatedTotal({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const springValue = useSpring(value, { stiffness: 100, damping: 20 })
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

  if (!impact) {
    return (
      <section className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="h-48 animate-pulse rounded-[32px] bg-white/5" />
          <div className="h-48 animate-pulse rounded-[32px] bg-white/5" />
          <div className="h-48 animate-pulse rounded-[32px] bg-white/5" />
        </div>
      </section>
    )
  }

  const stats = [
    { label: 'Water Conservation', value: impact.waterSaved, baseline: baseline.waterSaved, unit: 'Liters', icon: Droplets, color: 'cyan', description: 'Reduction vs traditional soil' },
    { label: 'Energy Optimization', value: impact.energySaved, baseline: baseline.energySaved, unit: 'kWh', icon: Zap, color: 'amber', description: 'Smart lighting efficiency' },
    { label: 'Operation Yield', value: impact.costSaved, baseline: baseline.costSaved, unit: 'RM', icon: DollarSign, color: 'emerald', description: 'Total automated savings' },
  ]

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Resource Efficiency</h3>
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-400">
          <Sparkles size={12} className="text-cyan-400" /> AI Optimized
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon
          const isPositive = item.value >= item.baseline
          const pct = Math.round(((item.value - item.baseline) / item.baseline) * 100)

          return (
            <motion.div
              key={item.label}
              className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-black/20 p-6 backdrop-blur-md transition-all duration-300 hover:bg-black/30 hover:shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${item.color}-500/10 text-${item.color}-400 ring-1 ring-${item.color}-500/20`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} />
                  {pct}%
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tight text-white">
                    <AnimatedTotal value={item.value} decimals={1} />
                  </h3>
                  <span className="text-sm font-bold text-slate-600">{item.unit}</span>
                </div>
                <p className="mt-3 text-[10px] font-medium leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>

              {/* Progress visualizer */}
              <div className="mt-6 h-1 w-full rounded-full bg-white/5">
                <motion.div
                  className={`h-full rounded-full bg-${item.color}-500 shadow-[0_0_8px_rgba(var(--${item.color}-500-rgb),0.3)]`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, 40 + Math.abs(pct))}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Sustainable badge footer */}
      <div className="mt-2 flex items-center justify-center rounded-3xl border border-white/5 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-md">
        <Leaf size={14} className="mr-3 text-emerald-500" /> Carbon Neutral Farming Initiative
      </div>
    </section>
  )
}

export default ImpactTracker
