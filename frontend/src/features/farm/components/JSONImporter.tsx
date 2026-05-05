import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { useFarmStore, type FarmProfile } from '../../../store/useFarmStore'

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
  const [message, setMessage] = useState('Drop a profile JSON file or select a preset below.')
  const [dragging, setDragging] = useState(false)

  const importFile = async (file: File) => {
    const text = await file.text()
    const parsed = JSON.parse(text) as Partial<FarmProfile> & { profile?: Partial<FarmProfile> }
    const profile = parsed.profile ?? parsed

    if (!profile || typeof profile.name !== 'string' || typeof profile.optimal !== 'object') {
      throw new Error('Invalid profile schema')
    }

    loadProfile(profile as FarmProfile)
    setMessage(`✓ Loaded ${profile.name} successfully.`)
  }

  const loadTemplate = (template: FarmProfile) => {
    loadProfile(template)
    setMessage(`✓ Loaded ${template.name} profile.`)
  }

  return (
    <section
      className={`rounded-[28px] border border-dashed p-4 backdrop-blur-xl transition ${
        dragging ? 'border-cyan-300 bg-cyan-500/10' : 'border-white/15 bg-white/5'
      }`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={async (event) => {
        event.preventDefault()
        setDragging(false)

        const file = event.dataTransfer.files[0]
        if (!file) {
          return
        }

        try {
          await importFile(file)
        } catch {
          setMessage('Invalid profile file.')
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Crop Profiles</p>
          <h2 className="text-lg font-semibold text-white">Load a preset or upload custom</h2>
        </div>
        <button
          type="button"
          className="border border-white/30 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/50 hover:bg-white/10 flex items-center gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp size={16} />
          Upload
        </button>
      </div>

      <p className="mb-4 text-sm text-slate-300">{message}</p>

      {/* Quick-load templates */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(CROP_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            type="button"
            onClick={() => loadTemplate(template)}
            className="border border-emerald-400/30 rounded-lg bg-emerald-500/10 px-3 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
            title={`Load ${template.name} profile`}
          >
            {template.name}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          try {
            await importFile(file)
          } catch {
            setMessage('Invalid profile file.')
          } finally {
            event.target.value = ''
          }
        }}
      />
    </section>
  )
}

export default JSONImporter
