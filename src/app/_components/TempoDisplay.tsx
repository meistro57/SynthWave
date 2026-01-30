"use client";

import { useTransportStore } from "@/store/useTransportStore";

export function TempoDisplay() {
  const { bpm, timeSignature, swing, humanizeMs, grooveTemplate } = useTransportStore();

  return (
    <div className="rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
      {bpm} BPM · {timeSignature[0]}/{timeSignature[1]} · {grooveTemplate} · Swing {swing}% · Humanize{" "}
      {humanizeMs}ms
    </div>
  );
}
