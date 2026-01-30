import { render, screen } from "@testing-library/react";

import { MasterMeter } from "@/app/_components/MasterMeter";

describe("MasterMeter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the Master Output heading", () => {
    render(<MasterMeter />);
    expect(screen.getByText("Master Output")).toBeInTheDocument();
  });

  it("renders the Metering label", () => {
    render(<MasterMeter />);
    expect(screen.getByText("Metering")).toBeInTheDocument();
  });

  it("renders Level label", () => {
    render(<MasterMeter />);
    expect(screen.getByText("Level")).toBeInTheDocument();
  });

  it("renders a dB value display", () => {
    render(<MasterMeter />);
    // Initial level or mock level - the component renders a dB value
    expect(screen.getByText(/dB/)).toBeInTheDocument();
  });
});
