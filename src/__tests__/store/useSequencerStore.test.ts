import {
  SEQUENCER_NOTES,
  useSequencerStore,
} from "@/store/useSequencerStore";

const ROWS = SEQUENCER_NOTES.length;
const DEFAULT_STEPS = 16;

function resetStore() {
  useSequencerStore.setState({
    steps: DEFAULT_STEPS,
    notes: [...SEQUENCER_NOTES],
    grid: Array.from({ length: ROWS }, () => Array.from({ length: DEFAULT_STEPS }, () => 0)),
    probability: Array.from({ length: ROWS }, () => Array.from({ length: DEFAULT_STEPS }, () => 1)),
    gate: Array.from({ length: ROWS }, () => Array.from({ length: DEFAULT_STEPS }, () => 1)),
    ratchet: Array.from({ length: ROWS }, () => Array.from({ length: DEFAULT_STEPS }, () => 1)),
    resolution: "16n",
    rowMutes: Array.from({ length: ROWS }, () => false),
    rowSolos: Array.from({ length: ROWS }, () => false),
    rowVolumes: Array.from({ length: ROWS }, () => 1),
    rowTransposes: Array.from({ length: ROWS }, () => 0),
    rowPans: Array.from({ length: ROWS }, () => 0),
    rowDelaySends: Array.from({ length: ROWS }, () => 0.2),
    rowReverbSends: Array.from({ length: ROWS }, () => 0.2),
    currentSlot: "A",
    slots: { A: null, B: null, C: null, D: null },
    slotAuto: { A: false, B: false, C: false, D: false },
  });
}

