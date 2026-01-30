import * as Tone from "tone";

import { getDelaySend, getReverbSend, initAudioEngine } from "@/audio/audioEngine";
import { routeToMachineEffects } from "@/audio/routing";

const CHANNEL_COUNT = 8;

export type BeatBoxSampleDefinition = {
  name: string;
  buffer: AudioBuffer;
};

type BeatBoxChannel = {
  player: Tone.Player;
  gain: Tone.Gain;
  panner: Tone.Panner;
  delaySend: Tone.Gain;
  reverbSend: Tone.Gain;
};

let channels: BeatBoxChannel[] | null = null;
let masterGain: Tone.Gain | null = null;
let masterPanner: Tone.Panner | null = null;
const pendingVolumes = Array.from({ length: CHANNEL_COUNT }, () => 0.9);
const pendingPans = Array.from({ length: CHANNEL_COUNT }, () => 0);
const pendingTunes = Array.from({ length: CHANNEL_COUNT }, () => 0);
const pendingDelaySends = Array.from({ length: CHANNEL_COUNT }, () => 0.2);
const pendingReverbSends = Array.from({ length: CHANNEL_COUNT }, () => 0.2);
let pendingMasterGain = 1;
let pendingMasterPan = 0;

function createBuffer(lengthSeconds: number, render: (data: Float32Array, sampleRate: number) => void) {
  const context = Tone.getContext().rawContext;
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * lengthSeconds));
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  render(data, sampleRate);
  return buffer;
}

function createKick() {
  return createBuffer(0.6, (data, sampleRate) => {
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      const freq = 120 * Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8);
    }
  });
}

function createSnare() {
  return createBuffer(0.4, (data, sampleRate) => {
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
      const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 10);
      data[i] = (noise * 0.7 + tone * 0.3) * 0.9;
    }
  });
}

function createClap() {
  return createBuffer(0.35, (data, sampleRate) => {
    const bursts = [0, 0.03, 0.06];
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      let amp = 0;
      for (const start of bursts) {
        const dt = t - start;
        if (dt >= 0 && dt < 0.08) {
          amp += Math.exp(-dt * 30);
        }
      }
      data[i] = (Math.random() * 2 - 1) * amp * 0.7;
    }
  });
}

function createHat(length = 0.2) {
  return createBuffer(length, (data, sampleRate) => {
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 35);
      data[i] = (Math.random() * 2 - 1) * env * 0.6;
    }
  });
}

function createTom() {
  return createBuffer(0.5, (data, sampleRate) => {
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      const freq = 160 * Math.exp(-t * 2.5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5);
    }
  });
}

function createRim() {
  return createBuffer(0.15, (data, sampleRate) => {
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 50);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
  });
}

function createPerc() {
  return createBuffer(0.3, (data, sampleRate) => {
    for (let i = 0; i < data.length; i += 1) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 15);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
  });
}

export function getBeatBoxFactorySamples() {
  return [
    { name: "Kick", buffer: createKick() },
    { name: "Snare", buffer: createSnare() },
    { name: "Clap", buffer: createClap() },
    { name: "Hat", buffer: createHat(0.2) },
    { name: "Open Hat", buffer: createHat(0.6) },
    { name: "Tom", buffer: createTom() },
    { name: "Rim", buffer: createRim() },
    { name: "Perc", buffer: createPerc() },
  ];
}

