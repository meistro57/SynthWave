import * as Tone from "tone";

import { MASTER_LIMITER_THRESHOLD_DB } from "./constants";
import { EffectChain } from "./effects/effectChain";
import { initTransport } from "./transport";

let initialized = false;
let masterGain: Tone.Gain | null = null;
let masterEffects: EffectChain | null = null;
let masterLimiter: Tone.Limiter | null = null;
let masterMeter: Tone.Meter | null = null;
let masterWidthMeter: Tone.Meter | null = null;
let masterFFT: Tone.FFT | null = null;
let delaySend: Tone.Gain | null = null;
let reverbSend: Tone.Gain | null = null;
let delayBus: Tone.FeedbackDelay | null = null;
let reverbBus: Tone.Reverb | null = null;
let masterConnected = false;
let masterEQ: Tone.EQ3 | null = null;
let masterCompressor: Tone.Compressor | null = null;
let masterCompressorDry: Tone.Gain | null = null;
let masterCompressorWet: Tone.Gain | null = null;
let masterCompressorMix: Tone.Gain | null = null;
let masterBoost: Tone.Gain | null = null;

function ensureMasterChain() {
  if (!masterGain) {
    masterGain = new Tone.Gain(0.9);
  }

  if (!masterLimiter) {
    masterLimiter = new Tone.Limiter(MASTER_LIMITER_THRESHOLD_DB).toDestination();
  }

  if (!masterEQ) {
    masterEQ = new Tone.EQ3(0, 0, 0);
  }

  if (!masterEffects) {
    masterEffects = new EffectChain(4);
  }

  if (!masterCompressor) {
    masterCompressor = new Tone.Compressor({
      threshold: -18,
      ratio: 3,
      attack: 0.02,
      release: 0.2,
    });
  }

  if (!masterCompressorDry) {
    masterCompressorDry = new Tone.Gain(1);
  }

  if (!masterCompressorWet) {
    masterCompressorWet = new Tone.Gain(0);
  }

  if (!masterCompressorMix) {
    masterCompressorMix = new Tone.Gain(1);
  }

  if (!masterBoost) {
    masterBoost = new Tone.Gain(1.2);
  }

  if (!masterConnected) {
    masterGain.connect(masterEQ);
    masterEQ.connect(masterEffects.input);
    masterEffects.output.connect(masterCompressorDry);
    masterEffects.output.connect(masterCompressor);
    masterCompressor.connect(masterCompressorWet);
    masterCompressorDry.connect(masterCompressorMix);
    masterCompressorWet.connect(masterCompressorMix);
    masterCompressorMix.connect(masterBoost);
    masterBoost.connect(masterLimiter);
    masterConnected = true;
  }

  if (!delayBus) {
    delayBus = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.35,
      wet: 1,
    });
  }

  if (!reverbBus) {
    reverbBus = new Tone.Reverb({
      decay: 2.4,
      wet: 1,
    });
  }

  if (!delaySend) {
    delaySend = new Tone.Gain(0);
    delaySend.connect(delayBus);
    delayBus.connect(masterGain);
  }

  if (!reverbSend) {
    reverbSend = new Tone.Gain(0);
    reverbSend.connect(reverbBus);
    reverbBus.connect(masterGain);
  }

  if (!masterMeter) {
    masterMeter = new Tone.Meter({
      normalRange: false,
      smoothing: 0.8,
    });
    masterLimiter.connect(masterMeter);
  }

  if (!masterWidthMeter) {
    masterWidthMeter = new Tone.Meter({
      normalRange: true,
      smoothing: 0.8,
    });
    masterLimiter.connect(masterWidthMeter);
  }

  if (!masterFFT) {
    masterFFT = new Tone.FFT(128);
    masterLimiter.connect(masterFFT);
  }
}

export async function initAudioEngine() {
  if (initialized) return;
  await Tone.start();

  ensureMasterChain();
  initTransport();

  initialized = true;
}

export function getMasterOutput(): Tone.ToneAudioNode {
  ensureMasterChain();
  return masterGain!;
}

export function getMasterInput(): Tone.ToneAudioNode {
  ensureMasterChain();
  return masterGain!;
}

export function getMasterEffects(): EffectChain {
  ensureMasterChain();
  return masterEffects!;
}

export function getDelaySend(): Tone.Gain {
  ensureMasterChain();
  return delaySend!;
}

export function getReverbSend(): Tone.Gain {
  ensureMasterChain();
  return reverbSend!;
}

export function setDelaySendLevel(level: number) {
  ensureMasterChain();
  delaySend!.gain.value = Math.max(0, Math.min(1, level));
}

export function setReverbSendLevel(level: number) {
  ensureMasterChain();
  reverbSend!.gain.value = Math.max(0, Math.min(1, level));
}

export function getMasterMeter(): Tone.Meter {
  ensureMasterChain();
  return masterMeter!;
}

export function getMasterWidthMeter(): Tone.Meter {
  ensureMasterChain();
  return masterWidthMeter!;
}

export function getMasterFFT(): Tone.FFT {
  ensureMasterChain();
  return masterFFT!;
}

export function isAudioInitialized(): boolean {
  return initialized && Tone.getContext().state === "running";
}

export function setMasterVolume(level: number) {
  ensureMasterChain();
  masterGain!.gain.value = Math.max(0, Math.min(1, level));
}

export function setMasterEQ(low: number, mid: number, high: number) {
  ensureMasterChain();
  if (!masterEQ) return;
  masterEQ.low.value = low;
  masterEQ.mid.value = mid;
  masterEQ.high.value = high;
}

export function setMasterCompressorEnabled(enabled: boolean) {
  ensureMasterChain();
  if (!masterCompressorDry || !masterCompressorWet) return;
  masterCompressorDry.gain.value = enabled ? 0 : 1;
  masterCompressorWet.gain.value = enabled ? 1 : 0;
}

export function setMasterBoost(level: number) {
  ensureMasterChain();
  if (!masterBoost) return;
  masterBoost.gain.value = Math.max(0, Math.min(2, level));
}
