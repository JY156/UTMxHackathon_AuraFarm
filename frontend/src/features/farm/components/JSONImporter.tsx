import { useRef, useState } from 'react'
import { Leaf, Info, Sparkles, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFarmStore, type FarmProfile } from '../../../store/useFarmStore'
import AIMarketRecommendation from './AIMarketRecommendation'

const CROP_TEMPLATES: Record<string, FarmProfile> = {
  basil: {
    name: 'Basil',
    optimal: {
      temp: [20, 25],
      humidity: [50, 70],
      moisture: [40, 60],
      ph: [6.0, 7.0],
    },
  },
  lettuce: {
    name: 'Lettuce',
    optimal: {
      temp: [15, 21],
      humidity: [60, 80],
      moisture: [50, 70],
      ph: [5.5, 7.0],
    },
  },
  tomato: {
    name: 'Tomato',
    optimal: {
      temp: [21, 28],
      humidity: [55, 75],
      moisture: [45, 65],
      ph: [6.0, 6.8],
    },
  },
}

function JSONImporter() {
  const loadProfile = useFarmStore((state) => state.loadProfile)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Drop configuration JSON or select a template.',
  })
  const [dragging, setDragging] = useState(false)

  const importFile = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<FarmProfile> & { profile?: Partial<FarmProfile> }
      const profile = parsed.profile ?? parsed

      if (!profile || typeof profile.name !== 'string' || typeof profile.optimal !== 'object') {
        throw new Error('Invalid profile schema')
      }

      loadProfile(profile as FarmProfile)
      setStatus({ type: 'success', message: `Profile "${profile.name}" deployed successfully.` })
    } catch (err) {
      setStatus({ type: 'error', message: 'Invalid profile schema. Check JSON structure.' })
    }
  }

  const loadTemplate = (template: FarmProfile) => {
    loadProfile(template)
    setStatus({ type: 'success', message: `${template.name} preset loaded.` })
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between px-2 border-b border-white/5 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-black uppercase tracking-[0.2em] text-white">Crop Orchestration & presets</h3>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Leaf size={12} className="text-emerald-400" /> Active configuration layer & B2B/B2G pre-booking ledger
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Preset templates & upload */}
        <div className="flex flex-col gap-6">
          {/* Preset Templates */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <Sparkles size={12} className="text-cyan-400" /> Optimized Presets
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(CROP_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => loadTemplate(template)}
                  className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                      <Leaf size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{template.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Optimized Preset Parameters</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-slate-500 group-hover:text-white transition-colors">
                    <Info size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Zone */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <UploadCloud size={12} className="text-emerald-400" /> Custom Configuration
            </div>
            <motion.div
              className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 transition-all duration-300 cursor-pointer ${
                dragging 
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' 
                  : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={async (e) => {
                e.preventDefault()
                setDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) await importFile(file)
              }}
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                <UploadCloud size={24} />
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-white">Upload Custom Profile</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Drag & drop profile .json files here</p>
              </div>
              
              <AnimatePresence mode="wait">
                {status.type !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`mt-3 flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest ${
                      status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Right Column: AI B2B/B2G Recommendations */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <Sparkles size={12} className="text-amber-400" /> B2B/B2G Escrow Ledger & Recommendations
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/40 p-4">
            <AIMarketRecommendation />
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await importFile(file)
          e.target.value = ''
        }}
      />
    </section>
  )
}

export default JSONImporter
