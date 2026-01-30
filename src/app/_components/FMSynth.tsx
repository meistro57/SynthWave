"use client";

import { useEffect, useMemo, useState } from "react";
import * as Tone from "tone";

import {
  FMSynthEnvelope,
  ModMatrix,
  OperatorSettings,
  initFMSynth,
  triggerFMSynth,
  updateFMSynth,
} from "@/audio/instruments/fmSynth";

const NOTES = ["C3", "D3", "E3", "G3", "A3", "C4"] as const;
const OSC_TYPES: Tone.ToneOscillatorType[] = ["sine", "triangle", "square", "sawtooth"];

type AlgorithmPreset = {
  name: string;
  op1ToOp2: number;
  op1ToOp3: number;
  op2ToOp1: number;
  op2ToOp3: number;
  op3ToOp1: number;
  op3ToOp2: number;
  ratios: [number, number, number];
};

const ALGORITHMS: AlgorithmPreset[] = [
  {
    name: "Classic",
    op1ToOp2: 0,
    op1ToOp3: 0,
    op2ToOp1: 0.6,
    op2ToOp3: 0,
    op3ToOp1: 0.2,
    op3ToOp2: 0.2,
    ratios: [1, 2, 3],
  },
  {
    name: "Stack",
    op1ToOp2: 0,
    op1ToOp3: 0,
    op2ToOp1: 0.7,
    op2ToOp3: 0.4,
    op3ToOp1: 0,
    op3ToOp2: 0.6,
    ratios: [1, 3, 5],
  },
  {
    name: "Metal",
    op1ToOp2: 0.3,
    op1ToOp3: 0.2,
    op2ToOp1: 0.5,
    op2ToOp3: 0.5,
    op3ToOp1: 0.4,
    op3ToOp2: 0.5,
    ratios: [1, 2.5, 4],
  },
];

const MATRIX_PRESETS: { name: string; matrix: ModMatrix }[] = [
  {
    name: "Simple FM",
    matrix: {
      op1ToOp2: 0,
      op1ToOp3: 0,
      op2ToOp1: 0.5,
      op2ToOp3: 0,
      op3ToOp1: 0,
      op3ToOp2: 0,
    },
  },
  {
    name: "Triple Stack",
    matrix: {
      op1ToOp2: 0,
      op1ToOp3: 0,
      op2ToOp1: 0.6,
      op2ToOp3: 0.4,
      op3ToOp1: 0.5,
      op3ToOp2: 0.3,
    },
  },
  {
    name: "Cross Mod",
    matrix: {
      op1ToOp2: 0.3,
      op1ToOp3: 0.4,
      op2ToOp1: 0.4,
      op2ToOp3: 0.2,
      op3ToOp1: 0.4,
      op3ToOp2: 0.2,
    },
  },
];

type FMSynthProps = {
  embedded?: boolean;
};

