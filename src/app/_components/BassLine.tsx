"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

import {
  BassLineEnvelope,
  initBassLine,
  triggerBassLine,
  updateBassLine,
} from "@/audio/instruments/bassLine";
import { useTransportStore } from "@/store/useTransportStore";

const NOTES = ["C2", "D2", "E2", "G2", "A2", "C3"] as const;
const PATTERN_NOTES = ["-", ...NOTES] as const;
const OSC_TYPES: Tone.ToneOscillatorType[] = ["sawtooth", "square", "triangle"];
const PATTERN_STORAGE_KEY = "synthwave.bassline.patterns";
const SLOT_STORAGE_KEY = "synthwave.bassline.slots";
const SLOT_LABELS = ["A", "B", "C", "D"] as const;

type BassLinePattern = {
  name: string;
  steps: number;
  notes: (typeof PATTERN_NOTES)[number][];
  accents: boolean[];
  glides: boolean[];
  settings: {
    oscillator: Tone.ToneOscillatorType;
    envelope: BassLineEnvelope;
    filterCutoff: number;
    filterResonance: number;
    accent: number;
    glide: number;
  };
};

export function BassLine({ embedded = false }: { embedded?: boolean }) {
  const { isPlaying, swing, humanizeMs } = useTransportStore();
  const [ready, setReady] = useState(false);
  const [oscType, setOscType] = useState<Tone.ToneOscillatorType>("sawtooth");
  const [envelope, setEnvelope] = useState<BassLineEnvelope>({
    attack: 0.01,
    decay: 0.2,
    sustain: 0.6,
    release: 0.4,
  });
  const [filterCutoff, setFilterCutoff] = useState(800);
  const [filterResonance, setFilterResonance] = useState(1.2);
  const [accent, setAccent] = useState(0.6);
  const [glide, setGlide] = useState(0.08);
  const [accentMode, setAccentMode] = useState(false);
  const [glideMode, setGlideMode] = useState(false);
  const [steps] = useState(16);
  const [patternNotes, setPatternNotes] = useState<(typeof PATTERN_NOTES)[number][]>(
    Array.from({ length: steps }, () => "-"),
  );
  const [patternAccents, setPatternAccents] = useState<boolean[]>(
    Array.from({ length: steps }, () => false),
  );
  const [patternGlides, setPatternGlides] = useState<boolean[]>(
    Array.from({ length: steps }, () => false),
  );
  const [patternName, setPatternName] = useState("BassLine Pattern");
  const [patterns, setPatterns] = useState<Record<string, BassLinePattern>>({});
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [slots, setSlots] = useState<Record<(typeof SLOT_LABELS)[number], BassLinePattern | null>>({
    A: null,
    B: null,
    C: null,
    D: null,
  });
  const [currentSlot, setCurrentSlot] = useState<(typeof SLOT_LABELS)[number]>("A");
  const [importText, setImportText] = useState("");

  const scheduleIdRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const notesRef = useRef(patternNotes);
  const accentsRef = useRef(patternAccents);
  const glidesRef = useRef(patternGlides);
  const swingRef = useRef(swing);
  const humanizeRef = useRef(humanizeMs);

  useEffect(() => {
    notesRef.current = patternNotes;
  }, [patternNotes]);

  useEffect(() => {
    accentsRef.current = patternAccents;
  }, [patternAccents]);

  useEffect(() => {
    glidesRef.current = patternGlides;
  }, [patternGlides]);

  useEffect(() => {
    swingRef.current = swing;
  }, [swing]);

  useEffect(() => {
    humanizeRef.current = humanizeMs;
  }, [humanizeMs]);

  useEffect(() => {
    updateBassLine({
      oscillator: oscType,
      envelope,
      filterCutoff,
      filterResonance,
      accent,
      glide,
    });
  }, [oscType, envelope, filterCutoff, filterResonance, accent, glide]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(PATTERN_STORAGE_KEY);
    if (!raw) return;
    try {
      setPatterns(JSON.parse(raw));
    } catch {
      setPatterns({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SLOT_STORAGE_KEY);
    if (!raw) return;
    try {
      setSlots(JSON.parse(raw));
    } catch {
      setSlots({ A: null, B: null, C: null, D: null });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  const handleInit = async () => {
    await initBassLine();
    setReady(true);
  };

  const handlePlay = async (note: string) => {
    if (!ready) {
      await initBassLine();
      setReady(true);
    }
    await triggerBassLine(note, "8n", undefined, 0.8, accentMode, glideMode);
  };

  useEffect(() => {
    if (!isPlaying) {
      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }
      stepRef.current = 0;
      return;
    }

    scheduleIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const step = stepRef.current % steps;
      const note = notesRef.current[step];
      const accentStep = accentsRef.current[step];
      const glideStep = glidesRef.current[step];
      const swingAmount = swingRef.current / 100;
      const baseStep = Tone.Time("16n").toSeconds();
      const swingOffset = step % 2 === 1 ? baseStep * 0.5 * swingAmount : 0;
      const humanizeSeconds = (Math.random() * 2 - 1) * (humanizeRef.current / 1000);
      const scheduledTime = time + swingOffset + humanizeSeconds;

      if (note && note !== "-") {
        triggerBassLine(note, "16n", scheduledTime, 0.8, accentStep, glideStep);
      }

      stepRef.current += 1;
    }, "16n");

    return () => {
      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }
    };
  }, [isPlaying, steps]);

  const handleSavePattern = () => {
    const payload: BassLinePattern = {
      name: patternName.trim() || "BassLine Pattern",
      steps,
      notes: patternNotes,
      accents: patternAccents,
      glides: patternGlides,
      settings: {
        oscillator: oscType,
        envelope,
        filterCutoff,
        filterResonance,
        accent,
        glide,
      },
    };
    setPatterns((prev) => {
      const next = { ...prev, [payload.name]: payload };
      window.localStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSelectedPattern(payload.name);
  };

  const handleLoadPattern = (name: string) => {
    const pattern = patterns[name];
    if (!pattern) return;
    setPatternName(pattern.name);
    setPatternNotes(pattern.notes);
    setPatternAccents(pattern.accents);
    setPatternGlides(pattern.glides);
    setOscType(pattern.settings.oscillator);
    setEnvelope(pattern.settings.envelope);
    setFilterCutoff(pattern.settings.filterCutoff);
    setFilterResonance(pattern.settings.filterResonance);
    setAccent(pattern.settings.accent);
    setGlide(pattern.settings.glide);
    setSelectedPattern(name);
  };

  const handleSaveSlot = () => {
    const payload: BassLinePattern = {
      name: patternName.trim() || `BassLine ${currentSlot}`,
      steps,
      notes: patternNotes,
      accents: patternAccents,
      glides: patternGlides,
      settings: {
        oscillator: oscType,
        envelope,
        filterCutoff,
        filterResonance,
        accent,
        glide,
      },
    };
    setSlots((prev) => ({ ...prev, [currentSlot]: payload }));
  };

  const handleSlotSelect = (slot: (typeof SLOT_LABELS)[number]) => {
    setCurrentSlot(slot);
    const pattern = slots[slot];
    if (pattern) {
      setPatternName(pattern.name);
      setPatternNotes(pattern.notes);
      setPatternAccents(pattern.accents);
      setPatternGlides(pattern.glides);
      setOscType(pattern.settings.oscillator);
      setEnvelope(pattern.settings.envelope);
      setFilterCutoff(pattern.settings.filterCutoff);
      setFilterResonance(pattern.settings.filterResonance);
      setAccent(pattern.settings.accent);
      setGlide(pattern.settings.glide);
      setSelectedPattern(pattern.name);
    }
  };

  const handleExport = () => {
    const payload: BassLinePattern = {
      name: patternName.trim() || "BassLine Pattern",
      steps,
      notes: patternNotes,
      accents: patternAccents,
      glides: patternGlides,
      settings: {
        oscillator: oscType,
        envelope,
        filterCutoff,
        filterResonance,
        accent,
        glide,
      },
    };
    setImportText(JSON.stringify(payload, null, 2));
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText) as BassLinePattern;
      if (!parsed.notes || !parsed.accents || !parsed.glides) return;
      setPatternName(parsed.name);
      setPatternNotes(parsed.notes);
      setPatternAccents(parsed.accents);
      setPatternGlides(parsed.glides);
      setOscType(parsed.settings.oscillator);
      setEnvelope(parsed.settings.envelope);
      setFilterCutoff(parsed.settings.filterCutoff);
      setFilterResonance(parsed.settings.filterResonance);
      setAccent(parsed.settings.accent);
      setGlide(parsed.settings.glide);
      setSelectedPattern(parsed.name);
    } catch {
      // ignore invalid JSON
    }
  };

  return (
    <section
      className={
        embedded
          ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
          : "rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">BassLine</p>
          <h2 className="text-xl font-semibold text-slate-100">Acid Mono</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleInit}
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {ready ? "Ready" : "Initialize"}
          </button>
          <div className="flex flex-wrap gap-2">
            {NOTES.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => handlePlay(note)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-400"
              >
                {note}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAccentMode((prev) => !prev)}
            className={
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
              (accentMode
                ? "border-amber-400 text-amber-200"
                : "border-slate-700 text-slate-200 hover:border-amber-300")
            }
          >
            Accent
          </button>
          <button
            type="button"
            onClick={() => setGlideMode((prev) => !prev)}
            className={
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
              (glideMode
                ? "border-cyan-400 text-cyan-200"
                : "border-slate-700 text-slate-200 hover:border-cyan-300")
            }
          >
            Glide
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-xs text-slate-500">
            Oscillator
            <select
              value={oscType}
              onChange={(event) => setOscType(event.target.value as Tone.ToneOscillatorType)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {OSC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-xs text-slate-500">
            Filter cutoff
            <input
              type="range"
              min={100}
              max={4000}
              step={10}
              value={filterCutoff}
              onChange={(event) => setFilterCutoff(Number(event.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-2 text-xs text-slate-500">
            Filter resonance
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.1}
              value={filterResonance}
              onChange={(event) => setFilterResonance(Number(event.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-2 text-xs text-slate-500">
            Accent amount
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={accent}
              onChange={(event) => setAccent(Number(event.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-2 text-xs text-slate-500">
            Glide time
            <input
              type="range"
              min={0}
              max={0.3}
              step={0.01}
              value={glide}
              onChange={(event) => setGlide(Number(event.target.value))}
              className="w-full"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Envelope</p>
          <div className="mt-3 grid gap-3">
            {(["attack", "decay", "sustain", "release"] as const).map((field) => (
              <label key={field} className="space-y-2 text-xs text-slate-500">
                {field}
                <input
                  type="range"
                  min={field === "sustain" ? 0 : 0.001}
                  max={field === "sustain" ? 1 : 1.5}
                  step={field === "sustain" ? 0.01 : 0.01}
                  value={envelope[field]}
                  onChange={(event) =>
                    setEnvelope((prev) => ({ ...prev, [field]: Number(event.target.value) }))
                  }
                  className="w-full"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pattern</p>
            <div className="flex items-center gap-2">
              <input
                value={patternName}
                onChange={(event) => setPatternName(event.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={handleSavePattern}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Save
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SLOT_LABELS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleSlotSelect(slot)}
                className={
                  "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                  (currentSlot === slot
                    ? "border-cyan-400 text-cyan-200"
                    : "border-slate-700 text-slate-200 hover:border-cyan-400")
                }
              >
                {slot}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSaveSlot}
              className="rounded-full border border-slate-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Save Slot
            </button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-[auto_1fr_auto_auto]">
            {patternNotes.map((note, index) => (
              <div key={`step-${index}`} className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-2">
                <span className="text-xs text-slate-500">{index + 1}</span>
                <select
                  value={note}
                  onChange={(event) => {
                    const next = [...patternNotes];
                    next[index] = event.target.value as (typeof PATTERN_NOTES)[number];
                    setPatternNotes(next);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  {PATTERN_NOTES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...patternAccents];
                    next[index] = !next[index];
                    setPatternAccents(next);
                  }}
                  className={
                    "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                    (patternAccents[index]
                      ? "border-amber-400 text-amber-200"
                      : "border-slate-700 text-slate-200 hover:border-amber-300")
                  }
                >
                  Acc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...patternGlides];
                    next[index] = !next[index];
                    setPatternGlides(next);
                  }}
                  className={
                    "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                    (patternGlides[index]
                      ? "border-cyan-400 text-cyan-200"
                      : "border-slate-700 text-slate-200 hover:border-cyan-300")
                  }
                >
                  Glide
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(patterns).length === 0 ? (
              <span className="text-xs text-slate-500">No saved patterns yet.</span>
            ) : (
              Object.keys(patterns)
                .sort()
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleLoadPattern(name)}
                    className={
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                      (selectedPattern === name
                        ? "border-cyan-400 text-cyan-200"
                        : "border-slate-700 text-slate-200 hover:border-cyan-400")
                    }
                  >
                    {name}
                  </button>
                ))
            )}
          </div>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full border border-slate-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-full border border-slate-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Import JSON
              </button>
            </div>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={5}
              className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              placeholder="Paste BassLine pattern JSON here"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
