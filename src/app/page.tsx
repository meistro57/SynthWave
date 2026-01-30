import { AudioTest } from "./_components/AudioTest";
import { MachineRack } from "./_components/MachineRack";
import { MasterMeter } from "./_components/MasterMeter";
import { StepSequencer } from "./_components/StepSequencer";
import { TempoDisplay } from "./_components/TempoDisplay";
import { TransportControls } from "./_components/TransportControls";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SynthWave</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-100 md:text-5xl">
              Modular DAW foundation build
            </h1>
            <p className="max-w-2xl text-base text-slate-400">
              Phase 1 kickoff: audio engine boot, transport scaffolding, SubSynth prototype,
              and a 16-step sequencer UI.
            </p>
          </div>
          <TempoDisplay />
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <AudioTest />
          <TransportControls />
          <MasterMeter />
          <MachineRack />
        </div>

        <StepSequencer />
      </main>
    </div>
  );
}
