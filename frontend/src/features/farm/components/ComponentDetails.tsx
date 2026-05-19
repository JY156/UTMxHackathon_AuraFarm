import React from 'react'
import { useFarmStore } from '../../../store/useFarmStore'
import { useShallow } from 'zustand/react/shallow'
import { motion } from 'framer-motion'
import { Droplet, Wind, Cpu, Sprout, Thermometer, Zap, AlertTriangle, Activity } from 'lucide-react'

export default function ComponentDetails() {
  const { inspectedId, alerts, sensors, actuators, cvData } = useFarmStore(
    useShallow((state) => ({
      inspectedId: state.inspectedId,
      alerts: state.alerts,
      sensors: state.sensors,
      actuators: state.actuators,
      cvData: state.cvData,
    })),
  )

  const isNitrogenDeficient = cvData?.nutrient_deficiencies?.nitrogen?.detected ?? false
  const isPhosphorusDeficient = cvData?.nutrient_deficiencies?.phosphorus?.detected ?? false
  const isPotassiumDeficient = cvData?.nutrient_deficiencies?.potassium?.detected ?? false

  if (!inspectedId || !sensors || !actuators) return null

  const isRack = inspectedId.startsWith('rack-')
  const rackNumber = isRack ? parseInt(inspectedId.split('-')[1]) : null
  const isTank = inspectedId === 'tank'
  const isDosingTank = inspectedId.startsWith('tank-')
  const isPump = inspectedId === 'pump'
  const isFan = inspectedId === 'fan'
  const isControlBox = inspectedId === 'control-box'

  const getTitle = () => {
    if (inspectedId === 'tank-n') return 'Nitrogen (N) Tank'
    if (inspectedId === 'tank-p') return 'Phosphorus (P) Tank'
    if (inspectedId === 'tank-k') return 'Potassium (K) Tank'
    if (inspectedId === 'tank-acidic') return 'Acid Tank'
    if (inspectedId === 'tank-alkaline') return 'Alkaline Tank'
    if (isRack) return `Grow Rack ${rackNumber}`
    return inspectedId.replace('-', ' ')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[32px] border border-white/10 bg-black/60 p-6 backdrop-blur-3xl shadow-2xl">
        <h2 className="mb-6 flex items-center gap-3 font-mono text-xl font-bold uppercase tracking-widest text-emerald-400">
          {isRack && <Sprout className="h-6 w-6" />}
          {(isTank || isPump) && <Droplet className="h-6 w-6" />}
          {isFan && <Wind className="h-6 w-6" />}
          {isControlBox && <Cpu className="h-6 w-6" />}
          {getTitle()} DETAILS
        </h2>

        {/* ... (Rack/Tank/Fan/ControlBox logic) */}
        {isRack && (
          <div className="grid gap-4">
            <DetailRow icon={<Thermometer />} label="Local Temp" value={`${(sensors.temp + (rackNumber === 1 ? -0.8 : rackNumber === 2 ? 0.2 : rackNumber === 3 ? 0.8 : -0.2)).toFixed(1)}°C`} />
            <DetailRow icon={<Droplet />} label="Local Humidity" value={`${(sensors.humidity + (rackNumber === 1 ? -3 : rackNumber === 2 ? 1 : rackNumber === 3 ? 4 : -1)).toFixed(1)}%`} />
            <DetailRow 
              icon={<Sprout />} 
              label="Crop Stage" 
              value={
                rackNumber === 1 ? 'Seedling (Day 5)' :
                rackNumber === 2 ? 'Vegetative (Day 18)' :
                rackNumber === 3 ? 'Harvest Ready (Day 38)' :
                'Harvest Ready (Day 42)'
              } 
            />
            <DetailRow icon={<Zap />} label="Light Level (PPFD)" value={actuators.led === 'full' ? '800 µmol' : actuators.led === 'dimmed' ? '400 µmol' : '0 µmol'} />

            {/* Showcase Rack Status Badges */}
            {/* Since all racks share the centralized water loop (Option B), a Nitrogen deficiency in the main tank affects all racks! */}
            <div className="mt-4 flex flex-col gap-3">
              {isNitrogenDeficient || isPhosphorusDeficient || isPotassiumDeficient ? (
                <>
                  {isNitrogenDeficient && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse" />
                        <span className="font-bold text-xs uppercase tracking-wider">Systemic Nitrogen Deficiency (Chlorosis)</span>
                      </div>
                      <p className="text-[10px] text-amber-400/80 leading-relaxed pl-8">
                        Central Reservoir Solution Alert // Pale yellow leaves observed across all racks. Recommended: Increase Nitrate dosage in the dosing pump.
                      </p>
                    </div>
                  )}
                  {isPhosphorusDeficient && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-purple-400">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-purple-400 animate-pulse" />
                        <span className="font-bold text-xs uppercase tracking-wider">Systemic Phosphorus Deficiency (Anthocyanin)</span>
                      </div>
                      <p className="text-[10px] text-purple-400/80 leading-relaxed pl-8">
                        Central Reservoir Solution Alert // Dark purplish-bronze leaves observed. Recommended: Increase Phosphate dosing flow.
                      </p>
                    </div>
                  )}
                  {isPotassiumDeficient && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-400">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-400 animate-pulse" />
                        <span className="font-bold text-xs uppercase tracking-wider">Systemic Potassium Deficiency (Necrosis)</span>
                      </div>
                      <p className="text-[10px] text-orange-400/80 leading-relaxed pl-8">
                        Central Reservoir Solution Alert // Bronze-orange outer leaf margin necrosis observed. Recommended: Increase Potash dosing valve output.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs uppercase tracking-wider">Systemic Nutrients: Balanced & Optimal</span>
                </div>
              )}

              {/* Local Rack Alerts */}
              {alerts.some(a => !a.resolved && a.type === 'biological_threat' && (a.target === 'rack' || a.rackId === rackNumber)) ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 animate-pulse">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">Localized Biological Threat: Leaf Rust</span>
                  </div>
                  <p className="text-[10px] text-red-400/80 leading-relaxed pl-8">
                    Crop Vision AI: 96% confidence // Orange-brown necrotic spots detected on select leaves. Quarantine Rack {rackNumber} and prune immediately.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-emerald-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">No Biological Threats Detected</span>
                </div>
              )}
            </div>
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

            {alerts.some(a => !a.resolved && a.target === 'tank') && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Resource Depletion Alert</span>
              </div>
            )}
          </div>
        )}

        {isDosingTank && (
          <div className="grid gap-4">
            <DetailRow 
              icon={<Droplet />} 
              label={inspectedId.startsWith('tank-n') || inspectedId.startsWith('tank-p') || inspectedId.startsWith('tank-k') ? "Nutrient Concentration" : "Chemical Volume"} 
              value={
                inspectedId === 'tank-n' ? `${sensors.nitrogen?.toFixed(1) ?? '120.0'} mg/L` :
                inspectedId === 'tank-p' ? `${sensors.phosphorus?.toFixed(1) ?? '40.0'} mg/L` :
                inspectedId === 'tank-k' ? `${sensors.potassium?.toFixed(1) ?? '180.0'} mg/L` :
                '85.0%'
              } 
            />
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div 
                className={`h-full transition-all duration-1000 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]`}
                style={{ 
                  width: `${
                    inspectedId === 'tank-n' ? Math.max(0, Math.min(100, ((sensors.nitrogen ?? 120.0) / 200) * 100)) :
                    inspectedId === 'tank-p' ? Math.max(0, Math.min(100, ((sensors.phosphorus ?? 40.0) / 80) * 100)) :
                    inspectedId === 'tank-k' ? Math.max(0, Math.min(100, ((sensors.potassium ?? 180.0) / 300) * 100)) :
                    85
                  }%` 
                }} 
              />
            </div>
            <DetailRow icon={<Activity />} label="Dosing Valve" value={
              (inspectedId === 'tank-n' && actuators.valveN) ||
              (inspectedId === 'tank-p' && actuators.valveP) ||
              (inspectedId === 'tank-k' && actuators.valveK) ||
              (inspectedId === 'tank-acidic' && actuators.valveAcidic) ||
              (inspectedId === 'tank-alkaline' && actuators.valveAlkaline)
                ? 'OPEN (Dosing)' : 'CLOSED'
            } />
          </div>
        )}

        {isFan && (
          <div className="grid gap-4">
            <DetailRow icon={<Wind />} label="Fan Status" value={alerts.some(a => a.type === 'mechanical_failure' && !a.resolved) ? 'HARDWARE FAILURE' : (actuators.fan ? 'ON' : 'OFF')} />
            <DetailRow icon={<Activity />} label="Current Speed" value={alerts.some(a => a.type === 'mechanical_failure' && !a.resolved) ? '0 RPM (FAULT)' : (actuators.fan ? '1450 RPM' : '0 RPM')} />
            <DetailRow icon={<Wind />} label="Airflow (CFM)" value={alerts.some(a => a.type === 'mechanical_failure' && !a.resolved) ? '0 CFM' : (actuators.fan ? '420 CFM' : '0 CFM')} />
            <DetailRow icon={<Zap />} label="Power Draw" value={alerts.some(a => a.type === 'mechanical_failure' && !a.resolved) ? 'OVERLOAD (FUSE BLOWN)' : (actuators.fan ? '120 W' : '0 W')} />

            {alerts.some(a => a.type === 'mechanical_failure' && !a.resolved) && (
              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-red-500/50 bg-red-500/20 p-5 text-red-400">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                  <span className="font-black text-sm uppercase tracking-widest">Critical Hardware Failure</span>
                </div>
                <p className="text-xs text-red-400/80 leading-relaxed font-medium">
                  Ventilation motor unresponsive. Possible blown fuse or bearing failure. 
                  Remote control disabled. Manual repair required immediately.
                </p>
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
