import { motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Droplets, Zap, DollarSign, TrendingUp, Sparkles, Leaf } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function AnimatedTotal({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const springValue = useSpring(value, { stiffness: 100, damping: 20 })
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    springValue.set(value)
  }, [springValue, value])

  useMotionValueEvent(springValue, 'change', (latest) => {
    setDisplayValue(Number(latest.toFixed(decimals)))
  })

  return <span>{displayValue.toFixed(decimals)}</span>
}

function ImpactTracker() {
  const impact = useFarmStore(useShallow((state) => state.impact))
  const [lendingLoading, setLendingLoading] = useState(false)
  const [lendingPhase, setLendingPhase] = useState<string | null>(null)
  const [lendingResult, setLendingResult] = useState<any | null>(null)
  const addToast = useFarmStore((state) => state.addToast)
  const baseline = { waterSaved: 12, energySaved: 9, costSaved: 48 }
  const fundingOffers = [
    {
      title: '🏢 Agrobank Young Agropreneur (PAM Fund)',
      status: 'Pre-Approved',
      limit: 'RM 2,000',
      rate: 'Subsidized Youth Floor',
      href: 'https://logmasuk.my/agrobank-loan/',
    },
    {
      title: '⚡ MDEC x CIMB Islamic AgTech Financing',
      status: 'Pre-Approved',
      limit: 'RM 5,000',
      rate: '3.5% Fixed p.a.',
      href: 'https://www.cimb.com/en/newsroom/2021/mdec-and-cimb-islamic-sign-mou-providing-rm25-million-to-scale-agtech-pilot.html',
    },
  ]

  const activeImpact = impact || { waterSaved: 0, energySaved: 0, costSaved: 0 }

  const stats = [
    { label: 'Water Conservation', value: activeImpact.waterSaved, baseline: baseline.waterSaved, unit: 'Liters', icon: Droplets, color: 'cyan', description: 'Reduction vs traditional soil' },
    { label: 'Energy Optimization', value: activeImpact.energySaved, baseline: baseline.energySaved, unit: 'kWh', icon: Zap, color: 'amber', description: 'Smart lighting efficiency' },
    { label: 'Operation Yield', value: activeImpact.costSaved, baseline: baseline.costSaved, unit: 'RM', icon: DollarSign, color: 'emerald', description: 'Total automated savings' },
  ]

  const startLendingFlow = async () => {
    setLendingResult(null)
    setLendingLoading(true)
    setLendingPhase('📡 Extracting raw IoT telemetry history...')

    // show phase updates while calling backend
    const phaseTimers: any[] = []
    phaseTimers.push(setTimeout(() => setLendingPhase('🛡️ Compiling tamper-proof Uptime Log (92% Stability)...'), 600))
    phaseTimers.push(setTimeout(() => setLendingPhase('🧮 Feeding parameters into DeFi Lending Pool...'), 1200))

    try {
      const resp = await fetch('/api/blockchain/agro-lend', { method: 'POST' })
      const data = resp.ok ? await resp.json() : null
      // Ensure the final phase shows briefly
      setTimeout(() => {
        setLendingPhase(null)
        setLendingResult(data)
        setLendingLoading(false)
      }, 1800)
    } catch (err) {
      setLendingPhase(null)
      setLendingLoading(false)
      addToast('Failed to evaluate credit', 'error')
    } finally {
      phaseTimers.forEach((t) => clearTimeout(t))
    }
  }

  const acceptLoan = (amount: number, message: string) => {
    addToast('🚀 Funds accepted — RM ' + amount.toFixed(2) + ' deposited', 'success')
    // Append to automation log (keep last 5)
    useFarmStore.setState((state) => ({ automationLog: [...state.automationLog, message].slice(-5) }))
    // collapse result
    setLendingResult(null)
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Resource Efficiency</h3>
      </header>

      {impact ? (
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon
            const isPositive = item.value >= item.baseline
            const pct = Math.round(((item.value - item.baseline) / item.baseline) * 100)

            return (
              <motion.div
                key={item.label}
                className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-black/20 p-6 backdrop-blur-md transition-all duration-300 hover:bg-black/30 hover:shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${item.color}-500/10 text-${item.color}-400 ring-1 ring-${item.color}-500/20`}>
                    <Icon size={24} />
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} />
                    {pct}%
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold tracking-tight text-white">
                      <AnimatedTotal value={item.value} decimals={1} />
                    </h3>
                    <span className="text-sm font-bold text-slate-600">{item.unit}</span>
                  </div>
                  <p className="mt-3 text-[10px] font-medium leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>

                {/* Progress visualizer */}
                <div className="mt-6 h-1 w-full rounded-full bg-white/5">
                  <motion.div
                    className={`h-full rounded-full bg-${item.color}-500 shadow-[0_0_8px_rgba(var(--${item.color}-500-rgb),0.3)]`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, 40 + Math.abs(pct))}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="h-48 animate-pulse rounded-[32px] bg-white/5" />
            <div className="h-48 animate-pulse rounded-[32px] bg-white/5" />
            <div className="h-48 animate-pulse rounded-[32px] bg-white/5" />
          </div>
        </section>
      )}

      {/* Lending overlay / result container */}
      <div className="mt-4 rounded-[20px] border border-white/5 bg-black/20 p-4 backdrop-blur-md">
        {lendingLoading && (
          <div className="flex flex-col gap-3">
            <div className="h-2 w-full rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} />
            </div>
            <div className="text-sm text-slate-300">
              <p>{lendingPhase}</p>
            </div>
          </div>
        )}

        {!lendingLoading && lendingResult && (
          <div className="flex flex-col gap-4">
            {lendingResult.status === 'approved' ? (
              // Approved design (Green Theme)
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      💰 DATA-BACKED CREDIT APPROVED
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.1em]">• REVENUES VERIFIED</span>
                  </div>
                  <div className="text-sm font-bold text-slate-300">
                    Limit: <span className="text-emerald-400">RM {lendingResult.credit_limit_myr.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {lendingResult.log_message}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 mt-1">
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 text-xs text-slate-300">
                    <p className="font-bold uppercase tracking-[0.2em] text-emerald-300">Funding Pool & Terms</p>
                    <p className="mt-1.5 font-semibold text-white">MDEC-CIMB Agtech Digital Scheme</p>
                    <p className="mt-1">Rate: <span className="text-emerald-400 font-bold">3.5% Fixed p.a.</span> (Subsidized)</p>
                    <p className="mt-0.5">Repayment: Automatic from crop revenues</p>
                  </div>
                  
                  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-slate-300 flex flex-col justify-between">
                    <div>
                      <p className="font-bold uppercase tracking-[0.2em] text-slate-400">Web3 Liquidity Details</p>
                      <p className="mt-1.5 font-mono text-[11px]">USDC Equivalent: {lendingResult.usdc_equivalent.toLocaleString()} USDC</p>
                      <p className="mt-0.5 text-slate-500 text-[10px]">Settled via Arbitrum Sepolia ESCROW</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
                  <button
                    onClick={() => setLendingResult(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                  >
                    🔄 Re-evaluate Credit Line
                  </button>
                  <button
                    onClick={() => acceptLoan(lendingResult.credit_limit_myr, lendingResult.log_message)}
                    className="rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition px-5 py-2 text-xs font-bold text-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    🚀 Accept & Claim Funds Instantly
                  </button>
                </div>
              </div>
            ) : (
              // Conditional Approval design (Amber Theme)
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
                      ⚠️ CONDITIONAL CREDIT APPROVAL
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.1em]">• ACTIVE RISKS DETECTED</span>
                  </div>
                  <div className="text-sm font-bold text-slate-300">
                    Reduced Limit: <span className="text-amber-400">RM {lendingResult.credit_limit_myr.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {lendingResult.log_message}
                </p>

                <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-xs text-slate-300">
                  <p className="font-bold uppercase tracking-[0.2em] text-amber-300">Lending Anomaly Advisory</p>
                  <p className="mt-1.5 leading-relaxed text-slate-400">
                    Our Agri-Underwriting engine detected active anomalies (active alerts, environmental telemetry drifts, or health fluctuations) in your system. To unlock higher-tier funding and lower interest rates (up to RM 150,000.00), please resolve all active alerts and stabilize your sensors (temperature, pH, leaf disease, etc.).
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 mt-1">
                  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-slate-300">
                    <p className="font-bold uppercase tracking-[0.2em] text-slate-400">Available Emergency Pool</p>
                    <p className="mt-1.5 font-semibold text-white">Agrobank Emergency Crop Micro-Lend</p>
                    <p className="mt-1 text-amber-400">Rate: 5.5% p.a. (Standard Risk Adjusted)</p>
                  </div>
                  
                  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-slate-300 flex flex-col justify-between">
                    <div>
                      <p className="font-bold uppercase tracking-[0.2em] text-slate-400">Web3 Liquidity Details</p>
                      <p className="mt-1.5 font-mono text-[11px]">USDC Equivalent: {lendingResult.usdc_equivalent.toLocaleString()} USDC</p>
                      <p className="mt-0.5 text-slate-500 text-[10px]">Settled via Arbitrum Sepolia ESCROW</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
                  <button
                    onClick={() => setLendingResult(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                  >
                    🔄 Re-evaluate Credit Line
                  </button>
                  <button
                    onClick={() => acceptLoan(lendingResult.credit_limit_myr, lendingResult.log_message)}
                    className="rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 transition px-5 py-2 text-xs font-bold text-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    🚀 Claim Emergency Liquidity
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!lendingLoading && !lendingResult && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="text-xs text-slate-400 leading-relaxed max-w-xl">
                <span className="font-bold text-slate-200 block text-sm mb-1">🏦 Telemetry-Backed DeFi Micro-Lending</span>
                Audit your dynamic environmental telemetry, leaf disease metrics, and uptime logs to unlock real-time operating capital. Fully backed by Agrobank Malaysia and CIMB Islamic Smart Schemes.
              </div>
              <button
                onClick={startLendingFlow}
                className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all duration-300 px-6 py-3 font-bold text-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 text-xs tracking-wider uppercase"
              >
                <Sparkles size={14} className="animate-pulse" /> Evaluate Credit Line
              </button>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Available Digital Funding Offers:</p>
              <div className="mt-3 flex flex-col gap-3">
                {fundingOffers.map((offer) => (
                  <div key={offer.title} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">{offer.title}</p>
                      <a
                        href={offer.href}
                        target="_blank"
                        rel="noreferrer"
                        className="whitespace-nowrap rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/20"
                      >
                        🔗 View Official Info
                      </a>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-300">
                      • Status: {offer.status}  • Limit: {offer.limit}  • Rate: {offer.rate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sustainable badge footer */}
      <div className="mt-2 flex items-center justify-center rounded-3xl border border-white/5 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-md">
        <Leaf size={14} className="mr-3 text-emerald-500" /> Carbon Neutral Farming Initiative
      </div>
    </section>
  )
}

export default ImpactTracker
