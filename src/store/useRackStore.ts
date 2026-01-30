import { create } from "zustand";

import { getMachineDefinition } from "@/audio/machines/registry";
import type { MachineState, MachineType } from "@/audio/machines/types";

const MAX_MACHINES = 14;

function createMachineId() {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis) {
    const cryptoApi = globalThis.crypto as Crypto | undefined;
    if (cryptoApi?.randomUUID) {
      return cryptoApi.randomUUID();
    }
  }
  return `machine_${Math.random().toString(36).slice(2, 10)}`;
}

function createMachineState(type: MachineType, nameOverride?: string): MachineState {
  const definition = getMachineDefinition(type);
  const id = createMachineId();
  return {
    id,
    type,
    name: nameOverride ?? definition.defaultName,
    muted: false,
    solo: false,
  };
}

export type RackState = {
  machines: MachineState[];
  addMachine: (type: MachineType) => void;
  removeMachine: (id: string) => void;
  cloneMachine: (id: string) => void;
  moveMachine: (fromId: string, toId: string) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  renameMachine: (id: string, name: string) => void;
};

export const useRackStore = create<RackState>((set, get) => ({
  machines: [createMachineState("subsynth")],
  addMachine: (type) =>
    set((state) => {
      if (state.machines.length >= MAX_MACHINES) return state;
      const definition = getMachineDefinition(type);
      const countForType = state.machines.filter((machine) => machine.type === type).length;
      if (definition.maxInstances && countForType >= definition.maxInstances) return state;

      const suffix = countForType > 0 ? ` ${countForType + 1}` : "";
      const nextMachine = createMachineState(type, `${definition.defaultName}${suffix}`);
      return { machines: [...state.machines, nextMachine] };
    }),
  removeMachine: (id) =>
    set((state) => ({ machines: state.machines.filter((machine) => machine.id !== id) })),
  cloneMachine: (id) =>
    set((state) => {
      if (state.machines.length >= MAX_MACHINES) return state;
      const source = state.machines.find((machine) => machine.id === id);
      if (!source) return state;

      const definition = getMachineDefinition(source.type);
      const countForType = state.machines.filter((machine) => machine.type === source.type).length;
      if (definition.maxInstances && countForType >= definition.maxInstances) return state;

      const copy = createMachineState(source.type, `${source.name} Copy`);
      return { machines: [...state.machines, copy] };
    }),
  moveMachine: (fromId, toId) =>
    set((state) => {
      if (fromId === toId) return state;
      const fromIndex = state.machines.findIndex((machine) => machine.id === fromId);
      const toIndex = state.machines.findIndex((machine) => machine.id === toId);
      if (fromIndex === -1 || toIndex === -1) return state;
      const next = state.machines.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { machines: next };
    }),
  toggleMute: (id) =>
    set((state) => ({
      machines: state.machines.map((machine) =>
        machine.id === id ? { ...machine, muted: !machine.muted } : machine,
      ),
    })),
  toggleSolo: (id) =>
    set((state) => ({
      machines: state.machines.map((machine) =>
        machine.id === id ? { ...machine, solo: !machine.solo } : machine,
      ),
    })),
  renameMachine: (id, name) =>
    set((state) => ({
      machines: state.machines.map((machine) =>
        machine.id === id ? { ...machine, name: name.trim() || machine.name } : machine,
      ),
    })),
}));

export function canAddMachine(type: MachineType, machines: MachineState[]) {
  if (machines.length >= MAX_MACHINES) return false;
  const definition = getMachineDefinition(type);
  const countForType = machines.filter((machine) => machine.type === type).length;
  if (definition.maxInstances && countForType >= definition.maxInstances) return false;
  return true;
}

export function getMaxMachines() {
  return MAX_MACHINES;
}
