import { disposeBassLine, initBassLine, setBassLineOutputGain } from "@/audio/instruments/bassLine";
import { Machine } from "./baseMachine";

export class BassLineMachine extends Machine {
  constructor(id: string, name: string) {
    super(id, "bassline", name);
  }

  async init() {
    await initBassLine();
  }

  dispose() {
    disposeBassLine();
  }

  setOutputLevel(level: number) {
    setBassLineOutputGain(level);
  }
}
