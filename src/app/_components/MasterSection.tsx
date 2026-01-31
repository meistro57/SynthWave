"use client";

import { useEffect, useMemo, useState } from "react";

import {
  setDelaySendLevel,
  setMasterCompressorEnabled,
  getMasterFFT,
  getMasterMeter,
  getMasterWidthMeter,
  setReverbSendLevel,
  setMasterEQ,
  setMasterBoost,
  setMasterVolume,
} from "@/audio/audioEngine";
import { MASTER_LIMITER_THRESHOLD_DB } from "@/audio/constants";

export function MasterSection() {
  const [volume, setVolume] = useState(0.9);
  const [eq, setEq] = useState({ low: 0, mid: 0, high: 0 });
  const [delaySend, setDelaySend] = useState(0.2);
  const [reverbSend, setReverbSend] = useState(0.2);
  const [compressorEnabled, setCompressorEnabled] = useState(false);
  const [boost, setBoost] = useState(1.2);
  const [meter, setMeter] = useState(0);
  const [width, setWidth] = useState(0);
  const [spectrum, setSpectrum] = useState<number[]>([]);
  const [vizMode, setVizMode] = useState<"bars" | "line">("bars");
  const [colorMode, setColorMode] = useState<"bands" | "gradient">("bands");
  const [barCount, setBarCount] = useState<32 | 64>(64);
  const [peakHold, setPeakHold] = useState(true);
  const [peakDecay, setPeakDecay] = useState(4);
  const peakRef = useState<number[]>([])[0];

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  useEffect(() => {
    setMasterEQ(eq.low, eq.mid, eq.high);
  }, [eq]);

  useEffect(() => {
    setDelaySendLevel(delaySend);
  }, [delaySend]);

  useEffect(() => {
    setReverbSendLevel(reverbSend);
  }, [reverbSend]);

  useEffect(() => {
    setMasterCompressorEnabled(compressorEnabled);
  }, [compressorEnabled]);

  useEffect(() => {
    setMasterBoost(boost);
  }, [boost]);

  useEffect(() => {
    let active = true;
    const meterNode = getMasterMeter();
    const widthNode = getMasterWidthMeter();
    const fft = getMasterFFT();

    const tick = () => {
      if (!active) return;
      const raw = meterNode.getValue();
      const level = Array.isArray(raw) ? raw[0] : raw;
      setMeter(Math.max(0, Math.min(1, (level + 60) / 60)));

      const widthValues = widthNode.getValue();
      if (Array.isArray(widthValues) && widthValues.length >= 2) {
        const diff = Math.abs(widthValues[0] - widthValues[1]);
        setWidth(Math.max(0, Math.min(1, diff / 60)));
      }

      const fftValues = fft.getValue();
      setSpectrum(Array.from(fftValues.subarray(0, barCount)));

      if (peakHold) {
        const next = Array.from(fftValues.subarray(0, barCount)).map((value) =>
          Math.max(2, Math.min(100, (value + 100) * 1.2)),
        );
        for (let i = 0; i < next.length; i += 1) {
          const current = peakRef[i] ?? 0;
          const decayed = Math.max(0, current - peakDecay);
          peakRef[i] = Math.max(decayed, next[i]);
        }
      } else if (peakRef.length) {
        peakRef.length = 0;
      }
      requestAnimationFrame(tick);
    };
    tick();

    return () => {
      active = false;
    };
  }, []);

  const spectrumBars = useMemo(() => {
    return spectrum.map((value, index) => {
      const height = Math.max(2, Math.min(100, (value + 100) * 1.2));
      if (colorMode === "gradient") {
        const hue = 190 + (index / Math.max(1, spectrum.length - 1)) * 110;
        return { height, color: `hsl(${hue}, 85%, 60%)` };
      }
      const third = spectrum.length / 3;
      const band = index < third ? "low" : index < third * 2 ? "mid" : "high";
      const color =
        band === "low"
          ? "rgba(34, 211, 238, 0.85)"
          : band === "mid"
            ? "rgba(251, 191, 36, 0.85)"
            : "rgba(167, 139, 250, 0.85)";
      return { height, color };
    });
  }, [spectrum, colorMode]);

  const spectrumLine = useMemo(() => {
    const points = spectrumBars.map((bar, index) => {
      const x = (index / Math.max(1, spectrumBars.length - 1)) * 100;
      const y = 100 - bar.height;
      return `${x},${y}`;
    });
    return `0,100 ${points.join(" ")} 100,100`;
  }, [spectrumBars]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Master</p>
          <h2 className="text-xl font-semibold text-slate-100">Master Section</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Master Volume</p>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="mt-3 w-full"
              />
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${meter * 100}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Master Boost</p>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.01}
                value={boost}
                onChange={(event) => setBoost(Number(event.target.value))}
                className="mt-3 w-full"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Parametric EQ</p>
              <div className="mt-3 grid gap-3">
                {(["low", "mid", "high"] as const).map((band) => (
                  <label key={band} className="space-y-2 text-xs text-slate-500">
                    {band}
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={eq[band]}
                      onChange={(event) =>
                        setEq((prev) => ({ ...prev, [band]: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Send/Return</p>
              <div className="mt-3 grid gap-3 text-xs text-slate-500">
                <label className="space-y-2">
                  Delay Send
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={delaySend}
                    onChange={(event) => setDelaySend(Number(event.target.value))}
                    className="w-full"
                  />
                </label>
                <label className="space-y-2">
                  Reverb Send
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={reverbSend}
                    onChange={(event) => setReverbSend(Number(event.target.value))}
                    className="w-full"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Spectrum EQ</p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setVizMode((mode) => (mode === "bars" ? "line" : "bars"))}
                    className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-200"
                  >
                    {vizMode === "bars" ? "Bars" : "Line"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode((mode) => (mode === "bands" ? "gradient" : "bands"))}
                    className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-200"
                  >
                    {colorMode === "bands" ? "Bands" : "Gradient"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarCount((count) => (count === 64 ? 32 : 64))}
                    className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-200"
                  >
                    {barCount} bars
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeakHold((value) => !value)}
                    className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-200"
                  >
                    {peakHold ? "Peak On" : "Peak Off"}
                  </button>
                </div>
              </div>
              <div className="mt-3 h-56 rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-3">
                <div className="h-full">
                  {vizMode === "bars" ? (
                    <div
                      className="grid h-full items-end gap-1"
                      style={{ gridTemplateColumns: `repeat(${spectrumBars.length}, minmax(0, 1fr))` }}
                    >
                      {spectrumBars.map((bar, index) => (
                        <div
                          key={`bar-${index}`}
                          className="rounded-sm"
                          style={{ height: `${bar.height}px`, backgroundColor: bar.color }}
                        />
                      ))}
                      {peakHold &&
                        peakRef.slice(0, spectrumBars.length).map((peak, index) => (
                          <div
                            key={`peak-${index}`}
                            className="h-0.5 rounded-sm bg-white/60"
                            style={{ marginTop: `${100 - peak}px` }}
                          />
                        ))}
                    </div>
                  ) : (
                    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
                      <polyline
                        points={spectrumLine}
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.9)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-cyan-200">Low</span>
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-amber-200">Mid</span>
                  <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-violet-200">High</span>
                </div>
                {peakHold && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                    Peak Decay
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={peakDecay}
                      onChange={(event) => setPeakDecay(Number(event.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Stereo Width</p>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-amber-300" style={{ width: `${width * 100}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Master Compressor</p>
              <button
                type="button"
                onClick={() => setCompressorEnabled((value) => !value)}
                className={
                  "mt-3 w-full rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                  (compressorEnabled
                    ? "border-emerald-400 text-emerald-200"
                    : "border-slate-700 text-slate-300 hover:border-emerald-300")
                }
              >
                {compressorEnabled ? "Compressor On" : "Compressor Off"}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Transparent glue before the limiter for tighter peaks.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Limiter</p>
              <p className="mt-2 text-xs text-slate-400">
                Brick-wall limiter engaged at {Math.round(MASTER_LIMITER_THRESHOLD_DB)} dB threshold.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
