"use client";
import React, { useEffect, useState, useRef } from "react";
import { RobotState } from "../../types/scene.types";
import { Socket } from "socket.io-client";
import { StatItem } from "./shared/StatItem";
import { StasisWarning } from "./shared/StasisWarning";

interface RacingHUDProps {
  playerRobot?: RobotState;
  startTime: number;
  isMobile?: boolean;
}

export const RacingHUD = ({
  playerRobot,
  startTime,
  isMobile,
}: RacingHUDProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Show banner on mount with a short delay
  useEffect(() => {
    const t = setTimeout(() => setBannerVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const damage = playerRobot?.totalDamageDealt ?? 0;
  const energyConsumed = playerRobot?.totalEnergyConsumed ?? 0;

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  const isInStasis = playerRobot?.inStasis ?? false;

  return (
    <>
      {/* ── "TRAINING FACILITY" entrance banner: top-center, fades in, non-intrusive ── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 z-30 pointer-events-none flex justify-center"
        style={{
          top: isMobile ? "8%" : "6%",
          transition: "opacity 1s ease, transform 1s cubic-bezier(0.16,1,0.3,1)",
          opacity: bannerVisible ? 0.45 : 0,
          transform: bannerVisible ? "translateY(0)" : "translateY(-16px)",
        }}
      >
        <div
          className="font-mono font-black tracking-[0.35em] select-none whitespace-nowrap"
          style={{
            fontSize: isMobile ? "clamp(11px, 2.8vw, 16px)" : "clamp(14px, 1.4vw, 20px)",
            color: "var(--arena-racing-brand)",
            textShadow: "0 0 10px rgba(var(--arena-racing-brand-rgb),0.5), 0 0 24px rgba(var(--arena-racing-brand-rgb),0.2)",
          }}
        >
          RACING TIME TRIAL
        </div>
      </div>

      {/* ── Racing Session HUD ── */}
      <div
        className={`absolute z-50 pointer-events-none ${isMobile
          ? "top-3 left-3" // mobile: top-left square widget
          : "top-[272px] right-8" // desktop: right side, exactly 16px below the tactical radar
          }`}
      >
        {isMobile ? (
          // MOBILE: Legendary iPhone-style Glass Widget
          <div className="w-[120px] bg-black/50 backdrop-blur-md border border-arena-racing-brand/20 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-2 py-1 border-b border-arena-racing-brand/15 flex justify-between items-center bg-linear-to-r from-arena-racing-brand/10 to-transparent">
              <span className="text-[6px] text-arena-racing-brand font-black tracking-widest uppercase">Time Trial</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-mono font-bold text-[8px] tabular-nums">{mins}:{secs}</span>
                <span className="w-1 h-1 bg-arena-racing-brand rounded-full animate-pulse shadow-[0_0_4px_var(--arena-racing-brand)]" />
              </div>
            </div>

            {/* Grid of stats */}
            <div className="grid grid-cols-2 gap-px bg-arena-racing-brand/10">
              <div className="bg-arena-bg-dark/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-white font-mono font-black text-xs drop-shadow-md">{mins}:{secs}</span>
                <span className="text-arena-racing-brand/60 text-[5px] uppercase font-bold tracking-widest mt-1">Time</span>
              </div>
              <div className="bg-arena-bg-dark/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-arena-yellow font-mono font-black text-xs drop-shadow-md">{energyConsumed}</span>
                <span className="text-arena-yellow/60 text-[5px] uppercase font-bold tracking-widest mt-1">Energy</span>
              </div>
              <div className="bg-arena-bg-dark/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-arena-red font-mono font-black text-xs drop-shadow-md">0</span>
                <span className="text-arena-red/70 text-[5px] uppercase font-bold tracking-widest mt-1">Penalties</span>
              </div>
              <div className="bg-linear-to-b from-arena-finish/10 to-arena-bg-dark/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-arena-finish font-mono font-black text-[8px] drop-shadow-md text-center leading-tight">FINISH<br />LINE</span>
                <span className="text-arena-finish/70 text-[5px] uppercase font-bold tracking-widest mt-1">Target</span>
              </div>
            </div>
          </div>
        ) : (
          // DESKTOP: Sleek Horizontal Panel
          <div className="w-72 bg-arena-bg-dark/85 backdrop-blur-md border border-arena-racing-brand/25 rounded-xl px-4 py-3 shadow-[0_0_24px_rgba(var(--arena-racing-brand-rgb),0.08)]">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-arena-racing-brand/15">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-arena-racing-brand animate-pulse shadow-[0_0_6px_var(--arena-racing-brand)]" />
                <h2 className="text-arena-racing-brand font-mono font-bold tracking-[0.2em] m-0 text-[10px]">
                  RACING TIME TRIAL
                </h2>
              </div>
              <div className="text-white font-mono font-bold tabular-nums text-xs">
                {mins}:{secs}
              </div>
            </div>

            <div className="flex w-full justify-between items-end gap-1">
              <StatItem label="TIME" value={`${mins}:${secs}`} accent={false} brandColor="var(--arena-racing-brand)" />
              <StatItem label="ENERGY" value={energyConsumed} accent={false} brandColor="var(--arena-racing-brand)" />
              <StatItem label="FAULTS" value={0} accent brandColor="var(--arena-red)" />
              <div className="flex flex-col items-center min-w-[56px]">
                <span className="font-mono text-[7px] tracking-widest mb-1 text-arena-racing-brand/50">OBJECTIVE</span>
                <span className="font-mono font-bold text-xs text-arena-finish">FINISH</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <StasisWarning isInStasis={isInStasis} />

    </>
  );
};
