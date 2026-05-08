import { motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Thermometer, Droplets, Waves, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react'
import { useFarmStore } from '../../../store/useFarmStore'

function AnimatedNumber({ value, precision = 1 }: { value: number; precision?: number }) {
  const springValue = useSpring(value, { stiffness: 100, damping: 20 })
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
  icon: Icon,
  color,
}: {
  label: string
  value: number
  unit: string
  range: [number, number]
  icon: any
  color: string
}) {
  const outsideRange = value < range[0] || value > range[1]
  const progressPercent = Math.max(0, Math.min(100, ((value - range[0]) / (range[1] - range[0])) * 100))

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-5 transition-all duration-500 hover:bg-white/10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-500/10 text-${color}-400 ring-1 ring-${color}-500/20`}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {outsideRange ? (
            <span className="flex items-center gap-1 text-rose-400">
              <TrendingUp size={10} /> Alert
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingDown size={10} /> Optimal
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <h3 className="text-3xl font-bold tracking-tight text-white">
            <AnimatedNumber value={value} precision={unit === 'pH' ? 1 : 0} />
          </h3>
          <span className="text-sm font-medium text-slate-500">{unit}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-4 space-y-2">
        <div className="relative h-1.5 w-full rounded-full bg-white/5">
          <motion.div
            className={`absolute h-full rounded-full bg-gradient-to-r from-${color}-500 to-${color}-400 shadow-[0_0_12px_rgba(var(--${color}-500-rgb),0.4)]`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-600">
          <span>{range[0]}{unit}</span>
          <span>{range[1]}{unit}</span>
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
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Environment</h3>
        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          {profile?.name || 'Standard'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SensorCard 
          label="Temperature" 
          value={sensors.temp} 
          unit="°C" 
          range={optimal.temp} 
          icon={Thermometer}
          color="orange"
        />
        <SensorCard 
          label="Humidity" 
          value={sensors.humidity} 
          unit="%" 
          range={optimal.humidity} 
          icon={Droplets}
          color="blue"
        />
        <SensorCard 
          label="Moisture" 
          value={sensors.moisture} 
          unit="%" 
          range={optimal.moisture} 
          icon={Waves}
          color="cyan"
        />
        <SensorCard 
          label="Acidity" 
          value={sensors.ph} 
          unit="pH" 
          range={optimal.ph} 
          icon={FlaskConical}
          color="purple"
        />
      </div>
    </section>
  )
}

export default SensorMetrics
