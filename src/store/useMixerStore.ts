import { create } from "zustand";

export type MixerChannelId = "subsynth" | "pcmsynth" | "beatbox" | "fmsynth" | "bassline";

export type MixerChannel = {
  id: MixerChannelId;
  name: string;
  color: string;
  volume: number;
  pan: number;
  width: number;
  mute: boolean;
  solo: boolean;
};

export type MixerState = {
  channels: MixerChannel[];
  automationArmed: boolean;
  setChannel: (id: MixerChannelId, patch: Partial<MixerChannel>) => void;
  toggleMute: (id: MixerChannelId) => void;
  toggleSolo: (id: MixerChannelId) => void;
  setChannels: (channels: MixerChannel[]) => void;
  setAutomationArmed: (armed: boolean) => void;
};

const DEFAULT_CHANNELS: MixerChannel[] = [
  {
    id: "subsynth",
    name: "SubSynth",
    color: "cyan",
    volume: 0.9,
    pan: 0,
    width: 0.5,
    mute: false,
    solo: false,
  },
  {
    id: "pcmsynth",
    name: "PCMSynth",
    color: "emerald",
    volume: 0.9,
    pan: 0,
    width: 0.5,
    mute: false,
    solo: false,
  },
  {
    id: "beatbox",
    name: "BeatBox",
    color: "amber",
    volume: 0.9,
    pan: 0,
    width: 0.6,
    mute: false,
    solo: false,
  },
  {
    id: "fmsynth",
    name: "FMSynth",
    color: "violet",
    volume: 0.9,
    pan: 0,
    width: 0.6,
    mute: false,
    solo: false,
  },
  {
    id: "bassline",
    name: "BassLine",
    color: "rose",
    volume: 0.9,
    pan: 0,
    width: 0.2,
    mute: false,
    solo: false,
  },
];

export const useMixerStore = create<MixerState>((set) => ({
  channels: DEFAULT_CHANNELS,
  automationArmed: false,
  setChannel: (id, patch) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === id ? { ...channel, ...patch } : channel,
      ),
    })),
  toggleMute: (id) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === id ? { ...channel, mute: !channel.mute } : channel,
      ),
    })),
  toggleSolo: (id) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === id ? { ...channel, solo: !channel.solo } : channel,
      ),
    })),
  setChannels: (channels) => set({ channels }),
  setAutomationArmed: (automationArmed) => set({ automationArmed }),
}));

export function getDefaultMixerChannels() {
  return DEFAULT_CHANNELS;
}