function ensureBeatBox() {
  if (!channels) {
    if (!masterGain) {
      masterGain = new Tone.Gain(pendingMasterGain);
    }
    if (!masterPanner) {
      masterPanner = new Tone.Panner(pendingMasterPan);
      masterGain.connect(masterPanner);
      routeToMachineEffects("beatbox", masterPanner);
    }
    channels = Array.from({ length: CHANNEL_COUNT }, () => {
      const player = new Tone.Player();
      const gain = new Tone.Gain(0.9);
      const panner = new Tone.Panner(0);
      const delaySend = new Tone.Gain(0);
      const reverbSend = new Tone.Gain(0);
      player.connect(gain);
      gain.connect(panner);
      panner.connect(masterGain);
      panner.connect(delaySend);
      panner.connect(reverbSend);
      delaySend.connect(getDelaySend());
      reverbSend.connect(getReverbSend());
      return { player, gain, panner, delaySend, reverbSend };
    });
  }

  channels.forEach((channel, index) => {
    channel.gain.gain.value = pendingVolumes[index];
    channel.panner.pan.value = pendingPans[index];
    channel.player.playbackRate = Math.pow(2, pendingTunes[index] / 12);
    channel.delaySend.gain.value = pendingDelaySends[index];
    channel.reverbSend.gain.value = pendingReverbSends[index];
  });
  if (masterGain) masterGain.gain.value = pendingMasterGain;
  if (masterPanner) masterPanner.pan.value = pendingMasterPan;

  return channels;
}

export async function initBeatBox() {
  await initAudioEngine();
  ensureBeatBox();
}

export function setBeatBoxChannelVolume(index: number, level: number) {
  pendingVolumes[index] = Math.max(0, Math.min(1, level));
  if (!channels) return;
  const channel = channels[index];
  if (channel?.gain) {
    channel.gain.gain.value = pendingVolumes[index];
  }
}

export function setBeatBoxChannelPan(index: number, pan: number) {
  pendingPans[index] = Math.max(-1, Math.min(1, pan));
  if (!channels) return;
  const channel = channels[index];
  if (channel?.panner) {
    channel.panner.pan.value = pendingPans[index];
  }
}

export function setBeatBoxChannelTune(index: number, semitones: number) {
  pendingTunes[index] = Math.max(-12, Math.min(12, semitones));
  if (!channels) return;
  const channel = channels[index];
  if (channel?.player) {
    channel.player.playbackRate = Math.pow(2, pendingTunes[index] / 12);
  }
}

export async function setBeatBoxSample(index: number, buffer: AudioBuffer) {
  await initBeatBox();
  const beatChannels = ensureBeatBox();
  const channel = beatChannels[index];
  if (!channel) return;
  channel.player.buffer = buffer;
}

export async function triggerBeatBox(index: number, time?: Tone.Unit.Time, velocity = 0.9) {
  await initBeatBox();
  const beatChannels = ensureBeatBox();
  const channel = beatChannels[index];
  if (!channel) return;
  channel.gain.gain.value = pendingVolumes[index] * Math.max(0, Math.min(1, velocity));
  channel.player.start(time ?? Tone.now());
}

export function disposeBeatBox() {
  channels?.forEach((channel) => {
    channel.player.dispose();
    channel.gain.dispose();
    channel.panner.dispose();
    channel.delaySend.dispose();
    channel.reverbSend.dispose();
  });
  channels = null;
  masterGain?.dispose();
  masterGain = null;
  masterPanner?.dispose();
  masterPanner = null;
}

export function setBeatBoxOutputGain(level: number) {
  pendingMasterGain = Math.max(0, Math.min(1, level));
  if (!masterGain) return;
  masterGain.gain.value = pendingMasterGain;
}

export function setBeatBoxPan(pan: number) {
  pendingMasterPan = Math.max(-1, Math.min(1, pan));
  if (!masterPanner) return;
  masterPanner.pan.value = pendingMasterPan;
}

export function setBeatBoxChannelDelaySend(index: number, level: number) {
  pendingDelaySends[index] = Math.max(0, Math.min(1, level));
  if (!channels) return;
  channels[index]?.delaySend && (channels[index].delaySend.gain.value = pendingDelaySends[index]);
}

export function setBeatBoxChannelReverbSend(index: number, level: number) {
  pendingReverbSends[index] = Math.max(0, Math.min(1, level));
  if (!channels) return;
  channels[index]?.reverbSend && (channels[index].reverbSend.gain.value = pendingReverbSends[index]);
}
