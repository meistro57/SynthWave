# SynthWave TODO

## Phase 1: Foundation & Proof of Concept (Complete)

### Testing Infrastructure
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

### 1.1 Project Setup
- [x] Confirm repo structure and package manager (npm)
- [x] Initialize Next.js 15 + TypeScript app
- [x] Verify Tailwind CSS setup
- [x] Initialize shadcn/ui
- [x] Configure Zustand store scaffolding
- [x] Install Tone.js and validate Web Audio playback (simple oscillator test)
- [x] Set up linting/formatting (ESLint, TS strict)
- [x] Add basic app shell and dev server smoke test

### 1.2 Core Audio Engine
- [x] Add audio routing utilities and master metering
- [x] Add basic transport UI (tempo + time signature controls)
- [x] Improve audio engine (master chain + meter smoothing + tempo display)

### 1.3 First Synthesizer (SubSynth)
- [x] Build SubSynth MVP (MonoSynth wrapper + basic UI controls)
- [x] Add SubSynth preset save/load (localStorage)
- [x] Add QWERTY keyboard input for SubSynth
- [x] Add hold/sustain mode for keyboard input

### 1.4 Basic Pattern Sequencer
- [x] Add 16-step sequencer grid UI (state + UI only)
- [x] Wire step sequencer into SubSynth playback (Tone.Transport schedule)
- [x] Add sequencer data model + transport scheduling
- [x] Add sequencer velocity + accent UI
- [x] Add sequencer pattern save/load (localStorage)
- [x] Add sequencer copy/paste + randomize tools
- [x] Add click-drag velocity editing
- [x] Add velocity tooltips + value display
- [x] Add per-step probability controls
- [x] Add pattern A/B/C/D slots

### 1.5 Extended Sequencer Features
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

---

## Phase 2: The Rack System (Next Up)

### 2.1 Machine Architecture
- [x] Design base Machine abstract class
- [x] Create Machine Registry/Factory pattern
- [x] Build Machine Rack container component
- [x] Implement add/remove machines (max 14)
- [x] Create machine selector UI
- [x] Add machine reordering (drag & drop)
- [x] Build machine clone/duplicate function
- [x] Implement machine mute/solo per machine

### 2.2 PCMSynth (Sampler)
- [x] Build Tone.Sampler wrapper
- [x] Create sample library browser
- [x] Implement drag-drop WAV file upload
- [x] Add sample mapping across keyboard
- [x] Build playback controls (loop, reverse, pitch)
- [x] Create ADSR for amplitude
- [x] Add filter section
- [x] Support SoundFont (.sf2) import
- [x] Build sample editor (trim, normalize)

### 2.3 BeatBox (Drum Machine)
- [x] Create 8-channel Tone.Players
- [x] Build 8-track step sequencer UI
- [x] Load default drum kit samples
- [x] Implement sample assignment per pad
- [x] Add individual channel controls (volume, pan, tune)
- [x] Create swing/humanize function
- [x] Build pattern variations (A/B/C/D)
- [x] Add drum pad trigger interface

### 2.4 FMSynth
- [x] Implement Tone.FMSynth (3-operator)
- [x] Create modulation matrix UI
- [x] Add algorithm selector
- [x] Build envelope per operator
- [x] Add feedback controls

### 2.5 BassLine
- [x] Create acid-style monosynth
- [x] Implement slide/glide between notes
- [x] Add accent controls
- [x] Build filter with resonance
- [x] Create pattern-based sequencer

---

## Phase 3: Effects & Mixing

### 3.1 Effects Rack System
- [x] Design effects slot architecture
- [x] Create effect selector dropdown
- [x] Build base Effect abstract class
- [x] Implement serial effects routing
- [x] Add effect bypass/mute buttons
- [x] Create preset system for effects
- [x] Build Distortion effect (overdrive, fuzz, bitcrusher)
- [x] Build Filter effect (lowpass, highpass, bandpass)
- [x] Build Delay effect (time, feedback, filter)
- [x] Build Reverb effect (room, hall, plate)
- [x] Build Chorus effect (depth, rate, mix)
- [x] Build Phaser effect (stages, frequency, feedback)
- [x] Build Compressor effect (threshold, ratio, attack, release)
- [x] Build EQ effect (3-band parametric)

