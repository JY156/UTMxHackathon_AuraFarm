import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function GrowthChart() {
  const history = useFarmStore(useShallow((state) => state.history))
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chart = useMemo(() => {
    const width = 920
    const height = 320
    const padding = { top: 32, right: 32, bottom: 60, left: 60 }

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
    const minValue = Math.min(0, ...values)
    const scale = (value: number) => {
      const normalized = (value - minValue) / (maxValue - minValue || 1)
      return height - padding.bottom - normalized * innerHeight
    }

    const pathFor = (key: 'temp' | 'humidity' | 'moisture') =>
      points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${scale(point[key]).toFixed(2)}`)
        .join(' ')

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
    { key: 'temp' as const, label: 'Temperature', color: '#fb7185', area: 'rgba(251, 113, 133, 0.1)' },
    { key: 'humidity' as const, label: 'Humidity', color: '#38bdf8', area: 'rgba(56, 189, 248, 0.1)' },
    { key: 'moisture' as const, label: 'Moisture', color: '#34d399', area: 'rgba(52, 211, 153, 0.1)' },
  ]

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Climate History</p>
          <h2 className="text-lg font-semibold text-white">Rolling 60-minute timeline</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Live data
        </div>
      </div>

      <div className="h-96 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-full w-full" onMouseLeave={() => setHoveredIndex(null)}>
          <defs>
            <linearGradient id="temp-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="humidity-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="moisture-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((row) => (
            <g key={`h-${row}`}>
              <line
                x1={chart.padding.left}
                y1={chart.padding.top + (row * chart.innerHeight) / 4}
                x2={chart.width - chart.padding.right}
                y2={chart.padding.top + (row * chart.innerHeight) / 4}
                stroke="rgba(148,163,184,0.12)"
              />
              <text
                x={chart.padding.left - 8}
                y={chart.padding.top + (row * chart.innerHeight) / 4 + 4}
                fontSize="12"
                fill="rgba(148,163,184,0.6)"
                textAnchor="end"
              >
                {Math.round(chart.maxValue - (row * chart.maxValue) / 4)}
              </text>
            </g>
          ))}

          {/* Vertical grid */}
          {[0, 1, 2, 3].map((column) => (
            <line
              key={column}
              x1={chart.padding.left + (column * chart.innerWidth) / 3}
              y1={chart.padding.top}
              x2={chart.padding.left + (column * chart.innerWidth) / 3}
              y2={chart.height - chart.padding.bottom}
              stroke="rgba(148,163,184,0.08)"
            />
          ))}

          {/* Area fills */}
          {lines.map((line) => (
            <path
              key={`area-${line.key}`}
              d={chart.areaPathFor(line.key)}
              fill={line.area}
              stroke="none"
            />
          ))}

          {/* Lines */}
          {lines.map((line) => (
            <path
              key={`line-${line.key}`}
              d={chart.pathFor(line.key)}
              fill="none"
              stroke={line.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Hover line and points */}
          {hoveredIndex !== null && (
            <>
              <line
                x1={chart.points[hoveredIndex].x}
                y1={chart.padding.top}
                x2={chart.points[hoveredIndex].x}
                y2={chart.height - chart.padding.bottom}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4"
              />
              {lines.map((line) => (
                <circle
                  key={`hover-${line.key}`}
                  cx={chart.points[hoveredIndex].x}
                  cy={chart.scale(chart.points[hoveredIndex][line.key])}
                  r="6"
                  fill={line.color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
            </>
          )}

          {/* Interactive hover zone */}
          {chart.points.map((point, index) => (
            <circle
              key={`hover-zone-${index}`}
              cx={point.x}
              cy={chart.padding.top + chart.innerHeight / 2}
              r="12"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(index)}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-3">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: line.color }} />
            <span className="text-slate-300">{line.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default GrowthChart
