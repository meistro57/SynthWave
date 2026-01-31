"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import * as Tone from "tone";

import {
  getBeatBoxFactorySamples,
  initBeatBox,
  setBeatBoxChannelDelaySend,
  setBeatBoxChannelPan,
  setBeatBoxChannelReverbSend,
  setBeatBoxChannelTune,
  setBeatBoxChannelVolume,
  setBeatBoxSample,
  triggerBeatBox,
} from "@/audio/instruments/beatBox";
import {
  loadBeatBoxPatterns,
  loadBeatBoxSlots,
  saveBeatBoxPatterns,
  saveBeatBoxSlots,
} from "@/store/beatBoxPersistence";
import type { BeatBoxPattern } from "@/store/useBeatBoxStore";
import { useBeatBoxStore } from "@/store/useBeatBoxStore";
import { useTransportStore } from "@/store/useTransportStore";

const FILE_ACCEPT = ".wav,audio/wav,audio/x-wav,audio/wave,audio/flac,audio/mp3,audio/mpeg";
const SLOT_LABELS = ["A", "B", "C", "D"] as const;
const CHANNEL_COUNT = 8;
const FACTORY_KIT_NAME = "Factory Kit";

type GridStep = number | [number, number];

function createGrid(rows: number, cols: number, fill = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function applyHits(grid: number[][], row: number, steps: GridStep[], velocity = 0.8) {
  steps.forEach((step) => {
    const [index, vel] = Array.isArray(step) ? step : [step, velocity];
    if (!grid[row]) return;
    grid[row][index] = vel;
  });
}

function buildPresetPatterns(channels: BeatBoxPattern["channels"]) {
  const patterns: Record<string, BeatBoxPattern> = {};

  const fourOnTheFloor = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(fourOnTheFloor, 0, [0, 4, 8, 12], 0.95);
  applyHits(fourOnTheFloor, 1, [4, 12], 0.85);
  applyHits(fourOnTheFloor, 2, [12], 0.6);
  applyHits(fourOnTheFloor, 3, [2, 6, 10, 14], 0.45);
  applyHits(fourOnTheFloor, 4, [15], 0.5);
  patterns["Four on the Floor"] = {
    name: "Four on the Floor",
    steps: 16,
    grid: fourOnTheFloor,
    channels,
  };

  const hipHop = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(hipHop, 0, [0, 6, 9, 11, 14], 0.9);
  applyHits(hipHop, 1, [4, 12], 0.9);
  applyHits(hipHop, 3, [2, 6, 10, 14], 0.4);
  applyHits(hipHop, 6, [7], 0.55);
  patterns["Hip Hop Pocket"] = {
    name: "Hip Hop Pocket",
    steps: 16,
    grid: hipHop,
    channels,
  };

  const breakbeat = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(breakbeat, 0, [0, 3, 7, 10, 12], 0.9);
  applyHits(breakbeat, 1, [4, 12], 0.8);
  applyHits(breakbeat, 3, [0, 2, 4, 6, 8, 10, 12, 14], 0.35);
  applyHits(breakbeat, 4, [7], 0.5);
  patterns["Breakbeat"] = {
    name: "Breakbeat",
    steps: 16,
    grid: breakbeat,
    channels,
  };

  const drumAndBass = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(drumAndBass, 0, [0, 6, 10, 14], 0.95);
  applyHits(drumAndBass, 1, [4, 12], 0.9);
  applyHits(drumAndBass, 3, [0, 2, 3, 5, 7, 8, 10, 11, 13, 15], 0.35);
  applyHits(drumAndBass, 4, [7, 15], 0.5);
  applyHits(drumAndBass, 6, [11], 0.55);
  patterns["Drum & Bass"] = {
    name: "Drum & Bass",
    steps: 16,
    grid: drumAndBass,
    channels,
  };

  const funk = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(funk, 0, [0, 3, 7, 11, 14], 0.9);
  applyHits(funk, 1, [4, 10, 12], 0.85);
  applyHits(funk, 2, [8], 0.6);
  applyHits(funk, 3, [1, 5, 9, 13, 15], 0.45);
  applyHits(funk, 6, [6], 0.5);
  patterns["Funk Shuffle"] = {
    name: "Funk Shuffle",
    steps: 16,
    grid: funk,
    channels,
  };

  const trap = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(trap, 0, [0, 5, 9, 11, 13], 0.95);
  applyHits(trap, 1, [8], 0.9);
  applyHits(
    trap,
    3,
    [
      [0, 0.35],
      [1, 0.4],
      [2, 0.35],
      [3, 0.5],
      [4, 0.35],
      [5, 0.4],
      [6, 0.35],
      [7, 0.6],
      [8, 0.35],
      [9, 0.4],
      [10, 0.35],
      [11, 0.7],
      [12, 0.35],
      [13, 0.4],
      [14, 0.35],
      [15, 0.6],
    ],
  );
  applyHits(trap, 4, [12], 0.55);
  patterns["Trap Hats"] = {
    name: "Trap Hats",
    steps: 16,
    grid: trap,
    channels,
  };

  const garage = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(garage, 0, [0, 7, 11, 15], 0.9);
  applyHits(garage, 1, [4, 12], 0.85);
  applyHits(garage, 3, [2, 6, 10, 14], 0.45);
  applyHits(garage, 4, [9], 0.5);
  patterns["UK Garage"] = {
    name: "UK Garage",
    steps: 16,
    grid: garage,
    channels,
  };

  const afro = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(afro, 0, [0, 5, 9, 13], 0.9);
  applyHits(afro, 1, [4, 12], 0.8);
  applyHits(afro, 7, [2, 6, 10, 14], 0.5);
  applyHits(afro, 3, [1, 3, 7, 11, 15], 0.35);
  patterns["Afro Groove"] = {
    name: "Afro Groove",
    steps: 16,
    grid: afro,
    channels,
  };

  const techno = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(techno, 0, [0, 4, 8, 12], 0.95);
  applyHits(techno, 1, [4, 12], 0.8);
  applyHits(techno, 3, [2, 6, 10, 14], 0.4);
  applyHits(techno, 4, [0, 8], 0.4);
  applyHits(techno, 7, [3, 11], 0.5);
  patterns["Techno Drive"] = {
    name: "Techno Drive",
    steps: 16,
    grid: techno,
    channels,
  };

  const electro = createGrid(CHANNEL_COUNT, 16, 0);
  applyHits(electro, 0, [0, 8], 0.9);
  applyHits(electro, 1, [4, 12], 0.85);
  applyHits(electro, 2, [12], 0.6);
  applyHits(electro, 3, [2, 6, 10, 14], 0.4);
  applyHits(electro, 6, [6, 14], 0.55);
  applyHits(electro, 7, [2, 10], 0.5);
  patterns["Electro"] = {
    name: "Electro",
    steps: 16,
    grid: electro,
    channels,
  };

  return patterns;
}

function velocityFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const normalized = 1 - y / rect.height;
  return Math.max(0.1, Math.min(1, normalized));
}

