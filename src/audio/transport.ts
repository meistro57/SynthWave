import * as Tone from "tone";

import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from "./constants";

export function initTransport() {
  Tone.Transport.bpm.value = DEFAULT_BPM;
  Tone.Transport.timeSignature = DEFAULT_TIME_SIGNATURE;
}

export function setBpm(bpm: number) {
  Tone.Transport.bpm.value = bpm;
}

export function setTimeSignature(signature: [number, number]) {
  Tone.Transport.timeSignature = signature;
}

export function startTransport() {
  Tone.Transport.start();
}

export function stopTransport() {
  Tone.Transport.stop();
}

export function pauseTransport() {
  Tone.Transport.pause();
}
