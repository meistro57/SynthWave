"use client";

import { useEffect, useMemo, useState } from "react";
import * as Tone from "tone";

import {
  SubSynthEnvelope,
  SubSynthFilter,
  SubSynthPreset,
  initSubSynth,
  triggerSubSynth,
  triggerSubSynthAttack,
  triggerSubSynthRelease,
  updateSubSynth,
} from "@/audio/instruments/subSynth";

const NOTES = ["C4", "D4", "E4", "G4", "A4", "C5"] as const;
const OSC_TYPES: Tone.ToneOscillatorType[] = ["sawtooth", "square", "triangle", "sine"];
const STORAGE_KEY = "synthwave.subsynth.presets";

const KEYBOARD_MAP: Record<string, string> = {
  a: "C4",
  s: "D4",
  d: "E4",
  f: "G4",
  g: "A4",
  h: "C5",
};

type PresetMap = Record<string, SubSynthPreset>;

type PresetForm = {
  name: string;
};

function loadPresets(): PresetMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PresetMap;
  } catch {
    return {};
  }
}

function savePresets(presets: PresetMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

type SubSynthProps = {
  embedded?: boolean;
};

export function SubSynth({ embedded = false }: SubSynthProps) {
  const [ready, setReady] = useState(false);
  const [oscType, setOscType] = useState<Tone.ToneOscillatorType>("sawtooth");
  const [envelope, setEnvelope] = useState<SubSynthEnvelope>({
    attack: 0.02,
    decay: 0.2,
    sustain: 0.6,
    release: 0.6,
  });
  const [filter, setFilter] = useState<SubSynthFilter>({
    frequency: 1200,
    resonance: 0.8,
  });
  const [presetForm, setPresetForm] = useState<PresetForm>({ name: "" });
  const [presets, setPresets] = useState<PresetMap>({});
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [holdMode, setHoldMode] = useState(false);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    updateSubSynth({
      oscillator: oscType,
      envelope,
      filter,
    });
  }, [oscType, envelope, filter]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      const note = KEYBOARD_MAP[key];
      if (!note) return;
      setPressedKeys((prev) => ({ ...prev, [key]: true }));
      if (!ready) {
        await initSubSynth();
        setReady(true);
      }

      if (holdMode) {
        const alreadyHeld = pressedKeys[key];
        if (alreadyHeld) {
          await triggerSubSynthRelease();
          setPressedKeys((prev) => ({ ...prev, [key]: false }));
          return;
        }
        await triggerSubSynthAttack(note);
        return;
      }

      await triggerSubSynth(note, "8n");
    };

    const handleKeyUp = async (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!KEYBOARD_MAP[key]) return;
      setPressedKeys((prev) => ({ ...prev, [key]: false }));
      if (holdMode) return;
      await triggerSubSynthRelease();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [ready, holdMode, pressedKeys]);

  const handleInit = async () => {
    await initSubSynth();
    setReady(true);
  };

  const handlePlay = async (note: string) => {
    if (!ready) {
      await initSubSynth();
      setReady(true);
    }
    await triggerSubSynth(note, "8n");
  };

  const handleSavePreset = () => {
    if (!presetForm.name.trim()) return;
    const preset: SubSynthPreset = {
      name: presetForm.name.trim(),
      oscillator: oscType,
      envelope,
      filter,
    };
    setPresets((prev) => {
      const next = { ...prev, [preset.name]: preset };
      savePresets(next);
      return next;
    });
    setSelectedPreset(preset.name);
  };

  const handleLoadPreset = (name: string) => {
    const preset = presets[name];
    if (!preset) return;
    setOscType(preset.oscillator);
    setEnvelope(preset.envelope);
    setFilter(preset.filter);
    setSelectedPreset(name);
  };

  const presetNames = useMemo(() => Object.keys(presets).sort(), [presets]);

  return (
    <section
      className={
        embedded
          ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
          : "rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">SubSynth</p>
          <h2 className="text-xl font-semibold text-slate-100">MonoSynth Prototype</h2>
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
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                {note}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Keys: {Object.keys(KEYBOARD_MAP).join(" ")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setHoldMode((prev) => !prev)}
            className={
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
              (holdMode
                ? "border-cyan-400 text-cyan-200"
                : "border-slate-700 text-slate-200 hover:border-cyan-400")
            }
          >
            Hold
          </button>
          <span>{holdMode ? "Hold mode active" : "Hold mode off"}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Oscillator</span>
            <select
              value={oscType}
              onChange={(event) => setOscType(event.target.value as Tone.ToneOscillatorType)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            >
              {OSC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Filter Cutoff</span>
            <input
              type="range"
              min={200}
              max={5000}
              value={filter.frequency}
              onChange={(event) =>
                setFilter((prev) => ({ ...prev, frequency: Number(event.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Resonance</span>
            <input
              type="range"
              min={0.1}
              max={8}
              step={0.1}
              value={filter.resonance}
              onChange={(event) =>
                setFilter((prev) => ({ ...prev, resonance: Number(event.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Attack</span>
            <input
              type="range"
              min={0.001}
              max={1}
              step={0.001}
              value={envelope.attack}
              onChange={(event) =>
                setEnvelope((prev) => ({ ...prev, attack: Number(event.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Decay</span>
            <input
              type="range"
              min={0.01}
              max={2}
              step={0.01}
              value={envelope.decay}
              onChange={(event) =>
                setEnvelope((prev) => ({ ...prev, decay: Number(event.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Sustain</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={envelope.sustain}
              onChange={(event) =>
                setEnvelope((prev) => ({ ...prev, sustain: Number(event.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Release</span>
            <input
              type="range"
              min={0.01}
              max={3}
              step={0.01}
              value={envelope.release}
              onChange={(event) =>
                setEnvelope((prev) => ({ ...prev, release: Number(event.target.value) }))
              }
              className="w-full"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Preset Name</span>
            <input
              type="text"
              value={presetForm.name}
              onChange={(event) => setPresetForm({ name: event.target.value })}
              placeholder="Midnight Bass"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={handleSavePreset}
            className="h-10 self-end rounded-full border border-cyan-500/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300"
          >
            Save Preset
          </button>
        </div>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Load Preset</span>
          <select
            value={selectedPreset}
            onChange={(event) => handleLoadPreset(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
          >
            <option value="">Select preset</option>
            {presetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
