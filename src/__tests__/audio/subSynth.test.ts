import {
  disposeSubSynth,
  setSubSynthOutputGain,
  setSubSynthPan,
  updateSubSynth,
} from "@/audio/instruments/subSynth";

describe("audio/instruments/subSynth", () => {
  afterEach(() => {
    disposeSubSynth();
  });

  describe("updateSubSynth", () => {
    it("stores pending parameters without throwing", () => {
      expect(() =>
        updateSubSynth({
          oscillator: "sawtooth",
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.6 },
          filter: { frequency: 1200, resonance: 0.8 },
        }),
      ).not.toThrow();
    });

    it("accepts different oscillator types", () => {
      const types = ["sawtooth", "square", "triangle", "sine"] as const;
      for (const type of types) {
        expect(() =>
          updateSubSynth({
            oscillator: type,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
            filter: { frequency: 1000, resonance: 1 },
          }),
        ).not.toThrow();
      }
    });
  });

  describe("setSubSynthPan", () => {
    it("accepts values within -1 to 1 range without throwing", () => {
      expect(() => setSubSynthPan(0)).not.toThrow();
      expect(() => setSubSynthPan(-1)).not.toThrow();
      expect(() => setSubSynthPan(1)).not.toThrow();
    });

    it("clamps out-of-range values without throwing", () => {
      expect(() => setSubSynthPan(-5)).not.toThrow();
      expect(() => setSubSynthPan(5)).not.toThrow();
    });
  });

  describe("setSubSynthOutputGain", () => {
    it("accepts values within 0 to 1 range without throwing", () => {
      expect(() => setSubSynthOutputGain(0)).not.toThrow();
      expect(() => setSubSynthOutputGain(0.5)).not.toThrow();
      expect(() => setSubSynthOutputGain(1)).not.toThrow();
    });

    it("clamps out-of-range values without throwing", () => {
      expect(() => setSubSynthOutputGain(-1)).not.toThrow();
      expect(() => setSubSynthOutputGain(2)).not.toThrow();
    });
  });

  describe("disposeSubSynth", () => {
    it("can be called multiple times safely", () => {
      expect(() => {
        disposeSubSynth();
        disposeSubSynth();
        disposeSubSynth();
      }).not.toThrow();
    });
  });
});
