import { create } from "zustand";

export type MachineTarget = "subsynth" | "pcmsynth" | "fmsynth" | "bassline";

export type MachineTargetState = {
  target: MachineTarget;
  setTarget: (target: MachineTarget) => void;
};

export const useMachineTargetStore = create<MachineTargetState>((set) => ({
  target: "subsynth",
  setTarget: (target) => set({ target }),
}));