### 3.2 Mixer Desk
- [x] Create mixer channel strip component
- [x] Implement fader controls (volume)
- [x] Add pan knobs
- [x] Build mute/solo logic (with exclusive solo)
- [x] Create VU meters per channel
- [x] Add channel naming/coloring
- [x] Build send effects (global delay/reverb)
- [x] Implement stereo width control
- [x] Create mixer automation recording

### 3.3 Master Section
- [x] Build master effect slots (4 slots)
- [x] Create parametric EQ (low/mid/high)
- [x] Implement brick-wall limiter
- [x] Add master volume control
- [x] Build spectrum analyzer visualization
- [x] Create stereo width meter
- [x] Add master compressor option

---

## Phase 4: Song Arrangement

### 4.1 Song Sequencer
- [ ] Create timeline/arrangement view
- [ ] Build pattern block system
- [ ] Implement pattern drag & drop to timeline
- [ ] Add pattern repeat/loop functionality
- [ ] Create section markers (intro, verse, chorus, etc.)
- [ ] Build timeline zoom controls
- [ ] Add pattern variations per machine
- [ ] Implement song length/bar count

### 4.2 Automation System
- [ ] Design automation lane UI
- [ ] Create automation recording mode
- [ ] Build automation curve editor
- [ ] Implement automation playback
- [ ] Add automation per parameter
- [ ] Create automation lane visibility toggle
- [ ] Build automation copy/paste
- [ ] Add automation curve shapes (linear, exponential)

---

## Phase 5: Advanced Features

### 5.1 Piano Roll Editor
- [ ] Build piano roll grid component
- [ ] Implement note drawing/erasing
- [ ] Add note selection and multi-select
- [ ] Create note resizing (duration)
- [ ] Build velocity editing per note
- [ ] Add quantize function
- [ ] Implement snap-to-grid options
- [ ] Create note transpose tools
- [ ] Add scale/chord helpers

### 5.2 Sample Management System
- [ ] Build sample browser UI
- [ ] Create sample categories/tags
- [ ] Implement sample search
- [ ] Add waveform preview
- [ ] Build sample upload system
- [ ] Create sample favorites/collections
- [ ] Add sample metadata editor
- [ ] Implement sample sharing (export/import)

### 5.3 Preset Management
- [ ] Design preset data structure
- [ ] Create preset browser per machine
- [ ] Build preset save/load UI
- [ ] Implement preset categories
- [ ] Add preset search/filter
- [ ] Create default preset library
- [ ] Build preset import/export
- [ ] Add preset sharing functionality

### 5.4 Web MIDI Support
- [ ] Implement Web MIDI API connection
- [ ] Create MIDI device manager
- [ ] Build MIDI learn functionality
- [ ] Add MIDI mapping per parameter
- [ ] Create MIDI keyboard input for machines
- [ ] Implement MIDI CC automation recording
- [ ] Build MIDI clock sync (in/out)

---

## Phase 6: AI Integration

### 6.1 AI Sound Generation
- [ ] Integrate ElevenLabs Sound Effects API
- [ ] Build text-to-sound UI
- [ ] Create sound description templates
- [ ] Implement direct-to-sampler loading
- [ ] Add AI sound library/history
- [ ] Create sound variation generator
- [ ] Build style transfer for sounds

### 6.2 AI Pattern Generation
- [ ] Integrate with pattern generation AI
- [ ] Build pattern prompt UI
- [ ] Create style/genre selectors
- [ ] Implement direct-to-sequencer loading
- [ ] Add pattern variation generator
- [ ] Build pattern "humanize" function
- [ ] Create pattern completion assistant

### 6.3 AI Mixing Assistant
- [ ] Build mix analysis system
- [ ] Create mixing suggestion engine
- [ ] Implement auto-EQ suggestions
- [ ] Add level balancing assistant
- [ ] Build frequency conflict detector
- [ ] Create stereo field optimizer

---

## Phase 7: Backend & Cloud

### 7.1 Laravel Backend Setup
- [ ] Initialize Laravel 12 project
- [ ] Set up Sanctum authentication
- [ ] Create User model and auth
- [ ] Build project storage system
- [ ] Implement preset sharing API
- [ ] Create sample library API
- [ ] Add collaboration endpoints
- [ ] Set up file storage (S3/DigitalOcean Spaces)

