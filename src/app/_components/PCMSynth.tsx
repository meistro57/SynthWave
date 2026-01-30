"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import * as Tone from "tone";
import { DEFAULT_GENERATOR_VALUES, GeneratorType, SampleType, SoundFont2 } from "soundfont2";
import type { Key, Sample } from "soundfont2";

import {
  PCMSynthEnvelope,
  PCMSynthFilter,
  addPCMSample,
  initPCMSynth,
  clearPCMSynthNoteEnvelopes,
  clearPCMSynthVelocityLayers,
  resetPCMSynthSampler,
  setPCMSynthNoteEnvelope,
  setPCMSynthVelocityLayers,
  triggerPCMSynth,
  updatePCMSynth,
} from "@/audio/instruments/pcmSynth";
import { initAudioEngine } from "@/audio/audioEngine";
import { routeToMaster } from "@/audio/routing";

const DEFAULT_NOTES = ["C2", "D2", "E2", "G2", "A2", "C3", "D3", "E3", "G3", "A3", "C4"];
const FILE_ACCEPT = ".wav,audio/wav,audio/x-wav,audio/wave,audio/flac,audio/mp3,audio/mpeg";

type SampleEntry = {
  id: string;
  name: string;
  note: string;
  buffer: AudioBuffer;
  original: AudioBuffer;
  duration: number;
  loopStart?: number;
  loopEnd?: number;
  velocityRange?: { min: number; max: number };
};

type PreviewSettings = {
  loop: boolean;
  reverse: boolean;
  pitch: number;
};

type SampleEditor = {
  start: number;
  end: number;
};

type SoundFontPreset = {
  bank: number;
  preset: number;
  name: string;
};

const FACTORY_SAMPLES = [
  { id: "sine", name: "Factory Sine" },
  { id: "noise", name: "Factory Noise" },
  { id: "pluck", name: "Factory Pluck" },
];

function createId() {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis) {
    const cryptoApi = globalThis.crypto as Crypto | undefined;
    if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  }
  return `sample_${Math.random().toString(36).slice(2, 10)}`;
}

function createFactoryBuffer(type: string, seconds = 1.2) {
  const context = Tone.getContext().rawContext;
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    if (type === "noise") {
      data[i] = (Math.random() * 2 - 1) * (1 - t / seconds);
    } else if (type === "pluck") {
      data[i] = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 6);
    } else {
      data[i] = Math.sin(2 * Math.PI * 220 * t);
    }
  }

  return buffer;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getGeneratorValue(generators: Record<number, { value?: number } | undefined>, id: number) {
  if (generators[id]?.value !== undefined) return generators[id]!.value ?? 0;
  return DEFAULT_GENERATOR_VALUES[id as keyof typeof DEFAULT_GENERATOR_VALUES] ?? 0;
}

function getGeneratorRange(
  generators: Record<number, { range?: { lo: number; hi: number } } | undefined>,
  id: number,
) {
  const range = generators[id]?.range;
  if (!range) return null;
  return { min: range.lo, max: range.hi };
}

function timecentsToSeconds(timecents: number) {
  return Math.pow(2, timecents / 1200);
}

function centibelsToLinear(centibels: number) {
  return Math.pow(10, -centibels / 200);
}

function centsToFrequency(cents: number) {
  return 8.176 * Math.pow(2, cents / 1200);
}

function getChannelDataFromSample(
  sample: Sample,
  offsets: { start: number; end: number; startLoop: number; endLoop: number },
) {
  const { header, data } = sample;
  const start = clamp(header.start + offsets.start, 0, data.length - 1);
  const end = clamp(header.end + offsets.end, start + 1, data.length);
  const length = Math.max(end - start, 1);
  const channel = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    channel[i] = data[start + i] / 32768;
  }
  const loopStart = clamp(header.startLoop + offsets.startLoop, start, end);
  const loopEnd = clamp(header.endLoop + offsets.endLoop, loopStart + 1, end);
  return {
    channel,
    length,
    loopStart: (loopStart - start) / header.sampleRate,
    loopEnd: (loopEnd - start) / header.sampleRate,
    sampleRate: header.sampleRate,
  };
}

