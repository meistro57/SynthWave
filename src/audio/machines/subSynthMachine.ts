import { disposeSubSynth, initSubSynth, setSubSynthOutputGain } from "@/audio/instruments/subSynth";
import { Machine } from "./baseMachine";

export class SubSynthMachine extends Machine {
  constructor(id: string, name: string) {
    super(id, "subsynth", name);
  }

  async init() {
    await initSubSynth();
  }

  dispose() {
    disposeSubSynth();
  }

  setOutputLevel(level: number) {
    setSubSynthOutputGain(level);
  }
}
