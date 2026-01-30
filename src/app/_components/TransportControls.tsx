"use client";

import { useEffect, useState } from "react";
import * as Tone from "tone";

import { initAudioEngine } from "@/audio/audioEngine";
import { GrooveTemplate, useTransportStore } from "@/store/useTransportStore";

const TIME_SIGNATURES: Array<[number, number]> = [
  [4, 4],
  [3, 4],
  [6, 8],
];

export function TransportControls() {
  const {
    bpm,
    timeSignature,
    isPlaying,
    swing,
    humanizeMs,
    grooveTemplate,
    setBpm,
    setTimeSignature,
    setSwing,
    setHumanizeMs,
    setGrooveTemplate,
    start,
    stop,
  } = useTransportStore();
  const [pendingBpm, setPendingBpm] = useState(bpm);

  useEffect(() => {
    Tone.Transport.swing = swing / 100;
    Tone.Transport.swingSubdivision = "16n";
  }, [swing]);

  const handleStart = async () => {
    await initAudioEngine();
    start();
  };

  const handleBpmCommit = () => {
    const clamped = Math.max(40, Math.min(220, Number(pendingBpm)));
    setPendingBpm(clamped);
    setBpm(clamped);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Transport</p>
          <h2 className="text-xl font-semibold text-slate-100">Tempo & Meter</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">BPM</span>
            <input
              type="number"
              min={40}
              max={220}
              value={pendingBpm}
              onChange={(event) => setPendingBpm(Number(event.target.value))}
              onBlur={handleBpmCommit}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Time Signature</span>
            <select
              value={`${timeSignature[0]}/${timeSignature[1]}`}
              onChange={(event) => {
                const [top, bottom] = event.target.value.split("/").map(Number);
                setTimeSignature([top, bottom]);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            >
              {TIME_SIGNATURES.map(([top, bottom]) => (
                <option key={`${top}/${bottom}`} value={`${top}/${bottom}`}>
                  {top}/{bottom}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Swing ({swing}%)
            </span>
            <input
              type="range"
              min={0}
              max={80}
              value={swing}
              onChange={(event) => setSwing(Number(event.target.value))}
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Humanize ({humanizeMs} ms)
            </span>
            <input
              type="range"
              min={0}
              max={40}
              value={humanizeMs}
              onChange={(event) => setHumanizeMs(Number(event.target.value))}
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Groove Template
            </span>
            <select
              value={grooveTemplate}
              onChange={(event) => setGrooveTemplate(event.target.value as GrooveTemplate)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            >
              {[
                "Straight",
                "Light Swing",
                "Heavy Swing",
                "Shuffle",
                "Triplet",
                "Custom",
              ].map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Start
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            Stop
          </button>
          <p className="text-xs text-slate-500">Status: {isPlaying ? "playing" : "stopped"}</p>
        </div>
      </div>
    </section>
  );
}
