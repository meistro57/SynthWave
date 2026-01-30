import * as Tone from "tone";

import { getDelaySend, getReverbSend, initAudioEngine } from "@/audio/audioEngine";
import { routeToMachineEffects } from "@/audio/routing";

export type PCMSynthEnvelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type PCMSynthFilter = {
  frequency: number;
  resonance: number;
};

let pcmSampler: Tone.Sampler | null = null;
let pcmEnvelope: Tone.AmplitudeEnvelope | null = null;
let pcmFilter: Tone.Filter | null = null;
let pcmGain: Tone.Gain | null = null;
let pcmPanner: Tone.Panner | null = null;
let connected = false;
const noteEnvelopes = new Map<string, PCMSynthEnvelope>();
type VelocityLayer = {
  min: number;
  max: number;
  buffer: AudioBuffer | Tone.ToneAudioBuffer;
  loopStart?: number;
  loopEnd?: number;
  envelope?: PCMSynthEnvelope;
  filter?: PCMSynthFilter;
};
const velocityLayers = new Map<string, VelocityLayer[]>();

let pendingEnvelope: PCMSynthEnvelope = {
  attack: 0.01,
  decay: 0.2,
  sustain: 0.7,
  release: 0.6,
};
let pendingFilter: PCMSynthFilter = {
  frequency: 12000,
  resonance: 0.8,
};
let pendingGain = 1;
let pendingPan = 0;

function ensureSampler() {
  if (!pcmSampler) {
    pcmSampler = new Tone.Sampler({ urls: {} });
  }
  return pcmSampler;
}

function ensureEnvelope() {
  if (!pcmEnvelope) {
    pcmEnvelope = new Tone.AmplitudeEnvelope({
      attack: pendingEnvelope.attack,
      decay: pendingEnvelope.decay,
      sustain: pendingEnvelope.sustain,
      release: pendingEnvelope.release,
    });
  }
  return pcmEnvelope;
}

function ensureFilter() {
  if (!pcmFilter) {
    pcmFilter = new Tone.Filter({
      type: "lowpass",
      frequency: pendingFilter.frequency,
      Q: pendingFilter.resonance,
    });
  }
  return pcmFilter;
}

function ensureGain() {
  if (!pcmGain) {
    pcmGain = new Tone.Gain(pendingGain);
  }
  return pcmGain;
}

function ensurePanner() {
  if (!pcmPanner) {
    pcmPanner = new Tone.Panner(pendingPan);
  }
  return pcmPanner;
}

function applyParams() {
  if (pcmEnvelope) {
    pcmEnvelope.set({
      attack: pendingEnvelope.attack,
      decay: pendingEnvelope.decay,
      sustain: pendingEnvelope.sustain,
      release: pendingEnvelope.release,
    });
  }
  if (pcmFilter) {
    pcmFilter.frequency.value = pendingFilter.frequency;
    pcmFilter.Q.value = pendingFilter.resonance;
  }
  if (pcmGain) {
    pcmGain.gain.value = pendingGain;
  }
  if (pcmPanner) {
    pcmPanner.pan.value = pendingPan;
  }
}

export async function initPCMSynth() {
  await initAudioEngine();
  const sampler = ensureSampler();
  const envelope = ensureEnvelope();
  const filter = ensureFilter();
  const gain = ensureGain();
  const panner = ensurePanner();

  applyParams();

  if (!connected) {
    sampler.connect(envelope);
    envelope.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(getDelaySend());
    panner.connect(getReverbSend());
    routeToMachineEffects("pcmsynth", panner);
    connected = true;
  }

  return sampler;
}

export function resetPCMSynthSampler() {
  pcmSampler?.dispose();
  pcmEnvelope?.dispose();
  pcmFilter?.dispose();
  pcmGain?.dispose();
  pcmPanner?.dispose();
  pcmSampler = null;
  pcmEnvelope = null;
  pcmFilter = null;
  pcmGain = null;
  pcmPanner = null;
  connected = false;
  noteEnvelopes.clear();
  velocityLayers.clear();
}

export function updatePCMSynth(params: { envelope: PCMSynthEnvelope; filter: PCMSynthFilter }) {
  pendingEnvelope = params.envelope;
  pendingFilter = params.filter;
  applyParams();
}

