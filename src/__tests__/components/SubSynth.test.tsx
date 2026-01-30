import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubSynth } from "@/app/_components/SubSynth";

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

describe("SubSynth", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it("renders the SubSynth heading", () => {
    render(<SubSynth />);
    expect(screen.getByText("MonoSynth Prototype")).toBeInTheDocument();
  });

  it("renders the Initialize button", () => {
    render(<SubSynth />);
    expect(screen.getByRole("button", { name: "Initialize" })).toBeInTheDocument();
  });

  it("renders note buttons", () => {
    render(<SubSynth />);
    expect(screen.getByRole("button", { name: "C4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "D4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "E4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "G4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C5" })).toBeInTheDocument();
  });

  it("renders oscillator type selector", () => {
    render(<SubSynth />);
    expect(screen.getByDisplayValue("sawtooth")).toBeInTheDocument();
  });

  it("renders Hold button", () => {
    render(<SubSynth />);
    expect(screen.getByRole("button", { name: "Hold" })).toBeInTheDocument();
  });

  it("renders Save Preset button", () => {
    render(<SubSynth />);
    expect(screen.getByRole("button", { name: "Save Preset" })).toBeInTheDocument();
  });

  it("renders preset name input", () => {
    render(<SubSynth />);
    expect(screen.getByPlaceholderText("Midnight Bass")).toBeInTheDocument();
  });

  it("shows Initialize label before init", () => {
    render(<SubSynth />);
    expect(screen.getByRole("button", { name: "Initialize" })).toBeInTheDocument();
  });

  it("toggles hold mode", async () => {
    const user = userEvent.setup();
    render(<SubSynth />);

    const holdButton = screen.getByRole("button", { name: "Hold" });
    expect(screen.getByText("Hold mode off")).toBeInTheDocument();

    await user.click(holdButton);
    expect(screen.getByText("Hold mode active")).toBeInTheDocument();
  });

  it("changes oscillator type", async () => {
    const user = userEvent.setup();
    render(<SubSynth />);

    const select = screen.getByDisplayValue("sawtooth");
    await user.selectOptions(select, "square");
    expect(screen.getByDisplayValue("square")).toBeInTheDocument();
  });
});
