import { useMemo } from "react";
import { useStream } from "../hooks/useStream";
import { useSummary } from "../hooks/useSummary";
import { useInsights } from "../hooks/useInsights";
import { useRiskScores } from "../hooks/useRiskScores";
import { useAlertAudio } from "../hooks/useAlertAudio";
import Card from "../components/Card";
import AlertsFeed from "../components/AlertsFeed";
import AlertPanels from "../components/AlertPanels";
import RiskIndicator from "../components/RiskIndicator";
import LiveTrafficChart from "../components/LiveTrafficChart";
import AttackTypeDistribution from "../components/AttackTypeDistribution";
import RiskScoresPanel from "../components/RiskScoresPanel";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function Stat({ label, value, accent = "text-slate-100" }) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 hover:bg-slate-900/70 transition">
      <div className="text-[10px] text-slate-400 font-bold tracking-[0.22em] uppercase">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tracking-tight ${accent}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { summary, loading: summaryLoading, error: summaryError } = useSummary();
  const { insights } = useInsights({ pollMs: 15000 });
  const { riskScores, loading: riskLoading, error: riskError } = useRiskScores({ pollMs: 5000 });
  const { events, isConnected, error: streamError } = useStream();
  const alertAudio = useAlertAudio();

  const handleStartSim = () => {
    fetch(`${API_BASE}/api/sim/start`, { method: "POST" })
      .catch(e => console.error(e));
  };
  
  const handleStopSim = () => {
    fetch(`${API_BASE}/api/sim/stop`, { method: "POST" })
      .catch(e => console.error(e));
  };

  const risk = summary?.system_risk ?? 0;
  const distribution = useMemo(() => {
    if (insights?.attack_distribution?.length) return insights.attack_distribution;
    if (Array.isArray(summary?.top_attack_types)) return summary.top_attack_types;
    return [];
  }, [insights, summary]);

  return (
    <div className="bg-gray-900 min-h-screen text-cyan-400 p-6 font-sans max-w-screen-2xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <div className="text-slate-400 text-[10px] font-bold tracking-[0.28em] uppercase">Intrusion Detection System</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">NetSentinel SOC Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold tracking-widest uppercase ${
            isConnected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}>
            {isConnected ? "Live stream connected" : "Live stream disconnected"}
          </div>
          <button
            onClick={alertAudio.arm}
            disabled={!alertAudio.supported || alertAudio.armed}
            className={`px-3 py-2 rounded-xl border text-[11px] font-extrabold tracking-widest uppercase transition active:scale-[0.98] ${
              !alertAudio.supported
                ? "border-slate-700/60 bg-slate-900/40 text-slate-500 cursor-not-allowed"
                : alertAudio.armed
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-200 cursor-default"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
            }`}
            title={alertAudio.supported ? (alertAudio.armed ? "Alert sound enabled" : "Enable alert sound (required by browser)") : "Audio not supported"}
          >
            {alertAudio.supported ? (alertAudio.armed ? "Sound enabled" : "Enable sound") : "Sound N/A"}
          </button>
          <button
            onClick={handleStartSim}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-extrabold tracking-widest uppercase border border-cyan-400/30 shadow-[0_0_18px_rgba(34,211,238,0.15)] transition active:scale-[0.98]"
          >
            Start simulation
          </button>
          <button
            onClick={handleStopSim}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-extrabold tracking-widest uppercase border border-slate-700/60 transition active:scale-[0.98]"
          >
            Stop
          </button>
        </div>
      </div>
      
      {summaryError && (
        <Card className="border border-red-500 mb-6">
          <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Error Loading Summary: {summaryError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
        {summaryLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[74px] rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          ))
        ) : (
          <>
            <Stat label="Total events" value={summary?.total_events ?? 0} accent="text-slate-100" />
            <Stat label="Attack events" value={summary?.attack_count ?? 0} accent="text-rose-300" />
            <Stat label="Benign events" value={summary?.benign_count ?? 0} accent="text-cyan-200" />
            <Stat label="Active alerts" value={summary?.active_alerts ?? 0} accent="text-amber-200" />
            <Stat label="Attack ratio" value={`${Math.round(((summary?.attack_ratio ?? 0) * 100) * 10) / 10}%`} accent="text-slate-100" />
            <Stat label="System risk" value={Math.round(risk)} accent={risk > 70 ? "text-rose-300" : risk > 30 ? "text-amber-200" : "text-emerald-200"} />
          </>
        )}
      </div>

      <div className="mb-4">
        <AlertPanels events={events} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 pb-8">
        <Card title="Live traffic (last 60s)" className="xl:col-span-8 border border-slate-700/60 bg-slate-900/40 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">
              Total vs Attacks (from SSE stream)
            </div>
            <div className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
              Buffer: {events?.length ?? 0}/100
            </div>
          </div>
          <LiveTrafficChart events={events} windowSeconds={60} height={280} />
          <div className="mt-2 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            Note: chart is derived from stream timestamps (1 event ≈ 1 packet/flow record).
          </div>
        </Card>

        <Card title="System risk" className="xl:col-span-4 border border-slate-700/60 bg-slate-900/40 rounded-2xl p-0">
          <RiskIndicator risk={risk} loading={summaryLoading} />
        </Card>

        <Card title="Attack type distribution" className="xl:col-span-4 border border-slate-700/60 bg-slate-900/40 rounded-2xl">
          <AttackTypeDistribution distribution={distribution} height={280} />
        </Card>

        <Card title="Alert panel (real-time)" className="xl:col-span-5 border border-slate-700/60 bg-slate-900/40 rounded-2xl h-[360px] flex flex-col">
          <AlertsFeed
            events={events}
            error={streamError}
            onNewHighCritical={(a) => alertAudio.play(a?.severity)}
          />
        </Card>

        <Card title="Top risk scores (real-time)" className="xl:col-span-3 border border-slate-700/60 bg-slate-900/40 rounded-2xl h-[360px] flex flex-col">
          <RiskScoresPanel riskScores={riskScores} loading={riskLoading} error={riskError} />
        </Card>
      </div>

    </div>
  );
}
