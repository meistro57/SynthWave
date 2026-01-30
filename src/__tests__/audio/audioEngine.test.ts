import * as Tone from "tone";

import {
  getDelaySend,
  getMasterMeter,
  getMasterOutput,
  getReverbSend,
  initAudioEngine,
  isAudioInitialized,
  setDelaySendLevel,
  setReverbSendLevel,
} from "@/audio/audioEngine";

// Access the mock start function
const mockToneStart = (Tone as unknown as { __mocks__: { mockToneStart: jest.Mock } }).__mocks__
  .mockToneStart;

describe("audio/audioEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initAudioEngine", () => {
    it("calls Tone.start() to resume audio context", async () => {
      await initAudioEngine();
      expect(mockToneStart).toHaveBeenCalled();
    });
  });

  describe("getMasterOutput", () => {
    it("returns a Gain node", () => {
      const output = getMasterOutput();
      expect(output).toBeDefined();
      expect(output).toHaveProperty("connect");
    });
  });

  describe("getDelaySend", () => {
    it("returns a Gain node for delay send", () => {
      const send = getDelaySend();
      expect(send).toBeDefined();
      expect(send).toHaveProperty("gain");
    });
  });

  describe("getReverbSend", () => {
    it("returns a Gain node for reverb send", () => {
      const send = getReverbSend();
      expect(send).toBeDefined();
      expect(send).toHaveProperty("gain");
    });
  });

  describe("setDelaySendLevel", () => {
    it("sets the delay send gain value", () => {
      setDelaySendLevel(0.5);
      const send = getDelaySend();
      expect(send.gain.value).toBe(0.5);
    });

    it("clamps values to 0-1 range", () => {
      setDelaySendLevel(-0.5);
      expect(getDelaySend().gain.value).toBe(0);

      setDelaySendLevel(1.5);
      expect(getDelaySend().gain.value).toBe(1);
    });
  });

  describe("setReverbSendLevel", () => {
    it("sets the reverb send gain value", () => {
      setReverbSendLevel(0.7);
      const send = getReverbSend();
      expect(send.gain.value).toBe(0.7);
    });

    it("clamps values to 0-1 range", () => {
      setReverbSendLevel(-1);
      expect(getReverbSend().gain.value).toBe(0);

      setReverbSendLevel(2);
      expect(getReverbSend().gain.value).toBe(1);
    });
  });

  describe("getMasterMeter", () => {
    it("returns a Meter node", () => {
      const meter = getMasterMeter();
      expect(meter).toBeDefined();
      expect(meter).toHaveProperty("getValue");
    });
  });

  describe("isAudioInitialized", () => {
    it("returns a boolean", () => {
      const result = isAudioInitialized();
      expect(typeof result).toBe("boolean");
    });
  });
});
