"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { SectionHeader, Toggle, useFeedback } from "./shared";
import { useAuth } from "../../../../context/AuthContext";
import { useSoundContext } from "../../../../context/SoundContext";
import { apiClient } from "../../../../lib/api-client";

interface ArenaPreferences {
  defaultRobot?: string;
  soundFx: boolean;
  music: boolean;
  graphicsQuality: string;
}

const DEFAULT_PREFS: ArenaPreferences = {
  defaultRobot: "robot",
  soundFx: true,
  music: true,
  graphicsQuality: "medium",
};

const NETWORK_DEBOUNCE_MS = 600;

export function PreferencesSection({ isGuest = false }: { isGuest?: boolean }) {
  const [prefs, setPrefs] = useState<ArenaPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const { state: feedback, flash } = useFeedback();
  const lastSaved = useRef<ArenaPreferences>(DEFAULT_PREFS);
  const currentPrefsRef = useRef<ArenaPreferences>(DEFAULT_PREFS);
  const pendingPatchRef = useRef<Partial<ArenaPreferences> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { profile, loading: authLoading, updateProfile } = useAuth();
  const { 
    clickSoundsEnabled, 
    arenaSoundsEnabled, 
    notificationSoundsEnabled, 
    setClickSoundsEnabled, 
    setArenaSoundsEnabled, 
    setNotificationSoundsEnabled 
  } = useSoundContext();

  // ── Load from backend once via AuthContext ─────────────────────────────────
  useEffect(() => {
    if (isGuest) {
      setPrefs({
        soundFx: localStorage.getItem("soundFx") !== "false",
        music: localStorage.getItem("music") !== "false",
        graphicsQuality: localStorage.getItem("graphicsQuality") ?? DEFAULT_PREFS.graphicsQuality,
      });
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (profile?.arenaPreferences) {
      const ap = profile.arenaPreferences as ArenaPreferences;
      setPrefs(ap);
      lastSaved.current = ap;
    } else {
      setPrefs({
        soundFx: localStorage.getItem("soundFx") !== "false",
        music: localStorage.getItem("music") !== "false",
        graphicsQuality: localStorage.getItem("graphicsQuality") ?? DEFAULT_PREFS.graphicsQuality,
      });
    }
    setLoading(false);
  }, [profile, authLoading, isGuest]);

  useEffect(() => {
    currentPrefsRef.current = prefs;
  }, [prefs]);

  // ── Network request execution (deduplicated, throttled & abort-safe) ─────────
  const flushBackend = useCallback(async (patch: Partial<ArenaPreferences>) => {
    if (isGuest) return;

    // Abort any prior in-flight request so requests never stack up in Network tab
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await apiClient.put("/users/preferences", patch, { signal: controller.signal });
      lastSaved.current = { ...lastSaved.current, ...patch };
      flash("success", "SAVED");
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as { name?: string })?.name === "CanceledError") {
        return; // Ignore deliberate abort on newer click
      }
      setPrefs(lastSaved.current);
      flash("error", "SAVE FAILED");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [isGuest, flash]);

  // ── Optimistic update with trailing network debounce ────────────────────────
  const update = useCallback(<K extends keyof ArenaPreferences>(key: K, value: ArenaPreferences[K]) => {
    // 1. Skip if value matches current pending or active value
    const currentVal = pendingPatchRef.current?.[key] ?? currentPrefsRef.current[key];
    if (currentVal === value) return;

    // 2. Immediately update local state, localStorage, and in-memory AuthContext (0ms latency)
    setPrefs((prev) => ({ ...prev, [key]: value }));

    if (key === "graphicsQuality" && typeof value === "string") {
      localStorage.setItem("graphicsQuality", value);
    } else if (key === "soundFx" || key === "music") {
      localStorage.setItem(key, String(value));
    }

    if (profile) {
      updateProfile({
        arenaPreferences: {
          defaultRobot: profile.arenaPreferences?.defaultRobot ?? "robot",
          soundFx: key === "soundFx" ? (value as boolean) : (profile.arenaPreferences?.soundFx ?? DEFAULT_PREFS.soundFx),
          music: key === "music" ? (value as boolean) : (profile.arenaPreferences?.music ?? DEFAULT_PREFS.music),
          graphicsQuality: key === "graphicsQuality" ? (value as string) : (profile.arenaPreferences?.graphicsQuality ?? DEFAULT_PREFS.graphicsQuality),
        },
      });
    }

    if (isGuest) {
      flash("success", "SAVED");
      return;
    }

    // 3. Queue network request to prevent floodgate if user clicks rapidly
    pendingPatchRef.current = { ...pendingPatchRef.current, [key]: value };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (pendingPatchRef.current) {
        const patchToSend = pendingPatchRef.current;
        pendingPatchRef.current = null;
        flushBackend(patchToSend);
      }
    }, NETWORK_DEBOUNCE_MS);
  }, [profile, updateProfile, isGuest, flash, flushBackend]);

  // ── Flush on unmount so leaving before 600ms never loses the change ────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (!isGuest && pendingPatchRef.current && Object.keys(pendingPatchRef.current).length > 0) {
        const finalPatch = pendingPatchRef.current;
        pendingPatchRef.current = null;
        apiClient.put("/users/preferences", finalPatch).catch(() => {});
      }
    };
  }, [isGuest]);

  if (loading) return (
    <div className="flex flex-col gap-6 opacity-50 animate-pulse">
      <SectionHeader>ARENA PREFERENCES</SectionHeader>
      <div className="h-24 rounded-xl border border-accent/10 bg-bg-secondary" />
      <div className="h-24 rounded-xl border border-accent/10 bg-bg-secondary" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>ARENA PREFERENCES</SectionHeader>

      {/* Graphics Quality */}
      <div className="flex flex-col gap-3">
        <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">Graphics Quality</div>
        <div className="grid grid-cols-3 gap-3">
          {(["low", "medium", "high"] as const).map((q) => {
            const selected = prefs.graphicsQuality === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => update("graphicsQuality", q)}
                className={`py-3 rounded-xl border text-center transition-all duration-200 ${selected
                  ? "border-accent bg-accent/[0.07] shadow-[0_0_16px_rgba(var(--accent-rgb),0.10)]"
                  : "border-accent/10 bg-bg-secondary hover:border-accent/30"
                } cursor-pointer`}
              >
                <div className={`text-[10px] font-black tracking-[0.15em] ${selected ? "text-accent" : "text-text-secondary"}`}>
                  {q.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Arena Sound & Notification Toggles */}
      <div className="flex flex-col gap-1">
        <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase mb-1">Arena Audio</div>
        <div className="flex flex-col gap-0 border border-accent/10 rounded-xl overflow-hidden">
          {([
            { id: "soundFx"  as const, label: "Arena Sound Effects", sub: "In-arena audio feedback (shots, hits, collisions)" },
            { id: "music"    as const, label: "Notifications",       sub: "Alerts for challenges and friend requests" },
          ] as const).map(({ id, label, sub }, i, arr) => (
            <div key={id} className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < arr.length - 1 ? "border-b border-accent/10" : ""} ${isGuest ? "opacity-60 grayscale-[0.5]" : ""}`}>
              <div>
                <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
                <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
              </div>
              <Toggle id={id} ariaLabel={label} checked={id === "soundFx" ? arenaSoundsEnabled : notificationSoundsEnabled} onChange={(v) => {
                if (id === "soundFx") setArenaSoundsEnabled(v);
                if (id === "music") setNotificationSoundsEnabled(v);
                update(id, v);
              }} isGuest={isGuest} />
            </div>
          ))}
        </div>
      </div>

      {/* Global UI Sound Toggles */}
      <div className="flex flex-col gap-1">
        <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase mb-1">Interface Audio</div>
        <div className="flex flex-col gap-0 border border-accent/10 rounded-xl overflow-hidden">
          <div className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${isGuest ? "opacity-60 grayscale-[0.5]" : ""}`}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">Click Sounds</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">Tactile click feedback on all buttons</div>
            </div>
            <Toggle
              id="clickSounds"
              ariaLabel="Click Sounds"
              checked={clickSoundsEnabled}
              onChange={setClickSoundsEnabled}
              isGuest={isGuest}
            />
          </div>
        </div>
      </div>

      {/* Feedback row */}
      {feedback.status !== "idle" && (
        <p className={`text-[10px] tracking-widest font-mono ${feedback.status === "success" ? "text-green-400" : "text-red-400"}`}>
          {feedback.message ?? (feedback.status === "success" ? "SAVED" : "ERROR")}
        </p>
      )}
    </div>
  );
}
