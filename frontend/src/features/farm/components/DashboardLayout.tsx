import { memo, useState } from 'react'
import { Radio, BarChart3, Bot, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'
import { useWebSocket } from '../../../hooks/useWebSocket'
import FarmScene from '../sensors/FarmScene'
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

function DashboardLayout() {
  useWebSocket()
  const [activeTab, setActiveTab] = useState<'monitor' | 'analytics' | 'ai'>('monitor')
  const [sidebarOpen, setSidebarOpen] = useState(true)


  const tabs = [
    { id: 'monitor' as const, label: 'Live Monitor', icon: Radio },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'ai' as const, label: 'AI & Config', icon: Bot },
  ]

  return (
    <div className="relative min-h-screen bg-[#050b18] text-slate-100 flex overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(135deg,_#040711_0%,_#08111f_45%,_#071220_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:96px_96px]" />

      {/* Left Sidebar Navigation */}
      <aside className={`relative z-20 flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-20'} gap-4 p-3`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="self-end rounded-lg p-2 hover:bg-white/10 transition text-slate-300"
          title={sidebarOpen ? 'Collapse' : 'Expand'}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                    : 'border border-transparent text-slate-400 hover:bg-white/5'
                } whitespace-nowrap`}
              >
                <IconComponent size={20} className="flex-shrink-0" strokeWidth={1.5} />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="relative z-10 flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-y-auto">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">AuraFarm OS</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Precision vertical farming, automated.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Real-time climate monitoring with AI-driven automation. Grow more with less, everywhere.
            </p>
          </div>
        </header>

        {activeTab === 'monitor' && (
          <main className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(360px,0.7fr)]">
            <section className="relative min-h-[680px] overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-2xl shadow-black/30 backdrop-blur-md">
              <div className="absolute left-5 top-5 z-20 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-200">
                3D Rack
              </div>
              <FarmViewport />
            </section>

            <aside className="grid gap-4 auto-rows-max">
              <SensorMetrics />
              <ActuatorStatus />
              <AlertSystem />
            </aside>
          </main>
        )}

        {activeTab === 'analytics' && (
          <main className="grid flex-1 gap-4 auto-rows-max">
            <GrowthChart />
            <ImpactTracker />
          </main>
        )}

        {activeTab === 'ai' && (
          <main className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <AIPanel />
            <JSONImporter />
          </main>
        )}
      </div>

      <DemoController />
    </div>
  )
}

export default DashboardLayout
