import { act, render, screen } from "@testing-library/react";

import { TempoDisplay } from "@/app/_components/TempoDisplay";
import { useTransportStore } from "@/store/useTransportStore";

describe("TempoDisplay", () => {
  beforeEach(() => {
    useTransportStore.setState({
      bpm: 120,
      timeSignature: [4, 4] as [number, number],
      swing: 0,
      humanizeMs: 0,
      grooveTemplate: "Straight",
    });
  });

  it("renders current BPM", () => {
    render(<TempoDisplay />);
    expect(screen.getByText(/120 BPM/)).toBeInTheDocument();
  });

  it("renders time signature", () => {
    render(<TempoDisplay />);
    expect(screen.getByText(/4\/4/)).toBeInTheDocument();
  });

  it("renders groove template", () => {
    render(<TempoDisplay />);
    expect(screen.getByText(/Straight/)).toBeInTheDocument();
  });

  it("renders swing percentage", () => {
    render(<TempoDisplay />);
    expect(screen.getByText(/Swing 0%/)).toBeInTheDocument();
  });

  it("renders humanize value", () => {
    render(<TempoDisplay />);
    expect(screen.getByText(/Humanize 0ms/)).toBeInTheDocument();
  });

  it("updates when store changes", () => {
    render(<TempoDisplay />);
    act(() => {
      useTransportStore.setState({ bpm: 140 });
    });
    expect(screen.getByText(/140 BPM/)).toBeInTheDocument();
  });
});
