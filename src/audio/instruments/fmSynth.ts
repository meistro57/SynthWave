import * as Tone from "tone";

import { getDelaySend, getReverbSend, initAudioEngine } from "@/audio/audioEngine";
import { routeToMaster } from "@/audio/routing";

export type FMSynthEnvelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type OperatorSettings = {
  oscillator: Tone.ToneOscillatorType;
  ratio: number;
  envelope: FMSynthEnvelope;
};

export type ModMatrix = {
  op1ToOp2: number;
  op1ToOp3: number;
  op2ToOp1: number;
  op2ToOp3: number;
  op3ToOp1: number;
  op3ToOp2: number;
};

export type FMSynthSettings = {
  op1: OperatorSettings;
  op2: OperatorSettings;
  op3: OperatorSettings;
  modMatrix: ModMatrix;
};

type Operator = {
  osc: Tone.Oscillator;
  env: Tone.AmplitudeEnvelope;
  outputs: Tone.Gain[];
};

let operators: Operator[] | null = null;
let carrierGain: Tone.Gain | null = null;
let masterGain: Tone.Gain | null = null;
let panner: Tone.Panner | null = null;
let connected = false;

let pendingSettings: FMSynthSettings = {
  op1: { oscillator: "sine", ratio: 1, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.6 } },
  op2: { oscillator: "sine", ratio: 2, envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 } },
  op3: { oscillator: "sine", ratio: 3, envelope: { attack: 0.03, decay: 0.4, sustain: 0.3, release: 0.4 } },
  modMatrix: {
    op1ToOp2: 0,
    op1ToOp3: 0,
    op2ToOp1: 0.6,
    op2ToOp3: 0,
    op3ToOp1: 0.2,
    op3ToOp2: 0.3,
  },
};
let pendingGain = 1;
let pendingPan = 0;

function createOperator(settings: OperatorSettings) {
  const osc = new Tone.Oscillator();
  const env = new Tone.AmplitudeEnvelope(settings.envelope);
  const outputs = [new Tone.Gain(0), new Tone.Gain(0)];
  osc.connect(env);
  env.connect(outputs[0]);
  env.connect(outputs[1]);
  osc.start();
  return { osc, env, outputs };
}

function ensureGraph() {
  if (!operators) {
    operators = [
      createOperator(pendingSettings.op1),
      createOperator(pendingSettings.op2),
      createOperator(pendingSettings.op3),
    ];
  }
  if (!carrierGain) {
    carrierGain = new Tone.Gain(1);
  }
  if (!masterGain) {
    masterGain = new Tone.Gain(pendingGain);
  }
  if (!panner) {
    panner = new Tone.Panner(pendingPan);
  }

  if (!connected) {
    operators[0].env.connect(carrierGain);
    carrierGain.connect(panner);
    panner.connect(getDelaySend());
    panner.connect(getReverbSend());
    routeToMaster(panner);

    const [op1, op2, op3] = operators;
    op1.outputs[0].connect(op2.osc.frequency);
    op1.outputs[1].connect(op3.osc.frequency);
    op2.outputs[0].connect(op1.osc.frequency);
    op2.outputs[1].connect(op3.osc.frequency);
    op3.outputs[0].connect(op1.osc.frequency);
    op3.outputs[1].connect(op2.osc.frequency);

    connected = true;
  }
}

function applySettings() {
  if (!operators) return;
  const [op1, op2, op3] = operators;
  const settings = pendingSettings;

  op1.osc.type = settings.op1.oscillator;
  op2.osc.type = settings.op2.oscillator;
  op3.osc.type = settings.op3.oscillator;

  op1.env.set(settings.op1.envelope);
  op2.env.set(settings.op2.envelope);
  op3.env.set(settings.op3.envelope);

  op1.outputs[0].gain.value = settings.modMatrix.op1ToOp2;
  op1.outputs[1].gain.value = settings.modMatrix.op1ToOp3;
  op2.outputs[0].gain.value = settings.modMatrix.op2ToOp1;
  op2.outputs[1].gain.value = settings.modMatrix.op2ToOp3;
  op3.outputs[0].gain.value = settings.modMatrix.op3ToOp1;
  op3.outputs[1].gain.value = settings.modMatrix.op3ToOp2;

  masterGain!.gain.value = pendingGain;
  panner!.pan.value = pendingPan;
}

export async function initFMSynth() {
  await initAudioEngine();
  ensureGraph();
  applySettings();
}

export function updateFMSynth(settings: Partial<FMSynthSettings>) {
  pendingSettings = {
    ...pendingSettings,
    ...settings,
    op1: { ...pendingSettings.op1, ...settings.op1 },
    op2: { ...pendingSettings.op2, ...settings.op2 },
    op3: { ...pendingSettings.op3, ...settings.op3 },
    modMatrix: { ...pendingSettings.modMatrix, ...settings.modMatrix },
  };
  applySettings();
}

export function setFMSynthOutputGain(level: number) {
  pendingGain = Math.max(0, Math.min(1, level));
  if (!masterGain) return;
  masterGain.gain.value = pendingGain;
}

export function setFMSynthPan(pan: number) {
  pendingPan = Math.max(-1, Math.min(1, pan));
  if (!panner) return;
  panner.pan.value = pendingPan;
}

export async function triggerFMSynth(
  note: string,
  duration: Tone.Unit.Time = "8n",
  time?: Tone.Unit.Time,
  velocity = 0.8,
) {
  await initFMSynth();
  if (!operators) return;
  const [op1, op2, op3] = operators;
  const baseFrequency = Tone.Frequency(note as Tone.Unit.Frequency).toFrequency();

  op1.osc.frequency.value = baseFrequency * pendingSettings.op1.ratio;
  op2.osc.frequency.value = baseFrequency * pendingSettings.op2.ratio;
  op3.osc.frequency.value = baseFrequency * pendingSettings.op3.ratio;

  const startTime = time ?? Tone.now();
  op1.env.triggerAttack(startTime, velocity);
  op2.env.triggerAttack(startTime, velocity);
  op3.env.triggerAttack(startTime, velocity);

  const releaseTime = Tone.Time(duration).toSeconds() + Tone.Time(startTime).toSeconds();
  op1.env.triggerRelease(releaseTime);
  op2.env.triggerRelease(releaseTime);
  op3.env.triggerRelease(releaseTime);
}

export function disposeFMSynth() {
  if (operators) {
    operators.forEach((op) => {
      op.osc.dispose();
      op.env.dispose();
      op.outputs.forEach((output) => output.dispose());
    });
  }
  carrierGain?.dispose();
  masterGain?.dispose();
  panner?.dispose();
  operators = null;
  carrierGain = null;
  masterGain = null;
  panner = null;
  connected = false;
}
