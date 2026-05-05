import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Clock, TrendingUp, RefreshCw } from 'lucide-react'
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
    }, 20)

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

  const timeAgo = aiRec.timestamp
    ? Math.round((Date.now() - aiRec.timestamp) / 1000) < 60
      ? 'just now'
      : Math.round((Date.now() - aiRec.timestamp) / 60000) + 'm ago'
    : 'never'

  const confidence = aiRec.confidence || 0
  let confidenceColor = 'text-emerald-400'
  let confidenceBg = 'bg-emerald-500/10 border-emerald-400/20'
  
  if (confidence < 50) {
    confidenceColor = 'text-rose-400'
    confidenceBg = 'bg-rose-500/10 border-rose-400/20'
  } else if (confidence < 80) {
    confidenceColor = 'text-amber-400'
    confidenceBg = 'bg-amber-500/10 border-amber-400/20'
  }

  const nextCheckTime = new Date(Date.now() + 5 * 60 * 1000)
  const nextCheckFormatted = `${String(nextCheckTime.getHours()).padStart(2, '0')}:${String(nextCheckTime.getMinutes()).padStart(2, '0')}`

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">AI Recommendation Engine</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Crop guidance & optimization</h2>
        </div>
        <button
          type="button"
          onClick={() => void fetchAI()}
          className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
          title="Refresh recommendation"
        >
          {aiRec.loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <AnimatePresence mode="wait">
          {aiRec.loading ? (
            <motion.div
              key="loading"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3 text-emerald-300">
                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm">Processing crop data...</span>
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-600" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-slate-600" />
              </div>
            </motion.div>
          ) : aiRec.text ? (
            <motion.div
              key={aiRec.text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-sm leading-6 text-slate-100">
                <TypewriterText text={aiRec.text} />
              </div>
              {aiRec.context && (
                <div className="rounded-lg border border-white/5 bg-white/5 p-2 text-xs text-slate-400">
                  {aiRec.context}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Status metadata section */}
      <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="text-xs">
            <div className="flex items-center gap-1 text-slate-500 uppercase tracking-[0.2em]">
              <Clock size={12} />
              Next check
            </div>
            <div className="mt-1 font-semibold text-emerald-300">{nextCheckFormatted}</div>
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1 text-slate-500 uppercase tracking-[0.2em]">
              <TrendingUp size={12} />
              Accuracy
            </div>
            <div className="mt-1 font-semibold text-slate-200">92% (7d)</div>
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1 text-slate-500 uppercase tracking-[0.2em]">
              <RefreshCw size={12} />
              Refresh
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-300">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with confidence and timestamp */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <div className={`rounded-lg border ${confidenceBg} px-3 py-1 text-xs font-medium ${confidenceColor}`}>
          {confidence >= 80 && '✓ '}
          {confidence < 80 && confidence >= 50 && '◐ '}
          {confidence < 50 && '⚠ '}
          {confidence}% confidence
        </div>
        <span className="text-xs text-slate-400">Updated {timeAgo}</span>
      </div>
    </section>
  )
}

export default AIPanel
