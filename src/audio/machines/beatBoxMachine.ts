import { disposeBeatBox, initBeatBox, setBeatBoxOutputGain } from "@/audio/instruments/beatBox";
import { Machine } from "./baseMachine";

export class BeatBoxMachine extends Machine {
  constructor(id: string, name: string) {
    super(id, "beatbox", name);
  }

  async init() {
    await initBeatBox();
  }

  dispose() {
    disposeBeatBox();
  }

  setOutputLevel(level: number) {
    setBeatBoxOutputGain(level);
  }
}
