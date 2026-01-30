import { create } from "zustand";

import type { PatternSlot } from "@/store/useSequencerStore";

const CHANNEL_COUNT = 8;
const DEFAULT_STEPS = 16;

export type BeatBoxGrid = number[][]; // 0..1 velocity

export type BeatBoxPattern = {
  name: string;
  steps: number;
  grid: BeatBoxGrid;
  channels: BeatBoxChannel[];
};

export type BeatBoxChannel = {
  name: string;
  volume: number;
  pan: number;
  tune: number;
  delaySend: number;
  reverbSend: number;
  sampleName: string;
};

export type BeatBoxState = {
  steps: number;
  grid: BeatBoxGrid;
  channels: BeatBoxChannel[];
  currentSlot: PatternSlot;
  slots: Record<PatternSlot, BeatBoxPattern | null>;
  setSteps: (steps: number) => void;
  toggleCell: (row: number, col: number, velocity?: number) => void;
  setVelocity: (row: number, col: number, velocity: number) => void;
  clear: () => void;
  setChannelVolume: (index: number, volume: number) => void;
  setChannelPan: (index: number, pan: number) => void;
  setChannelTune: (index: number, tune: number) => void;
  setChannelDelaySend: (index: number, send: number) => void;
  setChannelReverbSend: (index: number, send: number) => void;
  setChannelSampleName: (index: number, sampleName: string) => void;
  setSlot: (slot: PatternSlot) => void;
  saveToSlot: (name: string) => void;
  loadPattern: (pattern: BeatBoxPattern) => void;
};

const DEFAULT_CHANNELS: BeatBoxChannel[] = [
  {
    name: "Kick",
    volume: 0.9,
    pan: 0,
    tune: 0,
    delaySend: 0.1,
    reverbSend: 0.1,
    sampleName: "Factory Kick",
  },
  {
    name: "Snare",
    volume: 0.8,
    pan: 0,
    tune: 0,
    delaySend: 0.2,
    reverbSend: 0.2,
    sampleName: "Factory Snare",
  },
  {
    name: "Clap",
    volume: 0.75,
    pan: 0,
    tune: 0,
    delaySend: 0.2,
    reverbSend: 0.25,
    sampleName: "Factory Clap",
  },
  {
    name: "Hat",
    volume: 0.7,
    pan: -0.1,
    tune: 0,
    delaySend: 0.05,
    reverbSend: 0.05,
    sampleName: "Factory Hat",
  },
  {
    name: "Open Hat",
    volume: 0.7,
    pan: 0.1,
    tune: 0,
    delaySend: 0.1,
    reverbSend: 0.2,
    sampleName: "Factory Open Hat",
  },
  {
    name: "Tom",
    volume: 0.8,
    pan: -0.15,
    tune: 0,
    delaySend: 0.15,
    reverbSend: 0.2,
    sampleName: "Factory Tom",
  },
  {
    name: "Rim",
    volume: 0.7,
    pan: 0.15,
    tune: 0,
    delaySend: 0.05,
    reverbSend: 0.1,
    sampleName: "Factory Rim",
  },
  {
    name: "Perc",
    volume: 0.7,
    pan: 0,
    tune: 0,
    delaySend: 0.1,
    reverbSend: 0.15,
    sampleName: "Factory Perc",
  },
];

function createGrid(rows: number, cols: number, fill = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function resizeGrid(grid: BeatBoxGrid, rows: number, cols: number) {
  return Array.from({ length: rows }, (_, row) => {
    const existing = grid[row] ?? [];
    return Array.from({ length: cols }, (_, col) => existing[col] ?? 0);
  });
}

export const useBeatBoxStore = create<BeatBoxState>((set, get) => ({
  steps: DEFAULT_STEPS,
  grid: createGrid(CHANNEL_COUNT, DEFAULT_STEPS, 0),
  channels: DEFAULT_CHANNELS,
  currentSlot: "A",
  slots: { A: null, B: null, C: null, D: null },
  setSteps: (steps) =>
    set((state) => ({
      steps,
      grid: resizeGrid(state.grid, CHANNEL_COUNT, steps),
    })),
  toggleCell: (row, col, velocity = 0.8) =>
    set((state) => {
      const next = state.grid.map((rowValues) => rowValues.slice());
      if (!next[row]) return state;
      next[row][col] = next[row][col] > 0 ? 0 : velocity;
      return { grid: next };
    }),
  setVelocity: (row, col, velocity) =>
    set((state) => {
      const next = state.grid.map((rowValues) => rowValues.slice());
      if (!next[row]) return state;
      next[row][col] = Math.max(0, Math.min(1, velocity));
      return { grid: next };
    }),
  clear: () =>
    set((state) => ({
      grid: createGrid(CHANNEL_COUNT, state.steps, 0),
    })),
  setChannelVolume: (index, volume) =>
    set((state) => ({
      channels: state.channels.map((channel, row) =>
        row === index ? { ...channel, volume: Math.max(0, Math.min(1, volume)) } : channel,
      ),
    })),
  setChannelPan: (index, pan) =>
    set((state) => ({
      channels: state.channels.map((channel, row) =>
        row === index ? { ...channel, pan: Math.max(-1, Math.min(1, pan)) } : channel,
      ),
    })),
  setChannelTune: (index, tune) =>
    set((state) => ({
      channels: state.channels.map((channel, row) =>
        row === index ? { ...channel, tune: Math.max(-12, Math.min(12, tune)) } : channel,
      ),
    })),
  setChannelDelaySend: (index, send) =>
    set((state) => ({
      channels: state.channels.map((channel, row) =>
        row === index ? { ...channel, delaySend: Math.max(0, Math.min(1, send)) } : channel,
      ),
    })),
  setChannelReverbSend: (index, send) =>
    set((state) => ({
      channels: state.channels.map((channel, row) =>
        row === index ? { ...channel, reverbSend: Math.max(0, Math.min(1, send)) } : channel,
      ),
    })),
  setChannelSampleName: (index, sampleName) =>
    set((state) => ({
      channels: state.channels.map((channel, row) =>
        row === index ? { ...channel, sampleName } : channel,
      ),
    })),
  setSlot: (slot) => set({ currentSlot: slot }),
  saveToSlot: (name) =>
    set((state) => ({
      slots: {
        ...state.slots,
        [state.currentSlot]: { name, steps: state.steps, grid: state.grid, channels: state.channels },
      },
    })),
  loadPattern: (pattern) =>
    set({
      steps: pattern.steps,
      grid: pattern.grid,
      channels: pattern.channels ?? DEFAULT_CHANNELS,
    }),
}));
