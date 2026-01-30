/**
 * Mock for the Tone.js library used in test environments.
 * Provides stub implementations of all Tone.js classes and functions
 * used throughout SynthWave.
 */

const mockConnect = jest.fn().mockReturnThis();
const mockDisconnect = jest.fn().mockReturnThis();
const mockDispose = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();

class MockToneAudioNode {
  connect = mockConnect;
  disconnect = mockDisconnect;
  dispose = mockDispose;
  toDestination = jest.fn().mockReturnThis();
}

class MockGain extends MockToneAudioNode {
  gain = { value: 0 };
  constructor(value?: number) {
    super();
    this.gain.value = value ?? 0;
  }
}

class MockLimiter extends MockToneAudioNode {
  threshold = { value: -1 };
  constructor(threshold?: number) {
    super();
    this.threshold.value = threshold ?? -1;
  }
}

class MockMeter extends MockToneAudioNode {
  normalRange: boolean;
  smoothing: number;
  constructor(options?: { normalRange?: boolean; smoothing?: number }) {
    super();
    this.normalRange = options?.normalRange ?? true;
    this.smoothing = options?.smoothing ?? 0.8;
  }
  getValue() {
    return -60;
  }
}

class MockFeedbackDelay extends MockToneAudioNode {
  delayTime = { value: 0 };
  feedback = { value: 0 };
  wet = { value: 1 };
  constructor(options?: { delayTime?: string; feedback?: number; wet?: number }) {
    super();
    if (options) {
      this.feedback.value = options.feedback ?? 0;
      this.wet.value = options.wet ?? 1;
    }
  }
}

class MockReverb extends MockToneAudioNode {
  decay: number;
  wet = { value: 1 };
  constructor(options?: { decay?: number; wet?: number }) {
    super();
    this.decay = options?.decay ?? 1;
    if (options?.wet !== undefined) this.wet.value = options.wet;
  }
}

class MockPanner extends MockToneAudioNode {
  pan = { value: 0 };
  constructor(pan?: number) {
    super();
    this.pan.value = pan ?? 0;
  }
}

class MockMonoSynth extends MockToneAudioNode {
  oscillator = { type: "sawtooth" };
  envelope = { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 };
  filter = { frequency: { value: 1200 }, Q: { value: 1 } };
  triggerAttackRelease = jest.fn();
  triggerAttack = jest.fn();
  triggerRelease = jest.fn();
  set = jest.fn();
}

class MockOscillator extends MockToneAudioNode {
  frequency = { value: 440 };
  type = "sine";
  start = mockStart;
  stop = mockStop;
  constructor(frequency?: string | number, type?: string) {
    super();
    if (frequency) this.frequency.value = typeof frequency === "number" ? frequency : 440;
    if (type) this.type = type;
  }
}

class MockFrequency {
  private _freq: string;
  constructor(freq: string | number) {
    this._freq = String(freq);
  }
  transpose(semitones: number) {
    return new MockFrequency(this._freq + `+${semitones}`);
  }
  toNote() {
    return this._freq;
  }
}

const MockTransport = {
  bpm: { value: 120 },
  timeSignature: [4, 4] as [number, number] | number,
  swing: 0,
  swingSubdivision: "16n" as string,
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  clear: jest.fn(),
  scheduleRepeat: jest.fn().mockReturnValue(1),
  position: "0:0:0",
  state: "stopped" as string,
};

const MockDraw = {
  schedule: jest.fn((callback: () => void) => callback()),
};

const MockTime = jest.fn((time?: string | number) => ({
  toSeconds: () => (typeof time === "number" ? time : 0.125),
}));

const mockGetContext = jest.fn().mockReturnValue({
  state: "running",
  resume: jest.fn(),
});

const mockToneStart = jest.fn().mockResolvedValue(undefined);

module.exports = {
  // Classes
  Gain: MockGain,
  Limiter: MockLimiter,
  Meter: MockMeter,
  FeedbackDelay: MockFeedbackDelay,
  Reverb: MockReverb,
  Panner: MockPanner,
  MonoSynth: MockMonoSynth,
  Oscillator: MockOscillator,
  Frequency: MockFrequency,

  // Singletons & utilities
  Transport: MockTransport,
  Draw: MockDraw,
  Time: MockTime,
  getContext: mockGetContext,
  start: mockToneStart,

  // For test access to mocks
  __mocks__: {
    mockConnect,
    mockDisconnect,
    mockDispose,
    mockStart,
    mockStop,
    MockTransport,
    mockToneStart,
    mockGetContext,
  },
};
