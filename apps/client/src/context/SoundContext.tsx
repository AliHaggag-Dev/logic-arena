"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Web Audio constants ─────────────────────────────────────────────────────
const MASTER_GAIN_VALUE = 0.045;
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

// ─── Module-level singletons (shared across the whole app) ───────────────────
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;
let listenersInstalled = false;

function getAudioCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as WebKitAudioWindow;
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

function ensureAudioCtx(): AudioContext | null {
  if (!unlocked) return null;
  if (audioCtx) return audioCtx;
  const Ctor = getAudioCtor();
  if (!Ctor) return null;
  audioCtx = new Ctor();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = MASTER_GAIN_VALUE;
  masterGain.connect(audioCtx.destination);
  return audioCtx;
}

function unlockAudio(): void {
  unlocked = true;
  const ctx = ensureAudioCtx();
  if (ctx?.state === "suspended") void ctx.resume();
  if (typeof window === "undefined") return;
  INIT_EVENTS.forEach((ev) => window.removeEventListener(ev, unlockAudio, true));
  listenersInstalled = false;
}

function installUnlockListeners(): void {
  if (typeof window === "undefined" || listenersInstalled || unlocked) return;
  listenersInstalled = true;
  INIT_EVENTS.forEach((ev) =>
    window.addEventListener(ev, unlockAudio, { capture: true, once: true }),
  );
}

function playTone(steps: ToneStep[]): void {
  const ctx = ensureAudioCtx();
  const out = masterGain;
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
        Math.max(MIN_FREQUENCY, step.endFrequency),
        end,
      );
    }

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(step.gain, start + ATTACK_MS);
    gain.gain.linearRampToValueAtTime(0, Math.max(start + ATTACK_MS, end - RELEASE_MS));

    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(end);
  });
}

// ─── The click sound ─────────────────────────────────────────────────────────
function fireClickSound(): void {
  unlockAudio();
  playTone([
    { frequency: 220, endFrequency: 420, duration: 0.055, startOffset: 0, gain: 0.42, type: "triangle" },
    { frequency: 920, duration: 0.025, startOffset: 0.035, gain: 0.2, type: "square" },
  ]);
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface SoundContextValue {
  clickSoundsEnabled: boolean;
  arenaSoundsEnabled: boolean;
  setClickSoundsEnabled: (v: boolean) => void;
  setArenaSoundsEnabled: (v: boolean) => void;
}

const SoundContext = createContext<SoundContextValue>({
  clickSoundsEnabled: true,
  arenaSoundsEnabled: true,
  setClickSoundsEnabled: () => undefined,
  setArenaSoundsEnabled: () => undefined,
});

const LS_CLICK = "soundClickEnabled";
const LS_ARENA = "soundArenaEnabled";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [clickSoundsEnabled, setClickSoundsEnabledState] = useState(true);
  const [arenaSoundsEnabled, setArenaSoundsEnabledState] = useState(true);
  const clickEnabledRef = useRef(true);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clickVal = localStorage.getItem(LS_CLICK);
    const arenaVal = localStorage.getItem(LS_ARENA);
    if (clickVal !== null) {
      const enabled = clickVal !== "false";
      setClickSoundsEnabledState(enabled);
      clickEnabledRef.current = enabled;
    }
    if (arenaVal !== null) {
      setArenaSoundsEnabledState(arenaVal !== "false");
    }
    installUnlockListeners();
  }, []);

  // Global click interceptor — fires on every button click across the site
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent): void {
      if (!clickEnabledRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button");
      if (btn) fireClickSound();
    }

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => document.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  const setClickSoundsEnabled = useCallback((v: boolean) => {
    setClickSoundsEnabledState(v);
    clickEnabledRef.current = v;
    localStorage.setItem(LS_CLICK, String(v));
  }, []);

  const setArenaSoundsEnabled = useCallback((v: boolean) => {
    setArenaSoundsEnabledState(v);
    localStorage.setItem(LS_ARENA, String(v));
  }, []);

  return (
    <SoundContext.Provider
      value={{ clickSoundsEnabled, arenaSoundsEnabled, setClickSoundsEnabled, setArenaSoundsEnabled }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext(): SoundContextValue {
  return useContext(SoundContext);
}
