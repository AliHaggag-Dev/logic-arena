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

// ─── Sound Tiers ─────────────────────────────────────────────────────────────
function fireHeavyClick(): void {
  unlockAudio();
  playTone([
    { frequency: 150, endFrequency: 60, duration: 0.09, startOffset: 0, gain: 0.55, type: "triangle" },
    { frequency: 300, duration: 0.03, startOffset: 0.04, gain: 0.25, type: "square" },
  ]);
}

function fireDefaultClick(): void {
  unlockAudio();
  playTone([
    { frequency: 320, endFrequency: 520, duration: 0.04, startOffset: 0, gain: 0.35, type: "triangle" },
    { frequency: 800, duration: 0.02, startOffset: 0.02, gain: 0.15, type: "square" },
  ]);
}

function fireLightClick(): void {
  unlockAudio();
  playTone([
    { frequency: 1200, duration: 0.02, startOffset: 0, gain: 0.2, type: "sine" },
    { frequency: 2000, duration: 0.015, startOffset: 0.01, gain: 0.1, type: "sine" },
  ]);
}

function getSoundTier(el: HTMLElement): 1 | 2 | 3 {
  const ds = el.getAttribute("data-sound");
  if (ds === "1") return 1;
  if (ds === "2") return 2;
  if (ds === "3") return 3;

  const classes = el.className || "";
  const tagName = el.tagName.toLowerCase();
  
  if (
    classes.includes("text-lg") ||
    classes.includes("text-xl") ||
    classes.includes("h-12") ||
    classes.includes("h-14") ||
    classes.includes("h-16") ||
    classes.includes("py-3") ||
    classes.includes("py-4") ||
    tagName === "a" 
  ) {
    return 1; // Heavy / Main Navigation
  }

  if (
    classes.includes("text-xs") ||
    classes.includes("text-[10px]") ||
    classes.includes("text-[9px]") ||
    classes.includes("text-[11px]") ||
    classes.includes("h-6") ||
    classes.includes("h-8") ||
    classes.includes("w-6") ||
    classes.includes("w-8") ||
    classes.includes("p-1") ||
    classes.includes("p-1.5")
  ) {
    return 3; // Light / Inner / Modal
  }

  return 2; // Default / Tabs / Cards
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface SoundContextValue {
  clickSoundsEnabled: boolean;
  arenaSoundsEnabled: boolean;
  notificationSoundsEnabled: boolean;
  setClickSoundsEnabled: (v: boolean) => void;
  setArenaSoundsEnabled: (v: boolean) => void;
  setNotificationSoundsEnabled: (v: boolean) => void;
  playNotification: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  clickSoundsEnabled: true,
  arenaSoundsEnabled: true,
  notificationSoundsEnabled: true,
  setClickSoundsEnabled: () => undefined,
  setArenaSoundsEnabled: () => undefined,
  setNotificationSoundsEnabled: () => undefined,
  playNotification: () => undefined,
});

const LS_CLICK = "soundClickEnabled";
const LS_ARENA = "soundArenaEnabled";
const LS_NOTIF = "soundNotifEnabled";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [clickSoundsEnabled, setClickSoundsEnabledState] = useState(true);
  const [arenaSoundsEnabled, setArenaSoundsEnabledState] = useState(true);
  const [notificationSoundsEnabled, setNotificationSoundsEnabledState] = useState(true);
  const clickEnabledRef = useRef(true);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clickVal = localStorage.getItem(LS_CLICK);
    const arenaVal = localStorage.getItem(LS_ARENA);
    const notifVal = localStorage.getItem(LS_NOTIF);
    if (clickVal !== null) {
      const enabled = clickVal !== "false";
      setClickSoundsEnabledState(enabled);
      clickEnabledRef.current = enabled;
    }
    if (arenaVal !== null) {
      setArenaSoundsEnabledState(arenaVal !== "false");
    }
    if (notifVal !== null) {
      setNotificationSoundsEnabledState(notifVal !== "false");
    }
    installUnlockListeners();
  }, []);

  // Global click interceptor — fires on every button/link click across the site
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent): void {
      if (!clickEnabledRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest("button, a");
      if (clickable) {
        const tier = getSoundTier(clickable as HTMLElement);
        if (tier === 1) fireHeavyClick();
        else if (tier === 3) fireLightClick();
        else fireDefaultClick();
      }
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

  const setNotificationSoundsEnabled = useCallback((v: boolean) => {
    setNotificationSoundsEnabledState(v);
    localStorage.setItem(LS_NOTIF, String(v));
  }, []);

  const playNotification = useCallback(() => {
    if (!notificationSoundsEnabled) return;
    unlockAudio();
    playTone([
      { frequency: 523.25, endFrequency: 1046.50, duration: 0.15, startOffset: 0, gain: 0.3, type: "sine" },
      { frequency: 1046.50, endFrequency: 2093.00, duration: 0.4, startOffset: 0.15, gain: 0.2, type: "sine" },
    ]);
  }, [notificationSoundsEnabled]);

  return (
    <SoundContext.Provider
      value={{ 
        clickSoundsEnabled, 
        arenaSoundsEnabled, 
        notificationSoundsEnabled,
        setClickSoundsEnabled, 
        setArenaSoundsEnabled,
        setNotificationSoundsEnabled,
        playNotification
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext(): SoundContextValue {
  return useContext(SoundContext);
}
