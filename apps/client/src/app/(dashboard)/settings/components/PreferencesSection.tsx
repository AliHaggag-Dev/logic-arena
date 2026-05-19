"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bot, Lock } from "lucide-react";
import { SectionHeader, Toggle, useFeedback } from "./shared";
import { apiClient } from "../../../../lib/api-client";

interface ArenaPreferences {
  defaultRobot: string;
  soundFx: boolean;
  music: boolean;
  graphicsQuality: string;
}

const DEFAULT_PREFS: ArenaPreferences = {
  defaultRobot: "unit-01",
  soundFx: true,
  music: true,
  graphicsQuality: "medium",
};

const ROBOTS = [
  { id: "unit-01", label: "UNIT-01", desc: "Standard assault frame" },
  { id: "unit-02", label: "UNIT-02", desc: "Heavy armor variant" },
] as const;

const DEBOUNCE_MS = 800;

export function PreferencesSection({ isGuest = false }: { isGuest?: boolean }) {
  const [prefs, setPrefs] = useState<ArenaPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const { state: feedback, flash } = useFeedback();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a snapshot to roll back to on error
  const lastSaved = useRef<ArenaPreferences>(DEFAULT_PREFS);

  // ── Load from backend on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    apiClient.get("/users/profile").then((res) => {
      const ap = res.data.arenaPreferences ?? DEFAULT_PREFS;
      setPrefs(ap);
      lastSaved.current = ap;
    }).catch(() => {
      // Fallback to localStorage for graceful degradation
      setPrefs({
        defaultRobot: localStorage.getItem("defaultRobot") ?? DEFAULT_PREFS.defaultRobot,
        soundFx:      localStorage.getItem("soundFx") !== "false",
        music:        localStorage.getItem("music") !== "false",
        graphicsQuality: localStorage.getItem("graphicsQuality") ?? DEFAULT_PREFS.graphicsQuality,
      });
    }).finally(() => setLoading(false));
  }, [isGuest]);

  // ── Debounced persist to backend ───────────────────────────────────────────
  const persist = useCallback((patch: Partial<ArenaPreferences>) => {
    if (isGuest) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await apiClient.put("/users/preferences", patch);
        lastSaved.current = { ...lastSaved.current, ...patch };
        flash("success", "SAVED");
      } catch {
        // Rollback
        setPrefs(lastSaved.current);
        flash("error", "SAVE FAILED");
      }
    }, DEBOUNCE_MS);
  }, [isGuest, flash]);

  // ── Optimistic update helpers ──────────────────────────────────────────────
  const update = useCallback(<K extends keyof ArenaPreferences>(key: K, value: ArenaPreferences[K]) => {
    if (isGuest) return;
    setPrefs((prev) => ({ ...prev, [key]: value }));
    persist({ [key]: value });
  }, [isGuest, persist]);

  if (loading) return (
    <div className="flex flex-col gap-6 opacity-50 animate-pulse">
      <SectionHeader>ARENA PREFERENCES</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => <div key={i} className="h-24 rounded-xl border border-accent/10 bg-bg-secondary" />)}
      </div>
      <div className="h-24 rounded-xl border border-accent/10 bg-bg-secondary" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>ARENA PREFERENCES</SectionHeader>

      {/* Default Robot */}
      <div className="flex flex-col gap-3">
        <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">Default Robot</div>
        <div className="grid grid-cols-2 gap-3">
          {ROBOTS.map(({ id, label, desc }) => {
            const selected = prefs.defaultRobot === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => update("defaultRobot", id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${selected
                  ? "border-accent bg-accent/[0.07] shadow-[0_0_16px_rgba(var(--accent-rgb),0.10)]"
                  : "border-accent/10 bg-bg-secondary hover:border-accent/30"
                } ${isGuest ? "opacity-60 grayscale-[0.5] cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center border ${selected ? "border-accent/40 bg-accent/10" : "border-accent/10 bg-bg-primary"}`}>
                  {isGuest ? <Lock className="w-4 h-4 text-accent/60" /> : <Bot className="w-4 h-4 text-accent" />}
                </div>
                <div className={`text-[11px] font-black tracking-[0.2em] mb-1 ${selected ? "text-accent" : "text-text-secondary"}`}>
                  {label}
                </div>
                <div className="text-[9px] text-text-secondary/50 tracking-[0.06em]">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

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
                } ${isGuest ? "opacity-60 grayscale-[0.5] cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className={`text-[10px] font-black tracking-[0.15em] ${selected ? "text-accent" : "text-text-secondary"}`}>
                  {q.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-0 border border-accent/10 rounded-xl overflow-hidden">
        {([
          { id: "soundFx"  as const, label: "Sound Effects",  sub: "In-arena audio feedback" },
          { id: "music"    as const, label: "Music",           sub: "Background music during matches" },
        ] as const).map(({ id, label, sub }, i, arr) => (
          <div key={id} className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < arr.length - 1 ? "border-b border-accent/10" : ""} ${isGuest ? "opacity-60 grayscale-[0.5]" : ""}`}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
            </div>
            <Toggle id={id} ariaLabel={label} checked={prefs[id]} onChange={(v) => update(id, v)} isGuest={isGuest} />
          </div>
        ))}
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
