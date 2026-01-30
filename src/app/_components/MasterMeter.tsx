"use client";

import { useEffect, useMemo, useState } from "react";

import { getMasterMeter } from "@/audio/audioEngine";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MasterMeter() {
  const [dbLevel, setDbLevel] = useState(-Infinity);
  const meter = useMemo(() => getMasterMeter(), []);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      const value = meter.getValue();
      const level = Array.isArray(value) ? value[0] : value;
      setDbLevel(level);
      rafId = window.requestAnimationFrame(update);
    };

    rafId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(rafId);
  }, [meter]);

  const normalized = clamp((dbLevel + 60) / 60, 0, 1);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Metering</p>
          <h2 className="text-xl font-semibold text-slate-100">Master Output</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-28 w-5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full origin-bottom bg-gradient-to-t from-cyan-500 via-cyan-300 to-slate-50"
              style={{ transform: `scaleY(${normalized})` }}
            />
          </div>
          <div className="text-sm text-slate-400">
            <p>Level</p>
            <p className="text-lg font-semibold text-slate-100">{dbLevel.toFixed(1)} dB</p>
          </div>
        </div>
      </div>
    </section>
  );
}
