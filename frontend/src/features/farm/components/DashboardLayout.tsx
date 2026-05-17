import { memo, useState, useEffect, useRef } from 'react'
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
import ToastSystem from './ToastSystem'
import ComponentDetails from './ComponentDetails'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

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

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-6 text-[10px] font-medium uppercase tracking-widest text-slate-400">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-500" />
        <span>API LIVE</span>
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
  const container = useRef<HTMLDivElement>(null)
  
  const { inspectedId, setInspectedId, alerts, sensors, actuators } = useFarmStore(
    useShallow((state) => ({
      inspectedId: state.inspectedId,
      setInspectedId: state.setInspectedId,
      alerts: state.alerts,
      sensors: state.sensors,
      actuators: state.actuators,
    })),
  )

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } })
    
    // Snappier, high-performance entrance
    tl.from('.hud-widget-left', { x: -40, opacity: 0, stagger: 0.1 })
      .from('.hud-widget-right', { x: 40, opacity: 0, stagger: 0.1 }, '<')
      .from('.hud-header', { y: -40, opacity: 0, force3D: true }, '-=0.4')
      .from('.hud-demo', { scale: 0.95, opacity: 0, duration: 0.7, ease: 'back.out(1.2)' }, '-=0.2')
  }, { scope: container })

  const tabs = [
    { id: 'monitor' as const, label: 'Live Monitor', icon: Radio },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'ai' as const, label: 'AI & Config', icon: Bot },
  ]

  return (
    <div ref={container} className="relative h-screen w-screen overflow-hidden bg-[#020617] text-slate-100 font-sans antialiased">
      {!sensors || !actuators ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#020617] text-slate-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Zap size={24} className="text-white" fill="currentColor" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Establishing API Link</p>
          </div>
        </div>
      ) : (
      <>
      {/* 🌌 BACKGROUND: The 3D World */}
      <div className="absolute inset-0 z-0">
        <FarmViewport />
        {/* Subtle vignette for depth */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)]" />
      </div>

      {/* 🛸 UI LAYER: Floating HUD */}
      <div className="relative z-10 flex h-full w-full flex-col pointer-events-none">
        
        {/* TOP HUD: Header & Status */}
        <header className="hud-header flex h-24 items-center justify-between px-8 pt-4 pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Zap size={24} className="text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white uppercase">
                Aura<span className="text-emerald-400">Farm</span>
              </span>
              <SystemStatus />
            </div>
          </div>

          <div className="hud-widget-right flex items-center gap-4">
            {/* Dynamic Scanning Title (Top Right) */}
            <div className="flex flex-col items-end gap-1">
              <div className="rounded-lg border border-emerald-500/30 bg-black/60 px-4 py-2 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                    {inspectedId ? `Scanning // ${inspectedId.replace('-', ' ')}` : 'Digital Twin // Active'}
                  </span>
                </div>
              </div>
              <div className="px-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
                Grid Sector A-1 // UTMxHackathon
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={isListening ? stopListening : startListening}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all border backdrop-blur-xl ${
                  isListening 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
                    : 'bg-black/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }`}
              >
                <Mic size={22} strokeWidth={2.5} className={isListening ? 'animate-pulse' : ''} />
                
                {isListening && (
                  <>
                    <div className="absolute -inset-1 rounded-2xl bg-rose-500/10 animate-ping" />
                    <div className="absolute -bottom-12 flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-full border border-rose-500/30 backdrop-blur-md">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-rose-400 tracking-[0.2em] uppercase">Recording</span>
                    </div>
                  </>
                )}
              </button>
              
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-slate-400 backdrop-blur-xl transition-all hover:bg-white/5 hover:text-white">
                <Settings size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN VIEWPORT OVERLAYS */}
        <div className="flex flex-1 overflow-hidden p-8 gap-8">
          {/* LEFT HUD: Global Controls & Navigation */}
          <div className="hud-widget-left flex flex-col gap-4 pointer-events-auto shrink-0 w-[72px]">
            <nav className="group/nav flex flex-col gap-2 rounded-[28px] border border-white/10 bg-black/40 p-2 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 w-[72px] hover:w-[200px]">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex h-14 w-full items-center gap-4 px-4 rounded-2xl transition-all ${
                      isActive ? 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={24} className="shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100 whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </nav>

            <AnimatePresence>
              {inspectedId && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  onClick={() => setInspectedId(null)}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-[28px] bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.6)] backdrop-blur-xl transition-all hover:bg-emerald-400 active:scale-95"
                >
                  <ChevronLeft className="h-9 w-9" strokeWidth={3} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'monitor' && (
              <motion.div 
                key="monitor-ui"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-1 justify-end relative"
              >
                {/* RIGHT: Metrics Panel */}
                <aside className="hud-widget-right w-[400px] pointer-events-auto overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    <motion.div
                      key={inspectedId || 'global'}
                      layout
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="flex flex-col gap-6"
                    >
                      {inspectedId ? (
                        <ComponentDetails />
                      ) : (
                        <>
                          {/* Alert System Elevates to Top if Active */}
                          {alerts.filter(a => !a.resolved).length > 0 && <AlertSystem />}
                          
                          <SensorMetrics />
                          <ActuatorStatus />

                          {/* Alert System Stays at Bottom if Nominal */}
                          {alerts.filter(a => !a.resolved).length === 0 && <AlertSystem />}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </aside>
              </motion.div>
            )}

            {activeTab !== 'monitor' && (
              <motion.div
                key="other-tabs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mx-auto w-full max-w-6xl rounded-[40px] border border-white/10 bg-black/60 p-8 backdrop-blur-3xl pointer-events-auto overflow-y-auto"
              >
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
            )}
          </AnimatePresence>
        </div>
      </div>

      <ToastSystem />
      <div className="hud-demo">
        <DemoController />
      </div>
      </>
      )}
    </div>
  )
}

export default DashboardLayout
