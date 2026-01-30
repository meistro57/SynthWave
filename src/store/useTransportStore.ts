import { create } from "zustand";

import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from "@/audio/constants";
import {
  setBpm as setToneBpm,
  setTimeSignature as setToneTimeSignature,
  startTransport,
  stopTransport,
} from "@/audio/transport";

export type TransportState = {
  bpm: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  swing: number;
  humanizeMs: number;
  grooveTemplate: GrooveTemplate;
  setBpm: (bpm: number) => void;
  setTimeSignature: (signature: [number, number]) => void;
  setSwing: (swing: number) => void;
  setHumanizeMs: (humanizeMs: number) => void;
  setGrooveTemplate: (template: GrooveTemplate) => void;
  start: () => void;
  stop: () => void;
};

export type GrooveTemplate =
  | "Straight"
  | "Light Swing"
  | "Heavy Swing"
  | "Shuffle"
  | "Triplet"
  | "Custom";

export const useTransportStore = create<TransportState>((set) => ({
  bpm: DEFAULT_BPM,
  timeSignature: DEFAULT_TIME_SIGNATURE,
  isPlaying: false,
  swing: 0,
  humanizeMs: 0,
  grooveTemplate: "Straight",
  setBpm: (bpm) => {
    setToneBpm(bpm);
    set({ bpm });
  },
  setTimeSignature: (signature) => {
    setToneTimeSignature(signature);
    set({ timeSignature: signature });
  },
  setSwing: (swing) => {
    const clamped = Math.max(0, Math.min(80, swing));
    set({ swing: clamped, grooveTemplate: "Custom" });
  },
  setHumanizeMs: (humanizeMs) => {
    const clamped = Math.max(0, Math.min(40, humanizeMs));
    set({ humanizeMs: clamped, grooveTemplate: "Custom" });
  },
  setGrooveTemplate: (template) => {
    if (template === "Straight") {
      set({ grooveTemplate: template, swing: 0, humanizeMs: 0 });
      return;
    }
    if (template === "Light Swing") {
      set({ grooveTemplate: template, swing: 20, humanizeMs: 5 });
      return;
    }
    if (template === "Heavy Swing") {
      set({ grooveTemplate: template, swing: 55, humanizeMs: 8 });
      return;
    }
    if (template === "Shuffle") {
      set({ grooveTemplate: template, swing: 65, humanizeMs: 6 });
      return;
    }
    if (template === "Triplet") {
      set({ grooveTemplate: template, swing: 75, humanizeMs: 10 });
      return;
    }
    set({ grooveTemplate: "Custom" });
  },
  start: () => {
    startTransport();
    set({ isPlaying: true });
  },
  stop: () => {
    stopTransport();
    set({ isPlaying: false });
  },
}));
