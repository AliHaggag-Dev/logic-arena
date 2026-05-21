"use client";

import { useCallback, useEffect } from "react";

const MASTER_GAIN_VALUE = 0.045;
const HOVER_COOLDOWN_MS = 80;
const ATTACK_MS = 0.008;
const RELEASE_MS = 0.025;
const MIN_FREQUENCY = 1;
const INIT_EVENTS = ["pointerdown", "mousedown", "click", "keydown", "touchstart"] as const;

interface WebKitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface ToneStep {
  frequency: number;
  duration: number;
  startOffset: number;
  gain: number;
  type: OscillatorType;
  endFrequency?: number;
}

export interface SoundEffects {
  playHover: () => void;
  playClick: () => void;
  playLaser: () => void;
  playExplosion: () => void;
  playVictory: () => void;
  playDefeat: () => void;
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;
let listenersInstalled = false;
let lastHoverAt = 0;

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const audioWindow = window as WebKitAudioWindow;
  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function ensureAudioContext(): AudioContext | null {
  if (!unlocked) return null;
  if (audioContext) return audioContext;

  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = MASTER_GAIN_VALUE;
  masterGain.connect(audioContext.destination);

  return audioContext;
}

function unlockAudioContext(): void {
  unlocked = true;
  const context = ensureAudioContext();
  if (context?.state === "suspended") {
    void context.resume();
  }

  if (typeof window === "undefined") return;
  INIT_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, unlockAudioContext, true);
  });
  listenersInstalled = false;
}

function installAudioUnlockListeners(): void {
  if (typeof window === "undefined" || listenersInstalled || unlocked) return;
  listenersInstalled = true;
  INIT_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, unlockAudioContext, { capture: true, once: true });
  });
}

function playToneSequence(steps: ToneStep[]): void {
  const context = ensureAudioContext();
  const outputGain = masterGain;
  if (!context || !outputGain) return;
  if (context.state === "suspended") {
    void context.resume();
  }

  const baseTime = context.currentTime;
  steps.forEach((step) => {
    const startTime = baseTime + step.startOffset;
    const endTime = startTime + step.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = step.type;
    oscillator.frequency.setValueAtTime(step.frequency, startTime);
    if (step.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(MIN_FREQUENCY, step.endFrequency),
        endTime,
      );
    }

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(step.gain, startTime + ATTACK_MS);
    gain.gain.linearRampToValueAtTime(0, Math.max(startTime + ATTACK_MS, endTime - RELEASE_MS));
    oscillator.connect(gain);
    gain.connect(outputGain);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  });
}

export function useSoundEffects(): SoundEffects {
  useEffect(() => {
    installAudioUnlockListeners();
  }, []);

  const playHover = useCallback((): void => {
    // Disabled hover sound
  }, []);

  const playClick = useCallback((): void => {
    unlockAudioContext();
    playToneSequence([
      { frequency: 220, endFrequency: 420, duration: 0.055, startOffset: 0, gain: 0.42, type: "triangle" },
      { frequency: 920, duration: 0.025, startOffset: 0.035, gain: 0.2, type: "square" },
    ]);
  }, []);

  const playLaser = useCallback((): void => {
    playToneSequence([
      { frequency: 980, endFrequency: 160, duration: 0.18, startOffset: 0, gain: 0.45, type: "sawtooth" },
    ]);
  }, []);

  const playExplosion = useCallback((): void => {
    playToneSequence([
      { frequency: 130, endFrequency: 38, duration: 0.28, startOffset: 0, gain: 0.6, type: "sawtooth" },
      { frequency: 78, endFrequency: 24, duration: 0.34, startOffset: 0.035, gain: 0.5, type: "triangle" },
    ]);
  }, []);

  const playVictory = useCallback((): void => {
    playToneSequence([
      { frequency: 392, duration: 0.09, startOffset: 0, gain: 0.42, type: "triangle" },
      { frequency: 523.25, duration: 0.09, startOffset: 0.095, gain: 0.42, type: "triangle" },
      { frequency: 659.25, duration: 0.12, startOffset: 0.19, gain: 0.46, type: "triangle" },
      { frequency: 1046.5, duration: 0.18, startOffset: 0.32, gain: 0.32, type: "sine" },
    ]);
  }, []);

  const playDefeat = useCallback((): void => {
    playToneSequence([
      { frequency: 330, endFrequency: 220, duration: 0.16, startOffset: 0, gain: 0.42, type: "triangle" },
      { frequency: 196, endFrequency: 98, duration: 0.28, startOffset: 0.14, gain: 0.5, type: "sawtooth" },
    ]);
  }, []);

  return { playHover, playClick, playLaser, playExplosion, playVictory, playDefeat };
}

