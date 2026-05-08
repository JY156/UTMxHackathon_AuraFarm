import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'
import { TrendingUp, Clock, MousePointer2 } from 'lucide-react'

function GrowthChart() {
  const history = useFarmStore(useShallow((state) => state.history))
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chart = useMemo(() => {
    const width = 1000
    const height = 400
    const padding = { top: 40, right: 40, bottom: 60, left: 60 }

    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    const points = history.map((entry, index) => ({
      x: history.length > 1 ? padding.left + (index / (history.length - 1)) * innerWidth : width / 2,
      temp: entry.temp,
      humidity: entry.humidity,
      moisture: entry.moisture,
    }))

    const values = points.flatMap((point) => [point.temp, point.humidity, point.moisture])
    const maxValue = Math.max(100, ...values)
    const minValue = 0
    const scale = (value: number) => {
      const normalized = (value - minValue) / (maxValue - minValue || 1)
      return height - padding.bottom - normalized * innerHeight
    }

    const pathFor = (key: 'temp' | 'humidity' | 'moisture') => {
      if (points.length < 2) return ''
      return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${scale(point[key]).toFixed(2)}`)
        .join(' ')
    }

    const areaPathFor = (key: 'temp' | 'humidity' | 'moisture') => {
      if (points.length < 2) return ''
      const linePath = pathFor(key)
      const lastPoint = points[points.length - 1]
      const firstPoint = points[0]
      return `${linePath} L ${lastPoint.x} ${height - padding.bottom} L ${firstPoint.x} ${height - padding.bottom} Z`
    }

    return { width, height, padding, innerWidth, innerHeight, pathFor, areaPathFor, scale, minValue, maxValue, points }
  }, [history])

  const lines = [
    { key: 'temp' as const, label: 'Temperature', color: '#fb7185', grad: 'temp-grad' },
    { key: 'humidity' as const, label: 'Humidity', color: '#38bdf8', grad: 'humidity-grad' },
    { key: 'moisture' as const, label: 'Moisture', color: '#34d399', grad: 'moisture-grad' },
  ]

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Growth Analytics</h3>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Clock size={12} /> Live telemetry window (60m)
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-bold text-slate-400">
          <TrendingUp size={14} className="text-emerald-400" /> +2.4% Optimal Growth
        </div>
      </header>

      <div className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-black/20 p-8 backdrop-blur-md">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_transparent_70%)]" />
        
        <div className="relative aspect-[2.5/1] w-full">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-full w-full overflow-visible" onMouseLeave={() => setHoveredIndex(null)}>
            <defs>
              {lines.map(line => (
                <linearGradient key={`grad-${line.key}`} id={line.grad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={line.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={line.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>

            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line
                  x1={chart.padding.left}
                  y1={chart.padding.top + (v * chart.innerHeight)}
                  x2={chart.width - chart.padding.right}
                  y2={chart.padding.top + (v * chart.innerHeight)}
                  stroke="rgba(255,255,255,0.03)"
                  strokeDasharray="4 4"
                />
                <text
                  x={chart.padding.left - 15}
                  y={chart.padding.top + (v * chart.innerHeight) + 4}
                  fontSize="10"
                  fontWeight="700"
                  fill="rgba(148,163,184,0.3)"
                  textAnchor="end"
                >
                  {Math.round(chart.maxValue - (v * chart.maxValue))}
                </text>
              </g>
            ))}

            {/* Area Fills */}
            {lines.map((line) => (
              <motion.path
                key={`area-${line.key}`}
                initial={false}
                animate={{ d: chart.areaPathFor(line.key) }}
                fill={`url(#${line.grad})`}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            ))}

            {/* Lines */}
            {lines.map((line) => (
              <motion.path
                key={`line-${line.key}`}
                initial={false}
                animate={{ d: chart.pathFor(line.key) }}
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            ))}

            {/* Interaction Indicators */}
            {hoveredIndex !== null && (
              <g>
                <line
                  x1={chart.points[hoveredIndex].x}
                  y1={chart.padding.top}
                  x2={chart.points[hoveredIndex].x}
                  y2={chart.height - chart.padding.bottom}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                {lines.map((line) => (
                  <circle
                    key={`dot-${line.key}`}
                    cx={chart.points[hoveredIndex].x}
                    cy={chart.scale(chart.points[hoveredIndex][line.key])}
                    r="4"
                    fill={line.color}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}

            {/* Interactive Zones */}
            {chart.points.map((point, index) => (
              <rect
                key={index}
                x={point.x - 10}
                y={chart.padding.top}
                width="20"
                height={chart.innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                className="cursor-crosshair"
              />
            ))}
          </svg>

          {/* Floating Tooltip */}
          {hoveredIndex !== null && (
            <div 
              className="pointer-events-none absolute z-50 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200"
              style={{ 
                left: `${(chart.points[hoveredIndex].x / chart.width) * 100}%`,
                top: '0%',
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="space-y-1.5">
                {lines.map(line => (
                  <div key={line.key} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{line.label}</span>
                    <span className="ml-auto text-xs font-bold text-white">
                      {chart.points[hoveredIndex][line.key].toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between px-2">
        <div className="flex gap-6">
          {lines.map((line) => (
            <div key={line.key} className="flex items-center gap-2">
              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: line.color }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{line.label}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] font-bold text-slate-600 flex items-center gap-2 italic">
          <MousePointer2 size={10} /> Hover timeline for details
        </div>
      </div>
    </section>
  )
}

export default GrowthChart
