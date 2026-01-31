import { create } from "zustand";

export const SEQUENCER_NOTES = [
  "C5",
  "B4",
  "A4",
  "G4",
  "F4",
  "E4",
  "D4",
  "C4",
  "B3",
  "A3",
  "G3",
  "F3",
  "E3",
  "D3",
  "C3",
  "B2",
] as const;

export type SequencerNote = (typeof SEQUENCER_NOTES)[number];
export type SequencerResolution = "16n" | "8n" | "4n";

export type SequencerGrid = number[][]; // 0..1 velocity
export type SequencerProbability = number[][]; // 0..1 chance to trigger
export type SequencerGate = number[][]; // 0.1..1 gate multiplier
export type SequencerRatchet = number[][]; // 1..4 retrigger count

export type SequencerPattern = {
  name: string;
  grid: SequencerGrid;
  probability: SequencerProbability;
  gate: SequencerGate;
  ratchet: SequencerRatchet;
  resolution: SequencerResolution;
  steps: number;
  tags?: string[];
};

export type SequencerState = {
  steps: number;
  notes: SequencerNote[];
  grid: SequencerGrid;
  probability: SequencerProbability;
  gate: SequencerGate;
  ratchet: SequencerRatchet;
  resolution: SequencerResolution;
  rowTargets: SequencerTarget[];
  rowMutes: boolean[];
  rowSolos: boolean[];
  rowVolumes: number[];
  rowTransposes: number[];
  rowPans: number[];
  rowDelaySends: number[];
  rowReverbSends: number[];
  currentSlot: PatternSlot;
  slots: Record<PatternSlot, SequencerPattern | null>;
  slotAuto: Record<PatternSlot, boolean>;
  setResolution: (resolution: SequencerResolution) => void;
  setSteps: (steps: number) => void;
  toggleCell: (row: number, col: number, velocity?: number) => void;
  setVelocity: (row: number, col: number, velocity: number) => void;
  setProbability: (row: number, col: number, probability: number) => void;
  setGate: (row: number, col: number, gate: number) => void;
  setRatchet: (row: number, col: number, ratchet: number) => void;
  toggleRowMute: (row: number) => void;
  toggleRowSolo: (row: number) => void;
  setRowVolumes: (volumes: number[]) => void;
  setRowMutes: (mutes: boolean[]) => void;
  setRowSolos: (solos: boolean[]) => void;
  setRowTransposes: (transposes: number[]) => void;
  setRowPans: (pans: number[]) => void;
  setRowDelaySends: (sends: number[]) => void;
  setRowReverbSends: (sends: number[]) => void;
  setRowTargets: (targets: SequencerTarget[]) => void;
  clear: () => void;
  randomize: (density?: number) => void;
  loadPattern: (pattern: SequencerPattern) => void;
  setSlot: (slot: PatternSlot) => void;
  setSlots: (slots: Record<PatternSlot, SequencerPattern | null>) => void;
  setSlotAuto: (slotAuto: Record<PatternSlot, boolean>) => void;
  toggleSlotAuto: (slot: PatternSlot) => void;
  saveToSlot: (name: string) => void;
  applyQuickPreset: (mode: QuickPresetMode, level: QuickPresetLevel) => void;
};

export type PatternSlot = "A" | "B" | "C" | "D";
export type QuickPresetMode = "velocity" | "probability" | "gate" | "ratchet";
export type QuickPresetLevel = "low" | "med" | "high";
export type SequencerTarget = "subsynth" | "pcmsynth" | "beatbox" | "fmsynth" | "bassline";

