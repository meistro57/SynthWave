import * as Tone from "tone";

import { MASTER_LIMITER_THRESHOLD_DB } from "./constants";
import { initTransport } from "./transport";

let initialized = false;
let masterGain: Tone.Gain | null = null;
let masterLimiter: Tone.Limiter | null = null;
let masterMeter: Tone.Meter | null = null;
let delaySend: Tone.Gain | null = null;
let reverbSend: Tone.Gain | null = null;
let delayBus: Tone.FeedbackDelay | null = null;
let reverbBus: Tone.Reverb | null = null;

function ensureMasterChain() {
  if (!masterGain) {
    masterGain = new Tone.Gain(0.9);
  }

  if (!masterLimiter) {
    masterLimiter = new Tone.Limiter(MASTER_LIMITER_THRESHOLD_DB).toDestination();
    masterGain.connect(masterLimiter);
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

export function isAudioInitialized(): boolean {
  return initialized && Tone.getContext().state === "running";
}
