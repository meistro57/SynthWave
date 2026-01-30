import type * as Tone from "tone";

export type EffectType =
  | "distortion"
  | "filter"
  | "delay"
  | "reverb"
  | "chorus"
  | "phaser"
  | "compressor"
  | "eq";

export type EffectParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
};

export type EffectDefinition = {
  type: EffectType;
  label: string;
  params: EffectParam[];
  create: () => Tone.ToneAudioNode;
  apply: (node: Tone.ToneAudioNode, params: Record<string, number>) => void;
  defaultParams: Record<string, number>;
};

export type EffectSlotState = {
  type: EffectType | null;
  bypass: boolean;
  params: Record<string, number>;
};
