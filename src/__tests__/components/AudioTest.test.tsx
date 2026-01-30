import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AudioTest } from "@/app/_components/AudioTest";
import { useTransportStore } from "@/store/useTransportStore";

describe("AudioTest", () => {
  beforeEach(() => {
    useTransportStore.setState({ isPlaying: false });
  });

  it("renders the section heading", () => {
    render(<AudioTest />);
    expect(screen.getByText("Engine Smoke Test")).toBeInTheDocument();
  });

  it("renders the Initialize Audio button", () => {
    render(<AudioTest />);
    expect(screen.getByRole("button", { name: "Initialize Audio" })).toBeInTheDocument();
  });

  it("renders the Ping Oscillator button", () => {
    render(<AudioTest />);
    expect(screen.getByRole("button", { name: "Ping Oscillator" })).toBeInTheDocument();
  });

  it("renders Start Transport button when stopped", () => {
    render(<AudioTest />);
    expect(screen.getByRole("button", { name: "Start Transport" })).toBeInTheDocument();
  });

  it("renders Stop Transport button when playing", () => {
    useTransportStore.setState({ isPlaying: true });
    render(<AudioTest />);
    expect(screen.getByRole("button", { name: "Stop Transport" })).toBeInTheDocument();
  });

  it("shows idle status initially", () => {
    render(<AudioTest />);
    expect(screen.getByText("Status: idle")).toBeInTheDocument();
  });

  it("shows ready status after initialization", async () => {
    const user = userEvent.setup();
    render(<AudioTest />);

    await user.click(screen.getByRole("button", { name: "Initialize Audio" }));
    expect(screen.getByText("Status: ready")).toBeInTheDocument();
  });
});
