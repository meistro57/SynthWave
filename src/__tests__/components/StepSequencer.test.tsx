import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StepSequencer } from "@/app/_components/StepSequencer";
import { SEQUENCER_NOTES, useSequencerStore } from "@/store/useSequencerStore";
import { useTransportStore } from "@/store/useTransportStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const ROWS = SEQUENCER_NOTES.length;
const DEFAULT_STEPS = 16;

function resetStores() {
  useTransportStore.setState({
    bpm: 120,
    timeSignature: [4, 4] as [number, number],
    isPlaying: false,
    swing: 0,
    humanizeMs: 0,
    grooveTemplate: "Straight",
  });
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

describe("StepSequencer", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    resetStores();
  });

  it("renders the Sequencer heading", () => {
    render(<StepSequencer />);
    expect(screen.getByText("16-Step Grid")).toBeInTheDocument();
  });

  it("renders Clear button", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("renders Accent button", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Accent" })).toBeInTheDocument();
  });

  it("renders Randomize button", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Randomize" })).toBeInTheDocument();
  });

  it("renders Copy and Paste buttons", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paste" })).toBeInTheDocument();
  });

  it("renders edit mode buttons", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "velocity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "probability" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "gate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ratchet" })).toBeInTheDocument();
  });

  it("renders slot buttons A, B, C, D", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "D" })).toBeInTheDocument();
  });

  it("renders resolution selector", () => {
    render(<StepSequencer />);
    expect(screen.getByDisplayValue("16n")).toBeInTheDocument();
  });

  it("renders step count selector", () => {
    render(<StepSequencer />);
    expect(screen.getByDisplayValue("16 steps")).toBeInTheDocument();
  });

  it("renders Save Pattern button", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Save Pattern" })).toBeInTheDocument();
  });

  it("renders Export and Import buttons", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  });

  it("renders Save Slot button", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Save Slot" })).toBeInTheDocument();
  });

  it("renders Rename and Delete buttons", () => {
    render(<StepSequencer />);
    expect(screen.getByRole("button", { name: "Rename" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders density slider", () => {
    render(<StepSequencer />);
    expect(screen.getByText(/Density/)).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("renders note labels for all rows", () => {
    render(<StepSequencer />);
    expect(screen.getByText("C5")).toBeInTheDocument();
    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("B2")).toBeInTheDocument();
  });

  it("renders the grid cells as buttons", () => {
    render(<StepSequencer />);
    // 16 rows x 16 steps = 256 grid cells, plus all the control buttons
    const allButtons = screen.getAllByRole("button");
    // At least 256 grid buttons exist
    expect(allButtons.length).toBeGreaterThanOrEqual(256);
  });

  it("clears the grid when Clear is clicked", async () => {
    const user = userEvent.setup();
    // Set some cells
    useSequencerStore.getState().toggleCell(0, 0);
    expect(useSequencerStore.getState().grid[0][0]).toBe(0.7);

    render(<StepSequencer />);
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(useSequencerStore.getState().grid[0][0]).toBe(0);
  });

  it("changes resolution", async () => {
    const user = userEvent.setup();
    render(<StepSequencer />);

    const select = screen.getByDisplayValue("16n");
    await user.selectOptions(select, "8n");
    expect(useSequencerStore.getState().resolution).toBe("8n");
  });
});