export function FMSynth({ embedded = false }: FMSynthProps) {
  const [ready, setReady] = useState(false);
  const [carrierOsc, setCarrierOsc] = useState<Tone.ToneOscillatorType>("sine");
  const [modOsc, setModOsc] = useState<Tone.ToneOscillatorType>("sine");
  const [modOsc2, setModOsc2] = useState<Tone.ToneOscillatorType>("sine");
  const [envelope, setEnvelope] = useState<FMSynthEnvelope>({
    attack: 0.01,
    decay: 0.2,
    sustain: 0.6,
    release: 0.6,
  });
  const [modEnvelope, setModEnvelope] = useState<FMSynthEnvelope>({
    attack: 0.02,
    decay: 0.3,
    sustain: 0.4,
    release: 0.5,
  });
  const [modEnvelope2, setModEnvelope2] = useState<FMSynthEnvelope>({
    attack: 0.03,
    decay: 0.4,
    sustain: 0.3,
    release: 0.4,
  });
  const [ratios, setRatios] = useState<[number, number, number]>([1, 2, 3]);
  const [modMatrix, setModMatrix] = useState<ModMatrix>({
    op1ToOp2: 0,
    op1ToOp3: 0,
    op2ToOp1: 0.6,
    op2ToOp3: 0,
    op3ToOp1: 0.2,
    op3ToOp2: 0.3,
  });
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<Record<string, { op1: OperatorSettings; op2: OperatorSettings; op3: OperatorSettings; modMatrix: ModMatrix }>>({});
  const [matrixPreset, setMatrixPreset] = useState<string>("Simple FM");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS[0].name);

  useEffect(() => {
    updateFMSynth({
      op1: { oscillator: carrierOsc, ratio: ratios[0], envelope },
      op2: { oscillator: modOsc, ratio: ratios[1], envelope: modEnvelope },
      op3: { oscillator: modOsc2, ratio: ratios[2], envelope: modEnvelope2 },
      modMatrix,
    });
  }, [carrierOsc, modOsc, modOsc2, envelope, modEnvelope, modEnvelope2, ratios, modMatrix]);

  const handleInit = async () => {
    await initFMSynth();
    setReady(true);
  };

  const handlePlay = async (note: string) => {
    if (!ready) {
      await initFMSynth();
      setReady(true);
    }
    await triggerFMSynth(note, "8n");
  };

  const applyAlgorithm = (name: string) => {
    const preset = ALGORITHMS.find((entry) => entry.name === name);
    if (!preset) return;
    setSelectedAlgorithm(name);
    setRatios(preset.ratios);
    setModMatrix({
      op1ToOp2: preset.op1ToOp2,
      op1ToOp3: preset.op1ToOp3,
      op2ToOp1: preset.op2ToOp1,
      op2ToOp3: preset.op2ToOp3,
      op3ToOp1: preset.op3ToOp1,
      op3ToOp2: preset.op3ToOp2,
    });
  };

  const algOptions = useMemo(() => ALGORITHMS.map((alg) => alg.name), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("synthwave.fmsynth.presets");
    if (!raw) return;
    try {
      setPresets(JSON.parse(raw));
    } catch {
      setPresets({});
    }
  }, []);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const next = {
      ...presets,
      [presetName.trim()]: {
        op1: { oscillator: carrierOsc, ratio: ratios[0], envelope },
        op2: { oscillator: modOsc, ratio: ratios[1], envelope: modEnvelope },
        op3: { oscillator: modOsc2, ratio: ratios[2], envelope: modEnvelope2 },
        modMatrix,
      },
    };
    setPresets(next);
    window.localStorage.setItem("synthwave.fmsynth.presets", JSON.stringify(next));
  };

  const handleLoadPreset = (name: string) => {
    const preset = presets[name];
    if (!preset) return;
    setCarrierOsc(preset.op1.oscillator);
    setModOsc(preset.op2.oscillator);
    setModOsc2(preset.op3.oscillator);
    setRatios([preset.op1.ratio, preset.op2.ratio, preset.op3.ratio]);
    setEnvelope(preset.op1.envelope);
    setModEnvelope(preset.op2.envelope);
    setModEnvelope2(preset.op3.envelope);
    setModMatrix(preset.modMatrix);
    setPresetName(name);
  };

  const applyMatrixPreset = (name: string) => {
    const preset = MATRIX_PRESETS.find((entry) => entry.name === name);
    if (!preset) return;
    setMatrixPreset(name);
    setModMatrix(preset.matrix);
  };

  useEffect(() => {
    applyMatrixPreset(matrixPreset);
  }, []);

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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">FMSynth</p>
          <h2 className="text-xl font-semibold text-slate-100">FM Operator Lab</h2>
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
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Algorithm</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {algOptions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyAlgorithm(name)}
                    className={
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                      (selectedAlgorithm === name
                        ? "border-cyan-400 text-cyan-200"
                        : "border-slate-700 text-slate-200 hover:border-cyan-400")
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
                <div className="grid grid-cols-[80px_repeat(3,1fr)] items-center gap-2 text-center text-[10px] uppercase tracking-[0.2em]">
                  <div />
                  <div className="rounded-lg border border-slate-800 px-2 py-1">Op1</div>
                  <div className="rounded-lg border border-slate-800 px-2 py-1">Op2</div>
                  <div className="rounded-lg border border-slate-800 px-2 py-1">Op3</div>
                </div>
                {(["op1", "op2", "op3"] as const).map((source, rowIndex) => (
                  <div
                    key={source}
                    className="mt-2 grid grid-cols-[80px_repeat(3,1fr)] items-center gap-2"
                  >
                    <div className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {source}
                    </div>
                    {(["op1", "op2", "op3"] as const).map((targetOp, colIndex) => {
                      const fieldMap: Record<string, keyof ModMatrix> = {
                        "op1-op2": "op1ToOp2",
                        "op1-op3": "op1ToOp3",
                        "op2-op1": "op2ToOp1",
                        "op2-op3": "op2ToOp3",
                        "op3-op1": "op3ToOp1",
                        "op3-op2": "op3ToOp2",
                      };
                      if (source === targetOp) {
                        return (
                          <div
                            key={`${source}-${targetOp}`}
                            className="h-8 rounded-lg border border-dashed border-slate-800 bg-slate-950/40"
                          />
                        );
                      }
                      const key = fieldMap[`${source}-${targetOp}`];
                      return (
                        <div key={`${source}-${targetOp}`} className="flex flex-col gap-1">
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={modMatrix[key]}
                            onChange={(event) =>
                              setModMatrix((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                            }
                            className="w-full"
                          />
                          <span className="text-[10px] text-slate-500">
                            {modMatrix[key].toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Matrix Presets</label>
                <select
                  value={matrixPreset}
                  onChange={(event) => applyMatrixPreset(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  {MATRIX_PRESETS.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operator Oscillators</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-xs text-slate-500">
                  Carrier
                  <select
                    value={carrierOsc}
                    onChange={(event) => setCarrierOsc(event.target.value as Tone.ToneOscillatorType)}
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
                  Modulator
                  <select
                    value={modOsc}
                    onChange={(event) => setModOsc(event.target.value as Tone.ToneOscillatorType)}
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
                  Modulator 2
                  <select
                    value={modOsc2}
                    onChange={(event) => setModOsc2(event.target.value as Tone.ToneOscillatorType)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  >
                    {OSC_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(["op1", "op2", "op3"] as const).map((op, index) => (
                  <label key={op} className="space-y-2 text-xs text-slate-500">
                    {op} ratio
                    <input
                      type="range"
                      min={0.5}
                      max={8}
                      step={0.1}
                      value={ratios[index]}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setRatios((prev) => {
                          const next: [number, number, number] = [...prev] as [
                            number,
                            number,
                            number,
                          ];
                          next[index] = value;
                          return next;
                        });
                      }}
                      className="w-full"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Carrier Envelope</p>
              <div className="mt-3 grid gap-3">
                {(["attack", "decay", "sustain", "release"] as const).map((field) => (
                  <label key={field} className="space-y-2 text-xs text-slate-500">
                    {field}
                    <input
                      type="range"
                      min={field === "sustain" ? 0 : 0.001}
                      max={field === "sustain" ? 1 : 2}
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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mod Envelope</p>
              <div className="mt-3 grid gap-3">
                {(["attack", "decay", "sustain", "release"] as const).map((field) => (
                  <label key={field} className="space-y-2 text-xs text-slate-500">
                    {field}
                    <input
                      type="range"
                      min={field === "sustain" ? 0 : 0.001}
                      max={field === "sustain" ? 1 : 2}
                      step={field === "sustain" ? 0.01 : 0.01}
                      value={modEnvelope[field]}
                      onChange={(event) =>
                        setModEnvelope((prev) => ({ ...prev, [field]: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mod Envelope 2</p>
              <div className="mt-3 grid gap-3">
                {(["attack", "decay", "sustain", "release"] as const).map((field) => (
                  <label key={field} className="space-y-2 text-xs text-slate-500">
                    {field}
                    <input
                      type="range"
                      min={field === "sustain" ? 0 : 0.001}
                      max={field === "sustain" ? 1 : 2}
                      step={field === "sustain" ? 0.01 : 0.01}
                      value={modEnvelope2[field]}
                      onChange={(event) =>
                        setModEnvelope2((prev) => ({
                          ...prev,
                          [field]: Number(event.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Presets</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="Preset name"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                >
                  Save
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.keys(presets).length === 0 ? (
                  <span className="text-xs text-slate-500">No presets saved yet.</span>
                ) : (
                  Object.keys(presets)
                    .sort()
                    .map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleLoadPreset(name)}
                        className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                      >
                        {name}
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
