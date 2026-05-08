import { memo, useState, useEffect } from 'react'
import { Radio, BarChart3, Bot, ChevronLeft, ChevronRight, Settings, Bell, Cpu, Activity, Zap, Mic } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { motion, AnimatePresence } from 'framer-motion'
import { useFarmStore } from '../../../store/useFarmStore'
import { useWebSocket } from '../../../hooks/useWebSocket'
import { useVoiceCommand } from '../../../hooks/useVoiceCommand'
import FarmScene from '../FarmScene'
import SensorMetrics from './SensorMetrics'
import ActuatorStatus from './ActuatorStatus'
import AlertSystem from './AlertSystem'
import GrowthChart from './GrowthChart'
import ImpactTracker from './ImpactTracker'
import AIPanel from './AIPanel'
import JSONImporter from './JSONImporter'
import DemoController from './DemoController'

const FarmViewport = memo(function FarmViewport() {
  const { sensors, actuators, alerts, profile } = useFarmStore(
    useShallow((state) => ({
      sensors: state.sensors,
      actuators: state.actuators,
      alerts: state.alerts,
      profile: state.profile,
    })),
  )

  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical' && !alert.resolved)

  return <FarmScene sensors={sensors} actuators={actuators} alerts={criticalAlerts} profile={profile} />
})

function SystemStatus() {
  const [time, setTime] = useState(new Date())
  const { autoMode, toggleAutoMode } = useFarmStore(
    useShallow((state) => ({
      autoMode: state.autoMode,
      toggleAutoMode: state.toggleAutoMode,
    })),
  )

  // Check if we are receiving live data or running in fallback
  const isLive = useFarmStore((state) => state.automationLog.length > 0)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-6 text-[10px] font-medium uppercase tracking-widest text-slate-400">
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span>{isLive ? 'API LIVE' : 'DEMO MODE (No Backend)'}</span>
      </div>
      
      <button 
        onClick={toggleAutoMode}
        className={`flex items-center gap-2 rounded-full border px-3 py-1 transition-all ${
          autoMode 
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
        }`}
      >
        <div className={`h-1 w-1 rounded-full ${autoMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        <span>{autoMode ? 'Automated Mode' : 'Manual Override'}</span>
      </button>

      <div className="flex items-center gap-2">
        <Cpu size={12} className="text-emerald-400/70" />
        <span>82% Load</span>
      </div>
      <div className="flex items-center gap-2">
        <Activity size={12} className="text-emerald-400/70" />
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  )
}

function DashboardLayout() {
  useWebSocket()
  const { isListening, transcript, startListening, stopListening } = useVoiceCommand()
  const [activeTab, setActiveTab] = useState<'monitor' | 'analytics' | 'ai'>('monitor')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tabs = [
    { id: 'monitor' as const, label: 'Live Monitor', icon: Radio },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'ai' as const, label: 'AI & Config', icon: Bot },
  ]

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-100">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(16,185,129,0.08),_transparent_40%),radial-gradient(circle_at_80%_70%,_rgba(6,182,212,0.08),_transparent_40%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      {/* Sidebar */}
      <aside 
        className={`relative z-30 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="flex h-24 items-center justify-between px-6">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div 
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20">
                  <Zap size={22} className="text-white" fill="currentColor" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Aura<span className="text-emerald-400">Farm</span></span>
              </motion.div>
            ) : (
              <motion.div 
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20"
              >
                <Zap size={22} className="text-white" fill="currentColor" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <IconComponent size={22} strokeWidth={isActive ? 2 : 1.5} className="relative z-10 transition-transform group-hover:scale-110" />
                {sidebarOpen && (
                  <span className="relative z-10 text-sm font-semibold tracking-wide">
                    {tab.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center justify-center rounded-xl border border-white/5 bg-white/5 py-3 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-24 items-center justify-between border-b border-white/5 bg-black/20 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <SystemStatus />
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {tabs.find(t => t.id === activeTab)?.label}
              {transcript && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
                >
                  "{transcript}"
                </motion.span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-1">
              <button 
                onClick={isListening ? stopListening : startListening}
                className={`relative rounded-xl p-2.5 transition-all ${
                  isListening 
                    ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic size={20} />
                    <motion.div 
                      layoutId="mic-pulse"
                      className="absolute inset-0 rounded-xl border-2 border-rose-500"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </>
                ) : (
                  <Mic size={20} />
                )}
              </button>
              <button className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
                <Bell size={20} />
              </button>
              <button className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
                <Settings size={20} />
              </button>
            </div>
            <div className="h-10 w-10 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-slate-700 to-slate-900 p-0.5 shadow-lg">
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-emerald-400">
                AF
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {activeTab === 'monitor' && (
                <div className="grid h-full gap-6 xl:grid-cols-[1fr_400px]">
                  <section className="relative min-h-[600px] flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
                    <div className="absolute left-6 top-6 z-20 flex items-center gap-3">
                      <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 backdrop-blur-md">
                        3D Rack Viewport
                      </div>
                    </div>
                    <FarmViewport />
                  </section>

                  <aside className="flex flex-col gap-6 overflow-y-auto">
                    <SensorMetrics />
                    <ActuatorStatus />
                    <AlertSystem />
                  </aside>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="flex flex-col gap-6">
                  <GrowthChart />
                  <ImpactTracker />
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                  <AIPanel />
                  <JSONImporter />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <DemoController />
    </div>
  )
}

export default DashboardLayout
