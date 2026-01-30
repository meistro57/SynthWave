import * as Tone from "tone";

import { getMasterOutput } from "./audioEngine";

export function routeToMaster(node: Tone.ToneAudioNode) {
  return node.connect(getMasterOutput());
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
