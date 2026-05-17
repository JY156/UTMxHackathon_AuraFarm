import React from 'react'
import { useFarmStore } from '../../../store/useFarmStore'
import { useShallow } from 'zustand/react/shallow'
import { motion } from 'framer-motion'
import { Droplet, Wind, Cpu, Sprout, Thermometer, Zap, AlertTriangle, Activity } from 'lucide-react'

export default function ComponentDetails() {
  const { inspectedId, alerts, sensors, actuators } = useFarmStore(
    useShallow((state) => ({
      inspectedId: state.inspectedId,
      alerts: state.alerts,
      sensors: state.sensors,
      actuators: state.actuators,
    })),
  )

  if (!inspectedId || !sensors || !actuators) return null

  const isRack = inspectedId.startsWith('rack-')
  const rackNumber = isRack ? parseInt(inspectedId.split('-')[1]) : null
  const isTank = inspectedId === 'tank'
  const isPump = inspectedId === 'pump'
  const isFan = inspectedId === 'fan'
  const isControlBox = inspectedId === 'control-box'

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[32px] border border-white/10 bg-black/60 p-6 backdrop-blur-3xl shadow-2xl">
        <h2 className="mb-6 flex items-center gap-3 font-mono text-xl font-bold uppercase tracking-widest text-emerald-400">
          {isRack && <Sprout className="h-6 w-6" />}
          {(isTank || isPump) && <Droplet className="h-6 w-6" />}
          {isFan && <Wind className="h-6 w-6" />}
          {isControlBox && <Cpu className="h-6 w-6" />}
          {inspectedId.replace('-', ' ')} DETAILS
        </h2>

        {/* ... (Rack/Tank/Fan/ControlBox logic) */}
        {isRack && (
          <div className="grid gap-4">
            <DetailRow icon={<Thermometer />} label="Local Temp" value={`${(sensors.temp + 0.5).toFixed(1)}°C`} />
            <DetailRow icon={<Droplet />} label="Local Humidity" value={`${(sensors.humidity + 2).toFixed(1)}%`} />
            <DetailRow icon={<Sprout />} label="Crop Status" value="Vegetative (Day 14)" />
            <DetailRow icon={<Zap />} label="Light Level (PPFD)" value={actuators.led === 'full' ? '800 µmol' : actuators.led === 'dimmed' ? '400 µmol' : '0 µmol'} />

            {alerts.some(a => a.target === 'rack' || a.rackId === rackNumber) && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Biological Threat Detected</span>
              </div>
            )}
          </div>
        )}

        {(isTank || isPump) && (
          <div className="grid gap-4">
            <DetailRow icon={<Droplet />} label="Water Level" value={`${sensors.tankLevel.toFixed(1)}%`} />
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div 
                className={`h-full transition-all duration-1000 ${sensors.tankLevel <= 15 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                style={{ width: `${Math.max(0, Math.min(100, sensors.tankLevel))}%` }} 
              />
            </div>
            <DetailRow icon={<Activity />} label="Pump Status" value={actuators.pump ? 'ACTIVE (1.2 L/min)' : 'IDLE'} />
            <DetailRow icon={<Activity />} label="pH Level" value={sensors.ph.toFixed(1)} />
            <DetailRow icon={<Zap />} label="EC Level" value="1.8 mS/cm" />

            {alerts.some(a => a.target === 'tank') && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Resource Depletion Alert</span>
              </div>
            )}
          </div>
        )}

        {isFan && (
          <div className="grid gap-4">
            <DetailRow icon={<Wind />} label="Fan Status" value={actuators.fan ? 'ON' : 'OFF'} />
            <DetailRow icon={<Activity />} label="Current Speed" value={actuators.fan ? '1450 RPM' : '0 RPM'} />
            <DetailRow icon={<Wind />} label="Airflow (CFM)" value={actuators.fan ? '420 CFM' : '0 CFM'} />
            <DetailRow icon={<Zap />} label="Power Draw" value={actuators.fan ? '120 W' : '0 W'} />

            {alerts.some(a => a.target === 'fan') && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Mechanical Failure Detected</span>
              </div>
            )}
          </div>
        )}

        {isControlBox && (
          <div className="grid gap-4">
            <DetailRow icon={<Activity />} label="System Uptime" value="14d 08h 22m" />
            <DetailRow icon={<Activity />} label="Network Latency" value="24 ms" />
            <DetailRow icon={<Cpu />} label="CPU Load" value="18%" />
            <DetailRow icon={<Cpu />} label="Memory Usage" value="45%" />
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="text-emerald-500">{icon}</div>
        <span className="font-medium text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono font-bold text-white">{value}</span>
    </div>
  )
}
