"use client";

import { useEffect, useMemo, useState } from "react";

import { getMasterEffects } from "@/audio/audioEngine";
import { getMachineEffectChain } from "@/audio/effects/machineEffects";
import { listEffectDefinitions } from "@/audio/effects/registry";
import type { EffectSlotState, EffectType } from "@/audio/effects/types";
import type { MachineType } from "@/audio/machines/types";

const TARGETS: Array<{ id: "master" | MachineType; label: string }> = [
  { id: "master", label: "Master" },
  { id: "subsynth", label: "SubSynth" },
  { id: "pcmsynth", label: "PCMSynth" },
  { id: "beatbox", label: "BeatBox" },
  { id: "fmsynth", label: "FMSynth" },
  { id: "bassline", label: "BassLine" },
];

function storageKey(target: string) {
  return `synthwave.effects.${target}`;
}

function createDefaultSlots(slotCount: number): EffectSlotState[] {
  return Array.from({ length: slotCount }, () => ({ type: null, bypass: true, params: {} }));
}

export function EffectsRack() {
  const [target, setTarget] = useState<(typeof TARGETS)[number]["id"]>("master");
  const [slots, setSlots] = useState<EffectSlotState[]>(() => createDefaultSlots(2));

  const effectDefs = useMemo(() => listEffectDefinitions(), []);

  useEffect(() => {
    const chain = target === "master" ? getMasterEffects() : getMachineEffectChain(target);
    const defaultSlots = createDefaultSlots(chain.slots.length);
    setSlots(defaultSlots);

    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey(target));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as EffectSlotState[];
      if (parsed.length === chain.slots.length) {
        setSlots(parsed);
        parsed.forEach((slot, index) => {
          chain.setSlotEffect(index, slot.type);
          chain.setSlotBypass(index, slot.bypass);
          if (slot.type) {
            chain.updateSlotParams(index, slot.params);
          }
        });
      }
    } catch {
      // ignore
    }
  }, [target]);

  const handleSlotType = (index: number, type: EffectType | null) => {
    const chain = target === "master" ? getMasterEffects() : getMachineEffectChain(target);
    chain.setSlotEffect(index, type);
    setSlots((prev) => {
      const next = [...prev];
      const base = next[index] ?? { type: null, bypass: true, params: {} };
      next[index] = {
        ...base,
        type,
        bypass: type ? false : true,
        params: type
          ? effectDefs.find((def) => def.type === type)?.defaultParams ?? {}
          : {},
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(target), JSON.stringify(next));
      }
      return next;
    });
  };

  const handleBypass = (index: number) => {
    const chain = target === "master" ? getMasterEffects() : getMachineEffectChain(target);
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[index];
      if (!slot) return prev;
      const bypass = !slot.bypass;
      next[index] = { ...slot, bypass };
      chain.setSlotBypass(index, bypass);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(target), JSON.stringify(next));
      }
      return next;
    });
  };

  const handleParamChange = (index: number, key: string, value: number) => {
    const chain = target === "master" ? getMasterEffects() : getMachineEffectChain(target);
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[index];
      if (!slot) return prev;
      const params = { ...slot.params, [key]: value };
      next[index] = { ...slot, params };
      chain.updateSlotParams(index, { [key]: value });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(target), JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Effects Rack</p>
            <h2 className="text-xl font-semibold text-slate-100">Serial Effects</h2>
          </div>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value as typeof target)}
            className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200"
          >
            {TARGETS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {slots.map((slot, index) => {
            const definition = slot.type ? effectDefs.find((def) => def.type === slot.type) : null;
            return (
              <div key={`slot-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Slot {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => handleBypass(index)}
                    className={
                      "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
                      (slot.bypass
                        ? "border-slate-700 text-slate-400"
                        : "border-cyan-400 text-cyan-200")
                    }
                    disabled={!slot.type}
                  >
                    {slot.bypass ? "Bypassed" : "Active"}
                  </button>
                </div>
                <select
                  value={slot.type ?? ""}
                  onChange={(event) =>
                    handleSlotType(index, (event.target.value || null) as EffectType | null)
                  }
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">Empty</option>
                  {effectDefs.map((def) => (
                    <option key={def.type} value={def.type}>
                      {def.label}
                    </option>
                  ))}
                </select>

                {definition && (
                  <div className="mt-4 grid gap-3">
                    {definition.params.map((param) => (
                      <label key={param.key} className="space-y-2 text-xs text-slate-500">
                        {param.label}
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={slot.params[param.key] ?? definition.defaultParams[param.key]}
                          onChange={(event) =>
                            handleParamChange(index, param.key, Number(event.target.value))
                          }
                          className="w-full"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
