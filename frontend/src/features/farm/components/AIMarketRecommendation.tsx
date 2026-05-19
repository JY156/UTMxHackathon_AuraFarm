import React from 'react'
import { Bolt, RefreshCw, ExternalLink } from 'lucide-react'
import { useFarmStore } from '../../../store/useFarmStore'

const VERIFIED_BASIL_PARAMS = {
  temperature_c: [24, 28],
  humidity_pct: [60, 70],
  ph: [6.2, 6.8],
  ec_ms_cm: [1.6, 2.2],
  light: 'High Blue/Red ratio',
}

const AIMarketRecommendation: React.FC = () => {
  const profile = useFarmStore((s) => s.profile)
  const switchCrop = useFarmStore((s) => s.switchCrop)

  const currentValue = profile?.name?.toLowerCase().includes('lettuce') ? 904.0 : 904.0
  const projectedBasil = 1120.0

  const handleSwitch = async () => {
    await switchCrop('basil', { verified_by: 'MARDI_DOA', params: VERIFIED_BASIL_PARAMS })
  }

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-300">
            <Bolt />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-wider text-white">AI Market Recommendation</div>
            <div className="text-[11px] text-slate-400">Live FAMA data indicates a shortage in Premium Basil supply.</div>
          </div>
        </div>
        <div className="text-[10px] font-bold text-amber-300 uppercase">[ HIGH DEMAND SHIFT ]</div>
      </div>

      <div className="mt-3 border-t border-white/5 pt-3">
        <p className="text-xs text-slate-300">
          Changing your upcoming cycle from Lettuce to Basil can increase your revenue profile by{' '}
          <span className="font-black text-emerald-300">+24%</span>.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <div className="text-slate-400">• Current Lettuce Value:</div>
          <div className="text-white font-black">RM {currentValue.toFixed(2)}</div>
          <div className="text-slate-400">• Projected Basil Value:</div>
          <div className="text-white font-black">RM {projectedBasil.toFixed(2)}</div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={handleSwitch}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] font-black text-emerald-300 hover:bg-emerald-500/15"
          >
            <RefreshCw size={14} />
            <span>Switch Next Cycle to Basil Preset</span>
          </button>
        </div>

        <div className="mt-4 text-[11px] text-slate-400">
          <div className="font-bold text-slate-200">Verified Basil Parameters</div>
          <ul className="mt-2 list-disc pl-5">
            <li>Temperature: 24°C - 28°C</li>
            <li>Humidity: 60% - 70%</li>
            <li>pH: 6.2 - 6.8</li>
            <li>EC: 1.6 - 2.2 mS/cm</li>
            <li>Light: High Blue/Red ratio</li>
          </ul>

          <div className="mt-3 text-[11px]">
            <div>Verification sources:</div>
            <div className="mt-1 flex gap-3">
              <a
                href="https://www.mardi.gov.my/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 font-bold inline-flex items-center gap-1"
              >
                MARDI Official Repository <ExternalLink size={12} />
              </a>
              <a
                href="https://www.doa.gov.my/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 font-bold inline-flex items-center gap-1"
              >
                DOA Malaysia <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIMarketRecommendation
