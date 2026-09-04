import type { SoundPreset } from "./types";

export type CueType = "workStart" | "breakStart" | "finish";

let ctx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
}

/** Unlock the audio context from a user gesture (browser autoplay policy). */
export function unlockAudio(): void {
  ensureContext();
}

function tone(
  c: AudioContext,
  when: number,
  freq: number,
  dur: number,
  peak: number,
  wave: OscillatorType,
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

interface PresetStyle {
  wave: OscillatorType;
  peak: number;
  dur: number;
  gap: number;
  notes: Record<CueType, number[]>;
}

const PRESETS: Record<SoundPreset, PresetStyle> = {
  chime: {
    wave: "sine",
    peak: 0.12,
    dur: 0.4,
    gap: 0.18,
    notes: {
      workStart: [523.25, 659.25], // rising
      breakStart: [659.25, 523.25], // falling
      finish: [523.25, 659.25, 783.99],
    },
  },
  soft: {
    wave: "triangle",
    peak: 0.09,
    dur: 0.55,
    gap: 0.25,
    notes: {
      workStart: [392, 523.25],
      breakStart: [523.25, 392],
      finish: [392, 523.25, 659.25],
    },
  },
  breeze: {
    wave: "sine",
    peak: 0.07,
    dur: 0.7,
    gap: 0.3,
    notes: {
      workStart: [659.25, 783.99],
      breakStart: [783.99, 659.25],
      finish: [659.25, 783.99, 880],
    },
  },
};

/** Synthesized, asset-free cue. "Up" for starting focus, "down" for break, arpeggio for finish. */
export function playCue(type: CueType, preset: SoundPreset = "chime"): void {
  const c = ensureContext();
  if (!c) return;
  const style = PRESETS[preset];
  const t = c.currentTime;
  style.notes[type].forEach((freq, i) => {
    tone(c, t + i * style.gap, freq, style.dur, style.peak, style.wave);
  });
}