export function setPCMSynthOutputGain(level: number) {
  pendingGain = Math.max(0, Math.min(1, level));
  if (pcmGain) {
    pcmGain.gain.value = pendingGain;
  }
}

export function setPCMSynthPan(pan: number) {
  pendingPan = Math.max(-1, Math.min(1, pan));
  if (pcmPanner) {
    pcmPanner.pan.value = pendingPan;
  }
}

export async function addPCMSample(note: string, buffer: AudioBuffer | Tone.ToneAudioBuffer) {
  const sampler = await initPCMSynth();
  sampler.add(note as Tone.Unit.Frequency, buffer);
}

export async function triggerPCMSynth(
  note: string,
  duration: Tone.Unit.Time = "8n",
  time?: Tone.Unit.Time,
  velocity = 0.9,
) {
  const sampler = await initPCMSynth();
  const envelope = ensureEnvelope();
  const startTime = time ?? Tone.now();

  const velocityMidi = Math.round(velocity * 127);
  const layers = velocityLayers.get(note);
  if (layers && layers.length > 0) {
    const layer =
      layers.find((entry) => velocityMidi >= entry.min && velocityMidi <= entry.max) ?? layers[0];
    if (layer.envelope && pcmEnvelope) {
      pcmEnvelope.set({
        attack: layer.envelope.attack,
        decay: layer.envelope.decay,
        sustain: layer.envelope.sustain,
        release: layer.envelope.release,
      });
    } else {
      const noteEnvelope = noteEnvelopes.get(note);
      if (noteEnvelope && pcmEnvelope) {
        pcmEnvelope.set({
          attack: noteEnvelope.attack,
          decay: noteEnvelope.decay,
          sustain: noteEnvelope.sustain,
          release: noteEnvelope.release,
        });
      }
    }
    if (layer.filter && pcmFilter) {
      pcmFilter.frequency.value = layer.filter.frequency;
      pcmFilter.Q.value = layer.filter.resonance;
    }

    const player = new Tone.Player(layer.buffer);
    player.loop = layer.loopStart !== undefined && layer.loopEnd !== undefined;
    if (player.loop) {
      player.loopStart = layer.loopStart ?? 0;
      player.loopEnd = layer.loopEnd ?? 0;
    }
    player.connect(envelope);
    player.start(startTime);

    envelope.triggerAttack(startTime);
    const releaseTime = Tone.Time(duration).toSeconds() + Tone.Time(startTime).toSeconds();
    player.stop(releaseTime);
    envelope.triggerRelease(releaseTime);

    const releaseDelayMs = Math.max(0, (releaseTime - Tone.now()) * 1000 + 50);
    setTimeout(() => player.dispose(), releaseDelayMs);
    return;
  }

  const noteEnvelope = noteEnvelopes.get(note);
  if (noteEnvelope && pcmEnvelope) {
    pcmEnvelope.set({
      attack: noteEnvelope.attack,
      decay: noteEnvelope.decay,
      sustain: noteEnvelope.sustain,
      release: noteEnvelope.release,
    });
  }

  sampler.triggerAttack(note, startTime, velocity);
  envelope.triggerAttack(startTime);
  const releaseTime = Tone.Time(duration).toSeconds() + Tone.Time(startTime).toSeconds();
  sampler.triggerRelease(note, releaseTime);
  envelope.triggerRelease(releaseTime);
}

export function disposePCMSynth() {
  pcmSampler?.dispose();
  pcmEnvelope?.dispose();
  pcmFilter?.dispose();
  pcmGain?.dispose();
  pcmPanner?.dispose();
  pcmSampler = null;
  pcmEnvelope = null;
  pcmFilter = null;
  pcmGain = null;
  pcmPanner = null;
  connected = false;
  noteEnvelopes.clear();
  velocityLayers.clear();
}

export function setPCMSynthNoteEnvelope(note: string, envelope: PCMSynthEnvelope) {
  noteEnvelopes.set(note, envelope);
}

export function clearPCMSynthNoteEnvelopes() {
  noteEnvelopes.clear();
}

export function setPCMSynthVelocityLayers(note: string, layers: VelocityLayer[]) {
  velocityLayers.set(note, layers);
}

export function clearPCMSynthVelocityLayers() {
  velocityLayers.clear();
}
