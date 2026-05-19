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

  const stats = [
    { label: 'Water Conservation', value: impact.waterSaved, baseline: baseline.waterSaved, unit: 'Liters', icon: Droplets, color: 'cyan', description: 'Reduction vs traditional soil' },
    { label: 'Energy Optimization', value: impact.energySaved, baseline: baseline.energySaved, unit: 'kWh', icon: Zap, color: 'amber', description: 'Smart lighting efficiency' },
    { label: 'Operation Yield', value: impact.costSaved, baseline: baseline.costSaved, unit: 'RM', icon: DollarSign, color: 'emerald', description: 'Total automated savings' },
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
        <div className="flex items-center gap-2">
          <button
            onClick={startLendingFlow}
            className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[12px] font-bold text-emerald-300 hover:bg-emerald-500/15 transition"
            title="Check micro-loan eligibility"
          >
            <span>⚡</span>
            <span>Check Micro-Loan Eligibility</span>
          </button>
        </div>
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

        {!lendingLoading && lendingResult && lendingResult.status === 'approved' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 px-3 py-1 text-emerald-300 font-bold">💰 DATA-BACKED CREDIT APPROVAL</div>
                <div className="text-xs text-slate-400">REVENUES VERIFIED</div>
              </div>
              <div className="text-sm font-bold text-slate-300">Approved Amount: RM {lendingResult.credit_limit_myr.toFixed(2)}</div>
            </div>

            <div className="text-sm text-slate-300">Operational loan unlocked based on your 92% IoT stability score.</div>

            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-100/90">
              <p className="font-bold uppercase tracking-[0.2em] text-emerald-300">Funding Pool</p>
              <p className="mt-1">MDEC-CIMB Agtech Digital Scheme</p>
              <p className="mt-1 text-slate-300">Subsidized Rate: 3.5% p.a.</p>
            </div>

            <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
              <li>Approved Amount: RM {lendingResult.credit_limit_myr.toFixed(2)} (approx. {lendingResult.usdc_equivalent} USDC)</li>
              <li>Interest Rate: 3.5% p.a. (subsidized by the MDEC-CIMB Islamic program)</li>
              <li>Automatic Repayment: Deducted from your next harvest</li>
            </ul>

            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={() => acceptLoan(lendingResult.credit_limit_myr, lendingResult.log_message)}
                className="rounded-full bg-emerald-500 px-4 py-2 font-bold text-black"
              >
                🚀 Accept & Claim Funds Instantly
              </button>
            </div>
          </div>
        )}

        {!lendingLoading && !lendingResult && (
          <div className="space-y-3 text-sm text-slate-500">
            <p>Check your micro-loan eligibility to see data-backed offers.</p>
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
