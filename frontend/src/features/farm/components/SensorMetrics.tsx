import { motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Thermometer, Droplets, Waves, FlaskConical, TrendingUp, TrendingDown, Database, Camera } from 'lucide-react'
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
  
  // Calculate relative position for the marker
  // The track shows the range from (Min - 50% of span) to (Max + 50% of span)
  const span = range[1] - range[0]
  const absMin = range[0] - span * 0.5
  const absMax = range[1] + span * 0.5
  
  const markerPercent = Math.max(0, Math.min(100, ((value - absMin) / (absMax - absMin)) * 100))

  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
    blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  }
  const activeColorStyle = colorMap[color] || colorMap.blue

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-5 backdrop-blur-xl transition-all duration-500 hover:bg-black/90 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${activeColorStyle}`}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0">
          {outsideRange ? (
            <span className="flex items-center gap-1.5 text-rose-400 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5">
              ALERT
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5">
              OPTIMAL
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-end justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-bold tracking-tight text-white">
            <AnimatedNumber value={value} precision={unit === 'pH' ? 1 : 0} />
          </h3>
          <span className="text-sm font-medium text-slate-500">{unit}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-4 space-y-2">
        <div className="relative h-1.5 w-full rounded-full bg-black/60 border border-white/5">
          {/* Optimal Zone (Middle 50%) */}
          <div className="absolute h-full bg-emerald-500/20 left-[25%] w-[50%] rounded-full" />
          
          {/* Value Marker */}
          <motion.div
            className={`absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full ${
              outsideRange ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : `bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]`
            }`}
            initial={{ left: '50%' }}
            animate={{ left: `${markerPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex justify-between text-[9px] font-bold tracking-widest uppercase text-slate-600 px-[25%] relative">
          <span className="absolute left-[25%] -translate-x-1/2">Min: {range[0]}</span>
          <span className="absolute right-[25%] translate-x-1/2">Max: {range[1]}</span>
        </div>
      </div>
    </motion.div>
  )
}


function SensorMetrics() {
  const { sensors, profile, cvData } = useFarmStore(
    useShallow((state) => ({ sensors: state.sensors, profile: state.profile, cvData: state.cvData })),
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
        
        {/* CV Health View */}
        {cvData && (
          <>
            <div className="col-span-2 px-2 mt-2">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Nutrient Analysis</h3>
            </div>
            
            <div className="col-span-2 rounded-3xl border border-white/10 bg-black/80 p-5 backdrop-blur-xl flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Nitrogen',
                    key: 'nitrogen',
                    data: cvData.nutrient_deficiencies.nitrogen,
                  },
                  {
                    label: 'Phosphorus',
                    key: 'phosphorus',
                    data: cvData.nutrient_deficiencies.phosphorus,
                  },
                  {
                    label: 'Potassium',
                    key: 'potassium',
                    data: cvData.nutrient_deficiencies.potassium,
                  },
                ].map((item) => {
                  const optimal = !item.data.detected
                  const confidence = Math.round((item.data.confidence || 0.94) * 100)

                  return (
                    <div
                      key={item.key}
                      className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 p-3 transition-all duration-300 hover:bg-white/10"
                    >
                      {/* Top: Optimal Badge */}
                      <div className="w-full flex justify-center">
                        {optimal ? (
                          <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            OPTIMAL
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[8px] font-black uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse">
                            ALERT
                          </span>
                        )}
                      </div>

                      {/* Middle: Name */}
                      <div className="flex flex-col items-center mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-100 text-center">{item.label}</span>
                      </div>

                      {/* Bottom: Confidence */}
                      <span className="text-[8px] font-bold text-slate-500 tracking-wider text-center">AI Conf: {confidence}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default SensorMetrics