function buildAudioBufferFromSoundFont(key: Key, soundFont: SoundFont2) {
  const { header } = key.sample;
  const startOffset =
    getGeneratorValue(key.generators, GeneratorType.StartAddrsOffset) +
    getGeneratorValue(key.generators, GeneratorType.StartAddrsCoarseOffset) * 32768;
  const endOffset =
    getGeneratorValue(key.generators, GeneratorType.EndAddrsOffset) +
    getGeneratorValue(key.generators, GeneratorType.EndAddrsCoarseOffset) * 32768;
  const startLoopOffset =
    getGeneratorValue(key.generators, GeneratorType.StartLoopAddrsOffset) +
    getGeneratorValue(key.generators, GeneratorType.StartLoopAddrsCoarseOffset) * 32768;
  const endLoopOffset =
    getGeneratorValue(key.generators, GeneratorType.EndLoopAddrsOffset) +
    getGeneratorValue(key.generators, GeneratorType.EndLoopAddrsCoarseOffset) * 32768;

  const offsets = {
    start: startOffset,
    end: endOffset,
    startLoop: startLoopOffset,
    endLoop: endLoopOffset,
  };

  const hasLinked =
    header.type === SampleType.Left ||
    header.type === SampleType.Right ||
    header.type === SampleType.Linked;
  const linkedSample =
    hasLinked && soundFont.samples[header.link] ? soundFont.samples[header.link] : null;
  const leftSample = header.type === SampleType.Right && linkedSample ? linkedSample : key.sample;
  const rightSample = header.type === SampleType.Right ? key.sample : linkedSample;

  const leftData = getChannelDataFromSample(leftSample, offsets);
  const rightData = rightSample ? getChannelDataFromSample(rightSample, offsets) : null;

  const length = rightData ? Math.min(leftData.length, rightData.length) : leftData.length;
  const channelCount = rightData ? 2 : 1;
  const context = Tone.getContext().rawContext;
  const buffer = context.createBuffer(channelCount, length, leftData.sampleRate);
  buffer.getChannelData(0).set(leftData.channel.slice(0, length));
  if (rightData) {
    buffer.getChannelData(1).set(rightData.channel.slice(0, length));
  }

  const loopStart = leftData.loopStart;
  const loopEnd = leftData.loopEnd;
  const cacheKey = `${header.name}:${header.link}:${startOffset}:${endOffset}:${startLoopOffset}:${endLoopOffset}`;

  return { buffer, loopStart, loopEnd, cacheKey };
}

function deriveEnvelopeFromGenerators(
  generators: Record<number, { value?: number } | undefined>,
  keyNumber: number,
) {
  const keyOffset = keyNumber - 60;
  const attackTc = getGeneratorValue(generators, GeneratorType.AttackVolEnv);
  const holdTc =
    getGeneratorValue(generators, GeneratorType.HoldVolEnv) +
    keyOffset * getGeneratorValue(generators, GeneratorType.KeyNumToVolEnvHold);
  const decayTc =
    getGeneratorValue(generators, GeneratorType.DecayVolEnv) +
    keyOffset * getGeneratorValue(generators, GeneratorType.KeyNumToVolEnvDecay);
  const releaseTc = getGeneratorValue(generators, GeneratorType.ReleaseVolEnv);

  const attack = clamp(timecentsToSeconds(attackTc), 0.001, 10);
  const hold = clamp(timecentsToSeconds(holdTc), 0, 10);
  const decay = clamp(timecentsToSeconds(decayTc), 0.01, 10);
  const release = clamp(timecentsToSeconds(releaseTc), 0.01, 10);
  const sustainAttenuation = getGeneratorValue(generators, GeneratorType.SustainVolEnv);
  const sustain = clamp(centibelsToLinear(sustainAttenuation), 0, 1);
  return { attack, decay: hold + decay, sustain, release };
}

