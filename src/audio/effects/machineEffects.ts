import * as Tone from "tone";

import type { MachineType } from "@/audio/machines/types";
import { getMasterInput } from "@/audio/audioEngine";
import { EffectChain } from "./effectChain";

export type MachineEffects = {
  chain: EffectChain;
  meter: Tone.Meter;
  width: Tone.StereoWidener;
};

const machineEffects = new Map<MachineType, MachineEffects>();

export function getMachineEffects(type: MachineType): MachineEffects {
  const existing = machineEffects.get(type);
  if (existing) return existing;

  const chain = new EffectChain(2);
  const width = new Tone.StereoWidener(0.5);
  const meter = new Tone.Meter({ normalRange: true, smoothing: 0.7 });

  chain.output.connect(width);
  width.connect(getMasterInput());
  width.connect(meter);

  const created = { chain, meter, width };
  machineEffects.set(type, created);
  return created;
}

export function getMachineEffectChain(type: MachineType) {
  return getMachineEffects(type).chain;
}

export function getMachineMeter(type: MachineType) {
  return getMachineEffects(type).meter;
}

export function setMachineWidth(type: MachineType, widthValue: number) {
  const effects = getMachineEffects(type);
  effects.width.width = Math.max(0, Math.min(1, widthValue));
}
