import { useEffect, useState } from 'react'
import { useFarmStore } from '../../../store/useFarmStore'

function DemoController() {
  const updateData = useFarmStore((state) => state.updateData)
  const addAlert = useFarmStore((state) => state.addAlert)
  const resolveAlert = useFarmStore((state) => state.resolveAlert)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!open) {
    return null
  }

  const spike = () => {
    const current = useFarmStore.getState()
    updateData({
      sensors: {
        temp: current.sensors.temp + 4.5,
        humidity: current.sensors.humidity - 8,
        moisture: current.sensors.moisture - 12,
        ph: current.sensors.ph - 0.2,
      },
      actuators: { fan: true, pump: true, led: 'red' },
      actions: ['🎭 Demo spike injected → Fan and pump forced on'],
      impact: {
        waterSaved: current.impact.waterSaved + 1.2,
        energySaved: current.impact.energySaved + 0.1,
        costSaved: current.impact.costSaved + 2.4,
      },
    })

    addAlert({
      severity: 'critical',
      type: 'demo_spike',
      message: 'Demo spike injected. Sensors are intentionally out of band.',
      actionRequired: true,
    })
  }

  const calm = () => {
    updateData({
      sensors: { temp: 23, humidity: 66, moisture: 51, ph: 6.1 },
      actuators: { fan: false, pump: false, led: 'full' },
      actions: ['🧯 Demo reset → back to stable baseline'],
      impact: useFarmStore.getState().impact,
    })
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Demo controller</div>
          <div className="mt-1 text-sm text-white">Ctrl+Shift+D toggled this panel</div>
        </div>
        <button type="button" className="text-xs text-slate-400 transition hover:text-white" onClick={() => setOpen(false)}>
          Hide
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          className="rounded-2xl bg-rose-500/20 px-4 py-3 text-left text-sm text-rose-100 transition hover:bg-rose-500/30"
          onClick={spike}
        >
          Inject critical spike
        </button>
        <button
          type="button"
          className="rounded-2xl bg-emerald-500/15 px-4 py-3 text-left text-sm text-emerald-100 transition hover:bg-emerald-500/25"
          onClick={calm}
        >
          Return to baseline
        </button>
        <button
          type="button"
          className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/15"
          onClick={() => {
            useFarmStore.getState().alerts.forEach((alert) => resolveAlert(alert.id))
          }}
        >
          Resolve all alerts
        </button>
      </div>
    </div>
  )
}

export default DemoController