import { disposeFMSynth, initFMSynth, setFMSynthOutputGain } from "@/audio/instruments/fmSynth";
import { Machine } from "./baseMachine";

export class FMSynthMachine extends Machine {
  constructor(id: string, name: string) {
    super(id, "fmsynth", name);
  }

  async init() {
    await initFMSynth();
  }

  dispose() {
    disposeFMSynth();
  }

  setOutputLevel(level: number) {
    setFMSynthOutputGain(level);
  }
}
