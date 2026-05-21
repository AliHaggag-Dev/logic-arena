"use client";

import { useCallback } from "react";
import { useSoundContext } from "../../../context/SoundContext";

// ─── Web Audio helpers ────────────────────────────────────────────────────────
// Re-use the same module-level AudioContext as SoundContext (same JS module
// scope means they share the same singleton via window.AudioContext).

const MASTER_GAIN = 0.35;
const ATTACK_S = 0.004;
const RELEASE_S = 0.02;
const MIN_FREQ = 1;

interface ToneStep {
  frequency: number;
  endFrequency?: number;
  duration: number;
  startOffset: number;
  gain: number;
  type: OscillatorType;
}

// Module-level AudioContext (shared with SoundContext singleton)
let _audioCtx: AudioContext | null = null;
let _masterGain: GainNode | null = null;

interface WebKitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function getArenAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_audioCtx) return _audioCtx;

  const w = window as WebKitAudioWindow;
  const Ctor = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;

  _audioCtx = new Ctor();
  _masterGain = _audioCtx.createGain();
  _masterGain.gain.value = MASTER_GAIN;
  _masterGain.connect(_audioCtx.destination);
  return _audioCtx;
}

function playArenaSequence(steps: ToneStep[]): void {
  const ctx = getArenAudioCtx();
  const out = _masterGain;
  if (!ctx || !out) return;
  if (ctx.state === "suspended") void ctx.resume();

  const base = ctx.currentTime;
  steps.forEach((step) => {
    const start = base + step.startOffset;
    const end = start + step.duration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = step.type;
    osc.frequency.setValueAtTime(step.frequency, start);
    if (step.endFrequency !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(MIN_FREQ, step.endFrequency),
        end,
      );
    }

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(step.gain, start + ATTACK_S);
    gain.gain.linearRampToValueAtTime(
      0,
      Math.max(start + ATTACK_S, end - RELEASE_S),
    );

    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(end);
  });
}

// ─── Arena sound recipes ──────────────────────────────────────────────────────

/** Projectile fired — high-pitched sawtooth swoop down */
function fireLaserBurst(): void {
  playArenaSequence([
    { frequency: 1200, endFrequency: 220, duration: 0.12, startOffset: 0, gain: 0.55, type: "sawtooth" },
    { frequency: 2400, endFrequency: 800, duration: 0.06, startOffset: 0, gain: 0.18, type: "square" },
  ]);
}

/** Projectile hits a robot — sharp mid-range impact crunch */
function fireHitBurst(): void {
  playArenaSequence([
    { frequency: 320, endFrequency: 90, duration: 0.14, startOffset: 0, gain: 0.6, type: "sawtooth" },
    { frequency: 160, endFrequency: 55, duration: 0.18, startOffset: 0.02, gain: 0.45, type: "triangle" },
    { frequency: 640, endFrequency: 160, duration: 0.07, startOffset: 0, gain: 0.22, type: "square" },
  ]);
}

/** Robots collide — low metallic clang */
function fireClangBurst(): void {
  playArenaSequence([
    { frequency: 180, endFrequency: 60, duration: 0.22, startOffset: 0, gain: 0.65, type: "sawtooth" },
    { frequency: 90, endFrequency: 40, duration: 0.30, startOffset: 0.03, gain: 0.50, type: "triangle" },
    { frequency: 360, endFrequency: 120, duration: 0.10, startOffset: 0, gain: 0.20, type: "square" },
  ]);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const NOOP = () => { /* arena sound disabled */ };

interface GameSoundOptions {
  enabled?: boolean;
}

export const useGameSounds = ({ enabled = true }: GameSoundOptions = {}) => {
  const { arenaSoundsEnabled } = useSoundContext();
  const active = enabled && arenaSoundsEnabled;

  const playHit = useCallback((): void => {
    if (!active) return;
    fireHitBurst();
  }, [active]);

  const playClang = useCallback((): void => {
    if (!active) return;
    fireClangBurst();
  }, [active]);

  const playLaser = useCallback((): void => {
    if (!active) return;
    fireLaserBurst();
  }, [active]);

  return {
    playHit: active ? playHit : NOOP,
    playClang: active ? playClang : NOOP,
    playLaser: active ? playLaser : NOOP,
  };
};