"use client";

import { useCallback, useRef } from "react";
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

/** Projectile fired — high-pitched swoop down, softened */
function fireLaserBurst(): void {
  const r = 1 + (Math.random() * 0.1 - 0.05); // +/- 5%
  playArenaSequence([
    { frequency: 1000 * r, endFrequency: 300 * r, duration: 0.1, startOffset: 0, gain: 0.25, type: "sine" },
    { frequency: 2000 * r, endFrequency: 600 * r, duration: 0.05, startOffset: 0, gain: 0.1, type: "triangle" },
  ]);
}

/** Projectile hits a robot — soft, deep thud */
function fireHitBurst(): void {
  const r = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
  playArenaSequence([
    { frequency: 180 * r, endFrequency: 50 * r, duration: 0.15, startOffset: 0, gain: 0.2, type: "triangle" },
    { frequency: 90 * r, endFrequency: 30 * r, duration: 0.2, startOffset: 0.02, gain: 0.15, type: "sine" },
  ]);
}

/** Robots collide — low metallic thud */
function fireClangBurst(): void {
  const r = 1 + (Math.random() * 0.15 - 0.075); // +/- 7.5%
  playArenaSequence([
    { frequency: 140 * r, endFrequency: 50 * r, duration: 0.18, startOffset: 0, gain: 0.3, type: "triangle" },
    { frequency: 70 * r, endFrequency: 35 * r, duration: 0.25, startOffset: 0.02, gain: 0.2, type: "sine" },
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
  const lastClangRef = useRef<number>(0);
  const lastHitRef = useRef<number>(0);

  const playHit = useCallback((): void => {
    if (!active) return;
    const now = Date.now();
    if (now - lastHitRef.current < 100) return; // Prevent overlapping hits from exploding audio
    lastHitRef.current = now;
    fireHitBurst();
  }, [active]);

  const playClang = useCallback((): void => {
    if (!active) return;
    const now = Date.now();
    // 400ms debounce: Only plays on initial impact. 
    // If robots are stuck together colliding 60 times a second, it won't re-trigger continuously.
    if (now - lastClangRef.current < 400) return; 
    lastClangRef.current = now;
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