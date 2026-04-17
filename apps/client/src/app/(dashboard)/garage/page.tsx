"use client";

import React, { useState, useEffect } from "react";
import { RobotCard } from "./components/RobotCard";
import { apiClient } from "../../../lib/api-client";

const ROBOTS = [
  { robotId: "unit-01", name: "UNIT-01", file: "/robot.glb" },
  { robotId: "unit-02", name: "UNIT-02", file: "/robot2.glb" },
];

export default function GaragePage() {
  const [activeRobotId, setActiveRobotId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState("#22d3ee");

  useEffect(() => {
    apiClient.get("/users/profile").then((res) => {
      if (res.data.selectedRobotId) setActiveRobotId(res.data.selectedRobotId);
      if (res.data.selectedColor)   setActiveColor(res.data.selectedColor);
    }).catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
      `}</style>

      <div className="min-h-screen bg-[#030712] font-mono text-[#22d3ee]/90 relative overflow-hidden">
        {/* Cyan grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div
          className="max-w-[960px] mx-auto px-6 pt-12 pb-20 relative z-10"
          style={{ animation: "fadeIn 0.35s ease" }}
        >
          {/* ── Header ── */}
          <div className="border-b border-[#22d3ee]/10 pb-6 mb-10">
            <p className="text-[8px] tracking-[0.28em] text-[#22d3ee]/35 mb-2 uppercase">
              // HANGAR_DECK
            </p>
            <h1 className="m-0 text-[clamp(24px,4vw,38px)] font-black tracking-[0.18em] text-[#22d3ee] drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] leading-tight">
              ROBOT_GARAGE
            </h1>
            <p className="mt-2 text-[10px] text-[#22d3ee]/35 tracking-[0.15em]">
              SELECT A UNIT TO INSPECT AND CONFIGURE LOADOUT
            </p>
          </div>

          {/* ── Robot Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ROBOTS.map(({ robotId, name, file }) => {
              const isActive = robotId === activeRobotId;
              return (
                <div key={robotId} className="relative">
                  {/* ACTIVE badge */}
                  {isActive && (
                    <div
                      className="absolute -top-3 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-bold tracking-[0.25em] border"
                      style={{
                        background: "rgba(34,211,238,0.10)",
                        borderColor: "rgba(34,211,238,0.45)",
                        color: activeColor,
                        boxShadow: `0 0 12px ${activeColor}55`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: activeColor, boxShadow: `0 0 6px ${activeColor}` }}
                      />
                      ACTIVE_LOADOUT
                    </div>
                  )}
                  <RobotCard
                    robotId={robotId}
                    name={name}
                    file={file}
                    color={isActive ? activeColor : "#22d3ee"}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Footer hint ── */}
          <p
            className="text-center text-[9px] tracking-[0.22em] text-[#22d3ee]/20 mt-10"
            style={{ animation: "pulseGlow 3s ease-in-out infinite" }}
          >
            ◈ CLICK A UNIT TO OPEN FULL VIEWER ◈
          </p>
        </div>
      </div>
    </>
  );
}