describe("useSequencerStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("initial state", () => {
    it("has 16 notes", () => {
      expect(useSequencerStore.getState().notes).toHaveLength(ROWS);
    });

    it("starts with 16 steps", () => {
      expect(useSequencerStore.getState().steps).toBe(16);
    });

    it("starts with empty grid (all zeros)", () => {
      const { grid } = useSequencerStore.getState();
      expect(grid).toHaveLength(ROWS);
      expect(grid[0]).toHaveLength(DEFAULT_STEPS);
      for (const row of grid) {
        for (const cell of row) {
          expect(cell).toBe(0);
        }
      }
    });

    it("starts with default probability of 1", () => {
      const { probability } = useSequencerStore.getState();
      for (const row of probability) {
        for (const cell of row) {
          expect(cell).toBe(1);
        }
      }
    });

    it("starts with 16n resolution", () => {
      expect(useSequencerStore.getState().resolution).toBe("16n");
    });

    it("starts with all rows unmuted", () => {
      const { rowMutes } = useSequencerStore.getState();
      expect(rowMutes.every((m) => m === false)).toBe(true);
    });

    it("starts with all rows unsoloed", () => {
      const { rowSolos } = useSequencerStore.getState();
      expect(rowSolos.every((s) => s === false)).toBe(true);
    });

    it("starts on slot A", () => {
      expect(useSequencerStore.getState().currentSlot).toBe("A");
    });
  });

  describe("toggleCell", () => {
    it("toggles a cell on with default velocity 0.7", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      expect(useSequencerStore.getState().grid[0][0]).toBe(0.7);
    });

    it("toggles a cell off if already active", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      expect(useSequencerStore.getState().grid[0][0]).toBe(0.7);

      useSequencerStore.getState().toggleCell(0, 0);
      expect(useSequencerStore.getState().grid[0][0]).toBe(0);
    });

    it("accepts a custom velocity", () => {
      useSequencerStore.getState().toggleCell(3, 5, 1.0);
      expect(useSequencerStore.getState().grid[3][5]).toBe(1.0);
    });
  });

  describe("setVelocity", () => {
    it("sets velocity for a specific cell", () => {
      useSequencerStore.getState().setVelocity(2, 3, 0.85);
      expect(useSequencerStore.getState().grid[2][3]).toBe(0.85);
    });

    it("clamps velocity to 0-1 range", () => {
      useSequencerStore.getState().setVelocity(0, 0, 1.5);
      expect(useSequencerStore.getState().grid[0][0]).toBe(1);

      useSequencerStore.getState().setVelocity(0, 0, -0.5);
      expect(useSequencerStore.getState().grid[0][0]).toBe(0);
    });
  });

  describe("setProbability", () => {
    it("sets probability for a specific cell", () => {
      useSequencerStore.getState().setProbability(0, 0, 0.5);
      expect(useSequencerStore.getState().probability[0][0]).toBe(0.5);
    });

    it("clamps probability to 0-1 range", () => {
      useSequencerStore.getState().setProbability(0, 0, 2);
      expect(useSequencerStore.getState().probability[0][0]).toBe(1);

      useSequencerStore.getState().setProbability(0, 0, -1);
      expect(useSequencerStore.getState().probability[0][0]).toBe(0);
    });
  });

  describe("setGate", () => {
    it("sets gate for a specific cell", () => {
      useSequencerStore.getState().setGate(1, 1, 0.5);
      expect(useSequencerStore.getState().gate[1][1]).toBe(0.5);
    });

    it("clamps gate to 0.1-1 range", () => {
      useSequencerStore.getState().setGate(0, 0, 0);
      expect(useSequencerStore.getState().gate[0][0]).toBe(0.1);

      useSequencerStore.getState().setGate(0, 0, 2);
      expect(useSequencerStore.getState().gate[0][0]).toBe(1);
    });
  });

  describe("setRatchet", () => {
    it("sets ratchet for a specific cell", () => {
      useSequencerStore.getState().setRatchet(0, 0, 3);
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(3);
    });

    it("clamps ratchet to 1-4 range and rounds", () => {
      useSequencerStore.getState().setRatchet(0, 0, 0);
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(1);

      useSequencerStore.getState().setRatchet(0, 0, 5);
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(4);

      useSequencerStore.getState().setRatchet(0, 0, 2.7);
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(3);
    });
  });

  describe("toggleRowMute", () => {
    it("mutes an unmuted row", () => {
      useSequencerStore.getState().toggleRowMute(0);
      expect(useSequencerStore.getState().rowMutes[0]).toBe(true);
    });

    it("unmutes a muted row", () => {
      useSequencerStore.getState().toggleRowMute(0);
      useSequencerStore.getState().toggleRowMute(0);
      expect(useSequencerStore.getState().rowMutes[0]).toBe(false);
    });

    it("only affects the targeted row", () => {
      useSequencerStore.getState().toggleRowMute(5);
      const { rowMutes } = useSequencerStore.getState();
      expect(rowMutes[5]).toBe(true);
      expect(rowMutes[0]).toBe(false);
      expect(rowMutes[4]).toBe(false);
    });
  });

  describe("toggleRowSolo", () => {
    it("solos an unsoloed row", () => {
      useSequencerStore.getState().toggleRowSolo(3);
      expect(useSequencerStore.getState().rowSolos[3]).toBe(true);
    });

    it("unsolos a soloed row", () => {
      useSequencerStore.getState().toggleRowSolo(3);
      useSequencerStore.getState().toggleRowSolo(3);
      expect(useSequencerStore.getState().rowSolos[3]).toBe(false);
    });
  });

  describe("setResolution", () => {
    it("changes the step resolution", () => {
      useSequencerStore.getState().setResolution("8n");
      expect(useSequencerStore.getState().resolution).toBe("8n");
    });
  });

  describe("setSteps", () => {
    it("resizes the grid to 32 steps", () => {
      useSequencerStore.getState().setSteps(32);
      const { grid, steps } = useSequencerStore.getState();
      expect(steps).toBe(32);
      expect(grid[0]).toHaveLength(32);
    });

    it("preserves existing data when expanding", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      const velocityBefore = useSequencerStore.getState().grid[0][0];

      useSequencerStore.getState().setSteps(32);
      expect(useSequencerStore.getState().grid[0][0]).toBe(velocityBefore);
    });
  });

  describe("clear", () => {
    it("resets grid to all zeros", () => {
      // Set some cells
      useSequencerStore.getState().toggleCell(0, 0);
      useSequencerStore.getState().toggleCell(5, 10);
      expect(useSequencerStore.getState().grid[0][0]).toBeGreaterThan(0);

      // Clear
      useSequencerStore.getState().clear();
      const { grid } = useSequencerStore.getState();
      for (const row of grid) {
        for (const cell of row) {
          expect(cell).toBe(0);
        }
      }
    });

    it("resets probability to 1", () => {
      useSequencerStore.getState().setProbability(0, 0, 0.3);
      useSequencerStore.getState().clear();
      expect(useSequencerStore.getState().probability[0][0]).toBe(1);
    });

    it("resets gate to 1", () => {
      useSequencerStore.getState().setGate(0, 0, 0.5);
      useSequencerStore.getState().clear();
      expect(useSequencerStore.getState().gate[0][0]).toBe(1);
    });

    it("resets ratchet to 1", () => {
      useSequencerStore.getState().setRatchet(0, 0, 3);
      useSequencerStore.getState().clear();
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(1);
    });
  });

  describe("randomize", () => {
    it("fills grid with random values based on density", () => {
      useSequencerStore.getState().randomize(1.0); // 100% density
      const { grid } = useSequencerStore.getState();
      // With density=1, every cell should have a velocity > 0
      const activeCells = grid.flat().filter((v) => v > 0);
      expect(activeCells.length).toBe(ROWS * DEFAULT_STEPS);
    });

    it("respects density parameter", () => {
      useSequencerStore.getState().randomize(0);
      const { grid } = useSequencerStore.getState();
      // With density=0, no cells should be active
      const activeCells = grid.flat().filter((v) => v > 0);
      expect(activeCells.length).toBe(0);
    });
  });

  describe("loadPattern", () => {
    it("loads a pattern into the grid", () => {
      const pattern = {
        name: "Test",
        grid: Array.from({ length: ROWS }, () =>
          Array.from({ length: DEFAULT_STEPS }, () => 0.8),
        ),
        probability: Array.from({ length: ROWS }, () =>
          Array.from({ length: DEFAULT_STEPS }, () => 0.5),
        ),
        gate: Array.from({ length: ROWS }, () =>
          Array.from({ length: DEFAULT_STEPS }, () => 0.7),
        ),
        ratchet: Array.from({ length: ROWS }, () =>
          Array.from({ length: DEFAULT_STEPS }, () => 2),
        ),
        resolution: "8n" as const,
        steps: DEFAULT_STEPS,
      };

      useSequencerStore.getState().loadPattern(pattern);
      const state = useSequencerStore.getState();
      expect(state.grid[0][0]).toBe(0.8);
      expect(state.probability[0][0]).toBe(0.5);
      expect(state.gate[0][0]).toBe(0.7);
      expect(state.ratchet[0][0]).toBe(2);
      expect(state.resolution).toBe("8n");
    });
  });

  describe("slot management", () => {
    it("sets the current slot", () => {
      useSequencerStore.getState().setSlot("B");
      expect(useSequencerStore.getState().currentSlot).toBe("B");
    });

    it("saves current state to a slot", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      useSequencerStore.getState().saveToSlot("Test Slot");

      const { slots, currentSlot } = useSequencerStore.getState();
      expect(slots[currentSlot]).not.toBeNull();
      expect(slots[currentSlot]?.name).toBe("Test Slot");
      expect(slots[currentSlot]?.grid[0][0]).toBe(0.7);
    });

    it("toggles slot auto mode", () => {
      useSequencerStore.getState().toggleSlotAuto("A");
      expect(useSequencerStore.getState().slotAuto.A).toBe(true);

      useSequencerStore.getState().toggleSlotAuto("A");
      expect(useSequencerStore.getState().slotAuto.A).toBe(false);
    });
  });

  describe("row settings", () => {
    it("sets row volumes", () => {
      const volumes = Array.from({ length: ROWS }, () => 0.5);
      useSequencerStore.getState().setRowVolumes(volumes);
      expect(useSequencerStore.getState().rowVolumes).toEqual(volumes);
    });

    it("sets row transposes", () => {
      const transposes = Array.from({ length: ROWS }, () => 3);
      useSequencerStore.getState().setRowTransposes(transposes);
      expect(useSequencerStore.getState().rowTransposes).toEqual(transposes);
    });

    it("sets row pans", () => {
      const pans = Array.from({ length: ROWS }, () => -0.5);
      useSequencerStore.getState().setRowPans(pans);
      expect(useSequencerStore.getState().rowPans).toEqual(pans);
    });

    it("sets row delay sends", () => {
      const sends = Array.from({ length: ROWS }, () => 0.4);
      useSequencerStore.getState().setRowDelaySends(sends);
      expect(useSequencerStore.getState().rowDelaySends).toEqual(sends);
    });

    it("sets row reverb sends", () => {
      const sends = Array.from({ length: ROWS }, () => 0.6);
      useSequencerStore.getState().setRowReverbSends(sends);
      expect(useSequencerStore.getState().rowReverbSends).toEqual(sends);
    });
  });

  describe("applyQuickPreset", () => {
    it("applies velocity quick preset to active cells", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      useSequencerStore.getState().applyQuickPreset("velocity", "high");
      expect(useSequencerStore.getState().grid[0][0]).toBe(1);
    });

    it("does not activate empty cells when applying velocity preset", () => {
      useSequencerStore.getState().applyQuickPreset("velocity", "high");
      expect(useSequencerStore.getState().grid[0][0]).toBe(0);
    });

    it("applies probability quick preset to active cells", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      useSequencerStore.getState().applyQuickPreset("probability", "low");
      expect(useSequencerStore.getState().probability[0][0]).toBe(0.4);
    });

    it("applies gate quick preset to active cells", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      useSequencerStore.getState().applyQuickPreset("gate", "med");
      expect(useSequencerStore.getState().gate[0][0]).toBe(0.7);
    });

    it("applies ratchet quick preset to active cells", () => {
      useSequencerStore.getState().toggleCell(0, 0);
      useSequencerStore.getState().applyQuickPreset("ratchet", "low");
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(1);

      useSequencerStore.getState().applyQuickPreset("ratchet", "med");
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(2);

      useSequencerStore.getState().applyQuickPreset("ratchet", "high");
      expect(useSequencerStore.getState().ratchet[0][0]).toBe(4);
    });
  });

  describe("SEQUENCER_NOTES", () => {
    it("has 16 notes", () => {
      expect(SEQUENCER_NOTES).toHaveLength(16);
    });

    it("starts with C5 and ends with B2", () => {
      expect(SEQUENCER_NOTES[0]).toBe("C5");
      expect(SEQUENCER_NOTES[SEQUENCER_NOTES.length - 1]).toBe("B2");
    });
  });
});
