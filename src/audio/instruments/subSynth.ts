import * as Tone from "tone";

import { getDelaySend, getReverbSend, initAudioEngine } from "@/audio/audioEngine";
import { routeToMaster } from "@/audio/routing";

export type SubSynthEnvelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type SubSynthFilter = {
  frequency: number;
  resonance: number;
};

export type SubSynthPreset = {
  name: string;
  oscillator: Tone.ToneOscillatorType;
  envelope: SubSynthEnvelope;
  filter: SubSynthFilter;
};

let subSynth: Tone.MonoSynth | null = null;
let subSynthGain: Tone.Gain | null = null;
let subSynthPanner: Tone.Panner | null = null;
let connected = false;
let pendingParams: Omit<SubSynthPreset, "name"> | null = null;
let pendingPan = 0;
let pendingGain = 1;

function ensureSubSynth() {
  if (!subSynth) {
    subSynth = new Tone.MonoSynth();
  }

  return subSynth;
}

function ensureSubSynthGain() {
  if (!subSynthGain) {
    subSynthGain = new Tone.Gain(pendingGain);
  }
  return subSynthGain;
}

function applyParams(synth: Tone.MonoSynth, params: Omit<SubSynthPreset, "name">) {
  synth.set({
    oscillator: { type: params.oscillator as Tone.ToneOscillatorType & string },
    envelope: params.envelope,
    filter: { frequency: params.filter.frequency, Q: params.filter.resonance },
  } as Partial<Tone.MonoSynthOptions>);
}

export async function initSubSynth() {
  await initAudioEngine();
  const synth = ensureSubSynth();
  const gain = ensureSubSynthGain();
  if (pendingParams) {
    applyParams(synth, pendingParams);
  }
  if (!connected) {
    if (!subSynthPanner) {
      subSynthPanner = new Tone.Panner(0);
    }
    subSynthPanner.pan.value = pendingPan;
    synth.connect(gain);
    gain.connect(subSynthPanner);
    subSynthPanner.connect(getDelaySend());
    subSynthPanner.connect(getReverbSend());
    routeToMaster(subSynthPanner);
    connected = true;
  }
  return synth;
}

export async function triggerSubSynth(
  note: string,
  duration: Tone.Unit.Time = "8n",
  time?: Tone.Unit.Time,
  velocity = 0.8,
) {
  const synth = await initSubSynth();
  synth.triggerAttackRelease(note, duration, time, velocity);
}

export async function triggerSubSynthAttack(
  note: string,
  time?: Tone.Unit.Time,
  velocity = 0.8,
) {
  const synth = await initSubSynth();
  synth.triggerAttack(note, time, velocity);
}

export async function triggerSubSynthRelease(time?: Tone.Unit.Time) {
  const synth = await initSubSynth();
  synth.triggerRelease(time);
}

export function updateSubSynth(params: Omit<SubSynthPreset, "name">) {
  pendingParams = params;
  if (subSynth) {
    applyParams(subSynth, params);
  }
}

export function disposeSubSynth() {
  subSynth?.dispose();
  subSynthGain?.dispose();
  subSynthPanner?.dispose();
  subSynth = null;
  subSynthGain = null;
  subSynthPanner = null;
  connected = false;
  pendingParams = null;
}

export function setSubSynthPan(pan: number) {
  pendingPan = Math.max(-1, Math.min(1, pan));
  if (!subSynthPanner) return;
  subSynthPanner.pan.value = pendingPan;
}

export function setSubSynthOutputGain(level: number) {
  pendingGain = Math.max(0, Math.min(1, level));
  if (!subSynthGain) return;
  subSynthGain.gain.value = pendingGain;
}
