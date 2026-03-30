import React, { useEffect, useMemo, useRef, useState } from "react";
import { alertKey, normalizeSeverity, severityMeta } from "../utils/alerting";

export default function AlertsFeed({ events, error, onNewHighCritical }) {
  const [renderList, setRenderList] = useState([]);
  const lastTopKeyRef = useRef(null);

  useEffect(() => {
    if (!events) return;
    const threats = events.filter(e => e.attack_type && e.attack_type !== "BENIGN");
    // Retain 12 to cleanly fade out items 10, 11
    setRenderList(threats.slice(0, 12));
  }, [events]);

  const topAlertKey = useMemo(() => (renderList?.[0] ? alertKey(renderList[0], 0) : null), [renderList]);
  useEffect(() => {
    if (!renderList?.length) return;
    const currentTop = renderList[0];
    const k = topAlertKey;
    if (!k) return;
    if (lastTopKeyRef.current == null) {
      lastTopKeyRef.current = k;
      return;
    }
    if (k !== lastTopKeyRef.current) {
      lastTopKeyRef.current = k;
      const sev = normalizeSeverity(currentTop?.severity);
      if (sev === "Critical" || sev === "High") onNewHighCritical?.(currentTop);
    }
  }, [renderList, topAlertKey, onNewHighCritical]);

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto space-y-3 pr-2 relative h-full">
      {error && <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-2">{error}</p>}
      {!renderList.length ? (
        <div className="text-gray-500 text-center mt-20 italic text-xs font-bold tracking-widest uppercase">Awaiting Active Traces...</div>
      ) : (
        renderList.map((alert, i) => {
          const meta = severityMeta(alert?.severity);

          const isFading = i >= 10;

          return (
            <div 
              key={alertKey(alert, i)}
              className={`bg-gray-800 p-3 rounded-lg flex justify-between items-center shadow border border-gray-700/50 
                animate-[slideInRight_300ms_ease-out_forwards]
                transition-all duration-300
                ${isFading ? 'opacity-0 h-0 py-0 my-0 overflow-hidden border-none transform scale-95' : 'opacity-100'}
              `}
              style={{ animationFillMode: "forwards" }}
            >
              <div className="flex flex-col">
                <span className="font-mono text-cyan-300 text-xs tracking-tight drop-shadow-sm">{alert.src_ip}</span>
                <span className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">{alert.attack_type || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                {meta.pulse ? (
                  <span className="relative inline-flex">
                    <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 opacity-75 animate-[pulseRing_1.1s_ease-out_infinite]" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.55)]" />
                  </span>
                ) : null}
                <span className={`${meta.badge} font-extrabold text-[10px] px-2.5 py-1 rounded shadow-sm tracking-widest uppercase`}>
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.75; }
          70% { transform: scale(2.1); opacity: 0; }
          100% { transform: scale(2.1); opacity: 0; }
        }
      `}} />
    </div>
  );
}
