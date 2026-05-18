import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Clock, TrendingUp, RefreshCw, BrainCircuit, Eye, Flame, AlertTriangle, CheckCircle } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

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

  useEffect(() => {
    void fetchAI()
  }, [])

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
  let glowColor = 'shadow-emerald-500/20'

  const hasLeafRust = alerts.some((a) => a.type === 'biological_threat' && !a.resolved)
  const activeDeficiencies = cvData ? Object.keys(cvData.nutrient_deficiencies).filter(
    (key) => cvData.nutrient_deficiencies[key as 'nitrogen' | 'phosphorus' | 'potassium']?.detected
  ).length : 0

  if (hasLeafRust) {
    healthScore = 32
    healthLabel = 'Pathogen Infestation'
    healthColor = 'text-rose-400 stroke-rose-500'
    glowColor = 'shadow-rose-500/20'
  } else if (activeDeficiencies === 1) {
    healthScore = 82
    healthLabel = 'Minor Deficiency'
    healthColor = 'text-amber-400 stroke-amber-500'
    glowColor = 'shadow-amber-500/20'
  } else if (activeDeficiencies === 2) {
    healthScore = 65
    healthLabel = 'Stressed Canopy'
    healthColor = 'text-orange-400 stroke-orange-500'
    glowColor = 'shadow-orange-500/20'
  } else if (activeDeficiencies >= 3) {
    healthScore = 48
    healthLabel = 'Severe Chlorosis'
    healthColor = 'text-red-400 stroke-red-500'
    glowColor = 'shadow-red-500/20'
  }

  const strokeWidth = 8
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (healthScore / 100) * circumference

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

  const timeAgo = aiRec.timestamp
    ? Math.round((Date.now() - aiRec.timestamp) / 1000) < 60
      ? 'just now'
      : Math.round((Date.now() - aiRec.timestamp) / 60000) + 'm ago'
    : 'never'

  const confidence = aiRec.confidence || 98.2

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

      {/* 2. Premium Expanded Display Cards (🥗 How is the Veg?, 📅 Harvest Prediction, 💰 Sales/Demand Analysis) */}
      <div className="flex flex-col gap-5">
        {/* Card 1: How is the veg? */}
        <div className="flex flex-col md:flex-row items-center gap-6 rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
          {/* Left Column: Big SVG Circle Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
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
          
          {/* Right Column: In-depth telemetry metrics */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
              <h4 className={`text-base font-black ${healthColor.split(' ')[0]}`}>{healthLabel}</h4>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">🥗 How is the Veg?</span>
            </div>
            
            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-300">
              {hasLeafRust 
                ? 'CRITICAL ALERT: Spore infestation on Rack 3 detected by Vision AI. Emergency automated pathogen suppression cycle is engaged. Manual removal of infected cups required.' 
                : activeDeficiencies > 0 
                  ? 'CV analysis indicates localized nutrient deficiencies on crop canopy. Nitrogen/Phosphorus tracking shows slight variance from baseline.' 
                  : 'Vision AI reports standard lush leaf pigmentation, uniform crop height distribution, and 98% optimal density score.'}
            </p>
            
            {/* Telemetry micro-grid */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Canopy Cover</span>
                <span className="text-xs font-black text-white">{hasLeafRust ? '62.4%' : '98.5%'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Chlorophyll</span>
                <span className="text-xs font-black text-white">{hasLeafRust ? '28.2 SPAD' : '44.8 SPAD'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Stomata Cond.</span>
                <span className="text-xs font-black text-white">{hasLeafRust ? 'Low (Stress)' : 'Optimal'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Vision Status</span>
                <span className={`text-xs font-black uppercase ${healthScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {healthScore < 50 ? 'Pathology' : 'Healthy'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Harvest Prediction */}
        <div className="flex flex-col md:flex-row items-center gap-6 rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
          {/* Left Column: Big countdown metric */}
          <div className="flex flex-col items-center justify-center shrink-0 w-28 h-28 rounded-2xl border border-white/5 bg-white/5 px-2">
            <h3 className="text-2xl font-black text-white tracking-tight">{daysToHarvest} Days</h3>
            <span className="mt-1 text-[8px] font-black uppercase tracking-wider text-slate-500 text-center">until harvest</span>
            <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              <TrendingUp size={8} /> {velocityText}
            </div>
          </div>

          {/* Right Column: Progress and Dynamic historical stats */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-bold text-slate-300">{cycleText}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">📅 Harvest Prediction</span>
            </div>

            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-300">
              Crop growth velocity is tracking at <span className="text-emerald-400 font-bold">{velocityText}</span> based on multi-spectral camera metrics. Maturity curve calculations predict optimal harvest crispness in {daysToHarvest} days.
            </p>

            {/* Maturity bar & stats */}
            <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
                  <span>Growth Progress</span>
                  <span className="text-white">{maturityPercent}% maturity</span>
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

              <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hist. Benchmark</span>
                  <span className="text-xs font-black text-white">94% Align</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Optimal Window</span>
                  <span className="text-xs font-black text-cyan-400">May 22-24</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Sales/Demand Analysis */}
        <div className="flex flex-col md:flex-row items-center gap-6 rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300">
          {/* Left Column: Big Revenue/Yield metric */}
          <div className="flex flex-col items-center justify-center shrink-0 w-28 h-28 rounded-2xl border border-white/5 bg-white/5 p-2">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Proj. Revenue</span>
            <h3 className="mt-1 text-lg font-black text-emerald-400 tracking-tight">
              {cropName.toLowerCase().includes('basil') ? 'RM 864.00' : cropName.toLowerCase().includes('tomato') ? 'RM 512.00' : 'RM 904.00'}
            </h3>
            <span className="mt-2 text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              {cropName.toLowerCase().includes('basil') ? 'SURGE 🔥' : cropName.toLowerCase().includes('tomato') ? 'STEADY 📈' : 'HIGH 🚀'}
            </span>
          </div>

          {/* Right Column: Revenue target & target market channels */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-bold text-slate-300">Channel: {cropName.toLowerCase().includes('basil') ? 'Premium Dining' : cropName.toLowerCase().includes('tomato') ? 'Eco Wholesalers' : 'Local UTM Markets'}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">💰 Sales/Demand Analysis</span>
            </div>

            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-300">
              High market pull has driven premium prices. Expected harvest yield of <span className="text-white font-bold">{cropName.toLowerCase().includes('basil') ? '28.8 kg' : cropName.toLowerCase().includes('tomato') ? '64.0 kg' : '45.2 kg'}</span> matches direct delivery contracts for local cafeterias and supermarket hubs.
            </p>

            {/* Demand progress & stats */}
            <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
                  <span>Market Pull</span>
                  <span className="text-white">{cropName.toLowerCase().includes('basil') ? '96%' : cropName.toLowerCase().includes('tomato') ? '78%' : '92%'} Score</span>
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

              <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Est. Yield</span>
                  <span className="text-xs font-black text-white">
                    {cropName.toLowerCase().includes('basil') ? '28.8 kg' : cropName.toLowerCase().includes('tomato') ? '64.0 kg' : '45.2 kg'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contract Type</span>
                  <span className="text-xs font-black text-amber-400">Direct Sell</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hardware Attention Points (Anomaly Logs) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 flex items-center gap-1.5">
            <Eye size={12} className="text-rose-400 animate-pulse" /> ⚠️ Attention Points
          </h4>
          <span className="text-[9px] font-bold uppercase text-slate-600">Vision Diagnostic</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AIPanel
