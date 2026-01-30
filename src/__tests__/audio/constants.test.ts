import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE, MASTER_LIMITER_THRESHOLD_DB } from "@/audio/constants";

describe("audio/constants", () => {
  it("exports a default BPM of 120", () => {
    expect(DEFAULT_BPM).toBe(120);
  });

  it("exports a default time signature of 4/4", () => {
    expect(DEFAULT_TIME_SIGNATURE).toEqual([4, 4]);
  });

  it("exports a master limiter threshold of -1 dB", () => {
    expect(MASTER_LIMITER_THRESHOLD_DB).toBe(-1);
  });
});
