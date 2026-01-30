export type MachineType = "subsynth" | "pcmsynth" | "beatbox" | "fmsynth" | "bassline";

export type MachineState = {
  id: string;
  type: MachineType;
  name: string;
  muted: boolean;
  solo: boolean;
};
