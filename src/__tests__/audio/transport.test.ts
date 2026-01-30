import * as Tone from "tone";

import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from "@/audio/constants";
import {
  initTransport,
  pauseTransport,
  setBpm,
  setTimeSignature,
  startTransport,
  stopTransport,
} from "@/audio/transport";

describe("audio/transport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Tone.Transport.bpm.value = 120;
    Tone.Transport.timeSignature = [4, 4];
  });

  describe("initTransport", () => {
    it("sets default BPM and time signature on Tone.Transport", () => {
      initTransport();
      expect(Tone.Transport.bpm.value).toBe(DEFAULT_BPM);
      expect(Tone.Transport.timeSignature).toEqual(DEFAULT_TIME_SIGNATURE);
    });
  });

  describe("setBpm", () => {
    it("sets the BPM on Tone.Transport", () => {
      setBpm(140);
      expect(Tone.Transport.bpm.value).toBe(140);
    });

    it("accepts boundary values", () => {
      setBpm(40);
      expect(Tone.Transport.bpm.value).toBe(40);
      setBpm(220);
      expect(Tone.Transport.bpm.value).toBe(220);
    });
  });

  describe("setTimeSignature", () => {
    it("sets the time signature on Tone.Transport", () => {
      setTimeSignature([3, 4]);
      expect(Tone.Transport.timeSignature).toEqual([3, 4]);
    });

    it("supports 6/8 time", () => {
      setTimeSignature([6, 8]);
      expect(Tone.Transport.timeSignature).toEqual([6, 8]);
    });
  });

  describe("startTransport", () => {
    it("calls Tone.Transport.start()", () => {
      startTransport();
      expect(Tone.Transport.start).toHaveBeenCalledTimes(1);
    });
  });

  describe("stopTransport", () => {
    it("calls Tone.Transport.stop()", () => {
      stopTransport();
      expect(Tone.Transport.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("pauseTransport", () => {
    it("calls Tone.Transport.pause()", () => {
      pauseTransport();
      expect(Tone.Transport.pause).toHaveBeenCalledTimes(1);
    });
  });
});
