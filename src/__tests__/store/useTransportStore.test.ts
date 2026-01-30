import * as Tone from "tone";

import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from "@/audio/constants";
import { useTransportStore } from "@/store/useTransportStore";

describe("useTransportStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    useTransportStore.setState({
      bpm: DEFAULT_BPM,
      timeSignature: DEFAULT_TIME_SIGNATURE,
      isPlaying: false,
      swing: 0,
      humanizeMs: 0,
      grooveTemplate: "Straight",
    });
  });

  describe("initial state", () => {
    it("has correct default values", () => {
      const state = useTransportStore.getState();
      expect(state.bpm).toBe(120);
      expect(state.timeSignature).toEqual([4, 4]);
      expect(state.isPlaying).toBe(false);
      expect(state.swing).toBe(0);
      expect(state.humanizeMs).toBe(0);
      expect(state.grooveTemplate).toBe("Straight");
    });
  });

  describe("setBpm", () => {
    it("updates BPM in store and on Tone.Transport", () => {
      useTransportStore.getState().setBpm(140);
      expect(useTransportStore.getState().bpm).toBe(140);
      expect(Tone.Transport.bpm.value).toBe(140);
    });
  });

  describe("setTimeSignature", () => {
    it("updates time signature in store and on Tone.Transport", () => {
      useTransportStore.getState().setTimeSignature([3, 4]);
      expect(useTransportStore.getState().timeSignature).toEqual([3, 4]);
      expect(Tone.Transport.timeSignature).toEqual([3, 4]);
    });
  });

  describe("setSwing", () => {
    it("updates swing and sets groove template to Custom", () => {
      useTransportStore.getState().setSwing(30);
      const state = useTransportStore.getState();
      expect(state.swing).toBe(30);
      expect(state.grooveTemplate).toBe("Custom");
    });

    it("clamps swing to 0-80 range", () => {
      useTransportStore.getState().setSwing(-10);
      expect(useTransportStore.getState().swing).toBe(0);

      useTransportStore.getState().setSwing(100);
      expect(useTransportStore.getState().swing).toBe(80);
    });
  });

  describe("setHumanizeMs", () => {
    it("updates humanize and sets groove template to Custom", () => {
      useTransportStore.getState().setHumanizeMs(15);
      const state = useTransportStore.getState();
      expect(state.humanizeMs).toBe(15);
      expect(state.grooveTemplate).toBe("Custom");
    });

    it("clamps humanize to 0-40 range", () => {
      useTransportStore.getState().setHumanizeMs(-5);
      expect(useTransportStore.getState().humanizeMs).toBe(0);

      useTransportStore.getState().setHumanizeMs(50);
      expect(useTransportStore.getState().humanizeMs).toBe(40);
    });
  });

  describe("setGrooveTemplate", () => {
    it("sets Straight with swing=0 and humanize=0", () => {
      useTransportStore.getState().setGrooveTemplate("Straight");
      const state = useTransportStore.getState();
      expect(state.grooveTemplate).toBe("Straight");
      expect(state.swing).toBe(0);
      expect(state.humanizeMs).toBe(0);
    });

    it("sets Light Swing with swing=20 and humanize=5", () => {
      useTransportStore.getState().setGrooveTemplate("Light Swing");
      const state = useTransportStore.getState();
      expect(state.grooveTemplate).toBe("Light Swing");
      expect(state.swing).toBe(20);
      expect(state.humanizeMs).toBe(5);
    });

    it("sets Heavy Swing with swing=55 and humanize=8", () => {
      useTransportStore.getState().setGrooveTemplate("Heavy Swing");
      const state = useTransportStore.getState();
      expect(state.grooveTemplate).toBe("Heavy Swing");
      expect(state.swing).toBe(55);
      expect(state.humanizeMs).toBe(8);
    });

    it("sets Shuffle with swing=65 and humanize=6", () => {
      useTransportStore.getState().setGrooveTemplate("Shuffle");
      const state = useTransportStore.getState();
      expect(state.grooveTemplate).toBe("Shuffle");
      expect(state.swing).toBe(65);
      expect(state.humanizeMs).toBe(6);
    });

    it("sets Triplet with swing=75 and humanize=10", () => {
      useTransportStore.getState().setGrooveTemplate("Triplet");
      const state = useTransportStore.getState();
      expect(state.grooveTemplate).toBe("Triplet");
      expect(state.swing).toBe(75);
      expect(state.humanizeMs).toBe(10);
    });

    it("sets Custom when unknown template given", () => {
      useTransportStore.getState().setGrooveTemplate("Custom");
      expect(useTransportStore.getState().grooveTemplate).toBe("Custom");
    });
  });

  describe("start", () => {
    it("starts transport and sets isPlaying to true", () => {
      useTransportStore.getState().start();
      expect(useTransportStore.getState().isPlaying).toBe(true);
      expect(Tone.Transport.start).toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("stops transport and sets isPlaying to false", () => {
      // First start
      useTransportStore.getState().start();
      expect(useTransportStore.getState().isPlaying).toBe(true);

      // Then stop
      useTransportStore.getState().stop();
      expect(useTransportStore.getState().isPlaying).toBe(false);
      expect(Tone.Transport.stop).toHaveBeenCalled();
    });
  });
});
