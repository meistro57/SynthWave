"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";

import { initAudioEngine } from "@/audio/audioEngine";
import type { PatternSlot } from "@/store/useSequencerStore";
import { useSequencerStore } from "@/store/useSequencerStore";
import { useSongStore } from "@/store/useSongStore";

const STORAGE_KEY = "synthwave.song.arrangement";
const BAR_WIDTH = 48;
const SLOT_OPTIONS: PatternSlot[] = ["A", "B", "C", "D"];

const SLOT_COLORS: Record<PatternSlot, string> = {
  A: "bg-cyan-500/40 border-cyan-300/70",
  B: "bg-emerald-500/40 border-emerald-300/70",
  C: "bg-amber-500/40 border-amber-300/70",
  D: "bg-violet-500/40 border-violet-300/70",
};

export function SongArranger() {
  const { blocks, addBlock, removeBlock, moveBlock, setBlockBars, setBlockName, setBlocks } =
    useSongStore();
  const { slots, setSlot, loadPattern } = useSequencerStore();
  const [selectedSlot, setSelectedSlot] = useState<PatternSlot>("A");
  const [bars, setBars] = useState(4);
  const [songMode, setSongMode] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const scheduleIdsRef = useRef<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { blocks?: typeof blocks; songMode?: boolean };
      if (Array.isArray(parsed.blocks)) {
        setBlocks(parsed.blocks);
      }
      if (typeof parsed.songMode === "boolean") {
        setSongMode(parsed.songMode);
      }
    } catch {
      // ignore parse errors
    }
  }, [setBlocks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = { blocks, songMode };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [blocks, songMode]);

  useEffect(() => {
    scheduleIdsRef.current.forEach((id) => Tone.Transport.clear(id));
    scheduleIdsRef.current = [];

    if (!songMode) return;

    let cursorBars = 0;
    blocks.forEach((block) => {
      const startBars = cursorBars;
      const time = `${startBars}:0:0`;
      const id = Tone.Transport.scheduleOnce(() => {
        const pattern = slots[block.slot];
        if (!pattern) return;
        setSlot(block.slot);
        loadPattern(pattern);
      }, time);
      scheduleIdsRef.current.push(id);
      cursorBars += block.bars;
    });

    return () => {
      scheduleIdsRef.current.forEach((id) => Tone.Transport.clear(id));
      scheduleIdsRef.current = [];
    };
  }, [blocks, slots, songMode, setSlot, loadPattern]);

  const totalBars = useMemo(() => blocks.reduce((sum, block) => sum + block.bars, 0), [blocks]);

  const handleAdd = async () => {
    await initAudioEngine();
    addBlock(selectedSlot, bars);
  };

  const handleJumpToStart = () => {
    Tone.Transport.position = "0:0:0";
  };

  const handleDragStart = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingId && draggingId !== id) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
    if (sourceId && sourceId !== id) {
      moveBlock(sourceId, id);
    }
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Song Mode</p>
            <h2 className="text-xl font-semibold text-slate-100">Song Arranger</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSongMode((value) => !value)}
              className={
                "rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                (songMode
                  ? "border-emerald-400 text-emerald-200"
                  : "border-slate-700 text-slate-300 hover:border-emerald-300")
              }
            >
              {songMode ? "Song Mode On" : "Song Mode Off"}
            </button>
            <button
              type="button"
              onClick={handleJumpToStart}
              className="rounded-full border border-slate-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-400"
            >
              Jump to Start
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="uppercase tracking-[0.2em]">Add Block</span>
          <select
            value={selectedSlot}
            onChange={(event) => setSelectedSlot(event.target.value as PatternSlot)}
            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200"
          >
            {SLOT_OPTIONS.map((slot) => (
              <option key={slot} value={slot}>
                Slot {slot}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            Bars
            <input
              type="number"
              min={1}
              max={32}
              value={bars}
              onChange={(event) => setBars(Number(event.target.value))}
              className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
            />
          </label>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-400"
          >
            Add
          </button>
          <span className="text-xs text-slate-500">Total: {totalBars} bars</span>
        </div>

        <div className="theme-scrollbar overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div
            className="relative flex min-h-[120px] items-center gap-3"
            style={{
              minWidth: Math.max(480, totalBars * BAR_WIDTH),
              backgroundImage:
                "linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px)",
              backgroundSize: `${BAR_WIDTH}px 100%`,
            }}
          >
            {blocks.length === 0 ? (
              <div className="text-sm text-slate-500">No blocks yet. Add a pattern block to start.</div>
            ) : (
              blocks.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={handleDragStart(block.id)}
                  onDragOver={handleDragOver(block.id)}
                  onDrop={handleDrop(block.id)}
                  onDragEnd={handleDragEnd}
                  className={
                    "group relative flex h-20 flex-col justify-between rounded-xl border px-3 py-2 text-xs text-slate-100 shadow-sm transition " +
                    (draggingId === block.id ? "opacity-70" : "") +
                    SLOT_COLORS[block.slot]
                  }
                  style={{ width: block.bars * BAR_WIDTH }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={block.name ?? `Slot ${block.slot}`}
                      onChange={(event) => setBlockName(block.id, event.target.value)}
                      className="w-full bg-transparent text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100"
                    />
                    <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-[10px] font-semibold">
                      {block.slot}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBlockBars(block.id, block.bars - 1)}
                        className="rounded-full border border-slate-900/60 px-2 py-0.5"
                      >
                        -
                      </button>
                      <span>{block.bars} bars</span>
                      <button
                        type="button"
                        onClick={() => setBlockBars(block.id, block.bars + 1)}
                        className="rounded-full border border-slate-900/60 px-2 py-0.5"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="rounded-full border border-slate-900/60 px-2 py-0.5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
