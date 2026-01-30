import * as Tone from "tone";

import type { EffectDefinition, EffectType } from "./types";

const effectRegistry: Record<EffectType, EffectDefinition> = {
  distortion: {
    type: "distortion",
    label: "Distortion",
    params: [
      { key: "drive", label: "Drive", min: 0, max: 1, step: 0.01 },
      { key: "wet", label: "Wet", min: 0, max: 1, step: 0.01 },
    ],
    defaultParams: { drive: 0.4, wet: 0.5 },
    create: () => new Tone.Distortion(0.4),
    apply: (node, params) => {
      const distortion = node as Tone.Distortion;
      distortion.distortion = params.drive;
      distortion.wet.value = params.wet;
    },
  },
  filter: {
    type: "filter",
    label: "Filter",
    params: [
      { key: "frequency", label: "Cutoff", min: 80, max: 12000, step: 10 },
      { key: "resonance", label: "Resonance", min: 0.1, max: 10, step: 0.1 },
    ],
    defaultParams: { frequency: 1200, resonance: 1 },
    create: () => new Tone.Filter({ type: "lowpass", frequency: 1200, Q: 1 }),
    apply: (node, params) => {
      const filter = node as Tone.Filter;
      filter.frequency.value = params.frequency;
      filter.Q.value = params.resonance;
    },
  },
  delay: {
    type: "delay",
    label: "Delay",
    params: [
      { key: "time", label: "Time", min: 0.05, max: 1.5, step: 0.01 },
      { key: "feedback", label: "Feedback", min: 0, max: 0.9, step: 0.01 },
      { key: "wet", label: "Wet", min: 0, max: 1, step: 0.01 },
    ],
    defaultParams: { time: 0.25, feedback: 0.35, wet: 0.4 },
    create: () => new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.35, wet: 0.4 }),
    apply: (node, params) => {
      const delay = node as Tone.FeedbackDelay;
      delay.delayTime.value = params.time;
      delay.feedback.value = params.feedback;
      delay.wet.value = params.wet;
    },
  },
  reverb: {
    type: "reverb",
    label: "Reverb",
    params: [
      { key: "decay", label: "Decay", min: 0.5, max: 6, step: 0.1 },
      { key: "preDelay", label: "PreDelay", min: 0, max: 0.5, step: 0.01 },
      { key: "wet", label: "Wet", min: 0, max: 1, step: 0.01 },
    ],
    defaultParams: { decay: 2.5, preDelay: 0.01, wet: 0.4 },
    create: () => new Tone.Reverb({ decay: 2.5, preDelay: 0.01, wet: 0.4 }),
    apply: (node, params) => {
      const reverb = node as Tone.Reverb;
      reverb.decay = params.decay;
      reverb.preDelay = params.preDelay;
      reverb.wet.value = params.wet;
    },
  },
  chorus: {
    type: "chorus",
    label: "Chorus",
    params: [
      { key: "frequency", label: "Rate", min: 0.1, max: 5, step: 0.1 },
      { key: "depth", label: "Depth", min: 0, max: 1, step: 0.01 },
      { key: "wet", label: "Wet", min: 0, max: 1, step: 0.01 },
    ],
    defaultParams: { frequency: 1.5, depth: 0.4, wet: 0.4 },
    create: () => new Tone.Chorus(1.5, 2.5, 0.4).start(),
    apply: (node, params) => {
      const chorus = node as Tone.Chorus;
      chorus.frequency.value = params.frequency;
      chorus.depth = params.depth;
      chorus.wet.value = params.wet;
    },
  },
  phaser: {
    type: "phaser",
    label: "Phaser",
    params: [
      { key: "frequency", label: "Rate", min: 0.1, max: 4, step: 0.1 },
      { key: "octaves", label: "Octaves", min: 1, max: 6, step: 0.1 },
      { key: "wet", label: "Wet", min: 0, max: 1, step: 0.01 },
    ],
    defaultParams: { frequency: 0.5, octaves: 3, wet: 0.4 },
    create: () => new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350, wet: 0.4 }),
    apply: (node, params) => {
      const phaser = node as Tone.Phaser;
      phaser.frequency.value = params.frequency;
      phaser.octaves = params.octaves;
      phaser.wet.value = params.wet;
    },
  },
  compressor: {
    type: "compressor",
    label: "Compressor",
    params: [
      { key: "threshold", label: "Threshold", min: -60, max: 0, step: 1 },
      { key: "ratio", label: "Ratio", min: 1, max: 20, step: 0.5 },
      { key: "attack", label: "Attack", min: 0.001, max: 0.5, step: 0.001 },
      { key: "release", label: "Release", min: 0.01, max: 1, step: 0.01 },
    ],
    defaultParams: { threshold: -18, ratio: 3, attack: 0.01, release: 0.2 },
    create: () => new Tone.Compressor(-18, 3),
    apply: (node, params) => {
      const comp = node as Tone.Compressor;
      comp.threshold.value = params.threshold;
      comp.ratio.value = params.ratio;
      comp.attack.value = params.attack;
      comp.release.value = params.release;
    },
  },
  eq: {
    type: "eq",
    label: "EQ",
    params: [
      { key: "low", label: "Low", min: -20, max: 20, step: 0.5 },
      { key: "mid", label: "Mid", min: -20, max: 20, step: 0.5 },
      { key: "high", label: "High", min: -20, max: 20, step: 0.5 },
    ],
    defaultParams: { low: 0, mid: 0, high: 0 },
    create: () => new Tone.EQ3(0, 0, 0),
    apply: (node, params) => {
      const eq = node as Tone.EQ3;
      eq.low.value = params.low;
      eq.mid.value = params.mid;
      eq.high.value = params.high;
    },
  },
};

export function getEffectDefinition(type: EffectType) {
  return effectRegistry[type];
}

export function listEffectDefinitions() {
  return Object.values(effectRegistry);
}
