import * as Tone from "tone";

import { connectSerial, routeToMaster } from "@/audio/routing";

const mockConnect = (Tone as unknown as { __mocks__: { mockConnect: jest.Mock } }).__mocks__
  .mockConnect;

describe("audio/routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("routeToMaster", () => {
    it("connects the given node to the master output", () => {
      const node = new Tone.Gain(1);
      routeToMaster(node);
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe("connectSerial", () => {
    it("connects nodes in series and returns input/output", () => {
      const a = new Tone.Gain(1);
      const b = new Tone.Gain(1);
      const c = new Tone.Gain(1);
      const result = connectSerial([a, b, c]);
      expect(result.input).toBe(a);
      expect(result.output).toBe(c);
    });

    it("throws if given empty array", () => {
      expect(() => connectSerial([])).toThrow("connectSerial requires at least one node");
    });

    it("handles a single node", () => {
      const a = new Tone.Gain(1);
      const result = connectSerial([a]);
      expect(result.input).toBe(a);
      expect(result.output).toBe(a);
    });
  });
});
