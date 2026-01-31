"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Responsive, WidthProvider, type Layout, type Layouts } from "react-grid-layout";

import { AudioTest } from "./AudioTest";
import { EffectsRack } from "./EffectsRack";
import { MachineRack } from "./MachineRack";
import { MasterMeter } from "./MasterMeter";
import { MasterSection } from "./MasterSection";
import { MixerDesk } from "./MixerDesk";
import { StepSequencer } from "./StepSequencer";
import { TempoDisplay } from "./TempoDisplay";
import { TransportControls } from "./TransportControls";

const ResponsiveGridLayout = WidthProvider(Responsive);

const LAYOUT_STORAGE_KEY = "synthwave.layout.v1";

const CARD_IDS = [
  "audioTest",
  "transport",
  "masterMeter",
  "machineRack",
  "stepSequencer",
  "effectsRack",
  "mixerDesk",
  "masterSection",
] as const;

type CardId = (typeof CARD_IDS)[number];

type CardDefinition = {
  id: CardId;
  title: string;
  component: JSX.Element;
};

const CARD_DEFINITIONS: CardDefinition[] = [
  { id: "audioTest", title: "Engine Smoke Test", component: <AudioTest /> },
  { id: "transport", title: "Transport", component: <TransportControls /> },
  { id: "masterMeter", title: "Master Meter", component: <MasterMeter /> },
  { id: "machineRack", title: "Machine Rack", component: <MachineRack /> },
  { id: "stepSequencer", title: "Step Sequencer", component: <StepSequencer /> },
  { id: "effectsRack", title: "Effects Rack", component: <EffectsRack /> },
  { id: "mixerDesk", title: "Mixer Desk", component: <MixerDesk /> },
  { id: "masterSection", title: "Master Section", component: <MasterSection /> },
];

function buildStackedLayout(cols: number): Layout[] {
  let cursorY = 0;
  return CARD_IDS.map((id) => {
    const height = id === "stepSequencer" ? 16 : 8;
    const entry: Layout = {
      i: id,
      x: 0,
      y: cursorY,
      w: cols,
      h: height,
      minW: Math.min(cols, id === "stepSequencer" ? 4 : 3),
      minH: id === "stepSequencer" ? 10 : 6,
    };
    cursorY += height;
    return entry;
  });
}

const DEFAULT_LAYOUTS: Layouts = {
  xl: [
    { i: "audioTest", x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "transport", x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "masterMeter", x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "machineRack", x: 6, y: 6, w: 6, h: 8, minW: 3, minH: 6 },
    { i: "stepSequencer", x: 0, y: 14, w: 12, h: 16, minW: 6, minH: 10 },
    { i: "effectsRack", x: 0, y: 30, w: 6, h: 10, minW: 3, minH: 8 },
    { i: "mixerDesk", x: 6, y: 30, w: 6, h: 12, minW: 3, minH: 10 },
    { i: "masterSection", x: 6, y: 42, w: 6, h: 10, minW: 3, minH: 8 },
  ],
  lg: [
    { i: "audioTest", x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "transport", x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "masterMeter", x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "machineRack", x: 6, y: 6, w: 6, h: 8, minW: 3, minH: 6 },
    { i: "stepSequencer", x: 0, y: 14, w: 12, h: 16, minW: 6, minH: 10 },
    { i: "effectsRack", x: 0, y: 30, w: 6, h: 10, minW: 3, minH: 8 },
    { i: "mixerDesk", x: 6, y: 30, w: 6, h: 12, minW: 3, minH: 10 },
    { i: "masterSection", x: 6, y: 42, w: 6, h: 10, minW: 3, minH: 8 },
  ],
  md: buildStackedLayout(8),
  sm: buildStackedLayout(6),
  xs: buildStackedLayout(4),
};

function normalizeLayouts(payload: unknown): Layouts | null {
  if (!payload || typeof payload !== "object") return null;
  if ("layouts" in payload && payload.layouts && typeof payload.layouts === "object") {
    return payload.layouts as Layouts;
  }
  const maybeLayouts = payload as Layouts;
  if (maybeLayouts.lg || maybeLayouts.md || maybeLayouts.sm || maybeLayouts.xs) {
    return maybeLayouts;
  }
  return null;
}

export function DashboardLayout() {
  const [layouts, setLayouts] = useState<Layouts>(DEFAULT_LAYOUTS);
  const [ready, setReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const persistLayouts = (nextLayouts: Layouts) => {
    if (typeof window === "undefined") return;
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      layouts: nextLayouts,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serialized);
    lastSavedRef.current = serialized;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) {
      setReady(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizeLayouts(parsed);
      if (normalized) {
        setLayouts(normalized);
      }
    } catch {
      setLayouts(DEFAULT_LAYOUTS);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistLayouts(layouts);
  }, [layouts, ready]);

  const handleExport = () => {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      layouts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "synthwave-layout.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalizeLayouts(parsed);
      if (normalized) {
        setLayouts(normalized);
      }
    } catch (error) {
      console.warn("Failed to import layout", error);
    }
  };

  const handleReset = () => {
    setLayouts(DEFAULT_LAYOUTS);
  };

  const cards = useMemo(() => {
    return CARD_DEFINITIONS.map((card) => (
      <div key={card.id} className="h-full min-h-0 rounded-2xl ring-2 ring-amber-400/40">
        <div className="group relative h-full min-h-0 overflow-hidden">
          <div className="card-drag-handle absolute inset-x-3 top-4 flex h-8 items-center justify-center rounded-full border-2 border-amber-400/90 bg-amber-400 text-xs font-bold uppercase tracking-[0.25em] text-slate-900">
            {card.title}
          </div>
          <div className="theme-scrollbar h-full min-h-0 overflow-auto pt-14">
            {card.component}
          </div>
        </div>
      </div>
    ));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-10 px-6 py-16">
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
        <div className="flex flex-col items-end gap-4">
          <TempoDisplay />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500"
            >
              Export Layout
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500"
            >
              Import Layout
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500"
            >
              Reset Layout
            </button>
          </div>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void handleImport(file);
          event.currentTarget.value = "";
        }}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ xl: 1536, lg: 1200, md: 900, sm: 640, xs: 0 }}
        cols={{ xl: 12, lg: 12, md: 8, sm: 6, xs: 4 }}
        rowHeight={24}
        margin={[24, 24]}
        containerPadding={[0, 0]}
        draggableHandle=".card-drag-handle"
        resizeHandles={["n", "e", "s", "w"]}
        compactType="vertical"
        onLayoutChange={(_layout, nextLayouts) => {
          setLayouts(nextLayouts);
          if (ready) persistLayouts(nextLayouts);
        }}
        onDragStop={(_layout, _oldItem, _newItem, _placeholder, nextLayouts) => {
          if (ready) persistLayouts(nextLayouts);
        }}
        onResizeStop={(_layout, _oldItem, _newItem, _placeholder, nextLayouts) => {
          if (ready) persistLayouts(nextLayouts);
        }}
      >
        {cards}
      </ResponsiveGridLayout>
    </div>
  );
}
