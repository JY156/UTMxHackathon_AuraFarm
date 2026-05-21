import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Droplets, Leaf, Lightbulb, AlertCircle, Wind, Power, History, CloudFog } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore, type LedMode } from '../../../store/useFarmStore'

const eventIcons: Record<string, { icon: any; colorStyle: string }> = {
  '💡': { icon: Lightbulb, colorStyle: 'text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20' },
  '💧': { icon: Droplets, colorStyle: 'text-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-500/20' },
  '🌿': { icon: Leaf, colorStyle: 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20' },
  '⚡': { icon: Zap, colorStyle: 'text-yellow-400 bg-yellow-500/10 ring-1 ring-yellow-500/20' },
}

function ActuatorStatus() {
  const { actuators, automationLog, toggleActuator, setLedMode, alerts } = useFarmStore(
    useShallow((state) => ({
      actuators: state.actuators,
      automationLog: state.automationLog,
      toggleActuator: state.toggleActuator,
      setLedMode: state.setLedMode,
      alerts: state.alerts,
    })),
  )

  const isFanBroken = alerts.some((a) => a.type === 'mechanical_failure' && !a.resolved);

  const activeActuators = actuators || { fan: false, pump: false, mist: false, led: 'off' as LedMode }

  const controls = [
    { 
      id: 'fan', label: 'Ventilation', active: activeActuators.fan, icon: Wind, 
      colorStyle: {
        logo: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
        card: 'border-emerald-500/40 bg-emerald-500/10',
        text: 'text-emerald-400'
      }
    },
    { 
      id: 'pump', label: 'Irrigation', active: activeActuators.pump, icon: Droplets,
      colorStyle: {
        logo: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20',
        card: 'border-cyan-500/40 bg-cyan-500/10',
        text: 'text-cyan-400'
      }
    },
    { 
      id: 'mist', label: 'Misting System', active: activeActuators.mist, icon: CloudFog,
      colorStyle: {
        logo: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
        card: 'border-blue-500/40 bg-blue-500/10',
        text: 'text-blue-400'
      }
    },
    { 
      id: 'led', label: 'Growth LED', active: activeActuators.led !== 'off', icon: Lightbulb, mode: activeActuators.led,
      colorStyle: {
        logo: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
        card: 'border-amber-500/40 bg-amber-500/10',
        text: 'text-amber-400'
      }
    },
  ]

  const handleToggle = (id: string) => {
    if (!actuators) return
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
            const Icon = item.icon;
            const isItemBroken = item.id === 'fan' && isFanBroken;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: isItemBroken ? 1 : 1.02 }}
                whileTap={{ scale: isItemBroken ? 1 : 0.98 }}
                onClick={() => !isItemBroken && handleToggle(item.id)}
                disabled={isItemBroken}
                className={`relative flex items-center justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 backdrop-blur-xl ${
                  isItemBroken
                    ? 'border-red-500/40 bg-red-500/10 cursor-not-allowed opacity-90'
                    : item.active 
                      ? item.colorStyle.card
                      : 'border-white/10 bg-black/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isItemBroken
                      ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/40'
                      : item.active ? item.colorStyle.logo : 'bg-white/5 text-slate-500 ring-1 ring-white/10'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      isItemBroken ? 'text-red-400' : (item.active ? item.colorStyle.text : 'text-slate-500')
                    }`}>
                      {isItemBroken ? 'HARDWARE FAILURE' : (item.id === 'led' ? (item.active ? `Mode: ${item.mode}` : 'Off') : (item.active ? 'System Active' : 'Idle'))}
                    </p>
                  </div>
                </div>
                
                {/* Visual Toggle Switch */}
                <div className={`relative h-5 w-10 rounded-full border transition-colors duration-300 ${
                  isItemBroken ? 'border-red-500/40 bg-red-500/10' : (item.active ? 'border-white/10 bg-emerald-500' : 'border-white/10 bg-slate-800')
                }`}>
                  <motion.div
                    className={`absolute top-0.5 h-3.5 w-3.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${isItemBroken ? 'bg-red-500/50' : 'bg-white'}`}
                    animate={{ x: item.active && !isItemBroken ? 22 : 2 }}
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
                    let iconConfig = { icon: AlertCircle, colorStyle: 'text-slate-400 bg-white/5 ring-1 ring-white/10' }
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
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconConfig.colorStyle}`}>
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
