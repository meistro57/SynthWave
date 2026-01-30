import * as Tone from "tone";

import { getDelaySend, getReverbSend, initAudioEngine } from "@/audio/audioEngine";
import { routeToMachineEffects } from "@/audio/routing";

export type BassLineEnvelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type BassLineSettings = {
  oscillator: Tone.ToneOscillatorType;
  envelope: BassLineEnvelope;
  filterCutoff: number;
  filterResonance: number;
  accent: number;
  glide: number;
};

let bassSynth: Tone.MonoSynth | null = null;
let bassFilter: Tone.Filter | null = null;
let bassGain: Tone.Gain | null = null;
let bassPanner: Tone.Panner | null = null;
let connected = false;

let pendingSettings: BassLineSettings = {
  oscillator: "sawtooth",
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
  filterCutoff: 800,
  filterResonance: 1.2,
  accent: 0.6,
  glide: 0.08,
};
let pendingGain = 1;
let pendingPan = 0;

function ensureSynth() {
  if (!bassSynth) {
    bassSynth = new Tone.MonoSynth({
      oscillator: { type: pendingSettings.oscillator },
      envelope: pendingSettings.envelope,
    });
  }
  return bassSynth;
}

function ensureFilter() {
  if (!bassFilter) {
    bassFilter = new Tone.Filter({
      type: "lowpass",
      frequency: pendingSettings.filterCutoff,
      Q: pendingSettings.filterResonance,
    });
  }
  return bassFilter;
}

function ensureGain() {
  if (!bassGain) {
    bassGain = new Tone.Gain(pendingGain);
  }
  return bassGain;
}

function ensurePanner() {
  if (!bassPanner) {
    bassPanner = new Tone.Panner(pendingPan);
  }
  return bassPanner;
}

function applySettings() {
  if (!bassSynth) return;
  bassSynth.set({
    oscillator: { type: pendingSettings.oscillator },
    envelope: pendingSettings.envelope,
  } as Partial<Tone.MonoSynthOptions>);

  if (bassFilter) {
    bassFilter.frequency.value = pendingSettings.filterCutoff;
    bassFilter.Q.value = pendingSettings.filterResonance;
  }
  if (bassGain) {
    bassGain.gain.value = pendingGain;
  }
  if (bassPanner) {
    bassPanner.pan.value = pendingPan;
  }
}

export async function initBassLine() {
  await initAudioEngine();
  const synth = ensureSynth();
  const filter = ensureFilter();
  const gain = ensureGain();
  const panner = ensurePanner();
  applySettings();

  if (!connected) {
    synth.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(getDelaySend());
    panner.connect(getReverbSend());
    routeToMachineEffects("bassline", panner);
    connected = true;
  }

  return synth;
}

export function updateBassLine(settings: Partial<BassLineSettings>) {
  pendingSettings = { ...pendingSettings, ...settings };
  applySettings();
}

export function setBassLineOutputGain(level: number) {
  pendingGain = Math.max(0, Math.min(1, level));
  if (!bassGain) return;
  bassGain.gain.value = pendingGain;
}

export function setBassLinePan(pan: number) {
  pendingPan = Math.max(-1, Math.min(1, pan));
  if (!bassPanner) return;
  bassPanner.pan.value = pendingPan;
}

export async function triggerBassLine(
  note: string,
  duration: Tone.Unit.Time = "8n",
  time?: Tone.Unit.Time,
  velocity = 0.8,
  accent = false,
  glide = false,
) {
  const synth = await initBassLine();
  if (glide) {
    synth.portamento = pendingSettings.glide;
  } else {
    synth.portamento = 0;
  }
  const accentBoost = accent ? 1 + pendingSettings.accent : 1;
  const accentCutoff = accent ? pendingSettings.filterCutoff * (1 + pendingSettings.accent) : pendingSettings.filterCutoff;
  if (bassFilter) {
    bassFilter.frequency.value = accentCutoff;
  }
  synth.triggerAttackRelease(note, duration, time, velocity * accentBoost);
}

export function disposeBassLine() {
  bassSynth?.dispose();
  bassFilter?.dispose();
  bassGain?.dispose();
  bassPanner?.dispose();
  bassSynth = null;
  bassFilter = null;
  bassGain = null;
  bassPanner = null;
  connected = false;
}
