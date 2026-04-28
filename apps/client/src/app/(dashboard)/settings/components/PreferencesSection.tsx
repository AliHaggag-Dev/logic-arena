"use client";

import React, { useEffect, useState } from "react";
import { Bot, Lock } from 'lucide-react';
import { SectionHeader, Toggle } from "./Shared";

export function PreferencesSection({ isGuest = false }: { isGuest?: boolean }) {
  const [defaultRobot, setDefaultRobot] = useState("unit-01");
  const [soundFx, setSoundFx] = useState(true);
  const [showFps, setShowFps] = useState(false);

  useEffect(() => {
    setDefaultRobot(localStorage.getItem("defaultRobot") ?? "unit-01");
    setSoundFx(localStorage.getItem("soundFx") !== "false");
    setShowFps(localStorage.getItem("showFps") === "true");
  }, []);

  const save = (key: string, value: string) => localStorage.setItem(key, value);

  const ROBOTS = [
    { id: "unit-01", label: "UNIT-01", desc: "Standard assault frame" },
    { id: "unit-02", label: "UNIT-02", desc: "Heavy armor variant" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>ARENA PREFERENCES</SectionHeader>

      {/* Default Robot */}
      <div className="flex flex-col gap-3">
        <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">Default Robot</div>
        <div className="grid grid-cols-2 gap-3">
          {ROBOTS.map(({ id, label, desc }) => {
            const selected = defaultRobot === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { 
                  if (isGuest) return;
                  setDefaultRobot(id); save("defaultRobot", id); 
                }}
                className={`p-4 rounded-xl border text-left transition-all duration-200 group ${selected
                  ? "border-accent bg-accent/[0.07] shadow-[0_0_16px_rgba(var(--accent-rgb),0.10)]"
                  : "border-accent/10 bg-bg-secondary hover:border-accent/30"
                  } ${isGuest ? "opacity-60 grayscale-[0.5] cursor-not-allowed" : "cursor-pointer"}`}
              >
                {/* Robot icon placeholder */}
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

      {/* Toggles */}
      <div className="flex flex-col gap-0 border border-accent/10 rounded-xl overflow-hidden">
        {[
          { id: "soundFx", label: "Sound Effects", sub: "In-arena audio feedback", val: soundFx, set: (v: boolean) => { if (!isGuest) { setSoundFx(v); save("soundFx", String(v)); } } },
          { id: "showFps", label: "Show FPS Counter", sub: "Performance overlay during match", val: showFps, set: (v: boolean) => { if (!isGuest) { setShowFps(v); save("showFps", String(v)); } } },
        ].map(({ id, label, sub, val, set }, i, arr) => (
          <div key={id} className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < arr.length - 1 ? "border-b border-accent/10" : ""} ${isGuest ? "opacity-60 grayscale-[0.5]" : ""}`}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
            </div>
            <Toggle id={id} checked={val} onChange={set} isGuest={isGuest} />
          </div>
        ))}
      </div>
    </div>
  );
}
