"use client";

import React, { useState, useEffect } from "react";
import { RobotCard } from "./components/RobotCard";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { AuthModal } from "../../../components/AuthModal";

const ROBOTS = [
  { robotId: "unit-01", name: "UNIT-01", file: "/robot.glb", scale: 2.5 },
  { robotId: "unit-02", name: "UNIT-02", file: "/robot2.glb", scale: 1.2 },
];

const GUEST_ROBOT = [
  { robotId: "guest-unit", name: "GUEST_ROBOT", file: "/robot.glb", scale: 2.5 }
];

export default function GaragePage() {
  const [activeRobotId, setActiveRobotId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState("DEFAULT");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    apiClient.get("/users/profile").then((res) => {
      if (res.data.selectedRobotId) setActiveRobotId(res.data.selectedRobotId);
      if (res.data.selectedColor) setActiveColor(res.data.selectedColor);
    }).catch((err) => {
      if (err.response?.status === 401 || !localStorage.getItem("token")) {
        setIsGuest(true);
        setActiveRobotId("guest-unit");
        setActiveColor("#22d3ee");
      }
    });
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

      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""}`}>
        {/* Cyan grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div
          className={`max-w-[960px] mx-auto ${isMobile ? "px-4 pt-6" : "px-6 pt-12"} pb-20 relative z-10`}
          style={{ animation: "fadeIn 0.35s ease" }}
        >
          {/* ── Header ── */}
          <div className={`border-b border-accent/10 ${isMobile ? "pb-4 mb-6" : "pb-6 mb-10"}`}>
            <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-2 uppercase font-bold">
              // GARAGE v2.0
            </p>
            <h1 className={`m-0 ${isMobile ? "text-2xl" : "text-[clamp(24px,4vw,38px)]"} font-black tracking-[0.18em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.7)] leading-tight`}>
              GARAGE
            </h1>
            <p className={`mt-2 ${isMobile ? "text-[9px]" : "text-[10px]"} text-accent/30 tracking-[0.15em] uppercase font-bold`}>
              SELECT A ROBOT
            </p>
          </div>

          {/* ── Robot Grid ── */}
          <div className={`grid grid-cols-1 ${isMobile ? "gap-4" : "sm:grid-cols-2 gap-6"}`}>
            {(isGuest ? GUEST_ROBOT : ROBOTS).map(({ robotId, name, file, scale }) => {
              const isActive = robotId === activeRobotId;
              return (
                <div key={robotId} className="relative">
                  {/* ACTIVE badge */}
                  {isActive && (
                    <div
                      className={`absolute ${isMobile ? "-top-2 left-3" : "-top-3 left-4"} z-20 flex items-center gap-1.5 ${isMobile ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[9px]"} font-bold tracking-[0.25em] border rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]`}
                      style={{
                        background: "rgba(var(--accent-rgb),0.12)",
                        borderColor: "rgba(var(--accent-rgb),0.4)",
                        color: activeColor !== "DEFAULT" ? activeColor : "var(--accent)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ 
                          background: activeColor !== "DEFAULT" ? activeColor : "var(--accent)", 
                          boxShadow: `0 0 6px ${activeColor !== "DEFAULT" ? activeColor : "var(--accent)"}` 
                        }}
                      />
                      ACTIVE
                    </div>
                  )}
                  <RobotCard
                    robotId={robotId}
                    name={name}
                    file={file}
                    scale={scale}
                    color={isActive ? activeColor : "DEFAULT"}
                    isMobile={isMobile}
                    isGuest={isGuest}
                    onClick={() => {
                      if (isGuest) setShowAuthModal(true);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Footer hint ── */}
          <p
            className={`text-center ${isMobile ? "text-[9px]" : "text-[10px]"} tracking-[0.22em] text-accent/20 ${isMobile ? "mt-8" : "mt-10"} uppercase font-bold`}
            style={{ animation: "pulseGlow 3s ease-in-out infinite" }}
          >
            ◈ CHOOSE YOUR ROBOT ◈
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="CHASSIS LOCKED"
        message="Robot customization is restricted for guests. Initialize a user account to unlock new chassis types, apply custom paint jobs, and upgrade your battle bot."
      />
    </>
  );
}
