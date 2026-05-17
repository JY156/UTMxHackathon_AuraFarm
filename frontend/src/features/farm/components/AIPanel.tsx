import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Clock, TrendingUp, RefreshCw, Sparkles, BrainCircuit, ShieldCheck, Terminal, Info } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useFarmStore } from '../../../store/useFarmStore'

function TypewriterText({ text }: { text: string }) {
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setTypedText(text.slice(0, index))

      if (index >= text.length) {
        window.clearInterval(timer)
      }
    }, 15)

    return () => window.clearInterval(timer)
  }, [text])

  return <>{typedText}</>
}

function AIPanel() {
  const { aiRec, fetchAI } = useFarmStore(
    useShallow((state) => ({ aiRec: state.aiRec, fetchAI: state.fetchAI })),
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

  const timeAgo = aiRec.timestamp
    ? Math.round((Date.now() - aiRec.timestamp) / 1000) < 60
      ? 'just now'
      : Math.round((Date.now() - aiRec.timestamp) / 60000) + 'm ago'
    : 'never'

  const confidence = aiRec.confidence || 0
  
  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">AI Intelligence</h3>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <BrainCircuit size={12} className="text-emerald-400" /> Neural engine active
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

      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-black/40 backdrop-blur-xl">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-6 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
          </div>
          <div className="mx-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Terminal size={12} /> recommendation_engine.sh
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
            <Sparkles size={12} /> v2.4.0
          </div>
        </div>

        <div className="min-h-[220px] p-8">
          <AnimatePresence mode="wait">
            {aiRec.loading ? (
              <motion.div
                key="loading"
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-400/70">Scanning environment metrics...</span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-2 w-4/5 animate-pulse rounded bg-white/5" />
                  <div className="h-2 w-3/4 animate-pulse rounded bg-white/5" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={aiRec.text}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="relative rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-sm font-medium leading-relaxed text-slate-200">
                    <span className="mr-2 font-bold text-emerald-400">&gt;</span>
                    <TypewriterText text={aiRec.text || "No recommendations at this time."} />
                  </p>
                </div>
                
                {aiRec.context && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3"
                  >
                    <Info size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                    <p className="text-[11px] font-medium leading-relaxed text-slate-400">
                      {aiRec.context}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Terminal Footer */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Confidence: <span className="text-white">{confidence}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Last Sync: <span className="text-white">{timeAgo}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Optimized</span>
          </div>
        </div>
      </div>

      {/* Grid of secondary metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 rounded-3xl border border-white/5 bg-white/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Model Precision</p>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-bold text-white">98.2%</h4>
            <div className="h-1 w-12 rounded-full bg-emerald-500/20">
              <div className="h-full w-4/5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-3xl border border-white/5 bg-white/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Automation Uplift</p>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-bold text-white">+14.5%</h4>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default AIPanel
