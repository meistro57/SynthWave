import { disposePCMSynth, initPCMSynth, setPCMSynthOutputGain } from "@/audio/instruments/pcmSynth";
import { Machine } from "./baseMachine";

export class PCMSynthMachine extends Machine {
  constructor(id: string, name: string) {
    super(id, "pcmsynth", name);
  }

  async init() {
    await initPCMSynth();
  }

  dispose() {
    disposePCMSynth();
  }

  setOutputLevel(level: number) {
    setPCMSynthOutputGain(level);
  }
}
