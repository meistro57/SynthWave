import * as Tone from "tone";

import { getEffectDefinition } from "./registry";
import type { EffectSlotState, EffectType } from "./types";

export type EffectSlot = {
  state: EffectSlotState;
  node: Tone.ToneAudioNode | null;
  dry: Tone.Gain;
  wet: Tone.Gain;
  mix: Tone.Gain;
};

export class EffectChain {
  readonly input: Tone.Gain;
  readonly output: Tone.Gain;
  readonly slots: EffectSlot[];

  constructor(slotCount: number) {
    this.input = new Tone.Gain(1);
    this.output = new Tone.Gain(1);
    this.slots = Array.from({ length: slotCount }, () => ({
      state: { type: null, bypass: false, params: {} },
      node: null,
      dry: new Tone.Gain(1),
      wet: new Tone.Gain(0),
      mix: new Tone.Gain(1),
    }));

    this.rebuild();
  }

  setSlotEffect(index: number, type: EffectType | null) {
    const slot = this.slots[index];
    if (!slot) return;
    if (slot.node) {
      slot.node.dispose();
      slot.node = null;
    }
    slot.state.type = type;
    slot.state.params = {};
    if (type) {
      const definition = getEffectDefinition(type);
      slot.node = definition.create();
      slot.state.params = { ...definition.defaultParams };
      definition.apply(slot.node, slot.state.params);
      slot.state.bypass = false;
    } else {
      slot.state.bypass = true;
    }
    this.rebuild();
  }

  setSlotBypass(index: number, bypass: boolean) {
    const slot = this.slots[index];
    if (!slot) return;
    slot.state.bypass = bypass;
    this.applySlotMix(slot);
  }

  updateSlotParams(index: number, params: Record<string, number>) {
    const slot = this.slots[index];
    if (!slot || !slot.node || !slot.state.type) return;
    slot.state.params = { ...slot.state.params, ...params };
    const definition = getEffectDefinition(slot.state.type);
    definition.apply(slot.node, slot.state.params);
  }

  private applySlotMix(slot: EffectSlot) {
    if (!slot.state.type || slot.state.bypass) {
      slot.dry.gain.value = 1;
      slot.wet.gain.value = 0;
    } else {
      slot.dry.gain.value = 0;
      slot.wet.gain.value = 1;
    }
  }

  rebuild() {
    this.input.disconnect();
    this.slots.forEach((slot) => {
      slot.dry.disconnect();
      slot.wet.disconnect();
      slot.mix.disconnect();
      slot.node?.disconnect();
    });

    let current: Tone.ToneAudioNode = this.input;
    this.slots.forEach((slot) => {
      this.applySlotMix(slot);
      current.connect(slot.dry);
      if (slot.node) {
        current.connect(slot.node);
        slot.node.connect(slot.wet);
      }
      slot.dry.connect(slot.mix);
      slot.wet.connect(slot.mix);
      current = slot.mix;
    });
    current.connect(this.output);
  }
}
