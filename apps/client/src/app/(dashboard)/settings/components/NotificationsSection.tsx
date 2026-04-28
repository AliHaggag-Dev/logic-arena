"use client";

import React, { useEffect, useState } from "react";
import { SectionHeader, Toggle } from "./Shared";

export function NotificationsSection({ isGuest = false }: { isGuest?: boolean }) {
  const [challengeReqs, setChallengeReqs] = useState(true);
  const [tournamentAlerts, setTournamentAlerts] = useState(true);
  const [matchResults, setMatchResults] = useState(true);

  useEffect(() => {
    setChallengeReqs(localStorage.getItem("notif_challenges") !== "false");
    setTournamentAlerts(localStorage.getItem("notif_tournaments") !== "false");
    setMatchResults(localStorage.getItem("notif_results") !== "false");
  }, []);

  const save = (key: string, value: boolean) =>
    localStorage.setItem(key, String(value));

  const ITEMS = [
    { id: "challenges", label: "Challenge Requests", sub: "Incoming battle challenges from other players", val: challengeReqs, set: (v: boolean) => { if (!isGuest) { setChallengeReqs(v); save("notif_challenges", v); } } },
    { id: "tournaments", label: "Tournament Alerts", sub: "Updates when a tournament begins or ends", val: tournamentAlerts, set: (v: boolean) => { if (!isGuest) { setTournamentAlerts(v); save("notif_tournaments", v); } } },
    { id: "matchResults", label: "Match Results", sub: "Post-match outcome notifications", val: matchResults, set: (v: boolean) => { if (!isGuest) { setMatchResults(v); save("notif_results", v); } } },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>NOTIFICATIONS</SectionHeader>
      <div className="flex flex-col border border-accent/10 rounded-xl overflow-hidden">
        {ITEMS.map(({ id, label, sub, val, set }, i) => (
          <div key={id} className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < ITEMS.length - 1 ? "border-b border-accent/10" : ""} ${isGuest ? "opacity-60 grayscale-[0.5]" : ""}`}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
            </div>
            <Toggle id={`notif_${id}`} checked={val} onChange={set} isGuest={isGuest} />
          </div>
        ))}
      </div>
    </div>
  );
}
