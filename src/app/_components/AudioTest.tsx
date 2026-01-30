"use client";

import { useState } from "react";
import * as Tone from "tone";

import { initAudioEngine } from "@/audio/audioEngine";
import { routeToMaster } from "@/audio/routing";
import { useTransportStore } from "@/store/useTransportStore";

type Status = "idle" | "ready" | "playing";

export function AudioTest() {
  const [status, setStatus] = useState<Status>("idle");
  const { isPlaying, start, stop } = useTransportStore();

  const handleInit = async () => {
    await initAudioEngine();
    setStatus("ready");
  };

  const handlePing = async () => {
    await initAudioEngine();
    const osc = new Tone.Oscillator("C4", "sawtooth");
    routeToMaster(osc);
    osc.start();
    osc.stop("+0.2");
    setStatus("playing");
    window.setTimeout(() => setStatus("ready"), 250);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Audio Boot</p>
          <h2 className="text-xl font-semibold text-slate-100">Engine Smoke Test</h2>
        </div>
        <p className="text-sm text-slate-400">
          Initialize Tone.js with a user gesture, then ping the output chain to confirm sound.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleInit}
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Initialize Audio
          </button>
          <button
            type="button"
            onClick={handlePing}
            className="rounded-full border border-cyan-500/50 px-5 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-300 hover:text-cyan-100"
          >
            Ping Oscillator
          </button>
          <button
            type="button"
            onClick={isPlaying ? stop : start}
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            {isPlaying ? "Stop Transport" : "Start Transport"}
          </button>
        </div>
        <p className="text-xs text-slate-500">Status: {status}</p>
      </div>
    </section>
  );
}
