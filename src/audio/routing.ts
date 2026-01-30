import * as Tone from "tone";

import type { MachineType } from "@/audio/machines/types";

import { getMasterOutput } from "./audioEngine";
import { getMachineEffectChain } from "./effects/machineEffects";

export function routeToMaster(node: Tone.ToneAudioNode) {
  return node.connect(getMasterOutput());
}

export function routeToMachineEffects(type: MachineType, node: Tone.ToneAudioNode) {
  const chain = getMachineEffectChain(type);
  return node.connect(chain.input);
}

export function connectSerial(nodes: Tone.ToneAudioNode[]) {
  if (nodes.length === 0) {
    throw new Error("connectSerial requires at least one node");
  }

  for (let i = 0; i < nodes.length - 1; i += 1) {
    nodes[i].connect(nodes[i + 1]);
  }

  return {
    input: nodes[0],
    output: nodes[nodes.length - 1],
  };
}
