import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useFarmStore } from '../../../store/useFarmStore'

export default function ToastSystem() {
  const toasts = useFarmStore((state) => state.toasts)
  const removeToast = useFarmStore((state) => state.removeToast)

  return (
    <div className="fixed bottom-8 right-[448px] z-[60] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: any; onRemove: () => void }) {
  const onRemoveRef = useRef(onRemove)
  useEffect(() => {
    onRemoveRef.current = onRemove
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemoveRef.current()
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  const isSuccess = toast.type === 'success'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-4 rounded-2xl border bg-black/80 p-4 backdrop-blur-xl min-w-[300px] ${
        isSuccess 
          ? 'border-emerald-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(16,185,129,0.15)]' 
          : 'border-orange-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(249,115,22,0.15)]'
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
        isSuccess 
          ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/20' 
          : 'bg-orange-500/20 text-orange-400 ring-orange-500/20'
      }`}>
        {isSuccess ? <CheckCircle2 size={20} /> : <Info size={20} />}
      </div>
      <div className="flex-1">
        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
          isSuccess ? 'text-emerald-400/80' : 'text-orange-400/80'
        }`}>
          {isSuccess ? 'Operation Success' : 'System Alert'}
        </p>
        <p className="text-sm font-bold text-white tracking-tight">{toast.message}</p>
      </div>
      <button 
        onClick={onRemove}
        className="ml-2 rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white transition-all"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}
