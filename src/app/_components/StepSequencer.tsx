"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";

import { setDelaySendLevel, setReverbSendLevel } from "@/audio/audioEngine";
import { triggerBassLine } from "@/audio/instruments/bassLine";
import { triggerFMSynth } from "@/audio/instruments/fmSynth";
import { triggerPCMSynth } from "@/audio/instruments/pcmSynth";
import { setSubSynthPan, triggerSubSynth } from "@/audio/instruments/subSynth";
import { useMachineTargetStore } from "@/store/useMachineTargetStore";
import {
  PatternSlot,
  SequencerPattern,
  useSequencerStore,
} from "@/store/useSequencerStore";
import { useTransportStore } from "@/store/useTransportStore";

const STORAGE_KEY = "synthwave.sequencer.patterns";
const SLOT_STORAGE_KEY = "synthwave.sequencer.slots";
const SETTINGS_KEY = "synthwave.sequencer.settings";

type PatternMap = Record<string, SequencerPattern>;

type PresetForm = {
  name: string;
};

type DragState = {
  row: number;
  col: number;
  active: boolean;
};

type EditMode = "velocity" | "probability" | "gate" | "ratchet";

type SequencerSettings = {
  rowMutes: boolean[];
  rowSolos: boolean[];
  rowVolumes: number[];
  rowTransposes: number[];
  rowPans: number[];
  rowDelaySends: number[];
  rowReverbSends: number[];
  rowTargets: Array<"subsynth" | "pcmsynth" | "fmsynth" | "bassline">;
  editMode: EditMode;
  slotAuto: Record<PatternSlot, boolean>;
  randomizeDensity: number;
  steps: number;
};

function loadPatterns(): PatternMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PatternMap;
  } catch {
    return {};
  }
}

function savePatterns(patterns: PatternMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

function velocityFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const normalized = 1 - y / rect.height;
  return Math.max(0.1, Math.min(1, normalized));
}

function probabilityFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const normalized = x / rect.width;
  return Math.max(0.05, Math.min(1, normalized));
}

function ratchetFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const normalized = x / rect.width;
  return Math.max(1, Math.min(4, Math.round(1 + normalized * 3)));
}

const SLOT_LABELS: PatternSlot[] = ["A", "B", "C", "D"];

