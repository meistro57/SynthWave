# SynthWave TODO (Phase 1 Kickoff)

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