export function BeatBox({ embedded = false }: { embedded?: boolean }) {
  const { isPlaying, swing, humanizeMs } = useTransportStore();
  const {
    grid,
    channels,
    steps,
    setSteps,
    toggleCell,
    setVelocity,
    clear,
    setChannelVolume,
    setChannelPan,
    setChannelTune,
    setChannelDelaySend,
    setChannelReverbSend,
    setChannelSampleName,
    currentSlot,
    slots,
    setSlots,
    setSlot,
    saveToSlot,
    loadPattern,
  } = useBeatBoxStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [presetName, setPresetName] = useState("BeatBox Pattern");
  const [patterns, setPatterns] = useState<Record<string, BeatBoxPattern>>({});
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [renameValue, setRenameValue] = useState<string>("");
  const [exportText, setExportText] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedKit, setSelectedKit] = useState(FACTORY_KIT_NAME);

  const scheduleIdRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const gridRef = useRef(grid);
  const channelsRef = useRef(channels);
  const stepsRef = useRef(steps);
  const swingRef = useRef(swing);
  const humanizeRef = useRef(humanizeMs);
  const presetsLoadedRef = useRef(false);
  const factorySamplesRef = useRef(getBeatBoxFactorySamples());

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    swingRef.current = swing;
  }, [swing]);

  useEffect(() => {
    humanizeRef.current = humanizeMs;
  }, [humanizeMs]);

  useEffect(() => {
    const init = async () => {
      await initBeatBox();
      const factorySamples = factorySamplesRef.current;
      factorySamples.forEach(async (sample, index) => {
        await setBeatBoxSample(index, sample.buffer);
        setChannelSampleName(index, `Factory ${sample.name}`);
      });
    };
    init().catch(() => setStatus("Failed to initialize BeatBox."));
  }, [setChannelSampleName]);

  useEffect(() => {
    if (presetsLoadedRef.current) return;
    presetsLoadedRef.current = true;
    const stored = loadBeatBoxPatterns();
    const presets = buildPresetPatterns(channelsRef.current);
    const merged = { ...presets, ...stored };
    if (Object.keys(merged).length !== Object.keys(stored).length) {
      saveBeatBoxPatterns(merged);
    }
    setPatterns(merged);
    setSlots(loadBeatBoxSlots());
  }, [setSlots]);

  useEffect(() => {
    saveBeatBoxSlots(slots);
  }, [slots]);

  useEffect(() => {
    channels.forEach((channel, index) => {
      setBeatBoxChannelVolume(index, channel.volume);
      setBeatBoxChannelPan(index, channel.pan);
      setBeatBoxChannelTune(index, channel.tune);
      setBeatBoxChannelDelaySend(index, channel.delaySend);
      setBeatBoxChannelReverbSend(index, channel.reverbSend);
    });
  }, [channels]);

  useEffect(() => {
    if (!isPlaying) {
      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }
      stepRef.current = 0;
      setCurrentStep(0);
      return;
    }

    scheduleIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const step = stepRef.current % stepsRef.current;
      const gridSnapshot = gridRef.current;
      const swingAmount = swingRef.current / 100;
      const baseStep = Tone.Time("16n").toSeconds();
      const swingOffset = step % 2 === 1 ? baseStep * 0.5 * swingAmount : 0;
      const humanizeSeconds = (Math.random() * 2 - 1) * (humanizeRef.current / 1000);

      for (let row = 0; row < gridSnapshot.length; row += 1) {
        const velocity = gridSnapshot[row][step] ?? 0;
        if (velocity > 0) {
          const scheduledTime = time + swingOffset + humanizeSeconds;
          triggerBeatBox(row, scheduledTime, velocity);
        }
      }

      Tone.Draw.schedule(() => setCurrentStep(step), time);
      stepRef.current += 1;
    }, "16n");

    return () => {
      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
      }
    };
  }, [isPlaying]);

  const handleSaveSlot = () => {
    if (!presetName.trim()) return;
    saveToSlot(presetName.trim());
    setStatus(`Saved ${presetName.trim()} to slot ${currentSlot}.`);
  };

  const handleSavePattern = () => {
    if (!presetName.trim()) return;
    const pattern: BeatBoxPattern = {
      name: presetName.trim(),
      steps,
      grid,
      channels,
    };
    setPatterns((prev) => {
      const next = { ...prev, [pattern.name]: pattern };
      saveBeatBoxPatterns(next);
      return next;
    });
    setSelectedPattern(pattern.name);
    setStatus(`Saved pattern ${pattern.name}.`);
  };

  const handleLoadPattern = (name: string) => {
    const pattern = patterns[name];
    if (!pattern) return;
    loadPattern(pattern);
    setPresetName(pattern.name);
    setSelectedPattern(name);
    setStatus(`Loaded pattern ${pattern.name}.`);
  };

  const handleRenamePattern = () => {
    if (!selectedPattern || !renameValue.trim()) return;
    setPatterns((prev) => {
      const existing = prev[selectedPattern];
      if (!existing) return prev;
      const nextName = renameValue.trim();
      const { [selectedPattern]: _, ...rest } = prev;
      const next = { ...rest, [nextName]: { ...existing, name: nextName } };
      saveBeatBoxPatterns(next);
      return next;
    });
    setSelectedPattern(renameValue.trim());
    setPresetName(renameValue.trim());
    setRenameValue("");
    setStatus("Pattern renamed.");
  };

  const handleDeletePattern = () => {
    if (!selectedPattern) return;
    setPatterns((prev) => {
      const { [selectedPattern]: _, ...rest } = prev;
      saveBeatBoxPatterns(rest);
      return rest;
    });
    setSelectedPattern("");
    setStatus("Pattern deleted.");
  };

  const handleExport = () => {
    const payload = {
      name: presetName.trim() || "BeatBox Pattern",
      steps,
      grid,
      channels,
    } satisfies BeatBoxPattern;
    setExportText(JSON.stringify(payload, null, 2));
  };

  const handleCopyJson = async () => {
    const payload =
      exportText.trim() ||
      JSON.stringify(
        {
          name: presetName.trim() || "BeatBox Pattern",
          steps,
          grid,
          channels,
        } satisfies BeatBoxPattern,
        null,
        2,
      );
    setExportText(payload);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload);
      } catch {
        // ignore clipboard errors
      }
    }
  };

  const handleImport = () => {
    if (!exportText.trim()) return;
    try {
      const parsed = JSON.parse(exportText) as BeatBoxPattern;
      if (!parsed.grid || !parsed.channels) return;
      loadPattern(parsed);
      setPresetName(parsed.name);
      setStatus(`Imported ${parsed.name}.`);
    } catch {
      setStatus("Invalid JSON.");
    }
  };

  const handleSlotSelect = (slot: typeof SLOT_LABELS[number]) => {
    setSlot(slot);
    const pattern = slots[slot];
    if (pattern) {
      loadPattern(pattern);
      setPresetName(pattern.name);
    }
  };

  const handleFile = async (index: number, file: File | null) => {
    if (!file) return;
    await initBeatBox();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer.slice(0));
    await setBeatBoxSample(index, buffer);
    setChannelSampleName(index, file.name);
    setStatus(`Loaded ${file.name} on ${channels[index]?.name ?? "pad"}.`);
  };

  const handleFileInput = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    await handleFile(index, files[0]);
  };

  const handleDrop = async (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(index, file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handlePadTrigger = (rowIndex: number, velocity = 0.9) => {
    triggerBeatBox(rowIndex, undefined, velocity);
    if (!isRecording || !isPlaying) return;
    const step = stepRef.current % stepsRef.current;
    setVelocity(rowIndex, step, velocity);
  };

  const kitPresets = useMemo(
    () => [
      {
        name: "Factory Kit",
        channels: [
          { sample: "Kick", volume: 0.9, tune: 0, pan: 0, delay: 0.1, reverb: 0.1 },
          { sample: "Snare", volume: 0.8, tune: 0, pan: 0, delay: 0.2, reverb: 0.2 },
          { sample: "Clap", volume: 0.75, tune: 0, pan: 0, delay: 0.2, reverb: 0.25 },
          { sample: "Hat", volume: 0.7, tune: 0, pan: -0.1, delay: 0.05, reverb: 0.05 },
          { sample: "Open Hat", volume: 0.7, tune: 0, pan: 0.1, delay: 0.1, reverb: 0.2 },
          { sample: "Tom", volume: 0.8, tune: 0, pan: -0.15, delay: 0.15, reverb: 0.2 },
          { sample: "Rim", volume: 0.7, tune: 0, pan: 0.15, delay: 0.05, reverb: 0.1 },
          { sample: "Perc", volume: 0.7, tune: 0, pan: 0, delay: 0.1, reverb: 0.15 },
        ],
      },
      {
        name: "808 Kit",
        channels: [
          { sample: "Kick", volume: 0.95, tune: -4, pan: 0, delay: 0.05, reverb: 0.1 },
          { sample: "Snare", volume: 0.8, tune: -1, pan: 0, delay: 0.15, reverb: 0.2 },
          { sample: "Clap", volume: 0.7, tune: -1, pan: 0.05, delay: 0.2, reverb: 0.25 },
          { sample: "Hat", volume: 0.6, tune: 3, pan: -0.2, delay: 0.02, reverb: 0.05 },
          { sample: "Open Hat", volume: 0.6, tune: 2, pan: 0.2, delay: 0.08, reverb: 0.15 },
          { sample: "Tom", volume: 0.75, tune: -3, pan: -0.1, delay: 0.1, reverb: 0.18 },
          { sample: "Rim", volume: 0.65, tune: 2, pan: 0.1, delay: 0.05, reverb: 0.1 },
          { sample: "Perc", volume: 0.65, tune: 1, pan: 0, delay: 0.08, reverb: 0.12 },
        ],
      },
      {
        name: "House Kit",
        channels: [
          { sample: "Kick", volume: 0.9, tune: -2, pan: 0, delay: 0.05, reverb: 0.1 },
          { sample: "Snare", volume: 0.75, tune: 0, pan: 0, delay: 0.2, reverb: 0.25 },
          { sample: "Clap", volume: 0.8, tune: 1, pan: 0.05, delay: 0.2, reverb: 0.3 },
          { sample: "Hat", volume: 0.65, tune: 3, pan: -0.2, delay: 0.05, reverb: 0.08 },
          { sample: "Open Hat", volume: 0.65, tune: 2, pan: 0.2, delay: 0.1, reverb: 0.2 },
          { sample: "Tom", volume: 0.7, tune: -1, pan: -0.1, delay: 0.1, reverb: 0.15 },
          { sample: "Rim", volume: 0.6, tune: 3, pan: 0.1, delay: 0.05, reverb: 0.1 },
          { sample: "Perc", volume: 0.7, tune: 2, pan: 0, delay: 0.08, reverb: 0.12 },
        ],
      },
      {
        name: "Lo-Fi Kit",
        channels: [
          { sample: "Kick", volume: 0.8, tune: -5, pan: 0, delay: 0.08, reverb: 0.2 },
          { sample: "Snare", volume: 0.7, tune: -2, pan: 0, delay: 0.15, reverb: 0.3 },
          { sample: "Clap", volume: 0.6, tune: -3, pan: 0, delay: 0.2, reverb: 0.35 },
          { sample: "Hat", volume: 0.55, tune: -1, pan: -0.15, delay: 0.1, reverb: 0.18 },
          { sample: "Open Hat", volume: 0.55, tune: -2, pan: 0.15, delay: 0.15, reverb: 0.25 },
          { sample: "Tom", volume: 0.65, tune: -4, pan: -0.1, delay: 0.12, reverb: 0.25 },
          { sample: "Rim", volume: 0.55, tune: -1, pan: 0.1, delay: 0.08, reverb: 0.2 },
          { sample: "Perc", volume: 0.6, tune: -2, pan: 0, delay: 0.12, reverb: 0.2 },
        ],
      },
    ],
    [],
  );

  const handleApplyKit = async () => {
    await initBeatBox();
    const preset = kitPresets.find((kit) => kit.name === selectedKit);
    if (!preset) return;
    const samples = factorySamplesRef.current;
    const sampleByName = new Map(samples.map((sample) => [sample.name, sample.buffer]));
    preset.channels.forEach((channel, index) => {
      const buffer = sampleByName.get(channel.sample);
      if (buffer) {
        setBeatBoxSample(index, buffer);
        setChannelSampleName(index, `Kit ${channel.sample}`);
      }
      setChannelVolume(index, channel.volume);
      setBeatBoxChannelVolume(index, channel.volume);
      setChannelPan(index, channel.pan);
      setBeatBoxChannelPan(index, channel.pan);
      setChannelTune(index, channel.tune);
      setBeatBoxChannelTune(index, channel.tune);
      setChannelDelaySend(index, channel.delay);
      setBeatBoxChannelDelaySend(index, channel.delay);
      setChannelReverbSend(index, channel.reverb);
      setBeatBoxChannelReverbSend(index, channel.reverb);
    });
    setStatus(`Loaded ${preset.name}.`);
  };

  const stepsOptions = useMemo(() => [8, 16, 32], []);

  return (
    <section
      className={
        embedded
          ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
          : "rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">BeatBox</p>
            <h2 className="text-xl font-semibold text-slate-100">Drum Machine</h2>
          </div>
          {status && <div className="text-xs text-cyan-200">{status}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Steps</label>
          <select
            value={steps}
            onChange={(event) => setSteps(Number(event.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          >
            {stepsOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-rose-400"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setIsRecording((value) => !value)}
            className={
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
              (isRecording
                ? "border-rose-400 text-rose-200"
                : "border-slate-700 text-slate-200 hover:border-rose-300")
            }
          >
            {isRecording ? "Recording" : "Record"}
          </button>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Kit</label>
          <select
            value={selectedKit}
            onChange={(event) => setSelectedKit(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          >
            {kitPresets.map((kit) => (
              <option key={kit.name} value={kit.name}>
                {kit.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplyKit}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
          >
            Load Kit
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SLOT_LABELS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => handleSlotSelect(slot)}
              className={
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                (currentSlot === slot
                  ? "border-cyan-400 text-cyan-200"
                  : "border-slate-700 text-slate-200 hover:border-cyan-400")
              }
            >
              {slot}
            </button>
          ))}
          <input
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
            className="ml-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="button"
            onClick={handleSaveSlot}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
          >
            Save Slot
          </button>
          <button
            type="button"
            onClick={handleSavePattern}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
          >
            Save Pattern
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pattern Library</p>
            {Object.keys(patterns).length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No patterns saved yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {Object.keys(patterns)
                  .sort()
                  .map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleLoadPattern(name)}
                      className={
                        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition " +
                        (selectedPattern === name
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                          : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-cyan-400")
                      }
                    >
                      <span>{name}</span>
                      <span className="text-xs text-slate-500">{patterns[name].steps} steps</span>
                    </button>
                  ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                placeholder="Rename selected"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={handleRenamePattern}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={handleDeletePattern}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-rose-400"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Import / Export</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                View JSON
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
              >
                Import JSON
              </button>
            </div>
            <textarea
              value={exportText}
              onChange={(event) => setExportText(event.target.value)}
              rows={6}
              className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              placeholder="Paste pattern JSON here"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <div className="grid gap-2">
              {grid.map((row, rowIndex) => (
                <div key={channels[rowIndex]?.name ?? rowIndex} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePadTrigger(rowIndex)}
                    className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                  >
                    {channels[rowIndex]?.name ?? `Pad ${rowIndex + 1}`}
                  </button>
                  <div className="flex flex-1 gap-1">
                    {row.slice(0, steps).map((value, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        onClick={() => toggleCell(rowIndex, colIndex)}
                        onPointerDown={(event) => {
                          const velocity = velocityFromPointer(event);
                          setVelocity(rowIndex, colIndex, velocity);
                        }}
                        className={
                          "h-8 flex-1 rounded border transition " +
                          (colIndex === currentStep && isPlaying
                            ? "border-cyan-400"
                            : "border-slate-800") +
                          (value > 0
                            ? " bg-cyan-500/60"
                            : " bg-slate-950/40 hover:border-cyan-400")
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {channels.map((channel, index) => (
              <div key={channel.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{channel.name}</p>
                  <label className="cursor-pointer text-xs text-cyan-200 underline">
                    Assign
                    <input
                      type="file"
                      accept={FILE_ACCEPT}
                      className="hidden"
                      onChange={(event) => handleFileInput(index, event.target.files)}
                    />
                  </label>
                </div>
                <div
                  onDrop={(event) => handleDrop(index, event)}
                  onDragOver={handleDragOver}
                  className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-3 py-2 text-xs text-slate-400"
                >
                  {channel.sampleName}
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-500">
                  <label className="space-y-1">
                    Volume
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={channel.volume}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setChannelVolume(index, value);
                        setBeatBoxChannelVolume(index, value);
                      }}
                      className="w-full"
                    />
                  </label>
                  <label className="space-y-1">
                    Pan
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={channel.pan}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setChannelPan(index, value);
                        setBeatBoxChannelPan(index, value);
                      }}
                      className="w-full"
                    />
                  </label>
                  <label className="space-y-1">
                    Tune
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={channel.tune}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setChannelTune(index, value);
                        setBeatBoxChannelTune(index, value);
                      }}
                      className="w-full"
                    />
                  </label>
                  <label className="space-y-1">
                    Delay send
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={channel.delaySend}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setChannelDelaySend(index, value);
                        setBeatBoxChannelDelaySend(index, value);
                      }}
                      className="w-full"
                    />
                  </label>
                  <label className="space-y-1">
                    Reverb send
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={channel.reverbSend}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setChannelReverbSend(index, value);
                        setBeatBoxChannelReverbSend(index, value);
                      }}
                      className="w-full"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
