export type ChipKind =
  | "boot"
  | "click"
  | "mode"
  | "identify"
  | "catch"
  | "skip"
  | "watch"
  | "warn"
  | "a"
  | "b"
  | "power";

export const CHIP: Record<ChipKind, { freqs: number[]; dur: number; type: OscillatorType; gain: number }> = {
  boot: { freqs: [196, 262, 330, 392, 523], dur: 0.09, type: "square", gain: 0.05 },
  click: { freqs: [880], dur: 0.03, type: "square", gain: 0.03 },
  mode: { freqs: [392, 523], dur: 0.06, type: "square", gain: 0.04 },
  identify: { freqs: [523, 659, 784, 1047], dur: 0.045, type: "square", gain: 0.04 },
  catch: { freqs: [523, 659, 784], dur: 0.08, type: "square", gain: 0.05 },
  skip: { freqs: [196, 147, 110], dur: 0.09, type: "square", gain: 0.045 },
  watch: { freqs: [311, 370], dur: 0.07, type: "triangle", gain: 0.04 },
  warn: { freqs: [880, 440, 880], dur: 0.08, type: "square", gain: 0.05 },
  a: { freqs: [784], dur: 0.04, type: "square", gain: 0.035 },
  b: { freqs: [330], dur: 0.04, type: "square", gain: 0.035 },
  power: { freqs: [131, 196, 262], dur: 0.1, type: "square", gain: 0.05 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function armAudio(): void {
  const ac = audio();
  if (ac && ac.state === "suspended") void ac.resume();
}

function buzz(ac: AudioContext, dest: AudioNode, start: number, dur: number, gainVal: number): void {
  const n = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = n.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = n;
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(g);
  g.connect(dest);
  src.start(start);
  src.stop(start + dur + 0.02);
}

export function play(kind: ChipKind, muted: boolean): void {
  if (muted) return;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches && kind !== "a" && kind !== "b") {
    return;
  }
  const ac = audio();
  if (!ac || !master) return;
  void ac.resume();
  const spec = CHIP[kind];
  const t0 = ac.currentTime + 0.01;
  spec.freqs.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = spec.type;
    osc.frequency.value = freq;
    const start = t0 + i * spec.dur * 0.92;
    g.gain.setValueAtTime(spec.gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + spec.dur);
    osc.connect(g);
    g.connect(master as GainNode);
    osc.start(start);
    osc.stop(start + spec.dur + 0.03);
  });
  if (kind === "boot" || kind === "power") {
    buzz(ac, master, t0, 0.08, 0.02);
  }
  if (kind === "skip") {
    buzz(ac, master, t0 + 0.05, 0.06, 0.015);
  }
}

export function blip(kind: "catch" | "skip" | "watch", muted: boolean): void {
  play(kind, muted);
}

export function tap(muted: boolean): void {
  if (muted) return;
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(12);
  }
}
