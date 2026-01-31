import { create } from "zustand";

import type { PatternSlot } from "./useSequencerStore";

export type SongBlock = {
  id: string;
  slot: PatternSlot;
  bars: number;
  name?: string;
};

export type SongState = {
  blocks: SongBlock[];
  addBlock: (slot: PatternSlot, bars?: number) => void;
  removeBlock: (id: string) => void;
  moveBlock: (sourceId: string, targetId: string) => void;
  setBlockBars: (id: string, bars: number) => void;
  setBlockName: (id: string, name: string) => void;
  setBlocks: (blocks: SongBlock[]) => void;
  clear: () => void;
};

const DEFAULT_BLOCKS: SongBlock[] = [
  { id: "intro", slot: "A", bars: 2, name: "Intro" },
  { id: "groove", slot: "B", bars: 4, name: "Groove" },
  { id: "hook", slot: "C", bars: 4, name: "Hook" },
];

function moveBlockInList(blocks: SongBlock[], sourceId: string, targetId: string) {
  const fromIndex = blocks.findIndex((block) => block.id === sourceId);
  const toIndex = blocks.findIndex((block) => block.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return blocks;
  const next = blocks.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function sanitizeBars(bars: number) {
  return Math.max(1, Math.min(32, Math.round(bars)));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `block-${Math.random().toString(36).slice(2, 9)}`;
}

export const useSongStore = create<SongState>((set, get) => ({
  blocks: DEFAULT_BLOCKS,
  addBlock: (slot, bars = 4) =>
    set((state) => ({
      blocks: [
        ...state.blocks,
        { id: createId(), slot, bars: sanitizeBars(bars), name: `Slot ${slot}` },
      ],
    })),
  removeBlock: (id) => set((state) => ({ blocks: state.blocks.filter((block) => block.id !== id) })),
  moveBlock: (sourceId, targetId) =>
    set((state) => ({ blocks: moveBlockInList(state.blocks, sourceId, targetId) })),
  setBlockBars: (id, bars) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, bars: sanitizeBars(bars) } : block,
      ),
    })),
  setBlockName: (id, name) =>
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, name } : block)),
    })),
  setBlocks: (blocks) => set({ blocks }),
  clear: () => set({ blocks: [] }),
}));
