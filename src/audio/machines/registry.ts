import { setBassLineOutputGain } from "@/audio/instruments/bassLine";
import { setBeatBoxOutputGain } from "@/audio/instruments/beatBox";
import { setFMSynthOutputGain } from "@/audio/instruments/fmSynth";
import { setPCMSynthOutputGain } from "@/audio/instruments/pcmSynth";
import { setSubSynthOutputGain } from "@/audio/instruments/subSynth";

import { Machine } from "./baseMachine";
import { BeatBoxMachine } from "./beatBoxMachine";
import { BassLineMachine } from "./bassLineMachine";
import { FMSynthMachine } from "./fmSynthMachine";
import { PCMSynthMachine } from "./pcmSynthMachine";
import { SubSynthMachine } from "./subSynthMachine";
import type { MachineType } from "./types";

export type MachineDefinition = {
  type: MachineType;
  label: string;
  description: string;
  defaultName: string;
  maxInstances?: number;
  create: (id: string) => Machine;
  setOutputLevel: (id: string, level: number) => void;
};

const registry = new Map<MachineType, MachineDefinition>([
  [
    "subsynth",
    {
      type: "subsynth",
      label: "SubSynth",
      description: "MonoSynth prototype with filter and envelope controls.",
      defaultName: "SubSynth",
      maxInstances: 1,
      create: (id) => new SubSynthMachine(id, "SubSynth"),
      setOutputLevel: (_id, level) => setSubSynthOutputGain(level),
    },
  ],
  [
    "pcmsynth",
    {
      type: "pcmsynth",
      label: "PCMSynth",
      description: "Sample-based sampler with ADSR and filter controls.",
      defaultName: "PCMSynth",
      maxInstances: 1,
      create: (id) => new PCMSynthMachine(id, "PCMSynth"),
      setOutputLevel: (_id, level) => setPCMSynthOutputGain(level),
    },
  ],
  [
    "beatbox",
    {
      type: "beatbox",
      label: "BeatBox",
      description: "8-channel drum sampler with step sequencer.",
      defaultName: "BeatBox",
      maxInstances: 1,
      create: (id) => new BeatBoxMachine(id, "BeatBox"),
      setOutputLevel: (_id, level) => setBeatBoxOutputGain(level),
    },
  ],
  [
    "fmsynth",
    {
      type: "fmsynth",
      label: "FMSynth",
      description: "FM synth with algorithm and modulation controls.",
      defaultName: "FMSynth",
      maxInstances: 1,
      create: (id) => new FMSynthMachine(id, "FMSynth"),
      setOutputLevel: (_id, level) => setFMSynthOutputGain(level),
    },
  ],
  [
    "bassline",
    {
      type: "bassline",
      label: "BassLine",
      description: "Acid-style mono bass with slide and accent.",
      defaultName: "BassLine",
      maxInstances: 1,
      create: (id) => new BassLineMachine(id, "BassLine"),
      setOutputLevel: (_id, level) => setBassLineOutputGain(level),
    },
  ],
]);

export function listMachineDefinitions(): MachineDefinition[] {
  return Array.from(registry.values());
}

export function getMachineDefinition(type: MachineType): MachineDefinition {
  const definition = registry.get(type);
  if (!definition) {
    throw new Error(`Unknown machine type: ${type}`);
  }
  return definition;
}

export function createMachineInstance(type: MachineType, id: string): Machine {
  return getMachineDefinition(type).create(id);
}

export function applyMachineOutputLevel(type: MachineType, id: string, level: number) {
  getMachineDefinition(type).setOutputLevel(id, level);
}