function deriveFilterFromGenerators(generators: Record<number, { value?: number } | undefined>) {
  const cutoff = clamp(
    centsToFrequency(getGeneratorValue(generators, GeneratorType.InitialFilterFc)),
    80,
    18000,
  );
  const resonance = clamp(Math.pow(10, getGeneratorValue(generators, GeneratorType.InitialFilterQ) / 200), 0.1, 20);
  return { frequency: cutoff, resonance };
}

function deriveFilterFromGeneratorsWithScaling(
  generators: Record<number, { value?: number } | undefined>,
  keyNumber: number,
  velocityMidi: number,
) {
  let cutoffCents = getGeneratorValue(generators, GeneratorType.InitialFilterFc);
  const modEnvToFilter = getGeneratorValue(generators, GeneratorType.ModEnvToFilterFc);
  if (modEnvToFilter !== 0) {
    cutoffCents += modEnvToFilter * (velocityMidi / 127);
  }
  const scaleTuning = getGeneratorValue(generators, GeneratorType.ScaleTuning);
  if (scaleTuning !== 100) {
    cutoffCents += (keyNumber - 60) * (scaleTuning - 100);
  }
  const cutoff = clamp(centsToFrequency(cutoffCents), 80, 18000);
  const resonance = clamp(Math.pow(10, getGeneratorValue(generators, GeneratorType.InitialFilterQ) / 200), 0.1, 20);
  return { frequency: cutoff, resonance };
}

function isKeyInRange(range: { lo: number; hi: number } | undefined, key: number) {
  if (!range) return true;
  return key >= range.lo && key <= range.hi;
}

function getVelocityLayersForKey(soundFont: SoundFont2, bank: number, presetNumber: number, key: number) {
  const bankData = soundFont.banks[bank];
  if (!bankData) return [];
  const preset = bankData.presets[presetNumber];
  if (!preset) return [];
  const layers: Array<{
    generators: Record<number, { value?: number; range?: { lo: number; hi: number } }>;
    sample: Sample;
    velRange?: { min: number; max: number };
  }> = [];

  const presetZones = preset.zones.filter((zone) => isKeyInRange(zone.keyRange, key));
  for (const presetZone of presetZones) {
    const instrument = presetZone.instrument;
    const instrumentZones = instrument.zones.filter((zone) => isKeyInRange(zone.keyRange, key));
    for (const instrumentZone of instrumentZones) {
      const generators = { ...presetZone.generators, ...instrumentZone.generators } as Record<
        number,
        { value?: number; range?: { lo: number; hi: number } }
      >;
      const velRange = getGeneratorRange(generators, GeneratorType.VelRange);
      layers.push({ generators, sample: instrumentZone.sample, velRange: velRange ?? undefined });
    }
  }

  return layers;
}

function trimBuffer(buffer: AudioBuffer, start: number, end: number) {
  const sampleRate = buffer.sampleRate;
  const startIndex = Math.floor(start * sampleRate);
  const endIndex = Math.floor(end * sampleRate);
  const length = Math.max(endIndex - startIndex, 1);
  const context = Tone.getContext().rawContext;
  const trimmed = context.createBuffer(buffer.numberOfChannels, length, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel);
    const target = trimmed.getChannelData(channel);
    target.set(source.slice(startIndex, startIndex + length));
  }

  return trimmed;
}

function normalizeBuffer(buffer: AudioBuffer) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      const value = Math.abs(data[i]);
      if (value > peak) peak = value;
    }
  }

  if (peak === 0) return buffer;

  const context = Tone.getContext().rawContext;
  const normalized = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const gain = 1 / peak;

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel);
    const target = normalized.getChannelData(channel);
    for (let i = 0; i < source.length; i += 1) {
      target[i] = source[i] * gain;
    }
  }

  return normalized;
}

function createPreviewPlayer() {
  const player = new Tone.Player();
  routeToMaster(player);
  return player;
}

type PCMSynthProps = {
  embedded?: boolean;
};

