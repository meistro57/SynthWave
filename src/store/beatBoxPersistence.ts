import type { BeatBoxPattern } from "@/store/useBeatBoxStore";
import type { PatternSlot } from "@/store/useSequencerStore";

const STORAGE_KEY = "synthwave.beatbox.patterns";
const SLOT_STORAGE_KEY = "synthwave.beatbox.slots";

export type BeatBoxPatternMap = Record<string, BeatBoxPattern>;

export function loadBeatBoxPatterns(): BeatBoxPatternMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as BeatBoxPatternMap;
  } catch {
    return {};
  }
}

export function saveBeatBoxPatterns(patterns: BeatBoxPatternMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

export function loadBeatBoxSlots(): Record<PatternSlot, BeatBoxPattern | null> {
  if (typeof window === "undefined") {
    return { A: null, B: null, C: null, D: null };
  }
  const raw = window.localStorage.getItem(SLOT_STORAGE_KEY);
  if (!raw) return { A: null, B: null, C: null, D: null };
  try {
    return JSON.parse(raw) as Record<PatternSlot, BeatBoxPattern | null>;
  } catch {
    return { A: null, B: null, C: null, D: null };
  }
}

export function saveBeatBoxSlots(slots: Record<PatternSlot, BeatBoxPattern | null>) {
  window.localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slots));
}
