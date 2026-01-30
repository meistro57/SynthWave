# SynthWave TODO

## Testing Infrastructure
- [x] Fix build: replace Google Fonts with system fonts for offline/CI compatibility
- [x] Fix TypeScript error in SubSynth oscillator type
- [x] Fix MasterMeter SSR issue (lazy init via useEffect)
- [x] Install testing dependencies (Jest, Testing Library, ts-jest)
- [x] Configure Jest for Next.js + TypeScript (jest.config.ts)
- [x] Create Tone.js mock for test environment
- [x] Write unit tests for audio constants
- [x] Write unit tests for transport module
- [x] Write unit tests for audio engine
- [x] Write unit tests for audio routing
- [x] Write unit tests for SubSynth instrument
- [x] Write unit tests for transport store
- [x] Write unit tests for sequencer store
- [x] Write component tests for TempoDisplay
- [x] Write component tests for AudioTest
- [x] Write component tests for TransportControls
- [x] Write component tests for MasterMeter
- [x] Write component tests for SubSynth
- [x] Write component tests for StepSequencer
- [x] All 148 tests passing across 13 test suites

## Phase 1 Kickoff (Complete)

## Immediate
- [x] Confirm repo structure and package manager (npm)
- [x] Initialize Next.js 15 + TypeScript app
- [x] Verify Tailwind CSS setup
- [x] Initialize shadcn/ui
- [x] Configure Zustand store scaffolding
- [x] Install Tone.js and validate Web Audio playback (simple oscillator test)
- [x] Set up linting/formatting (ESLint, TS strict)
- [x] Add basic app shell and dev server smoke test

## Next
- [x] Add audio routing utilities and master metering
- [x] Add basic transport UI (tempo + time signature controls)
- [x] Build SubSynth MVP (MonoSynth wrapper + basic UI controls)
- [x] Add 16-step sequencer grid UI (state + UI only)
- [x] Improve audio engine (master chain + meter smoothing + tempo display)
- [x] Wire step sequencer into SubSynth playback (Tone.Transport schedule)
- [x] Add SubSynth preset save/load (localStorage)
- [x] Add sequencer data model + transport scheduling
- [x] Add sequencer velocity + accent UI
- [x] Add sequencer pattern save/load (localStorage)
- [x] Add QWERTY keyboard input for SubSynth
- [x] Add sequencer copy/paste + randomize tools
- [x] Add click-drag velocity editing
- [x] Add hold/sustain mode for keyboard input
- [x] Add velocity tooltips + value display
- [x] Add per-step probability controls
- [x] Add pattern A/B/C/D slots

## Extended
- [x] Add transport swing control
- [x] Add transport humanize control
- [x] Add per-step gate length editing
- [x] Add gate visual indicator in grid
- [x] Add pattern rename/delete actions
- [x] Add randomize density control
- [x] Add sequencer step count control (16/32)
- [x] Add pattern export to clipboard/textarea
- [x] Add pattern import from JSON
- [x] Add gate edit mode toggle
- [x] Add per-step ratchet/retrigger
- [x] Add row mute/solo for sequencer notes
- [x] Persist A/B/C/D slots to localStorage
- [x] Persist row mute/solo and edit mode settings
- [x] Add per-row volume sliders
- [x] Add pattern bank switcher with auto-play toggles
- [x] Persist randomize density + selected step count
- [x] Add visual legend for edit modes
- [x] Add per-row pitch transpose (±12 semitones)
- [x] Add per-row pan controls
- [x] Add per-step gate length display overlay (numeric)
- [x] Add velocity/probability/gate/ratchet quick presets
- [x] Add per-row FX sends (delay/reverb)
- [x] Add pattern library tagging + search
- [x] Add groove templates (swing/humanize presets)
