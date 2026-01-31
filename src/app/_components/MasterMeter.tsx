"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Tone from "tone";

import { getMasterFFT, getMasterMeter } from "@/audio/audioEngine";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MasterMeter() {
  const [dbLevel, setDbLevel] = useState(-Infinity);
  const [spectrum, setSpectrum] = useState<number[]>([]);
  const [vizMode, setVizMode] = useState<"bars" | "line">("bars");
  const [colorMode, setColorMode] = useState<"bands" | "gradient">("bands");
  const [barCount, setBarCount] = useState<32 | 64>(32);
  const meterRef = useRef<Tone.Meter | null>(null);
  const fftRef = useRef<Tone.FFT | null>(null);

  useEffect(() => {
    meterRef.current = getMasterMeter();
    fftRef.current = getMasterFFT();
    let rafId = 0;

    const update = () => {
      if (meterRef.current) {
        const value = meterRef.current.getValue();
        const level = Array.isArray(value) ? value[0] : value;
        setDbLevel(level);
      }
      if (fftRef.current) {
        const fftValues = fftRef.current.getValue();
        setSpectrum(Array.from(fftValues.subarray(0, barCount)));
      }
      rafId = window.requestAnimationFrame(update);
    };

    rafId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(rafId);
  }, [barCount]);

  const normalized = clamp((dbLevel + 60) / 60, 0, 1);

  const spectrumBars = useMemo(() => {
    return spectrum.map((value, index) => {
      const height = Math.max(2, Math.min(80, (value + 100) * 1.1));
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
    return points.join(" ");
  }, [spectrumBars]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Metering</p>
          <h2 className="text-xl font-semibold text-slate-100">Master Output</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
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
          </div>
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
        <div className="h-28 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="h-full">
            {vizMode === "bars" ? (
              <div
                className="grid h-full items-end gap-1"
                style={{ gridTemplateColumns: `repeat(${spectrumBars.length}, minmax(0, 1fr))` }}
              >
                {spectrumBars.map((bar, index) => (
                  <div
                    key={`meter-bar-${index}`}
                    className="rounded-sm"
                    style={{ height: `${bar.height}px`, backgroundColor: bar.color }}
                  />
                ))}
              </div>
            ) : (
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <polyline
                  points={spectrumLine}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.9)"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
