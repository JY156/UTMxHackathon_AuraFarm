import { useEffect, useState } from 'react';
import { useFarmStore } from '../../../store/useFarmStore';
import { Bot, Calendar, AlertTriangle } from 'lucide-react';
import type { AIInsightsData } from '../../../types';

export default function AIInsightsTab() {
  const cvData = useFarmStore((state) => state.cvData);
  const [insights, setInsights] = useState<AIInsightsData | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/ai/insights');
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadInsights();
  }, []);

  if (!insights) {
    return <div className="text-emerald-400 p-8">Loading AI Insights...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* CV Data Card */}
      <div className="rounded-3xl border border-emerald-500/20 bg-black/40 p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-400">
          <Bot size={20} />
          Computer Vision Analysis
        </h3>
        {cvData ? (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>Crop Type</span>
              <span className="font-semibold text-white capitalize">{cvData.crop_type}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>Overall Health</span>
              <span className={`font-semibold capitalize ${cvData.overall_health === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {cvData.overall_health}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>Growth Stage</span>
              <span className="font-semibold text-white capitalize">{cvData.growth_stage}</span>
            </div>

            {cvData.diseases_detected && cvData.diseases_detected.length > 0 && (
              <div className="rounded-lg bg-rose-500/10 p-3 border border-rose-500/30">
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                  <AlertTriangle size={16} />
                  Threats Detected
                </div>
                {cvData.diseases_detected.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span>{d.name}</span>
                    <span className="text-rose-300">Conf: {(d.confidence * 100).toFixed(0)}% | {d.severity}</span>
                  </div>
                ))}
              </div>
            )}

            {cvData.recommendations && cvData.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-emerald-400 mb-2 text-xs uppercase tracking-wider">AI Recommendations</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {cvData.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-400">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-500 italic text-sm">No recent camera scan available.</div>
        )}
      </div>

      {/* Harvest Data Card */}
      <div className="rounded-3xl border border-emerald-500/20 bg-black/40 p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-400">
          <Calendar size={20} />
          Harvest Forecast
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-3xl font-black text-emerald-400">{insights.harvest_data?.days_remaining || '-'}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Days Remaining</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-3xl font-black text-emerald-400">{insights.predicted_yield?.value || '-'}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">{insights.predicted_yield?.unit || ''} Est. Yield</div>
          </div>
        </div>

        <h4 className="font-semibold text-emerald-400 mb-3 text-xs uppercase tracking-wider">Demand Analysis</h4>
        <div className="space-y-3 text-sm text-slate-300 bg-white/5 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Suggested Harvest</span>
            <span className="font-bold text-emerald-400">{insights.demand_analysis?.suggested_harvest_day || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Peak Demand Days</span>
            <span className="font-bold text-white">{insights.demand_analysis?.peak_days?.join(', ') || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Est. Revenue</span>
            <span className="font-bold text-emerald-400">{insights.demand_analysis?.revenue_estimate || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