function createGrid(rows: number, cols: number, fill = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function randomVelocity() {
  return 0.4 + Math.random() * 0.6;
}

function randomGate() {
  return 0.3 + Math.random() * 0.7;
}

function randomRatchet() {
  return Math.ceil(Math.random() * 4);
}

function resizeGrid<T extends number>(grid: T[][], rows: number, cols: number, fill: T) {
  const next = Array.from({ length: rows }, (_, row) => {
    const existing = grid[row] ?? [];
    return Array.from({ length: cols }, (_, col) => existing[col] ?? fill);
  });
  return next;
}

const DEFAULT_STEPS = 16;

export const useSequencerStore = create<SequencerState>((set, get) => ({
  steps: DEFAULT_STEPS,
  notes: [...SEQUENCER_NOTES],
  grid: createGrid(SEQUENCER_NOTES.length, DEFAULT_STEPS, 0),
  probability: createGrid(SEQUENCER_NOTES.length, DEFAULT_STEPS, 1),
  gate: createGrid(SEQUENCER_NOTES.length, DEFAULT_STEPS, 1),
  ratchet: createGrid(SEQUENCER_NOTES.length, DEFAULT_STEPS, 1),
  resolution: "16n",
  rowTargets: Array.from({ length: SEQUENCER_NOTES.length }, () => "subsynth" as SequencerTarget),
  rowMutes: Array.from({ length: SEQUENCER_NOTES.length }, () => false),
  rowSolos: Array.from({ length: SEQUENCER_NOTES.length }, () => false),
  rowVolumes: Array.from({ length: SEQUENCER_NOTES.length }, () => 1),
  rowTransposes: Array.from({ length: SEQUENCER_NOTES.length }, () => 0),
  rowPans: Array.from({ length: SEQUENCER_NOTES.length }, () => 0),
  rowDelaySends: Array.from({ length: SEQUENCER_NOTES.length }, () => 0.2),
  rowReverbSends: Array.from({ length: SEQUENCER_NOTES.length }, () => 0.2),
  currentSlot: "A",
  slots: { A: null, B: null, C: null, D: null },
  slotAuto: { A: false, B: false, C: false, D: false },
  setResolution: (resolution) => set({ resolution }),
  setSteps: (steps) =>
    set((state) => ({
      steps,
      grid: resizeGrid(state.grid, state.notes.length, steps, 0),
      probability: resizeGrid(state.probability, state.notes.length, steps, 1),
      gate: resizeGrid(state.gate, state.notes.length, steps, 1),
      ratchet: resizeGrid(state.ratchet, state.notes.length, steps, 1),
    })),
  toggleCell: (row, col, velocity = 0.7) =>
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
  setProbability: (row, col, probability) =>
    set((state) => {
      const next = state.probability.map((rowValues) => rowValues.slice());
      if (!next[row]) return state;
      next[row][col] = Math.max(0, Math.min(1, probability));
      return { probability: next };
    }),
  setGate: (row, col, gate) =>
    set((state) => {
      const next = state.gate.map((rowValues) => rowValues.slice());
      if (!next[row]) return state;
      next[row][col] = Math.max(0.1, Math.min(1, gate));
      return { gate: next };
    }),
  setRatchet: (row, col, ratchet) =>
    set((state) => {
      const next = state.ratchet.map((rowValues) => rowValues.slice());
      if (!next[row]) return state;
      next[row][col] = Math.max(1, Math.min(4, Math.round(ratchet)));
      return { ratchet: next };
    }),
  toggleRowMute: (row) =>
    set((state) => ({
      rowMutes: state.rowMutes.map((value, index) => (index === row ? !value : value)),
    })),
  toggleRowSolo: (row) =>
    set((state) => ({
      rowSolos: state.rowSolos.map((value, index) => (index === row ? !value : value)),
    })),
  setRowVolumes: (volumes) => set({ rowVolumes: volumes }),
  setRowMutes: (mutes) => set({ rowMutes: mutes }),
  setRowSolos: (solos) => set({ rowSolos: solos }),
  setRowTransposes: (transposes) => set({ rowTransposes: transposes }),
  setRowPans: (pans) => set({ rowPans: pans }),
  setRowDelaySends: (sends) => set({ rowDelaySends: sends }),
  setRowReverbSends: (sends) => set({ rowReverbSends: sends }),
  setRowTargets: (targets) => set({ rowTargets: targets }),
  clear: () =>
    set((state) => ({
      grid: createGrid(state.notes.length, state.steps, 0),
      probability: createGrid(state.notes.length, state.steps, 1),
      gate: createGrid(state.notes.length, state.steps, 1),
      ratchet: createGrid(state.notes.length, state.steps, 1),
    })),
  randomize: (density = 0.25) =>
    set((state) => ({
      grid: state.grid.map((row) =>
        row.map(() => (Math.random() < density ? randomVelocity() : 0)),
      ),
      probability: state.probability.map((row) => row.map(() => Math.random() * 0.8 + 0.2)),
      gate: state.gate.map((row) => row.map(() => randomGate())),
      ratchet: state.ratchet.map((row) => row.map(() => randomRatchet())),
    })),
  loadPattern: (pattern) =>
    set({
      steps: pattern.steps ?? DEFAULT_STEPS,
      grid: pattern.grid,
      probability: pattern.probability,
      gate: pattern.gate ?? createGrid(SEQUENCER_NOTES.length, pattern.steps ?? DEFAULT_STEPS, 1),
      ratchet:
        pattern.ratchet ?? createGrid(SEQUENCER_NOTES.length, pattern.steps ?? DEFAULT_STEPS, 1),
      resolution: pattern.resolution,
    }),
  setSlot: (slot) => set({ currentSlot: slot }),
  setSlots: (slots) => set({ slots }),
  setSlotAuto: (slotAuto) => set({ slotAuto }),
  toggleSlotAuto: (slot) =>
    set((state) => ({ slotAuto: { ...state.slotAuto, [slot]: !state.slotAuto[slot] } })),
  saveToSlot: (name) => {
    const state = get();
    const pattern: SequencerPattern = {
      name,
      grid: state.grid,
      probability: state.probability,
      gate: state.gate,
      ratchet: state.ratchet,
      resolution: state.resolution,
      steps: state.steps,
    };
    set((prev) => ({
      slots: {
        ...prev.slots,
        [state.currentSlot]: pattern,
      },
    }));
  },
  applyQuickPreset: (mode, level) => {
    const state = get();
    const value =
      level === "low" ? 0.4 : level === "med" ? 0.7 : 1;
    if (mode === "velocity") {
      const grid = state.grid.map((row) =>
        row.map((cell) => (cell > 0 ? value : 0)),
      );
      set({ grid });
      return;
    }
    if (mode === "probability") {
      const probability = state.probability.map((row, rowIndex) =>
        row.map((cell, colIndex) => (state.grid[rowIndex][colIndex] > 0 ? value : cell)),
      );
      set({ probability });
      return;
    }
    if (mode === "gate") {
      const gate = state.gate.map((row, rowIndex) =>
        row.map((cell, colIndex) => (state.grid[rowIndex][colIndex] > 0 ? value : cell)),
      );
      set({ gate });
      return;
    }
    const ratchetValue = level === "low" ? 1 : level === "med" ? 2 : 4;
    const ratchet = state.ratchet.map((row, rowIndex) =>
      row.map((cell, colIndex) => (state.grid[rowIndex][colIndex] > 0 ? ratchetValue : cell)),
    );
    set({ ratchet });
  },
}));
