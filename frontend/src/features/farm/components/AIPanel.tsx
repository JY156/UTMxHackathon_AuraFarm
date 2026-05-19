import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, RefreshCw, BrainCircuit, Eye, Flame, AlertTriangle, CheckCircle, Loader2, ShieldCheck, X, Wallet, ExternalLink } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Lettuce } from '../models/Lettuce'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

type ProcurementResponse = {
  status: string
  tx_hash: string
  contract_address: string
  log_message: string
  supplier_notified: boolean
  explorer_url?: string
}

const PROCUREMENT_REQUEST = {
  item_id: 'Submersible Pump WP-3000',
  supplier_id: 'Supplier_Alpha_MY',
  cost_myr: 150,
}

function AIPanel() {
  const { aiRec, fetchAI, cvData, alerts, profile } = useFarmStore(
    useShallow((state) => ({ 
      aiRec: state.aiRec, 
      fetchAI: state.fetchAI,
      cvData: state.cvData,
      alerts: state.alerts,
      profile: state.profile
    })),
  )
  const addToast = useFarmStore((state) => state.addToast)
  const [procurementOpen, setProcurementOpen] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [procurementResult, setProcurementResult] = useState<ProcurementResponse | null>(null)
  const [pendingLogMessage, setPendingLogMessage] = useState<string | null>(null)
  const [procurementError, setProcurementError] = useState<string | null>(null)
  const [selectedVendorIndex, setSelectedVendorIndex] = useState(0)
  const vendorOptions = [
    {
      id: 'alpha_agri',
      name: 'Alpha Agri Sdn. Bhd.',
      lines: ['Fastest Deployment', 'Same-day dispatch via local logistics'],
      cost_myr: 150,
      recommended: true,
    },
    {
      id: 'beta_hydro',
      name: 'Beta Hydroponics Hub',
      lines: ['Lowest Cost', 'Regional hub shipping'],
      cost_myr: 135,
      recommended: false,
    },
    {
      id: 'utara_agro',
      name: 'Utara Agrotech Supplies',
      lines: ['High Redundancy', '2-year warranty included'],
      cost_myr: 165,
      recommended: false,
    },
  ]

  const [previewReceipt, setPreviewReceipt] = useState<ProcurementResponse | null>(null)

  useEffect(() => {
    void fetchAI()
  }, [])

  const commitProcurementLog = (message: string) => {
    useFarmStore.setState((state) => ({
      automationLog: [...state.automationLog, message].slice(-5),
    }))
  }

  const closeProcurementModal = () => {
    if (isDeploying) return

    if (pendingLogMessage) {
      commitProcurementLog(pendingLogMessage)
      // Show confirmation toast with truncated tx if available
      const tx = procurementResult?.tx_hash
      const shortTx = tx ? `${tx.slice(0, 12)}…${tx.slice(-8)}` : null
      const vendorName = vendorOptions[selectedVendorIndex]?.name
      addToast(shortTx ? `Procurement recorded (${vendorName}) — Tx ${shortTx}` : `Procurement recorded (${vendorName})`, 'success')
    }

    setProcurementOpen(false)
    setProcurementResult(null)
    setPendingLogMessage(null)
    setProcurementError(null)
  }

  const handleWeb3Procure = async () => {
    setProcurementOpen(true)
    setIsDeploying(true)
    setProcurementResult(null)
    setPendingLogMessage(null)
    setProcurementError(null)

    try {
      const selected = vendorOptions[selectedVendorIndex]
      const requestBody = {
        item_id: PROCUREMENT_REQUEST.item_id,
        supplier_id: selected.id,
        cost_myr: selected.cost_myr,
      }

      const response = await fetch('/api/blockchain/procure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      // Defensive parsing: backend may return empty body or non-JSON on error
      const raw = await response.text()

      if (!raw) {
        throw new Error(`Empty response from backend (status ${response.status})`)
      }

      let data: ProcurementResponse
      try {
        data = JSON.parse(raw) as ProcurementResponse
      } catch (err) {
        throw new Error(`Invalid JSON response from backend: ${raw}`)
      }

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.log_message || `Mock procurement failed (status ${response.status})`)
      }

      setProcurementResult(data)
      setPendingLogMessage(data.log_message)
    } catch (error) {
      console.error('Procurement error:', error)
      setProcurementError(error instanceof Error ? error.message : 'Mock procurement failed')
    } finally {
      setIsDeploying(false)
    }
  }

  if (!aiRec) {
    return (
      <section className="flex flex-col gap-6">
        <div className="h-10 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-[32px] bg-white/5" />
      </section>
    )
  }

  // 1. Calculate reactive Canopy Health score based on Vision AI deficiencies and Leaf Rust
  let healthScore = 98
  let healthLabel = 'Lush & Optimal'
  let healthColor = 'text-emerald-400 stroke-emerald-500'

  const hasLeafRust = alerts.some((a) => a.type === 'biological_threat' && !a.resolved)
  const activeDeficiencies = cvData ? Object.keys(cvData.nutrient_deficiencies).filter(
    (key) => cvData.nutrient_deficiencies[key as 'nitrogen' | 'phosphorus' | 'potassium']?.detected
  ).length : 0

  if (hasLeafRust) {
    healthScore = 32
    healthLabel = 'Pathogen Infestation'
    healthColor = 'text-rose-400 stroke-rose-500'
  } else if (activeDeficiencies === 1) {
    healthScore = 82
    healthLabel = 'Minor Deficiency'
    healthColor = 'text-amber-400 stroke-amber-500'
  } else if (activeDeficiencies === 2) {
    healthScore = 65
    healthLabel = 'Stressed Canopy'
    healthColor = 'text-orange-400 stroke-orange-500'
  } else if (activeDeficiencies >= 3) {
    healthScore = 48
    healthLabel = 'Severe Chlorosis'
    healthColor = 'text-red-400 stroke-red-500'
  }

  const strokeWidth = 8
  const radius = 36

  // 2. Profile-Bound Predictive Harvest Data
  const cropName = profile?.name || 'Lettuce'
  let daysToHarvest = 4
  let maturityPercent = 85
  let velocityText = '+1.4 cm/day'
  let cycleText = 'Harvest Phase'

  if (cropName.toLowerCase().includes('basil')) {
    daysToHarvest = 7
    maturityPercent = 72
    velocityText = '+1.8 cm/day'
    cycleText = 'Vegetative Growth'
  } else if (cropName.toLowerCase().includes('tomato')) {
    daysToHarvest = 12
    maturityPercent = 55
    velocityText = '+2.3 cm/day'
    cycleText = 'Flowering State'
  }

  // 3. Hardware Attention points
  const attentionItems = [
    {
      id: 'pump-replacement',
      label: 'Rack 3 Submersible Pump Failure',
      status: 'CRITICAL',
      details: 'Nozzle backpressure dropped below baseline (0.0 Bar). Replace the pump assembly before the irrigation loop stalls.',
      type: 'critical',
      cta: {
        label: 'Replace & Procure via Web3',
        onClick: handleWeb3Procure,
      },
    },
    { id: 'cam', label: 'CV Lens Clarity', status: 'Optimal', details: 'Camera clean. No dewing detected.', type: 'nominal' },
    { id: 'dosing', label: 'Nutrient Feed Lines', status: 'Clean', details: 'Flow rates matching baseline.', type: 'nominal' },
    { id: 'misting', label: 'Misting Pressure', status: 'Stable', details: 'Nozzle backpressure in nominal range.', type: 'nominal' },
  ]

  // Add reactive hardware failures/alerts into attention logs
  const isFanBroken = alerts.some((a) => a.type === 'mechanical_failure' && !a.resolved)
  const isTankEmpty = alerts.some((a) => a.type === 'resource_depletion' && !a.resolved)

  if (isFanBroken) {
    attentionItems.unshift({
      id: 'fan-fail',
      label: 'Ventilation Fan 1',
      status: 'CRITICAL',
      details: 'Motor/fuse unresponsive. Rapid heat buildup danger!',
      type: 'critical',
    })
  }
  if (isTankEmpty) {
    attentionItems.unshift({
      id: 'tank-fail',
      label: 'Main Reservoir',
      status: 'EMPTY',
      details: 'Water level 0%. Misting and irrigation loops paused.',
      type: 'critical',
    })
  }
  if (hasLeafRust) {
    attentionItems.unshift({
      id: 'pest-fail',
      label: 'Biological Quarantine',
      status: 'WARNING',
      details: 'Fungicide dosing loop active on Rack 3. Spore spread risk.',
      type: 'warning',
    })
  }


  return (
    <section className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">AI Intelligence</h3>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <BrainCircuit size={12} className="text-emerald-400" /> Vision AI Neural Engine Active
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAI()}
          disabled={aiRec.loading}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <RefreshCw size={14} className={aiRec.loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          {aiRec.loading ? 'Analyzing' : 'Sync Neural'}
        </button>
      </header>

      {/* 2. 3-Column Metrics Dashboard Widget Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Card 1: Canopy Health */}
        <div className="flex flex-col items-center gap-5 rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
          
          <div className="flex items-center justify-between w-full border-b border-white/5 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">🥗 Health Index</span>
            <h4 className={`text-xs font-black ${healthColor.split(' ')[0]}`}>{healthLabel}</h4>
          </div>

          <div className="relative flex items-center justify-center">
            <svg className="h-28 w-28 -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="44"
                fill="transparent"
                className="stroke-white/5"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx="56"
                cy="56"
                r="44"
                fill="transparent"
                className={healthColor}
                strokeWidth={strokeWidth}
                strokeDasharray={2 * Math.PI * 44}
                initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 44 - (healthScore / 100) * 2 * Math.PI * 44 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white tracking-tighter">{healthScore}%</span>
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Index</span>
            </div>
          </div>

          <p className="text-[11px] font-semibold leading-relaxed text-slate-300 text-center min-h-[32px]">
            {hasLeafRust 
              ? 'Pathogen detected on Rack 3. Suppression system fully active.' 
              : activeDeficiencies > 0 
                ? 'Canopy deficit detected. Automated nutrient dosing loop engaged.' 
                : 'All foliage parameters, height, and chlorophyll are optimal.'}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Canopy Cover</span>
              <span className="text-xs font-black text-white">{hasLeafRust ? '62.4%' : '98.5%'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Chlorophyll</span>
              <span className="text-xs font-black text-white">{hasLeafRust ? '28.2 SPAD' : '44.8 SPAD'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Stomata</span>
              <span className="text-xs font-black text-white">{hasLeafRust ? 'Stress' : 'Optimal'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
              <span className={`text-xs font-black uppercase ${healthScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {healthScore < 50 ? 'Anomaly' : 'Optimal'}
              </span>
            </div>
          </div>

        </div>

        {/* Card 2: Harvest Prediction */}
        <div className="flex flex-col items-center gap-5 rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
          
          <div className="flex items-center justify-between w-full border-b border-white/5 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">📅 Harvest Prediction</span>
            <span className="text-xs font-bold text-slate-400">{cycleText}</span>
          </div>

          <div className="w-full h-32 rounded-3xl border border-white/5 bg-black/30 relative overflow-hidden flex items-center justify-center">
            <Canvas camera={{ position: [0, 1.2, 2.2], fov: 42 }} className="absolute inset-0">
              <ambientLight intensity={0.9} />
              <directionalLight position={[3, 4, 3]} intensity={1.8} />
              <pointLight position={[-3, -2, -3]} intensity={0.6} />
              <Lettuce 
                growthStage={
                  maturityPercent < 35 
                    ? 'seedling' 
                    : maturityPercent < 75 
                      ? 'vegetative' 
                      : 'harvest'
                }
                scale={1.2}
                position={[0, -0.4, 0]}
              />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={3.5} />
            </Canvas>
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center justify-end pb-2.5 pointer-events-none">
              <h3 className="text-base font-black text-white tracking-tight drop-shadow-md">{daysToHarvest} Days</h3>
              <span className="text-[7px] font-black uppercase tracking-widest text-cyan-400 drop-shadow-md">to harvest</span>
            </div>
          </div>

          <p className="text-[11px] font-semibold leading-relaxed text-slate-300 text-center min-h-[32px]">
            Velocity at <span className="text-emerald-400 font-bold">{velocityText}</span>. Target crispness window predicted in {daysToHarvest} days.
          </p>

          <div className="flex flex-col gap-3 w-full border-t border-white/5 pt-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
                <span>Maturity Progress</span>
                <span className="text-white">{maturityPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${maturityPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alignment</span>
                <span className="text-xs font-black text-white">94%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Window</span>
                <span className="text-xs font-black text-cyan-400">May 22-24</span>
              </div>
            </div>
          </div>

        </div>

        {/* Card 3: Demand Analysis */}
        <div className="flex flex-col items-center gap-5 rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
          
          <div className="flex items-center justify-between w-full border-b border-white/5 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">💰 Demand Analysis</span>
            <span className="text-xs font-bold text-slate-400 truncate max-w-[120px]">
              {cropName.toLowerCase().includes('basil') ? 'Premium Retail' : cropName.toLowerCase().includes('tomato') ? 'Wholesale Hub' : 'Direct Channel'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-28 h-28 rounded-3xl border border-white/5 bg-white/5 p-2">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Est. Value</span>
            <h3 className="mt-1 text-lg font-black text-emerald-400 tracking-tight">
              {cropName.toLowerCase().includes('basil') ? 'RM 864.00' : cropName.toLowerCase().includes('tomato') ? 'RM 512.00' : 'RM 904.00'}
            </h3>
            <span className="mt-2 text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              {cropName.toLowerCase().includes('basil') ? 'SURGE 🔥' : cropName.toLowerCase().includes('tomato') ? 'STEADY 📈' : 'HIGH 🚀'}
            </span>
          </div>

          <p className="text-[11px] font-semibold leading-relaxed text-slate-300 text-center min-h-[32px]">
            Fulfillment forecast aligns with active commercial purchase order requirements.
          </p>

          <div className="flex flex-col gap-3 w-full border-t border-white/5 pt-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
                <span>Market Score</span>
                <span className="text-white">{cropName.toLowerCase().includes('basil') ? '96%' : cropName.toLowerCase().includes('tomato') ? '78%' : '92%'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: cropName.toLowerCase().includes('basil') ? '96%' : cropName.toLowerCase().includes('tomato') ? '78%' : '92%' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Est. Yield</span>
                <span className="text-xs font-black text-white">
                  {cropName.toLowerCase().includes('basil') ? '28.8 kg' : cropName.toLowerCase().includes('tomato') ? '64.0 kg' : '45.2 kg'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contract</span>
                <span className="text-xs font-black text-amber-400">Direct Sell</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Diagnostic Checklist section below */}
      <div className="flex flex-col gap-4 mt-6 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 flex items-center gap-1.5">
            <Eye size={12} className="text-rose-400 animate-pulse" /> Diagnostic Checklist
          </h4>
          <span className="text-[9px] font-bold uppercase text-slate-600">Active Monitor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {attentionItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-300 ${
                item.type === 'critical'
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : item.type === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                item.type === 'critical'
                  ? 'bg-rose-500/20 text-rose-400'
                  : item.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/5 text-slate-400'
              }`}>
                {item.type === 'critical' ? (
                  <Flame size={14} className="animate-bounce" />
                ) : item.type === 'warning' ? (
                  <AlertTriangle size={14} className="animate-pulse" />
                ) : (
                  <CheckCircle size={14} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{item.label}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    item.type === 'critical'
                      ? 'bg-rose-500/20 text-rose-400'
                      : item.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-slate-400 leading-normal">
                  {item.details}
                </p>
                {item.cta && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={item.cta.onClick}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-rose-300 transition-all hover:border-rose-300/50 hover:bg-rose-500/15 hover:text-rose-200"
                    >
                      <Wallet size={11} />
                      {item.cta.label}
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Secure escrow to Arbitrum testnet
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {procurementOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/78 px-4 py-8 backdrop-blur-sm"
            onClick={closeProcurementModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#050816]/95 p-1 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.06),transparent_38%)]" />
              <div className="relative rounded-[30px] border border-white/5 bg-black/40 p-6 backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-400">Secure Smart Contract Escrow</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Deploying procurement contract</h3>
                      {/* Summary details moved into Escrow Summary; removed duplicate bullets. */}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeProcurementModal}
                    disabled={isDeploying}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">Network Status</span>
                      <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${isDeploying ? 'bg-amber-500/15 text-amber-300' : procurementError ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                        {isDeploying ? 'Awaiting block confirmation' : procurementError ? 'Contract aborted' : 'Contract secured'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <div className="flex items-start gap-3">
                        <Loader2 size={16} className={`mt-0.5 shrink-0 text-emerald-400 ${isDeploying ? 'animate-spin' : ''}`} />
                        <p className="leading-relaxed">
                          {isDeploying
                            ? `📡 Deploying Contract to Arbitrum Testnet... Tx: ${procurementResult?.tx_hash?.slice(0, 12) ?? 'pending'}`
                            : procurementError
                              ? procurementError
                              : procurementResult
                                ? '📡 Deploying Contract to Arbitrum Testnet... Tx confirmed.'
                                : previewReceipt
                                  ? '✅ Preview ready — sample Tx available'
                                  : '📡 Deploying Contract to Arbitrum Testnet...'}
                        </p>
                      </div>

                      {(procurementResult || previewReceipt) && (
                        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-[11px] text-emerald-100">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold uppercase tracking-[0.2em] text-emerald-300">Transaction Receipt</span>
                            <a
                              href={(procurementResult || previewReceipt)!.explorer_url || `https://sepolia.arbiscan.io/tx/${(procurementResult || previewReceipt)!.tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:text-cyan-200"
                            >
                              Explorer <ExternalLink size={10} />
                            </a>
                          </div>
                          <div className="mt-2 grid gap-2 text-slate-300">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-500">Tx Hash</span>
                              <span className="font-mono text-slate-100">{(procurementResult || previewReceipt)!.tx_hash.slice(0, 12)}…{(procurementResult || previewReceipt)!.tx_hash.slice(-8)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-500">Contract</span>
                              <span className="font-mono text-slate-100">{(procurementResult || previewReceipt)!.contract_address.slice(0, 12)}…{(procurementResult || previewReceipt)!.contract_address.slice(-6)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-500">Supplier Notified</span>
                              <span className="text-emerald-300">{(procurementResult || previewReceipt)!.supplier_notified ? 'Yes' : 'Pending'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {procurementError && !isDeploying && (
                        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-200">
                          {procurementError}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">Escrow Summary</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-white">{PROCUREMENT_REQUEST.item_id}</p>
                        <div className="mt-2 flex items-center gap-3">
                          {vendorOptions.map((v, idx) => (
                            <div key={v.id} className="flex flex-col items-center">
                              {v.recommended && (
                                <span className={`text-[10px] font-black mb-1 ${selectedVendorIndex === idx ? 'text-emerald-300' : 'text-emerald-500/60'}`}>
                                  Recommended
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVendorIndex(idx)
                                  // show preview receipt to make selection feel realistic
                                  setPreviewReceipt({
                                    status: 'success',
                                    tx_hash: '0x95d75352afcbe2fc1986b549ea86e4d396fe40c20a36201643a6da2302326b11',
                                    contract_address: idx === 0 ? '0xDeFi9947F2aBc12345678987aA89' : idx === 1 ? '0xBeta1234FfEE9988776655Aa' : '0xUtara77AAaB1100ffCC88',
                                    log_message: `Procurement preview for ${v.name}`,
                                    supplier_notified: true,
                                    explorer_url: 'https://sepolia.arbiscan.io/tx/0x95d75352afcbe2fc1986b549ea86e4d396fe40c20a36201643a6da2302326b11'
                                  })
                                }}
                                className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition-all ${selectedVendorIndex === idx ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-slate-300 hover:border-white/20'}`}
                              >
                                <span>{v.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
                          {vendorOptions[selectedVendorIndex].lines.map((line, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-emerald-300 text-xs">✓</span>
                              <span>{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Escrow Amount</p>
                        <p className="mt-1 text-2xl font-black tracking-tight text-emerald-300">RM {vendorOptions[selectedVendorIndex].cost_myr}.00</p>
                        <p className="text-[11px] text-slate-500">Approx. {(vendorOptions[selectedVendorIndex].cost_myr / 4.29).toFixed(1)} USDC</p>
                      </div>

                      {/* Removed the previous Next Step copy — closing the modal will commit the event. */}
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeProcurementModal}
                        disabled={isDeploying}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-200 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pendingLogMessage ? 'Close & Log Event' : 'Close Gateway'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default AIPanel