export function PCMSynth({ embedded = false }: PCMSynthProps) {
  const [ready, setReady] = useState(false);
  const [envelope, setEnvelope] = useState<PCMSynthEnvelope>({
    attack: 0.01,
    decay: 0.2,
    sustain: 0.7,
    release: 0.6,
  });
  const [filter, setFilter] = useState<PCMSynthFilter>({
    frequency: 12000,
    resonance: 0.8,
  });
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [selectedNote, setSelectedNote] = useState<string>(DEFAULT_NOTES[0]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSettings>({ loop: false, reverse: false, pitch: 0 });
  const [editor, setEditor] = useState<SampleEditor>({ start: 0, end: 0 });
  const [soundFontName, setSoundFontName] = useState<string | null>(null);
  const [soundFont, setSoundFont] = useState<SoundFont2 | null>(null);
  const [soundFontPresets, setSoundFontPresets] = useState<SoundFontPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<SoundFontPreset | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const previewPlayerRef = useRef<Tone.Player | null>(null);

  useEffect(() => {
    updatePCMSynth({ envelope, filter });
  }, [envelope, filter]);

  useEffect(() => {
    if (!selectedSampleId) return;
    const sample = samples.find((entry) => entry.id === selectedSampleId);
    if (!sample) return;
    setEditor({ start: 0, end: sample.duration });
  }, [selectedSampleId, samples]);

  useEffect(() => {
    return () => {
      previewPlayerRef.current?.dispose();
      previewPlayerRef.current = null;
    };
  }, []);

  const selectedSample = samples.find((entry) => entry.id === selectedSampleId) ?? null;

  const notes = useMemo(() => DEFAULT_NOTES, []);

  const ensureReady = async () => {
    if (ready) return;
    await initPCMSynth();
    setReady(true);
  };

  const handleAddSample = async (
    name: string,
    buffer: AudioBuffer,
    note = selectedNote,
    loopStart?: number,
    loopEnd?: number,
  ) => {
    await ensureReady();
    await addPCMSample(note, buffer);
    const entry: SampleEntry = {
      id: createId(),
      name,
      note,
      buffer,
      original: buffer,
      duration: buffer.duration,
      loopStart,
      loopEnd,
    };
    setSamples((prev) => [...prev, entry]);
    setSelectedSampleId(entry.id);
    setStatus(`Loaded ${name}`);
  };

  const handleFactoryLoad = async (type: string, name: string) => {
    await initAudioEngine();
    const buffer = createFactoryBuffer(type);
    await handleAddSample(name, buffer);
  };

  const decodeFile = async (file: File) => {
    await initAudioEngine();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer;
  };

  const handleFileInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const buffer = await decodeFile(file);
    await handleAddSample(file.name, buffer);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.includes("audio")) return;
    const buffer = await decodeFile(file);
    await handleAddSample(file.name, buffer);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const playPreview = async () => {
    if (!selectedSample) return;
    await initAudioEngine();
    if (!previewPlayerRef.current) {
      previewPlayerRef.current = createPreviewPlayer();
    }
    const player = previewPlayerRef.current;
    player.stop();
    player.loop = preview.loop;
    player.reverse = preview.reverse;
    player.playbackRate = Math.pow(2, preview.pitch / 12);
    player.buffer = selectedSample.buffer;
    if (preview.loop && selectedSample.loopStart !== undefined && selectedSample.loopEnd !== undefined) {
      player.loopStart = selectedSample.loopStart;
      player.loopEnd = selectedSample.loopEnd;
    }
    player.start();
  };

  const stopPreview = () => {
    previewPlayerRef.current?.stop();
  };

  const triggerNote = async (note: string) => {
    await ensureReady();
    const velocity = 0.9;
    await triggerPCMSynth(note, "8n", undefined, velocity);
  };

  const applyTrim = async () => {
    if (!selectedSample) return;
    const start = clamp(editor.start, 0, selectedSample.duration);
    const end = clamp(editor.end, start + 0.01, selectedSample.duration);
    const trimmed = trimBuffer(selectedSample.buffer, start, end);
    await addPCMSample(selectedSample.note, trimmed);
    setSamples((prev) =>
      prev.map((entry) =>
        entry.id === selectedSample.id
          ? { ...entry, buffer: trimmed, duration: trimmed.duration }
          : entry,
      ),
    );
  };

  const applyNormalize = async () => {
    if (!selectedSample) return;
    const normalized = normalizeBuffer(selectedSample.buffer);
    await addPCMSample(selectedSample.note, normalized);
    setSamples((prev) =>
      prev.map((entry) =>
        entry.id === selectedSample.id
          ? { ...entry, buffer: normalized, duration: normalized.duration }
          : entry,
      ),
    );
  };

  const resetSample = async () => {
    if (!selectedSample) return;
    await addPCMSample(selectedSample.note, selectedSample.original);
    setSamples((prev) =>
      prev.map((entry) =>
        entry.id === selectedSample.id
          ? { ...entry, buffer: entry.original, duration: entry.original.duration }
          : entry,
      ),
    );
  };

  const updateSampleNote = async (sampleId: string, note: string) => {
    const target = samples.find((entry) => entry.id === sampleId);
    if (!target) return;
    await addPCMSample(note, target.buffer);
    setSamples((prev) => prev.map((entry) => (entry.id === sampleId ? { ...entry, note } : entry)));
  };

  const handleSoundFont = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      await initAudioEngine();
      const arrayBuffer = await file.arrayBuffer();
      const sf2 = new SoundFont2(new Uint8Array(arrayBuffer));
      const presets = sf2.presets
        .map((preset) => ({
          bank: preset.header.bank,
          preset: preset.header.preset,
          name: preset.header.name,
        }))
        .filter((preset) => preset.name.toLowerCase() !== "eop");

      setSoundFontName(file.name);
      setSoundFont(sf2);
      setSoundFontPresets(presets);
      setSelectedPreset(presets[0] ?? null);
      setStatus(`Parsed ${presets.length} presets from ${file.name}.`);
    } catch (error) {
      setStatus(`Failed to parse ${file.name}.`);
      console.error(error);
    }
  };

  const loadSoundFontPreset = async () => {
    if (!soundFont || !selectedPreset) return;
    setStatus(`Loading preset ${selectedPreset.name}...`);
    resetPCMSynthSampler();
    clearPCMSynthNoteEnvelopes();
    clearPCMSynthVelocityLayers();
    setSamples([]);
    const nextSamples: SampleEntry[] = [];
    const sampleMap = new Map<string, { buffer: AudioBuffer; loopStart: number; loopEnd: number }>();
    let appliedGenerators = false;
    await ensureReady();

    try {
      for (let midi = 0; midi < 128; midi += 1) {
        const layers = getVelocityLayersForKey(soundFont, selectedPreset.bank, selectedPreset.preset, midi);
        if (layers.length === 0) continue;
        const note = Tone.Frequency(midi, "midi").toNote();

        const velocityLayerEntries: Array<{
          min: number;
          max: number;
          buffer: AudioBuffer;
          loopStart?: number;
          loopEnd?: number;
          envelope: PCMSynthEnvelope;
          filter: PCMSynthFilter;
        }> = [];

        for (const layer of layers) {
          const velocityRange = layer.velRange ?? { min: 0, max: 127 };
          const velocityMidi = Math.round((velocityRange.min + velocityRange.max) / 2);
          const fakeKey = {
            keyNumber: midi,
            sample: layer.sample,
            generators: layer.generators,
            modulators: {},
          } as Key;

          const { buffer, loopStart, loopEnd, cacheKey } = buildAudioBufferFromSoundFont(
            fakeKey,
            soundFont,
          );
          const cached = sampleMap.get(cacheKey);
          const resolved = cached ?? { buffer, loopStart, loopEnd };
          if (!cached) {
            sampleMap.set(cacheKey, resolved);
          }

          const derivedEnvelope = deriveEnvelopeFromGenerators(layer.generators, midi);
          const derivedFilter = deriveFilterFromGeneratorsWithScaling(
            layer.generators,
            midi,
            velocityMidi,
          );

          velocityLayerEntries.push({
            min: velocityRange.min,
            max: velocityRange.max,
            buffer: resolved.buffer,
            loopStart: resolved.loopStart,
            loopEnd: resolved.loopEnd,
            envelope: derivedEnvelope,
            filter: derivedFilter,
          });

          nextSamples.push({
            id: createId(),
            name: `${selectedPreset.name} ${note} v${velocityRange.min}-${velocityRange.max}`,
            note,
            buffer: resolved.buffer,
            original: resolved.buffer,
            duration: resolved.buffer.duration,
            loopStart: resolved.loopStart,
            loopEnd: resolved.loopEnd,
            velocityRange,
          });

          if (!appliedGenerators) {
            setEnvelope(derivedEnvelope);
            setFilter(derivedFilter);
            appliedGenerators = true;
          }
        }

        setPCMSynthNoteEnvelope(note, velocityLayerEntries[0].envelope);
        setPCMSynthVelocityLayers(note, velocityLayerEntries);
      }

      setSamples(nextSamples);
      setSelectedSampleId(nextSamples[0]?.id ?? null);
      setStatus(`Loaded ${nextSamples.length} samples from ${selectedPreset.name}.`);
    } catch (error) {
      setStatus(`Failed to load preset ${selectedPreset.name}.`);
      console.error(error);
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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">PCMSynth</p>
          <h2 className="text-xl font-semibold text-slate-100">Sampler Workbench</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={ensureReady}
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {ready ? "Ready" : "Initialize"}
          </button>
          <div className="text-xs text-slate-500">Assign samples to notes and trigger playback.</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sample Library</p>
                  <p className="text-sm text-slate-300">Factory sources and local uploads.</p>
                </div>
                {status && <p className="text-xs text-cyan-200">{status}</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {FACTORY_SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleFactoryLoad(sample.id, sample.name)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400"
              >
                Drag & drop a WAV/MP3/FLAC to load it, or
                <label className="ml-2 cursor-pointer text-cyan-200 underline">
                  browse
                  <input
                    type="file"
                    accept={FILE_ACCEPT}
                    className="hidden"
                    onChange={(event) => handleFileInput(event.target.files)}
                  />
                </label>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Mapping note
                <select
                  value={selectedNote}
                  onChange={(event) => setSelectedNote(event.target.value)}
                  className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  {notes.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sample Map</p>
              {samples.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No samples loaded yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {samples.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setSelectedSampleId(sample.id)}
                      className={
                        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition " +
                        (sample.id === selectedSampleId
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                          : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-cyan-400")
                      }
                    >
                      <span>{sample.name}</span>
                      <span className="text-xs text-slate-500">{sample.note}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview Controls</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={playPreview}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={stopPreview}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-rose-400"
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={() => setPreview((prev) => ({ ...prev, loop: !prev.loop }))}
                  className={
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                    (preview.loop
                      ? "border-emerald-400 text-emerald-200"
                      : "border-slate-700 text-slate-200 hover:border-emerald-300")
                  }
                >
                  Loop
                </button>
                <button
                  type="button"
                  onClick={() => setPreview((prev) => ({ ...prev, reverse: !prev.reverse }))}
                  className={
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
                    (preview.reverse
                      ? "border-cyan-400 text-cyan-200"
                      : "border-slate-700 text-slate-200 hover:border-cyan-300")
                  }
                >
                  Reverse
                </button>
              </div>
              <div className="mt-4">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Pitch</label>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={preview.pitch}
                  onChange={(event) =>
                    setPreview((prev) => ({ ...prev, pitch: Number(event.target.value) }))
                  }
                  className="mt-2 w-full"
                />
                <div className="text-xs text-slate-500">{preview.pitch} semitones</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sample Editor</p>
              {selectedSample ? (
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>{selectedSample.name}</span>
                    <span className="text-xs text-slate-500">
                      {selectedSample.duration.toFixed(2)}s
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 text-xs text-slate-500">
                      Trim start
                      <input
                        type="number"
                        min={0}
                        max={selectedSample.duration}
                        step={0.01}
                        value={editor.start}
                        onChange={(event) =>
                          setEditor((prev) => ({ ...prev, start: Number(event.target.value) }))
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                      />
                    </label>
                    <label className="space-y-2 text-xs text-slate-500">
                      Trim end
                      <input
                        type="number"
                        min={0}
                        max={selectedSample.duration}
                        step={0.01}
                        value={editor.end}
                        onChange={(event) =>
                          setEditor((prev) => ({ ...prev, end: Number(event.target.value) }))
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyTrim}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                    >
                      Apply Trim
                    </button>
                    <button
                      type="button"
                      onClick={applyNormalize}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                    >
                      Normalize
                    </button>
                    <button
                      type="button"
                      onClick={resetSample}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    Map note
                    <select
                      value={selectedSample.note}
                      onChange={(event) => updateSampleNote(selectedSample.id, event.target.value)}
                      className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                    >
                      {notes.map((note) => (
                        <option key={note} value={note}>
                          {note}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Select a sample to edit.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SoundFont Import</p>
              <div className="mt-3 flex items-center gap-3">
                <label className="cursor-pointer rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400">
                  Load .sf2
                  <input
                    type="file"
                    accept=".sf2"
                    className="hidden"
                    onChange={(event) => handleSoundFont(event.target.files)}
                  />
                </label>
                <span className="text-xs text-slate-500">
                  {soundFontName ? `Loaded ${soundFontName}` : "No SoundFont loaded"}
                </span>
              </div>
              {soundFontPresets.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    value={selectedPreset ? `${selectedPreset.bank}:${selectedPreset.preset}` : ""}
                    onChange={(event) => {
                      const [bank, preset] = event.target.value.split(":").map(Number);
                      const match = soundFontPresets.find(
                        (entry) => entry.bank === bank && entry.preset === preset,
                      );
                      setSelectedPreset(match ?? null);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  >
                    {soundFontPresets.map((preset) => (
                      <option key={`${preset.bank}:${preset.preset}`} value={`${preset.bank}:${preset.preset}`}>
                        {preset.name} (Bank {preset.bank}, Preset {preset.preset})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={loadSoundFontPreset}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
                  >
                    Load Preset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trigger Notes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {notes.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => triggerNote(note)}
                  className="rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400"
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amplitude & Filter</p>
            <div className="mt-3 grid gap-3">
              <label className="space-y-2 text-xs text-slate-500">
                Attack
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
              <label className="space-y-2 text-xs text-slate-500">
                Decay
                <input
                  type="range"
                  min={0.01}
                  max={1}
                  step={0.01}
                  value={envelope.decay}
                  onChange={(event) =>
                    setEnvelope((prev) => ({ ...prev, decay: Number(event.target.value) }))
                  }
                  className="w-full"
                />
              </label>
              <label className="space-y-2 text-xs text-slate-500">
                Sustain
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
              <label className="space-y-2 text-xs text-slate-500">
                Release
                <input
                  type="range"
                  min={0.01}
                  max={2}
                  step={0.01}
                  value={envelope.release}
                  onChange={(event) =>
                    setEnvelope((prev) => ({ ...prev, release: Number(event.target.value) }))
                  }
                  className="w-full"
                />
              </label>
              <label className="space-y-2 text-xs text-slate-500">
                Filter cutoff
                <input
                  type="range"
                  min={100}
                  max={18000}
                  step={10}
                  value={filter.frequency}
                  onChange={(event) =>
                    setFilter((prev) => ({ ...prev, frequency: Number(event.target.value) }))
                  }
                  className="w-full"
                />
              </label>
              <label className="space-y-2 text-xs text-slate-500">
                Filter resonance
                <input
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={filter.resonance}
                  onChange={(event) =>
                    setFilter((prev) => ({ ...prev, resonance: Number(event.target.value) }))
                  }
                  className="w-full"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
