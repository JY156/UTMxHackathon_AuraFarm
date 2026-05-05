import { motion } from 'framer-motion'
import { Zap, Droplets, Leaf, Lightbulb, AlertCircle } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

const eventIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  '💡': { icon: <Lightbulb size={14} />, color: 'text-amber-400' },
  '💧': { icon: <Droplets size={14} />, color: 'text-cyan-400' },
  '🌿': { icon: <Leaf size={14} />, color: 'text-emerald-400' },
  '⚡': { icon: <Zap size={14} />, color: 'text-yellow-400' },
}

function ActuatorStatus() {
  const { actuators, automationLog } = useFarmStore(
    useShallow((state) => ({
      actuators: state.actuators,
      automationLog: state.automationLog,
    })),
  )

  const badges = [
    { label: 'Fan', active: actuators.fan },
    { label: 'Pump', active: actuators.pump },
    { label: 'LED', active: actuators.led !== 'off' },
  ]

  return (
    <section className="grid auto-rows-max gap-4">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Actuator Control</p>
          <h2 className="text-lg font-semibold text-white">Rule engine output</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {badges.map((badge) => (
            <motion.div
              key={badge.label}
              className={`rounded-2xl border px-3 py-4 text-center relative ${
                badge.active ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'
              }`}
              animate={badge.active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              {badge.active && (
                <div className="absolute top-2 right-2 h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
              <div className="text-xs uppercase tracking-[0.35em]">{badge.label}</div>
              <div className="mt-2 text-sm font-medium">{badge.active ? 'Active' : 'Idle'}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="mb-3 text-xs uppercase tracking-[0.35em] text-slate-400">Event Log</div>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/50 p-3">
          <div className="space-y-2 text-sm text-slate-200">
            {automationLog.length ? (
              automationLog
                .slice(-5)
                .reverse()
                .map((entry, i, arr) => {
                  const secondsAgo = (arr.length - i - 1) * 3
                  const timeLabel = secondsAgo < 60 ? `${secondsAgo}s` : `${Math.round(secondsAgo / 60)}m`

                  // Extract emoji from entry to map to icon
                  let iconComponent = null
                  let color = 'text-slate-400'
                  for (const [emoji, { icon, color: c }] of Object.entries(eventIcons)) {
                    if (entry.includes(emoji)) {
                      iconComponent = icon
                      color = c
                      break
                    }
                  }

                  // Clean emoji from display text
                  let displayText = entry
                  for (const emoji of Object.keys(eventIcons)) {
                    displayText = displayText.replace(emoji, '').trim()
                  }

                  return (
                    <div key={i} className="flex items-start gap-2 border-b border-white/5 pb-2 last:border-0">
                      <span className={`mt-0.5 flex-shrink-0 ${color}`}>
                        {iconComponent || <AlertCircle size={14} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="leading-5 break-words text-xs">{displayText}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{timeLabel} ago</div>
                      </div>
                    </div>
                  )
                })
            ) : (
              <div className="text-slate-500 text-xs">Awaiting automation events...</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ActuatorStatus
