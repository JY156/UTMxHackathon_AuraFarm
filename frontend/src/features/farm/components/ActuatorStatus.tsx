import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Droplets, Leaf, Lightbulb, AlertCircle, Wind, Power, History, CloudFog } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore, type LedMode } from '../../../store/useFarmStore'

const eventIcons: Record<string, { icon: any; color: string; bg: string }> = {
  '💡': { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  '💧': { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  '🌿': { icon: Leaf, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  '⚡': { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
}

function ActuatorStatus() {
  const { actuators, automationLog, toggleActuator, setLedMode } = useFarmStore(
    useShallow((state) => ({
      actuators: state.actuators,
      automationLog: state.automationLog,
      toggleActuator: state.toggleActuator,
      setLedMode: state.setLedMode,
    })),
  )

  const controls = [
    { id: 'fan', label: 'Ventilation', active: actuators.fan, icon: Wind, color: 'emerald' },
    { id: 'pump', label: 'Irrigation', active: actuators.pump, icon: Droplets, color: 'cyan' },
    { id: 'mist', label: 'Misting System', active: actuators.mist, icon: CloudFog, color: 'blue' },
    { id: 'led', label: 'Growth LED', active: actuators.led !== 'off', icon: Lightbulb, color: 'amber', mode: actuators.led },
  ]

  const handleToggle = (id: string) => {
    if (id === 'led') {
      const modes: LedMode[] = ['off', 'full', 'purple']
      const currentIndex = modes.indexOf(actuators.led)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      setLedMode(nextMode)
    } else {
      toggleActuator(id as 'fan' | 'pump' | 'mist')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Manual Control</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <Power size={10} /> Toggle Active
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {controls.map((item) => {
            const Icon = item.icon
            const colorClass = item.color === 'blue' ? 'blue' : item.color
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToggle(item.id)}
                className={`relative flex items-center justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 backdrop-blur-xl ${
                  item.active 
                    ? `border-${colorClass}-500/40 bg-${colorClass}-500/10` 
                    : 'border-white/10 bg-black/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    item.active ? `bg-${colorClass}-500/20 text-${colorClass}-400` : 'bg-white/5 text-slate-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${item.active ? `text-${colorClass}-400` : 'text-slate-500'}`}>
                      {item.id === 'led' ? (item.active ? `Mode: ${item.mode}` : 'Off') : (item.active ? 'System Active' : 'Idle')}
                    </p>
                  </div>
                </div>
                
                {/* Visual Toggle Switch */}
                <div className={`relative h-5 w-10 rounded-full border border-white/10 transition-colors duration-300 ${item.active ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                  <motion.div
                    className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    animate={{ x: item.active ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Activity Log</h3>
          <History size={14} className="text-slate-500" />
        </div>

        <div className="max-h-[220px] overflow-y-auto rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl scrollbar-hide">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {automationLog.length ? (
                automationLog
                  .slice()
                  .reverse()
                  .map((entry, i) => {
                    let iconConfig = { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-white/5' }
                    let displayText = entry
                    
                    for (const [emoji, config] of Object.entries(eventIcons)) {
                      if (entry.includes(emoji)) {
                        iconConfig = config
                        displayText = entry.replace(emoji, '').trim()
                        break
                      }
                    }

                    const LogIcon = iconConfig.icon

                    return (
                      <motion.div 
                        key={entry + i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 last:border-0"
                      >
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconConfig.bg} ${iconConfig.color}`}>
                          <LogIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium leading-relaxed text-slate-300">{displayText}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">Sync Completed</p>
                        </div>
                      </motion.div>
                    )
                  })
              ) : (
                <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Awaiting Signals
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ActuatorStatus