### 7.2 User Authentication
- [ ] Build login/register UI
- [ ] Implement JWT/Sanctum integration
- [ ] Create password reset flow
- [ ] Add social auth (Google, GitHub)
- [ ] Build user profile management
- [ ] Create subscription/billing system (Stripe)
- [ ] Add usage tracking/analytics

### 7.3 Project Cloud Sync
- [ ] Build project serialization
- [ ] Implement auto-save system
- [ ] Create project versioning
- [ ] Add project sharing/collaboration
- [ ] Build project browser UI
- [ ] Create project templates
- [ ] Add project export (as ZIP)

### 7.4 Sample Library Backend
- [ ] Build sample upload API
- [ ] Create sample CDN integration
- [ ] Implement sample transcoding
- [ ] Add sample metadata extraction
- [ ] Build sample search API
- [ ] Create sample packs system
- [ ] Add sample licensing/attribution

---

## Phase 8: Collaboration Features

### 8.1 Real-time Collaboration
- [ ] Set up WebSocket server (Laravel Reverb)
- [ ] Implement presence channels
- [ ] Build real-time state sync
- [ ] Create cursor/selection sharing
- [ ] Add chat system
- [ ] Implement conflict resolution
- [ ] Build session management
- [ ] Create invite/permission system

### 8.2 Project Sharing & Community
- [ ] Build public project gallery
- [ ] Create project commenting system
- [ ] Add like/favorite functionality
- [ ] Implement follow/follower system
- [ ] Build remix/fork functionality
- [ ] Create collaborative playlists
- [ ] Add project challenges/competitions

---

## Phase 9: Export & Integration

### 9.1 Audio Export
- [ ] Implement offline audio rendering
- [ ] Add WAV export (16/24/32-bit)
- [ ] Create MP3 export with quality settings
- [ ] Add FLAC lossless export
- [ ] Implement stem export (per machine)
- [ ] Create mixdown presets
- [ ] Add metadata embedding (ID3 tags)
- [ ] Build export queue system

### 9.2 MIDI Export
- [ ] Implement MIDI file export (.mid)
- [ ] Create multi-track MIDI export
- [ ] Add tempo map export
- [ ] Build MIDI CC automation export
- [ ] Create MIDI import functionality

### 9.3 Project Export
- [ ] Create project bundle format (.synthwave)
- [ ] Implement project export with samples
- [ ] Add project import from bundle
- [ ] Build legacy Caustic import (if possible)
- [ ] Create project converter tools

---

## Phase 10: Polish & Launch

### 10.1 Performance Optimization
- [ ] Profile audio thread performance
- [ ] Optimize re-renders with React.memo
- [ ] Implement virtual scrolling for large lists
- [ ] Add Web Worker for heavy computation
- [ ] Optimize bundle size (code splitting)
- [ ] Add loading states and skeletons
- [ ] Implement progressive loading
- [ ] Create performance monitoring

### 10.2 Mobile/Tablet Support
- [ ] Create responsive layouts
- [ ] Build touch gesture controls
- [ ] Optimize knob/fader touch input
- [ ] Add on-screen keyboard for tablets
- [ ] Create mobile-specific UI patterns
- [ ] Test on iOS/Android devices
- [ ] Optimize for smaller screens

### 10.3 Documentation & Tutorials
- [ ] Write user manual
- [ ] Create video tutorials
- [ ] Build interactive onboarding
- [ ] Add tooltips and help system
- [ ] Create keyboard shortcut guide
- [ ] Build example projects library
- [ ] Add contextual help

### 10.4 Testing & QA
- [ ] Create integration tests (Cypress)
- [ ] Test audio accuracy
- [ ] Perform cross-browser testing
- [ ] Conduct user acceptance testing
- [ ] Fix critical bugs
- [ ] Perform security audit

### 10.5 Launch Preparation
- [ ] Set up production infrastructure
- [ ] Configure CDN (Cloudflare)
- [ ] Implement monitoring (Sentry)
- [ ] Create landing page
- [ ] Build email marketing campaign
- [ ] Prepare press kit
- [ ] Set up social media accounts
- [ ] Create launch video/demo
