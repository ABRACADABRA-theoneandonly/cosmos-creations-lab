/**
 * Tiny synthesized audio manager — no audio files.
 * The AudioContext is created lazily on the first user gesture.
 */

type Listener = (muted: boolean) => void;

const STORAGE_KEY = "ai-science-lab:muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { stop: () => void } | null = null;
let muted = false;
let loaded = false;
const listeners = new Set<Listener>();

function loadMuted() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function isMuted() {
  loadMuted();
  return muted;
}

export function subscribeMuted(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  loadMuted();
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(next: boolean) {
  loadMuted();
  muted = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.35, ctx.currentTime, 0.05);
  }
  listeners.forEach((l) => l(next));
  if (!next) ensureCtx();
}

export function toggleMuted() {
  setMuted(!isMuted());
}

type ToneOptions = {
  freq: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
  delay?: number;
};

export function tone({
  freq,
  duration = 0.16,
  type = "sine",
  gain = 0.25,
  sweepTo,
  delay = 0,
}: ToneOptions) {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function noiseBurst(duration = 0.5, gain = 0.3, filterFreq = 900, sweepDown = true) {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const frames = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  const t0 = c.currentTime;
  filter.frequency.setValueAtTime(filterFreq, t0);
  if (sweepDown) filter.frequency.exponentialRampToValueAtTime(120, t0 + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
}

/** Common one-shots. */
export const sfx = {
  hover: () => tone({ freq: 660, duration: 0.07, type: "triangle", gain: 0.12 }),
  click: () => tone({ freq: 880, duration: 0.1, type: "square", gain: 0.12, sweepTo: 1320 }),
  back: () => tone({ freq: 420, duration: 0.12, type: "triangle", gain: 0.12, sweepTo: 240 }),
  blip: () => tone({ freq: 1200, duration: 0.05, type: "sine", gain: 0.09 }),
  chime: () => {
    tone({ freq: 784, duration: 0.24, type: "sine", gain: 0.14 });
    tone({ freq: 1176, duration: 0.3, type: "sine", gain: 0.1, delay: 0.09 });
  },
  error: () => tone({ freq: 180, duration: 0.3, type: "sawtooth", gain: 0.14, sweepTo: 90 }),
  splice: () => {
    tone({ freq: 300, duration: 0.5, type: "sawtooth", gain: 0.1, sweepTo: 1400 });
    noiseBurst(0.35, 0.12, 2400);
  },
  liftoff: () => noiseBurst(2.2, 0.34, 700, false),
  explosion: () => {
    noiseBurst(1.6, 0.42, 1400);
    tone({ freq: 90, duration: 1.2, type: "sine", gain: 0.28, sweepTo: 32 });
  },
  rumble: () => {
    noiseBurst(2.4, 0.3, 320, false);
    tone({ freq: 55, duration: 2.2, type: "sine", gain: 0.22 });
  },
  sizzle: () => noiseBurst(0.3, 0.14, 3200),
};

/** Slow atmospheric drone; safe to call repeatedly. */
export function startAmbient(baseFreq = 74) {
  const c = ensureCtx();
  if (!c || !master || ambient) return;
  const g = c.createGain();
  g.gain.value = 0.0001;
  g.gain.setTargetAtTime(0.07, c.currentTime, 1.4);
  g.connect(master);

  const oscs: OscillatorNode[] = [];
  [1, 1.5, 2.01].forEach((mult, i) => {
    const o = c.createOscillator();
    o.type = i === 2 ? "triangle" : "sine";
    o.frequency.value = baseFreq * mult;
    const og = c.createGain();
    og.gain.value = 0.5 / (i + 1);
    o.connect(og).connect(g);
    o.start();
    oscs.push(o);
  });

  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 2.4;
  lfo.connect(lfoGain).connect(oscs[0].frequency);
  lfo.start();

  ambient = {
    stop: () => {
      const t = c.currentTime;
      g.gain.setTargetAtTime(0.0001, t, 0.4);
      oscs.forEach((o) => o.stop(t + 1.2));
      lfo.stop(t + 1.2);
      ambient = null;
    },
  };
}

export function stopAmbient() {
  ambient?.stop();
}
