"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";

import {
  applyMachineOutputLevel,
  listMachineDefinitions,
} from "@/audio/machines/registry";
import type { MachineState, MachineType } from "@/audio/machines/types";
import { canAddMachine, getMaxMachines, useRackStore } from "@/store/useRackStore";
import { BeatBox } from "./BeatBox";
import { BassLine } from "./BassLine";
import { FMSynth } from "./FMSynth";
import { PCMSynth } from "./PCMSynth";
import { SubSynth } from "./SubSynth";

function formatBadge(text: string) {
  return text.toUpperCase();
}

function getMachineCardClasses(type: MachineType, isDragOver: boolean) {
  const base = "rounded-2xl border p-4 transition";
  const variants: Record<MachineType, { base: string; hover: string }> = {
    subsynth: { base: "border-cyan-400/50 bg-cyan-500/20", hover: "border-cyan-300 bg-cyan-500/25" },
    pcmsynth: {
      base: "border-emerald-400/50 bg-emerald-500/20",
      hover: "border-emerald-300 bg-emerald-500/25",
    },
    beatbox: { base: "border-amber-400/50 bg-amber-500/20", hover: "border-amber-300 bg-amber-500/25" },
    fmsynth: { base: "border-violet-400/50 bg-violet-500/20", hover: "border-violet-300 bg-violet-500/25" },
    bassline: { base: "border-rose-400/50 bg-rose-500/20", hover: "border-rose-300 bg-rose-500/25" },
  };
  const variant = variants[type] ?? { base: "border-slate-800 bg-slate-950/60", hover: "border-cyan-400 bg-cyan-500/10" };
  return [base, isDragOver ? variant.hover : variant.base].join(" ");
}

export function MachineRack() {
  const {
    machines,
    addMachine,
    removeMachine,
    cloneMachine,
    moveMachine,
    toggleMute,
    toggleSolo,
    renameMachine,
  } = useRackStore();
  const definitions = useMemo(() => listMachineDefinitions(), []);
  const [selectedType, setSelectedType] = useState<MachineType>(
    definitions[0]?.type ?? "subsynth",
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    const hasSolo = machines.some((machine) => machine.solo);
    machines.forEach((machine) => {
      const effectiveMuted = machine.muted || (hasSolo && !machine.solo);
      applyMachineOutputLevel(machine.type, machine.id, effectiveMuted ? 0 : 1);
    });
  }, [machines]);

  const maxMachines = getMaxMachines();
  const canAddSelected = canAddMachine(selectedType, machines);

  const handleAdd = () => {
    if (!canAddSelected) return;
    addMachine(selectedType);
  };

  const handleDragStart = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    setDraggingId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
    if (sourceId && sourceId !== id) {
      moveMachine(sourceId, id);
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Machine Rack</p>
            <h2 className="text-xl font-semibold text-slate-100">Rack System</h2>
          </div>
          <div className="text-xs text-slate-500">
            {machines.length} / {maxMachines} slots filled
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Add Machine</label>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as MachineType)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
          >
            {definitions.map((definition) => (
              <option key={definition.type} value={definition.type}>
                {definition.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAddSelected}
            className={
              "rounded-full px-5 py-2 text-sm font-semibold transition " +
              (canAddSelected
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                : "cursor-not-allowed bg-slate-800 text-slate-500")
            }
          >
            Add to Rack
          </button>
          {!canAddSelected && (
            <span className="text-xs text-slate-500">Slot limit or instance limit reached.</span>
          )}
        </div>

        <div className="space-y-4">
          {machines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-500">
              The rack is empty. Add a machine to get started.
            </div>
          ) : (
            machines.map((machine) => (
              <div
                key={machine.id}
                draggable
                onDragStart={handleDragStart(machine.id)}
                onDragOver={handleDragOver(machine.id)}
                onDrop={handleDrop(machine.id)}
                onDragEnd={handleDragEnd}
                className={getMachineCardClasses(machine.type, dragOverId === machine.id)}
              >
                <MachineRow
                  machine={machine}
                  onMute={() => toggleMute(machine.id)}
                  onSolo={() => toggleSolo(machine.id)}
                  onRemove={() => removeMachine(machine.id)}
                  onClone={() => cloneMachine(machine.id)}
                  onRename={(name) => renameMachine(machine.id, name)}
                  canClone={canAddMachine(machine.type, machines)}
                />
                {machine.type === "subsynth" && (
                  <div className="mt-4">
                    <SubSynth embedded />
                  </div>
                )}
                {machine.type === "pcmsynth" && (
                  <div className="mt-4">
                    <PCMSynth embedded />
                  </div>
                )}
                {machine.type === "beatbox" && (
                  <div className="mt-4">
                    <BeatBox embedded />
                  </div>
                )}
                {machine.type === "fmsynth" && (
                  <div className="mt-4">
                    <FMSynth embedded />
                  </div>
                )}
                {machine.type === "bassline" && (
                  <div className="mt-4">
                    <BassLine embedded />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MachineRow({
  machine,
  onMute,
  onSolo,
  onRemove,
  onClone,
  onRename,
  canClone,
}: {
  machine: MachineState;
  onMute: () => void;
  onSolo: () => void;
  onRemove: () => void;
  onClone: () => void;
  onRename: (name: string) => void;
  canClone: boolean;
}) {
  const [localName, setLocalName] = useState(machine.name);

  useEffect(() => {
    setLocalName(machine.name);
  }, [machine.name]);

  const handleBlur = () => {
    onRename(localName);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-slate-800 px-3 py-1 text-[0.6rem] font-semibold text-slate-500">
          {formatBadge(machine.type)}
        </div>
        <input
          value={localName}
          onChange={(event) => setLocalName(event.target.value)}
          onBlur={handleBlur}
          className="w-48 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMute}
          className={
            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
            (machine.muted
              ? "border-rose-400 text-rose-200"
              : "border-slate-700 text-slate-200 hover:border-rose-300")
          }
        >
          Mute
        </button>
        <button
          type="button"
          onClick={onSolo}
          className={
            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
            (machine.solo
              ? "border-emerald-400 text-emerald-200"
              : "border-slate-700 text-slate-200 hover:border-emerald-300")
          }
        >
          Solo
        </button>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClone}
          disabled={!canClone}
          className={
            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition " +
            (canClone
              ? "border-slate-700 text-slate-200 hover:border-cyan-400"
              : "cursor-not-allowed border-slate-800 text-slate-600")
          }
        >
          Clone
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-rose-400"
        >
          Remove
        </button>
        <div className="cursor-move select-none rounded-full border border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Drag
        </div>
      </div>
    </div>
  );
}
