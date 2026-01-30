import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TransportControls } from "@/app/_components/TransportControls";
import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from "@/audio/constants";
import { useTransportStore } from "@/store/useTransportStore";

describe("TransportControls", () => {
  beforeEach(() => {
    useTransportStore.setState({
      bpm: DEFAULT_BPM,
      timeSignature: DEFAULT_TIME_SIGNATURE,
      isPlaying: false,
      swing: 0,
      humanizeMs: 0,
      grooveTemplate: "Straight",
    });
  });

  it("renders the Transport heading", () => {
    render(<TransportControls />);
    expect(screen.getByText("Tempo & Meter")).toBeInTheDocument();
  });

  it("renders BPM input with default value", () => {
    render(<TransportControls />);
    const bpmInput = screen.getByDisplayValue("120");
    expect(bpmInput).toBeInTheDocument();
  });

  it("renders time signature selector", () => {
    render(<TransportControls />);
    expect(screen.getByDisplayValue("4/4")).toBeInTheDocument();
  });

  it("renders Start and Stop buttons", () => {
    render(<TransportControls />);
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("shows stopped status initially", () => {
    render(<TransportControls />);
    expect(screen.getByText("Status: stopped")).toBeInTheDocument();
  });

  it("renders groove template selector", () => {
    render(<TransportControls />);
    expect(screen.getByDisplayValue("Straight")).toBeInTheDocument();
  });

  it("changes groove template on select", async () => {
    const user = userEvent.setup();
    render(<TransportControls />);

    const select = screen.getByDisplayValue("Straight");
    await user.selectOptions(select, "Light Swing");

    const state = useTransportStore.getState();
    expect(state.grooveTemplate).toBe("Light Swing");
    expect(state.swing).toBe(20);
  });

  it("renders swing slider", () => {
    render(<TransportControls />);
    expect(screen.getByText(/Swing \(0%\)/)).toBeInTheDocument();
  });

  it("renders humanize slider", () => {
    render(<TransportControls />);
    expect(screen.getByText(/Humanize \(0 ms\)/)).toBeInTheDocument();
  });
});