export function StepSequencer() {
  const { bpm, isPlaying, humanizeMs } = useTransportStore();
  const { target } = useMachineTargetStore();
  const {
    grid,
    probability,
    gate,
    ratchet,
    notes,
    steps,
    resolution,
    toggleCell,
    clear,
    setResolution,
    setVelocity,
    setProbability,
    setGate,
    setRatchet,
    loadPattern,
    randomize,
    slots,
    currentSlot,
    setSlot,
    saveToSlot,
    setSteps,
    rowTargets,
    rowMutes,
    rowSolos,
    toggleRowMute,
    toggleRowSolo,
    setSlots,
    rowVolumes,
    setRowVolumes,
    setRowMutes,
    setRowSolos,
    slotAuto,
    setSlotAuto,
    toggleSlotAuto,
    rowTransposes,
    setRowTransposes,
    rowPans,
    setRowPans,
    rowDelaySends,
    rowReverbSends,
    setRowDelaySends,
    setRowReverbSends,
    setRowTargets,
    applyQuickPreset,
  } = useSequencerStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAccentMode, setIsAccentMode] = useState(false);
  const [patterns, setPatterns] = useState<PatternMap>({});
  const [presetForm, setPresetForm] = useState<PresetForm>({ name: "" });
  const [tagInput, setTagInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [renameValue, setRenameValue] = useState<string>("");
  const [copiedPattern, setCopiedPattern] = useState<SequencerPattern | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("velocity");
  const [randomizeDensity, setRandomizeDensity] = useState(25);
  const [importText, setImportText] = useState("");

  const gridRef = useRef(grid);
  const probabilityRef = useRef(probability);
  const gateRef = useRef(gate);
  const ratchetRef = useRef(ratchet);
  const rowMutesRef = useRef(rowMutes);
  const rowSolosRef = useRef(rowSolos);
  const rowVolumesRef = useRef(rowVolumes);
  const rowTransposesRef = useRef(rowTransposes);
  const rowPansRef = useRef(rowPans);
  const rowDelaySendsRef = useRef(rowDelaySends);
  const rowReverbSendsRef = useRef(rowReverbSends);
  const rowTargetsRef = useRef(rowTargets);
  const resolutionRef = useRef(resolution);
  const notesRef = useRef(notes);
  const stepsRef = useRef(steps);
  const humanizeRef = useRef(humanizeMs);
  const slotsRef = useRef(slots);
  const currentSlotRef = useRef(currentSlot);
  const slotAutoRef = useRef(slotAuto);
  const scheduleIdRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);

  useEffect(() => {
    setPatterns(loadPatterns());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SLOT_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<PatternSlot, SequencerPattern | null>;
      setSlots(parsed);
    } catch {
      // ignore slot parse errors
    }
  }, [setSlots]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SequencerSettings;
      if (parsed.rowMutes) setRowMutes(parsed.rowMutes);
      if (parsed.rowSolos) setRowSolos(parsed.rowSolos);
      if (parsed.rowVolumes) setRowVolumes(parsed.rowVolumes);
      if (parsed.rowTransposes) setRowTransposes(parsed.rowTransposes);
      if (parsed.rowPans) setRowPans(parsed.rowPans);
      if (parsed.rowDelaySends) setRowDelaySends(parsed.rowDelaySends);
      if (parsed.rowReverbSends) setRowReverbSends(parsed.rowReverbSends);
      if (parsed.rowTargets) setRowTargets(parsed.rowTargets);
      if (parsed.editMode) setEditMode(parsed.editMode);
      if (parsed.slotAuto) setSlotAuto(parsed.slotAuto);
      if (typeof parsed.randomizeDensity === "number") setRandomizeDensity(parsed.randomizeDensity);
      if (typeof parsed.steps === "number") setSteps(parsed.steps);
    } catch {
      // ignore settings parse errors
    }
  }, [
    setRowMutes,
    setRowSolos,
    setRowVolumes,
    setRowTransposes,
    setRowPans,
    setRowDelaySends,
    setRowReverbSends,
    setRowTargets,
    setSlotAuto,
    setSteps,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: SequencerSettings = {
      rowMutes,
      rowSolos,
      rowVolumes,
      rowTransposes,
      rowPans,
      rowDelaySends,
      rowReverbSends,
      rowTargets,
      editMode,
      slotAuto,
      randomizeDensity,
      steps,
    };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  }, [
    rowMutes,
    rowSolos,
    rowVolumes,
    rowTransposes,
    rowPans,
    rowDelaySends,
    rowReverbSends,
    rowTargets,
    editMode,
    slotAuto,
    randomizeDensity,
    steps,
  ]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    probabilityRef.current = probability;
  }, [probability]);

  useEffect(() => {
    gateRef.current = gate;
  }, [gate]);

  useEffect(() => {
    ratchetRef.current = ratchet;
  }, [ratchet]);

  useEffect(() => {
    rowMutesRef.current = rowMutes;
  }, [rowMutes]);

  useEffect(() => {
    rowSolosRef.current = rowSolos;
  }, [rowSolos]);

  useEffect(() => {
    rowVolumesRef.current = rowVolumes;
  }, [rowVolumes]);

  useEffect(() => {
    rowTransposesRef.current = rowTransposes;
  }, [rowTransposes]);

  useEffect(() => {
    rowPansRef.current = rowPans;
  }, [rowPans]);

  useEffect(() => {
    rowDelaySendsRef.current = rowDelaySends;
  }, [rowDelaySends]);

  useEffect(() => {
    rowReverbSendsRef.current = rowReverbSends;
  }, [rowReverbSends]);

  useEffect(() => {
    rowTargetsRef.current = rowTargets;
  }, [rowTargets]);

  useEffect(() => {
    resolutionRef.current = resolution;
  }, [resolution]);

  useEffect(() => {
    notesRef.current = notes;
    stepsRef.current = steps;
  }, [notes, steps]);

  useEffect(() => {
    humanizeRef.current = humanizeMs;
  }, [humanizeMs]);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    currentSlotRef.current = currentSlot;
  }, [currentSlot]);

  useEffect(() => {
    slotAutoRef.current = slotAuto;
  }, [slotAuto]);

  useEffect(() => {
    if (!isPlaying) {
      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }
      stepIndexRef.current = 0;
      setCurrentStep(0);
      return;
    }

    if (scheduleIdRef.current !== null) return;

    scheduleIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const nextStep = stepIndexRef.current % stepsRef.current;
      const currentGrid = gridRef.current;
      const currentProbability = probabilityRef.current;
      const currentGate = gateRef.current;
      const currentRatchet = ratchetRef.current;
      const currentMutes = rowMutesRef.current;
      const currentSolos = rowSolosRef.current;
      const currentVolumes = rowVolumesRef.current;
      const currentPans = rowPansRef.current;
      const currentTransposes = rowTransposesRef.current;
      const currentDelaySends = rowDelaySendsRef.current;
      const currentReverbSends = rowReverbSendsRef.current;
      const currentTargets = rowTargetsRef.current;
      const currentNotes = notesRef.current;
      const stepResolution = resolutionRef.current;
      const stepSeconds = Tone.Time(stepResolution).toSeconds();
      const anySolo = currentSolos.some(Boolean);

      for (let row = 0; row < currentGrid.length; row += 1) {
        if (anySolo && !currentSolos[row]) continue;
        if (currentMutes[row]) continue;
        const velocity = currentGrid[row][nextStep];
        const chance = currentProbability[row][nextStep] ?? 1;
        const gateMultiplier = currentGate[row][nextStep] ?? 1;
        const ratchetCount = currentRatchet[row][nextStep] ?? 1;
        if (velocity > 0 && Math.random() <= chance) {
          const volume = currentVolumes[row] ?? 1;
          const transpose = currentTransposes[row] ?? 0;
          const pan = currentPans[row] ?? 0;
          const delaySend = currentDelaySends[row] ?? 0.2;
          const reverbSend = currentReverbSends[row] ?? 0.2;
          const rowTarget = currentTargets[row] ?? target;
          const humanizeOffset = (Math.random() * 2 - 1) * (humanizeRef.current / 1000);
          const scheduledTime = Math.max(0, Tone.Time(time).toSeconds() + humanizeOffset);
          const subStep = stepSeconds / ratchetCount;
          for (let i = 0; i < ratchetCount; i += 1) {
            const ratchetTime = scheduledTime + i * subStep;
            const duration = Math.max(0.03, subStep * gateMultiplier);
            const note = Tone.Frequency(currentNotes[row]).transpose(transpose).toNote();
            setSubSynthPan(pan);
            setDelaySendLevel(delaySend);
            setReverbSendLevel(reverbSend);
            if (rowTarget === "subsynth") {
              triggerSubSynth(note, duration, ratchetTime, velocity * volume);
            } else if (rowTarget === "pcmsynth") {
              triggerPCMSynth(note, duration, ratchetTime, velocity * volume);
            } else if (rowTarget === "fmsynth") {
              triggerFMSynth(note, duration, ratchetTime, velocity * volume);
            } else if (rowTarget === "bassline") {
              triggerBassLine(note, duration, ratchetTime, velocity * volume, false, false);
            }
          }
        }
      }

      Tone.Draw.schedule(() => {
        setCurrentStep(nextStep);
      }, time);

      const nextIndex = (stepIndexRef.current + 1) % stepsRef.current;
      const wrapped = nextIndex === 0;
      stepIndexRef.current = nextIndex;

      if (wrapped) {
        const autoSlots = SLOT_LABELS.filter((slot) => slotAutoRef.current[slot]);
        if (autoSlots.length > 0) {
          const current = currentSlotRef.current;
          const currentIndex = autoSlots.indexOf(current);
          const nextSlot = autoSlots[(currentIndex + 1) % autoSlots.length] ?? autoSlots[0];
          const pattern = slotsRef.current[nextSlot];
          Tone.Draw.schedule(() => {
            setSlot(nextSlot);
            if (pattern) {
              loadPattern(pattern);
            }
          }, time);
        }
      }
    }, resolutionRef.current);

    return () => {
      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }
    };
  }, [isPlaying, target]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [dragState]);

  useEffect(() => {
    if (selectedPattern && patterns[selectedPattern]) {
      setRenameValue(selectedPattern);
    }
  }, [selectedPattern, patterns]);

  const tempoLabel = useMemo(() => `${bpm} BPM · ${resolution}`, [bpm, resolution]);

  const handleSavePattern = () => {
    if (!presetForm.name.trim()) return;
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const pattern: SequencerPattern = {
      name: presetForm.name.trim(),
      grid,
      probability,
      gate,
      ratchet,
      resolution,
      steps,
      tags,
    };
    setPatterns((prev) => {
      const next = { ...prev, [pattern.name]: pattern };
      savePatterns(next);
      return next;
    });
    setSelectedPattern(pattern.name);
  };

  const handleLoadPattern = (name: string) => {
    const pattern = patterns[name];
    if (!pattern) return;
    loadPattern(pattern);
    setSelectedPattern(name);
    setTagInput(pattern.tags?.join(", ") ?? "");
  };

  const handleRenamePattern = () => {
    const newName = renameValue.trim();
    if (!selectedPattern || !newName) return;
    setPatterns((prev) => {
      const existing = prev[selectedPattern];
      if (!existing) return prev;
      const next: PatternMap = { ...prev };
      delete next[selectedPattern];
      next[newName] = { ...existing, name: newName };
      savePatterns(next);
      return next;
    });
    setSelectedPattern(newName);
  };

  const handleDeletePattern = () => {
    if (!selectedPattern) return;
    setPatterns((prev) => {
      const next: PatternMap = { ...prev };
      delete next[selectedPattern];
      savePatterns(next);
      return next;
    });
    setSelectedPattern("");
    setRenameValue("");
  };

  const handleCopyPattern = () => {
    setCopiedPattern({ name: "Copied", grid, probability, gate, ratchet, resolution, steps });
  };

  const handlePastePattern = () => {
    if (!copiedPattern) return;
    loadPattern(copiedPattern);
  };

  const handleExportPattern = async () => {
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const payload = JSON.stringify(
      { grid, probability, gate, ratchet, resolution, steps, tags },
      null,
      2,
    );
    setImportText(payload);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload);
      } catch {
        // Clipboard may be blocked; keep payload in textarea.
      }
    }
  };

  const handleImportPattern = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText) as SequencerPattern;
      const fallbackSteps = parsed.steps ?? steps;
      const normalized: SequencerPattern = {
        name: parsed.name ?? "Imported",
        grid: parsed.grid,
        probability: parsed.probability ?? probability,
        gate: parsed.gate ?? gate,
        ratchet: parsed.ratchet ?? ratchet,
        resolution: parsed.resolution ?? "16n",
        steps: fallbackSteps,
        tags: parsed.tags ?? [],
      };
      loadPattern(normalized);
      setTagInput(normalized.tags?.join(", ") ?? "");
    } catch {
      // ignore parse errors for now
    }
  };

  const handleSaveSlot = () => {
    const name = presetForm.name.trim() || `Slot ${currentSlot}`;
    saveToSlot(name);
  };

  const handleLoadSlot = (slot: PatternSlot) => {
    setSlot(slot);
    const pattern = slots[slot];
    if (pattern) {
      loadPattern(pattern);
    }
  };

  const patternNames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const entries = Object.values(patterns);
    const filtered = query
      ? entries.filter((pattern) => {
          const inName = pattern.name.toLowerCase().includes(query);
          const inTags = pattern.tags?.some((tag) => tag.toLowerCase().includes(query));
          return inName || inTags;
        })
      : entries;
    return filtered.map((pattern) => pattern.name).sort();
  }, [patterns, searchQuery]);

  const handleCellClick = (row: number, col: number) => {
    if (isAccentMode && grid[row][col] > 0) {
      const nextVelocity = grid[row][col] >= 0.95 ? 0.6 : 1;
      setVelocity(row, col, nextVelocity);
      return;
    }

    toggleCell(row, col, isAccentMode ? 1 : 0.7);
  };

  const handlePointerDown = (row: number, col: number, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (editMode === "probability") {
      const chance = probabilityFromPointer(event);
      setProbability(row, col, chance);
    } else if (editMode === "gate") {
      const gateValue = velocityFromPointer(event);
      setGate(row, col, gateValue);
    } else if (editMode === "ratchet") {
      const ratchetValue = ratchetFromPointer(event);
      setRatchet(row, col, ratchetValue);
    } else {
      const velocity = velocityFromPointer(event);
      setVelocity(row, col, velocity);
    }
    setDragState({ row, col, active: true });
  };

  const handlePointerMove = (row: number, col: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState?.active) return;
    if (dragState.row !== row || dragState.col !== col) return;
    if (editMode === "probability") {
      const chance = probabilityFromPointer(event);
      setProbability(row, col, chance);
    } else if (editMode === "gate") {
      const gateValue = velocityFromPointer(event);
      setGate(row, col, gateValue);
    } else if (editMode === "ratchet") {
      const ratchetValue = ratchetFromPointer(event);
      setRatchet(row, col, ratchetValue);
    } else {
      const velocity = velocityFromPointer(event);
      setVelocity(row, col, velocity);
    }
  };

  const handleRandomize = () => {
    randomize(randomizeDensity / 100);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sequencer</p>
            <h2 className="text-xl font-semibold text-slate-100">16-Step Grid</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{tempoLabel}</span>
            <select
              value={resolution}
              onChange={(event) => setResolution(event.target.value as "16n" | "8n" | "4n")}
              className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200"
            >
              <option value="16n">16n</option>
              <option value="8n">8n</option>
              <option value="4n">4n</option>
            </select>
            <select
              value={steps}
              onChange={(event) => setSteps(Number(event.target.value))}
              className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200"
            >
              <option value={16}>16 steps</option>
              <option value={32}>32 steps</option>
            </select>
            <button
              type="button"
              onClick={clear}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsAccentMode((prev) => !prev)}
              className={
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                (isAccentMode
                  ? "border-cyan-400 text-cyan-200"
                  : "border-slate-700 text-slate-200 hover:border-cyan-400")
              }
            >
              Accent
            </button>
            <button
              type="button"
              onClick={handleRandomize}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Randomize
            </button>
            <button
              type="button"
              onClick={handleCopyPattern}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={handlePastePattern}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              disabled={!copiedPattern}
            >
              Paste
            </button>
            <select
              value={target}
              onChange={(event) =>
                useMachineTargetStore
                  .getState()
                  .setTarget(event.target.value as "subsynth" | "pcmsynth" | "fmsynth" | "bassline")
              }
              className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200"
            >
              <option value="subsynth">SubSynth</option>
              <option value="pcmsynth">PCMSynth</option>
              <option value="fmsynth">FMSynth</option>
              <option value="bassline">BassLine</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="uppercase tracking-[0.2em]">Edit</span>
          {(["velocity", "probability", "gate", "ratchet"] as EditMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setEditMode(mode)}
              className={
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                (editMode === mode
                  ? mode === "probability"
                    ? "border-pink-400 text-pink-200"
                    : mode === "gate"
                      ? "border-emerald-400 text-emerald-200"
                      : mode === "ratchet"
                        ? "border-amber-400 text-amber-200"
                        : "border-cyan-400 text-cyan-200"
                  : "border-slate-700 text-slate-200 hover:border-cyan-400")
              }
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="uppercase tracking-[0.2em]">Legend</span>
          <span className="rounded-full border border-cyan-400/40 px-2 py-0.5 text-[10px] text-cyan-200">
            Velocity (vertical drag)
          </span>
          <span className="rounded-full border border-pink-400/40 px-2 py-0.5 text-[10px] text-pink-200">
            Probability (horizontal drag)
          </span>
          <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] text-emerald-200">
            Gate (vertical drag)
          </span>
          <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] text-amber-200">
            Ratchet (horizontal drag)
          </span>
        </div>

        <label className="flex items-center gap-3 text-xs text-slate-500">
          <span className="uppercase tracking-[0.2em]">Density</span>
          <input
            type="range"
            min={5}
            max={80}
            value={randomizeDensity}
            onChange={(event) => setRandomizeDensity(Number(event.target.value))}
            className="w-40"
          />
          <span>{randomizeDensity}%</span>
        </label>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="uppercase tracking-[0.2em]">Quick</span>
          {([
            { mode: "velocity", label: "Vel", hover: "hover:border-cyan-400" },
            { mode: "probability", label: "Prob", hover: "hover:border-pink-400" },
            { mode: "gate", label: "Gate", hover: "hover:border-emerald-400" },
            { mode: "ratchet", label: "Ratchet", hover: "hover:border-amber-400" },
          ] as const).map(({ mode, label, hover }) => (
            <div key={mode} className="flex items-center gap-1">
              {(["low", "med", "high"] as const).map((level) => (
                <button
                  key={`${mode}-${level}`}
                  type="button"
                  onClick={() => {
                    setEditMode(mode);
                    applyQuickPreset(mode, level);
                  }}
                  className={`rounded-full border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition ${hover}`}
                >
                  {label} {level}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${steps + 1}, minmax(0, 1fr))` }}>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Note</div>
              {Array.from({ length: steps }, (_, step) => (
                <div
                  key={`header-${step}`}
                  className={
                    "text-center text-[10px] uppercase tracking-[0.2em] text-slate-500" +
                    (currentStep === step && isPlaying ? " text-cyan-300" : "")
                  }
                >
                  {step + 1}
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {grid.map((row, rowIndex) => (
                <div
                  key={notes[rowIndex]}
                  className="grid items-center gap-1"
                  style={{ gridTemplateColumns: `repeat(${steps + 1}, minmax(0, 1fr))` }}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <span className="min-w-[2.5rem]">{notes[rowIndex]}</span>
                    <button
                      type="button"
                      onClick={() => toggleRowMute(rowIndex)}
                      className={
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] " +
                        (rowMutes[rowIndex]
                          ? "border-rose-400 text-rose-200"
                          : "border-slate-700 text-slate-300 hover:border-rose-300")
                      }
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRowSolo(rowIndex)}
                      className={
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] " +
                        (rowSolos[rowIndex]
                          ? "border-amber-400 text-amber-200"
                          : "border-slate-700 text-slate-300 hover:border-amber-300")
                      }
                    >
                      S
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rowVolumes[rowIndex] ?? 1}
                      onChange={(event) => {
                        const next = [...rowVolumes];
                        next[rowIndex] = Number(event.target.value);
                        setRowVolumes(next);
                      }}
                      className="w-16"
                      title={`Vol ${Math.round((rowVolumes[rowIndex] ?? 1) * 100)}%`}
                    />
                    <input
                      type="number"
                      min={-12}
                      max={12}
                      value={rowTransposes[rowIndex] ?? 0}
                      onChange={(event) => {
                        const next = [...rowTransposes];
                        next[rowIndex] = Number(event.target.value);
                        setRowTransposes(next);
                      }}
                      className="w-14 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px] text-slate-200"
                      title="Transpose (semitones)"
                    />
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.1}
                      value={rowPans[rowIndex] ?? 0}
                      onChange={(event) => {
                        const next = [...rowPans];
                        next[rowIndex] = Number(event.target.value);
                        setRowPans(next);
                      }}
                      className="w-16"
                      title={`Pan ${Math.round((rowPans[rowIndex] ?? 0) * 100)}%`}
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rowDelaySends[rowIndex] ?? 0.2}
                      onChange={(event) => {
                        const next = [...rowDelaySends];
                        next[rowIndex] = Number(event.target.value);
                        setRowDelaySends(next);
                      }}
                      className="w-16"
                      title={`Delay ${Math.round((rowDelaySends[rowIndex] ?? 0) * 100)}%`}
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rowReverbSends[rowIndex] ?? 0.2}
                      onChange={(event) => {
                        const next = [...rowReverbSends];
                        next[rowIndex] = Number(event.target.value);
                        setRowReverbSends(next);
                      }}
                      className="w-16"
                      title={`Reverb ${Math.round((rowReverbSends[rowIndex] ?? 0) * 100)}%`}
                    />
                    <select
                      value={rowTargets[rowIndex] ?? target}
                      onChange={(event) => {
                        const next = [...rowTargets];
                        next[rowIndex] = event.target.value as
                          | "subsynth"
                          | "pcmsynth"
                          | "fmsynth"
                          | "bassline";
                        setRowTargets(next);
                      }}
                      className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200"
                      title="Row target"
                    >
                      <option value="subsynth">Sub</option>
                      <option value="pcmsynth">PCM</option>
                      <option value="fmsynth">FM</option>
                      <option value="bassline">Bass</option>
                    </select>
                  </div>
                  {row.map((velocity, colIndex) => {
                    const isActive = velocity > 0;
                    const isAccent = velocity >= 0.95;
                    const chance = probability[rowIndex]?.[colIndex] ?? 1;
                    const gateValue = gate[rowIndex]?.[colIndex] ?? 1;
                    const ratchetValue = ratchet[rowIndex]?.[colIndex] ?? 1;
                    const label = isActive
                      ? `Vel ${Math.round(velocity * 100)}% · Prob ${Math.round(
                          chance * 100,
                        )}% · Gate ${Math.round(gateValue * 100)}% · Ratchet x${ratchetValue}`
                      : "Inactive";
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onPointerDown={(event) => handlePointerDown(rowIndex, colIndex, event)}
                        onPointerMove={(event) => handlePointerMove(rowIndex, colIndex, event)}
                        title={label}
                        className={
                          "relative h-6 rounded border border-slate-800 transition" +
                          (isActive
                            ? isAccent
                              ? " bg-pink-500/70"
                              : " bg-cyan-500/70"
                            : " bg-slate-950") +
                          (currentStep === colIndex && isPlaying
                            ? " border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                            : "")
                        }
                        aria-pressed={isActive}
                        style={
                          isActive
                            ? { boxShadow: `inset 0 ${6 - velocity * 6}px 0 rgba(255,255,255,0.15)` }
                            : undefined
                        }
                      >
                        {isActive && (
                          <span className="absolute left-1 top-1 text-[9px] text-slate-200/80">
                            {Math.round(gateValue * 100)}
                          </span>
                        )}
                        {isActive && (
                          <span
                            className="absolute inset-x-0 bottom-0 h-[2px] bg-pink-300/70"
                            style={{ opacity: chance }}
                          />
                        )}
                        {isActive && (
                          <span
                            className="absolute inset-x-0 top-0 h-[2px] bg-emerald-300/70"
                            style={{ opacity: gateValue }}
                          />
                        )}
                        {isActive && ratchetValue > 1 && (
                          <span className="absolute right-1 top-1 text-[9px] font-semibold text-amber-200">
                            x{ratchetValue}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="uppercase tracking-[0.2em]">Slots</span>
          {SLOT_LABELS.map((slot) => (
            <div key={slot} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadSlot(slot)}
                className={
                  "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                  (currentSlot === slot
                    ? "border-cyan-400 text-cyan-200"
                    : "border-slate-700 text-slate-200 hover:border-cyan-400")
                }
              >
                {slot}
              </button>
              <button
                type="button"
                onClick={() => toggleSlotAuto(slot)}
                className={
                  "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                  (slotAuto[slot]
                    ? "border-amber-400 text-amber-200"
                    : "border-slate-700 text-slate-300 hover:border-amber-300")
                }
                title="Auto-advance through enabled slots"
              >
                Auto
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleSaveSlot}
            className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
          >
            Save Slot
          </button>
          <span className="text-[10px] text-slate-500">
            {slots[currentSlot]?.name ?? "Empty"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Pattern Name</span>
            <input
              type="text"
              value={presetForm.name}
              onChange={(event) => setPresetForm({ name: event.target.value })}
              placeholder="Verse Pulse"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Tags</span>
            <input
              type="text"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="bass, dark, intro"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={handleSavePattern}
            className="h-10 self-end rounded-full border border-cyan-500/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300"
          >
            Save Pattern
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter by name or tag"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Load Pattern</span>
            <select
              value={selectedPattern}
              onChange={(event) => handleLoadPattern(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            >
              <option value="">Select pattern</option>
              {patternNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Rename Selected</span>
            <input
              type="text"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="New name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={handleRenamePattern}
            className="h-10 self-end rounded-full border border-emerald-500/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={handleDeletePattern}
            className="h-10 self-end rounded-full border border-rose-500/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-300"
          >
            Delete
          </button>
        </div>

        <div className="grid gap-3">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Import / Export</span>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste pattern JSON here"
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-100"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportPattern}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Export
            </button>
            <button
              type="button"
              onClick={handleImportPattern}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
