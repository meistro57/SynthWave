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
      setSpectrum(Array.from(fftValues.subarray(0, 24)));
      requestAnimationFrame(tick);
    };
    tick();

    return () => {
      active = false;
    };
  }, []);

  const spectrumBars = useMemo(
    () => spectrum.map((value) => Math.max(2, Math.min(100, (value + 100) * 1.2))),
    [spectrum],
  );

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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Spectrum Analyzer</p>
              <div className="mt-3 grid grid-cols-12 items-end gap-1">
                {spectrumBars.map((height, index) => (
                  <div
                    key={`bar-${index}`}
                    className="rounded bg-cyan-400/70"
                    style={{ height: `${height}px` }}
                  />
                ))}
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
