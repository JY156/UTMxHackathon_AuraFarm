import { motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function AnimatedNumber({ value, precision = 1 }: { value: number; precision?: number }) {
  const springValue = useSpring(value, { stiffness: 140, damping: 24 })
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    springValue.set(value)
  }, [springValue, value])

  useMotionValueEvent(springValue, 'change', (latest) => {
    setDisplayValue(Number(latest.toFixed(precision)))
  })

  return <span>{displayValue.toFixed(precision)}</span>
}

function SensorCard({
  label,
  value,
  unit,
  range,
}: {
  label: string
  value: number
  unit: string
  range: [number, number]
}) {
  const outsideRange = value < range[0] || value > range[1]
  const accent = outsideRange ? 'text-rose-300' : 'text-emerald-300'
  const ring = outsideRange ? 'border-rose-400/35 bg-rose-500/10' : 'border-emerald-400/25 bg-emerald-500/10'
  const progressPercent = Math.max(0, Math.min(100, ((value - range[0]) / (range[1] - range[0])) * 100))

  return (
    <motion.div
      className={`rounded-2xl border p-4 shadow-lg shadow-black/20 backdrop-blur-xl ${ring}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</div>
      <div className={`mt-2 flex items-end gap-1 text-3xl font-semibold ${accent}`}>
        <AnimatedNumber value={value} precision={unit === '%' ? 0 : 1} />
        <span className="pb-1 text-sm text-slate-300">{unit}</span>
      </div>

      {/* Progress bar showing position within optimal range */}
      <div className="mt-3 space-y-1">
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className={`h-full ${outsideRange ? 'bg-rose-500' : 'bg-emerald-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="text-xs text-slate-500 flex justify-between px-0.5">
          <span>{range[0]}</span>
          <span>{range[1]}</span>
        </div>
      </div>
    </motion.div>
  )
}

function SensorMetrics() {
  const { sensors, profile } = useFarmStore(
    useShallow((state) => ({ sensors: state.sensors, profile: state.profile })),
  )

  const optimal = profile?.optimal ?? {
    temp: [21, 27],
    humidity: [55, 75],
    moisture: [35, 68],
    ph: [5.8, 6.5],
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Environmental Sensors</p>
          <h2 className="text-lg font-semibold text-white">Real-time climate data</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {profile?.name ?? 'Default profile'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SensorCard label="Temperature" value={sensors.temp} unit="°C" range={optimal.temp} />
        <SensorCard label="Humidity" value={sensors.humidity} unit="%" range={optimal.humidity} />
        <SensorCard label="Moisture" value={sensors.moisture} unit="%" range={optimal.moisture} />
        <SensorCard label="pH" value={sensors.ph} unit="pH" range={optimal.ph} />
      </div>
    </section>
  )
}

export default SensorMetrics
