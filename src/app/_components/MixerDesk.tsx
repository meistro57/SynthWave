"use client";

import { useEffect, useMemo, useState } from "react";

import { setBassLineOutputGain, setBassLinePan } from "@/audio/instruments/bassLine";
import { setBeatBoxOutputGain, setBeatBoxPan } from "@/audio/instruments/beatBox";
import { setFMSynthOutputGain, setFMSynthPan } from "@/audio/instruments/fmSynth";
import { setPCMSynthOutputGain, setPCMSynthPan } from "@/audio/instruments/pcmSynth";
import { setSubSynthOutputGain, setSubSynthPan } from "@/audio/instruments/subSynth";
import { getMachineMeter, setMachineWidth } from "@/audio/effects/machineEffects";
import type { MachineType } from "@/audio/machines/types";
import { getDefaultMixerChannels, useMixerStore } from "@/store/useMixerStore";

const STORAGE_KEY = "synthwave.mixer.channels";

function useMeterLevel(type: MachineType) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let active = true;
    const meter = getMachineMeter(type);

    const tick = () => {
      if (!active) return;
      const raw = meter.getValue();
      const normalized = Array.isArray(raw) ? raw[0] : raw;
      const level = Math.max(0, Math.min(1, (normalized + 60) / 60));
      setValue(level);
      requestAnimationFrame(tick);
    };
    tick();

    return () => {
      active = false;
    };
  }, [type]);

  return value;
}

export function MixerDesk() {
  const {
    channels,
    automationArmed,
    setChannel,
    toggleMute,
    toggleSolo,
    setChannels,
    setAutomationArmed,
  } = useMixerStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setChannels(parsed);
      } else if (parsed && typeof parsed === "object") {
        setChannels(parsed.channels ?? getDefaultMixerChannels());
        if (typeof parsed.automationArmed === "boolean") {
          setAutomationArmed(parsed.automationArmed);
        }
      }
    } catch {
      setChannels(getDefaultMixerChannels());
    }
  }, [setChannels, setAutomationArmed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ channels, automationArmed }),
    );
  }, [channels, automationArmed]);

  const anySolo = useMemo(() => channels.some((channel) => channel.solo), [channels]);

  useEffect(() => {
    channels.forEach((channel) => {
      const effectiveMute = channel.mute || (anySolo && !channel.solo);
      const gain = effectiveMute ? 0 : channel.volume;
      const pan = channel.pan;
      setMachineWidth(channel.id, channel.width);

      if (channel.id === "subsynth") {
        setSubSynthOutputGain(gain);
        setSubSynthPan(pan);
      } else if (channel.id === "pcmsynth") {
        setPCMSynthOutputGain(gain);
        setPCMSynthPan(pan);
      } else if (channel.id === "beatbox") {
        setBeatBoxOutputGain(gain);
        setBeatBoxPan(pan);
      } else if (channel.id === "fmsynth") {
        setFMSynthOutputGain(gain);
        setFMSynthPan(pan);
      } else if (channel.id === "bassline") {
        setBassLineOutputGain(gain);
        setBassLinePan(pan);
      }
    });
  }, [channels, anySolo]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mixer Desk</p>
            <h2 className="text-xl font-semibold text-slate-100">Channel Strips</h2>
          </div>
          <button
            type="button"
            onClick={() => setAutomationArmed(!automationArmed)}
            className={
              "rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
              (automationArmed
                ? "border-emerald-400 text-emerald-200"
                : "border-slate-700 text-slate-300 hover:border-emerald-300")
            }
          >
            {automationArmed ? "Automation Armed" : "Automation Off"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {channels.map((channel) => (
            <MixerChannelStrip
              key={channel.id}
              channel={channel}
              onMute={() => toggleMute(channel.id)}
              onSolo={() => toggleSolo(channel.id)}
              onChange={(patch) => setChannel(channel.id, patch)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MixerChannelStrip({
  channel,
  onMute,
  onSolo,
  onChange,
}: {
  channel: ReturnType<typeof useMixerStore.getState>["channels"][number];
  onMute: () => void;
  onSolo: () => void;
  onChange: (patch: Partial<typeof channel>) => void;
}) {
  const level = useMeterLevel(channel.id);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{channel.name}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMute}
            className={
              "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
              (channel.mute
                ? "border-rose-400 text-rose-200"
                : "border-slate-700 text-slate-300 hover:border-rose-300")
            }
          >
            M
          </button>
          <button
            type="button"
            onClick={onSolo}
            className={
              "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition " +
              (channel.solo
                ? "border-amber-400 text-amber-200"
                : "border-slate-700 text-slate-300 hover:border-amber-300")
            }
          >
            S
          </button>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${Math.round(level * 100)}%`,
            backgroundColor: channel.color === "cyan"
              ? "#22d3ee"
              : channel.color === "emerald"
                ? "#34d399"
                : channel.color === "amber"
                  ? "#fbbf24"
                  : channel.color === "violet"
                    ? "#a78bfa"
                    : "#fb7185",
          }}
        />
      </div>

      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <label className="space-y-1">
          Name
          <input
            value={channel.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          />
        </label>
        <label className="space-y-1">
          Color
          <select
            value={channel.color}
            onChange={(event) => onChange({ color: event.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          >
            <option value="cyan">Cyan</option>
            <option value="emerald">Emerald</option>
            <option value="amber">Amber</option>
            <option value="violet">Violet</option>
            <option value="rose">Rose</option>
          </select>
        </label>
        <label className="space-y-1">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={channel.volume}
            onChange={(event) => onChange({ volume: Number(event.target.value) })}
            className="w-full"
          />
        </label>
        <label className="space-y-1">
          Pan
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={channel.pan}
            onChange={(event) => onChange({ pan: Number(event.target.value) })}
            className="w-full"
          />
        </label>
        <label className="space-y-1">
          Width
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={channel.width}
            onChange={(event) => onChange({ width: Number(event.target.value) })}
            className="w-full"
          />
        </label>
      </div>
    </div>
  );
}
