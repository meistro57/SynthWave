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

class MockFilter extends MockToneAudioNode {
  frequency = { value: 1200 };
  Q = { value: 1 };
  type = "lowpass";
  constructor(options?: { frequency?: number; Q?: number; type?: string }) {
    super();
    if (options?.frequency !== undefined) this.frequency.value = options.frequency;
    if (options?.Q !== undefined) this.Q.value = options.Q;
    if (options?.type) this.type = options.type;
  }
}

class MockAmplitudeEnvelope extends MockToneAudioNode {
  attack = 0.01;
  decay = 0.2;
  sustain = 0.7;
  release = 0.6;
  triggerAttack = jest.fn();
  triggerRelease = jest.fn();
  set = jest.fn();
  constructor(options?: { attack?: number; decay?: number; sustain?: number; release?: number }) {
    super();
    if (!options) return;
    if (options.attack !== undefined) this.attack = options.attack;
    if (options.decay !== undefined) this.decay = options.decay;
    if (options.sustain !== undefined) this.sustain = options.sustain;
    if (options.release !== undefined) this.release = options.release;
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
  portamento = 0;
  triggerAttackRelease = jest.fn();
  triggerAttack = jest.fn();
  triggerRelease = jest.fn();
  set = jest.fn();
}

class MockFMSynth extends MockToneAudioNode {
  oscillator = { type: "sine" };
  modulation = { type: "sine" };
  envelope = { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.6 };
  modulationEnvelope = { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 };
  harmonicity = { value: 2 };
  modulationIndex = { value: 10 };
  triggerAttackRelease = jest.fn();
  triggerAttack = jest.fn();
  triggerRelease = jest.fn();
  set = jest.fn();
}

class MockSampler extends MockToneAudioNode {
  add = jest.fn();
  triggerAttack = jest.fn();
  triggerRelease = jest.fn();
  triggerAttackRelease = jest.fn();
}

class MockToneAudioBuffer {
  reverse = false;
  loaded = true;
  duration = 1;
  constructor(options?: { url?: AudioBuffer; reverse?: boolean }) {
    if (options?.reverse !== undefined) this.reverse = options.reverse;
    if (options?.url && "duration" in options.url) this.duration = options.url.duration;
  }
  set = jest.fn();
}

class MockPlayer extends MockToneAudioNode {
  loop = false;
  reverse = false;
  playbackRate = 1;
  buffer = new MockToneAudioBuffer();
  loopStart = 0;
  loopEnd = 0;
  start = jest.fn();
  stop = jest.fn();
  constructor(buffer?: AudioBuffer) {
    super();
    if (buffer) {
      this.buffer = new MockToneAudioBuffer({ url: buffer });
    }
  }
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

class MockFrequencyClass {
  private _freq: string;
  constructor(freq: string | number) {
    this._freq = String(freq);
  }
  transpose(semitones: number) {
    return new MockFrequencyClass(this._freq + `+${semitones}`);
  }
  toFrequency() {
    return 440;
  }
  toNote() {
    return this._freq;
  }
}

const MockFrequency = jest.fn((freq: string | number) => new MockFrequencyClass(freq));

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
  rawContext: {
    sampleRate: 44100,
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const channelData = Array.from({ length: channels }, () => new Float32Array(length));
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: (index: number) => channelData[index] ?? new Float32Array(length),
      };
    },
    decodeAudioData: async () => ({
      duration: 1,
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 44100,
      getChannelData: () => new Float32Array(44100),
    }),
  },
});

const mockToneStart = jest.fn().mockResolvedValue(undefined);
const mockToneNow = jest.fn().mockReturnValue(0);

module.exports = {
  // Classes
  Gain: MockGain,
  Limiter: MockLimiter,
  Meter: MockMeter,
  FeedbackDelay: MockFeedbackDelay,
  Reverb: MockReverb,
  Filter: MockFilter,
  AmplitudeEnvelope: MockAmplitudeEnvelope,
  Panner: MockPanner,
  MonoSynth: MockMonoSynth,
  FMSynth: MockFMSynth,
  Sampler: MockSampler,
  Player: MockPlayer,
  ToneAudioBuffer: MockToneAudioBuffer,
  Oscillator: MockOscillator,
  Frequency: MockFrequency,

  // Singletons & utilities
  Transport: MockTransport,
  Draw: MockDraw,
  Time: MockTime,
  getContext: mockGetContext,
  start: mockToneStart,
  now: mockToneNow,

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
