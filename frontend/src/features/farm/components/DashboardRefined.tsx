import { memo, useState, useEffect, useRef } from 'react'
import { Radio, BarChart3, Bot, ChevronLeft, Settings, Mic, Zap, Cpu, Activity, Info, AlertTriangle } from 'lucide-react'
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

// Compact version of SensorMetrics for the refined layout
function CompactSensorMetrics() {
  const { sensors, profile } = useFarmStore(
    useShallow((state) => ({ sensors: state.sensors, profile: state.profile })),
  )

  const optimal = profile?.optimal ?? {
    temp: [21, 27],
    humidity: [55, 75],
    moisture: [35, 68],
    ph: [5.8, 6.5],
  }

  const items = [
    { label: 'TEMP', value: sensors.temp, unit: '°C', range: optimal.temp, color: 'orange' },
    { label: 'HUM', value: sensors.humidity, unit: '%', range: optimal.humidity, color: 'blue' },
    { label: 'MOIST', value: sensors.moisture, unit: '%', range: optimal.moisture, color: 'cyan' },
    { label: 'PH', value: sensors.ph, unit: 'pH', range: optimal.ph, color: 'purple' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const outsideRange = item.value < item.range[0] || item.value > item.range[1]
        return (
          <div key={item.label} className="group relative rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:bg-black/40">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest text-slate-500">{item.label}</span>
              <div className={`h-1 w-1 rounded-full ${outsideRange ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{item.value.toFixed(item.label === 'PH' ? 1 : 0)}</span>
              <span className="text-[10px] text-slate-500">{item.unit}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HUDAccents() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* Corner Brackets */}
      <div className="absolute left-8 top-8 h-12 w-12 border-l-2 border-t-2 border-emerald-500/30" />
      <div className="absolute right-8 top-8 h-12 w-12 border-r-2 border-t-2 border-emerald-500/30" />
      <div className="absolute bottom-16 left-8 h-12 w-12 border-b-2 border-l-2 border-emerald-500/30" />
      <div className="absolute bottom-16 right-8 h-12 w-12 border-b-2 border-r-2 border-emerald-500/30" />
      
      {/* Decorative Scan Lines */}
      <div className="absolute left-1/2 top-8 h-[1px] w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      <div className="absolute bottom-16 left-1/2 h-[1px] w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </div>
  )
}

function ActionTicker() {
  const logs = useFarmStore((state) => state.automationLog).slice(-3).reverse()
  
  return (
    <div className="hud-footer pointer-events-auto absolute bottom-0 left-0 right-0 flex h-12 items-center border-t border-white/10 bg-black/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <Activity size={14} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Live Telemetry</span>
        </div>
        <div className="flex gap-8 overflow-hidden whitespace-nowrap">
          {logs.length > 0 ? logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-300">{log}</span>
            </div>
          )) : (
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">System standby // Awaiting telemetry...</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SystemStatus() {
  const [time, setTime] = useState(new Date())
  const { autoMode, toggleAutoMode } = useFarmStore(
    useShallow((state) => ({
      autoMode: state.autoMode,
      toggleAutoMode: state.toggleAutoMode,
    })),
  )

  const isLive = useFarmStore((state) => state.automationLog.length > 0)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-6 text-[10px] font-medium uppercase tracking-widest text-slate-400">
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span>{isLive ? 'API LIVE' : 'DEMO'}</span>
      </div>
      
      <button 
        onClick={toggleAutoMode}
        className={`flex items-center gap-2 rounded-full border px-3 py-0.5 transition-all ${
          autoMode 
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
        }`}
      >
        <span>{autoMode ? 'Auto' : 'Manual'}</span>
      </button>

      <div className="flex items-center gap-2">
        <Activity size={12} className="text-emerald-400/70" />
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  )
}

function DashboardRefined() {
  useWebSocket()
  const { isListening, startListening, stopListening } = useVoiceCommand()
  const [activeTab, setActiveTab] = useState<'monitor' | 'analytics' | 'ai'>('monitor')
  const container = useRef<HTMLDivElement>(null)
  
  const { inspectedId, setInspectedId, alerts, sensors, actuators, profile } = useFarmStore(
    useShallow((state) => ({
      inspectedId: state.inspectedId,
      setInspectedId: state.setInspectedId,
      alerts: state.alerts,
      sensors: state.sensors,
      actuators: state.actuators,
      profile: state.profile
    })),
  )

  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical' && !alert.resolved)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } })
    tl.from('.hud-header', { y: -20, opacity: 0 })
      .from('.hud-nav', { x: -20, opacity: 0 }, '<')
      .from('.hud-right', { x: 20, opacity: 0 }, '<')
      .from('.hud-footer', { y: 20, opacity: 0 }, '<')
  }, { scope: container })

  const tabs = [
    { id: 'monitor' as const, label: 'Monitor', icon: Radio },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'ai' as const, label: 'Config', icon: Bot },
  ]

  return (
    <div ref={container} className="relative h-screen w-screen overflow-hidden bg-[#020617] text-slate-100 font-sans antialiased">
      {/* 🌌 BACKGROUND: The 3D World */}
      <div className="absolute inset-0 z-0">
        <FarmScene 
          sensors={sensors} 
          actuators={actuators} 
          alerts={criticalAlerts} 
          profile={profile} 
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)]" />
      </div>

      <HUDAccents />

      {/* 🛸 UI LAYER */}
      <div className="relative z-10 flex h-full w-full flex-col pointer-events-none">
        
        {/* HEADER */}
        <header className="hud-header flex h-16 items-center justify-between px-8 pointer-events-auto border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-black tracking-tighter text-white uppercase">
                Aura<span className="text-emerald-400">Farm</span>
              </span>
              <div className="h-4 w-[1px] bg-white/10" />
              <SystemStatus />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-1 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                    {inspectedId ? `SCAN: ${inspectedId.replace('-', ' ')}` : 'SYSTEM: ACTIVE'}
                  </span>
                </div>
              </div>
            
            <button 
              onClick={isListening ? stopListening : startListening}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all border ${
                isListening 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
              {isListening && (
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
                </span>
              )}
            </button>
            <button className="rounded-xl p-2 text-slate-400 hover:bg-white/5">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* MAIN AREA */}
        <div className="flex flex-1 overflow-hidden p-6 pb-16 gap-6">
          
          {/* NAV SIDEBAR */}
          <div className="hud-nav group/nav flex flex-col gap-4 pointer-events-auto">
            <nav className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-2xl transition-all duration-300 hover:w-40 w-[60px] overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex h-12 w-full items-center gap-4 px-3 rounded-xl transition-all ${
                      isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100 whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </nav>

            {inspectedId && (
              <button
                onClick={() => setInspectedId(null)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-xl transition-all hover:bg-emerald-500/30 pointer-events-auto"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 flex justify-end">
            <AnimatePresence mode="wait">
              {activeTab === 'monitor' ? (
                <motion.aside 
                  key="monitor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="hud-right w-80 pointer-events-auto flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1"
                >
                  {/* Status Summary (Always there) */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Status</span>
                    </div>
                    {inspectedId ? (
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Selected Entity</div>
                        <div className="text-sm font-bold text-white uppercase">{inspectedId.replace('-', ' ')}</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Environment</div>
                        <div className="text-sm font-bold text-white uppercase">{profile?.name || 'Standard'}</div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Content: Component Details OR Sensors */}
                  <AnimatePresence mode="wait">
                    {inspectedId ? (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <ComponentDetails />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="global"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-4"
                      >
                         {/* Compact Sensors */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment</span>
                            <Zap size={12} className="text-amber-400" />
                          </div>
                          <CompactSensorMetrics />
                        </div>

                        {/* Actuators */}
                        <ActuatorStatus />

                        {/* Alerts */}
                        <AlertSystem />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.aside>
              ) : (
                <motion.div
                  key="full-panel"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-3xl pointer-events-auto overflow-y-auto"
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

        <ActionTicker />
      </div>

      <ToastSystem />
      <div className="hud-demo opacity-50 hover:opacity-100 transition-opacity">
        <DemoController />
      </div>
    </div>
  )
}

export default DashboardRefined
