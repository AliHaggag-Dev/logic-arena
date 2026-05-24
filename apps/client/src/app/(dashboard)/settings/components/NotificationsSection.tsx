"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { SectionHeader, Toggle, useFeedback } from "./shared";
import { useAuth } from "../../../../context/AuthContext";
import { apiClient } from "../../../../lib/api-client";

interface NotificationSettings {
  challengeReqs:    boolean;
  tournamentAlerts: boolean;
  matchResults:     boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  challengeReqs:    true,
  tournamentAlerts: true,
  matchResults:     true,
};

const DEBOUNCE_MS = 800;

const ITEMS: { id: keyof NotificationSettings; label: string; sub: string }[] = [
  { id: "challengeReqs",    label: "Challenge Requests", sub: "Incoming battle challenges from other players" },
  { id: "tournamentAlerts", label: "Tournament Alerts",  sub: "Updates when a tournament begins or ends" },
  { id: "matchResults",     label: "Match Results",      sub: "Post-match outcome notifications" },
];

export function NotificationsSection({ isGuest = false }: { isGuest?: boolean }) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { state: feedback, flash } = useFeedback();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<NotificationSettings>(DEFAULT_SETTINGS);

  const { profile, loading: authLoading } = useAuth();

  // ── Load from backend once via AuthContext ─────────────────────────────────
  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    if (authLoading) return;
    if (profile?.notificationSettings) {
      const ns = profile.notificationSettings as NotificationSettings;
      setSettings(ns);
      lastSaved.current = ns;
    } else {
      // Graceful degradation to localStorage
      setSettings({
        challengeReqs:    localStorage.getItem("notif_challenges")  !== "false",
        tournamentAlerts: localStorage.getItem("notif_tournaments") !== "false",
        matchResults:     localStorage.getItem("notif_results")     !== "false",
      });
    }
    setLoading(false);
  }, [profile, authLoading, isGuest]);

  // ── Debounced persist ──────────────────────────────────────────────────────
  const persist = useCallback(async (patch: Partial<NotificationSettings>) => {
    if (isGuest) return;
      try {
        await apiClient.put("/users/notifications", patch);
        lastSaved.current = { ...lastSaved.current, ...patch };
        flash("success", "SAVED");
      } catch {
        setSettings(lastSaved.current);
        flash("error", "SAVE FAILED");
      }
  }, [isGuest, flash]);

  // ── Optimistic update ──────────────────────────────────────────────────────
  const update = useCallback((key: keyof NotificationSettings, value: boolean) => {
    if (isGuest) return;
    setSettings((prev) => ({ ...prev, [key]: value }));
    persist({ [key]: value });
  }, [isGuest, persist]);

  if (loading) return (
    <div className="flex flex-col gap-6 opacity-50 animate-pulse">
      <SectionHeader>NOTIFICATIONS</SectionHeader>
      <div className="h-36 rounded-xl border border-accent/10 bg-bg-secondary" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>NOTIFICATIONS</SectionHeader>
      <div className="flex flex-col border border-accent/10 rounded-xl overflow-hidden">
        {ITEMS.map(({ id, label, sub }, i) => (
          <div
            key={id}
            className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < ITEMS.length - 1 ? "border-b border-accent/10" : ""} ${isGuest ? "opacity-60 grayscale-[0.5]" : ""}`}
          >
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
            </div>
            <Toggle
              id={`notif_${id}`}
              ariaLabel={label}
              checked={settings[id]}
              onChange={(v) => update(id, v)}
              isGuest={isGuest}
            />
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
