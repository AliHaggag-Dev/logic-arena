"use client";
import React, { useEffect, useState, useRef } from "react";
import { RobotState } from "../../types/scene.types";
import { Socket } from "socket.io-client";
import { StatItem } from "./shared/StatItem";
import { StasisWarning } from "./shared/StasisWarning";
import { ANIM_DURATION_MS } from "./shared/constants";

interface TrainingHUDProps {
  playerRobot?: RobotState;
  shotsFired: number;
  dummiesDestroyed: number;
  startTime: number;
  isMobile?: boolean;
  socket: Socket | null;
  dummies: RobotState[];
}

export const TrainingHUD = ({
  playerRobot,
  shotsFired,
  dummiesDestroyed,
  startTime,
  isMobile,
  socket,
  dummies,
}: TrainingHUDProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [killToast, setKillToast] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const prevDummies = useRef(dummiesDestroyed);

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

  // Kill toast
  useEffect(() => {
    if (dummiesDestroyed > prevDummies.current) {
      prevDummies.current = dummiesDestroyed;
      setKillToast(true);
      const t = setTimeout(() => setKillToast(false), ANIM_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [dummiesDestroyed]);

  const damage = playerRobot?.totalDamageDealt ?? 0;
  const energyConsumed = playerRobot?.totalEnergyConsumed ?? 0;
  const hits = shotsFired > 0 ? Math.round((damage / 10 / Math.max(1, shotsFired)) * 100) : 0;
  const accuracy = Math.min(100, hits);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  const isInStasis = playerRobot?.inStasis ?? false;

  const aliveDummies = dummies.filter((d) => d.health > 0).length;
  const allDead = aliveDummies === 0 && dummies.length > 0;

  const handleRespawnDummies = () => {
    socket?.emit("respawnDummies");
  };

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
            color: "#00ffff",
            textShadow: "0 0 10px rgba(0,255,255,0.5), 0 0 24px rgba(0,255,255,0.2)",
          }}
        >
          TRAINING FACILITY
        </div>
      </div>

      {/* ── Training Session HUD ── */}
      <div
        className={`absolute z-50 pointer-events-none ${isMobile
          ? "top-3 left-3" // mobile: top-left square widget
          : "top-72 right-8" // desktop: right side, directly below tactical radar
          }`}
      >
        {isMobile ? (
          // MOBILE: Legendary iPhone-style Glass Widget
          <div className="w-[120px] bg-black/50 backdrop-blur-md border border-[#00ffff]/20 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-2 py-1 border-b border-[#00ffff]/15 flex justify-between items-center bg-linear-to-r from-[#00ffff]/10 to-transparent">
              <span className="text-[6px] text-[#00ffff] font-black tracking-widest uppercase">Training</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-mono font-bold text-[8px] tabular-nums">{mins}:{secs}</span>
                <span className="w-1 h-1 bg-[#00ffff] rounded-full animate-pulse shadow-[0_0_4px_#00ffff]" />
              </div>
            </div>

            {/* Grid of stats */}
            <div className="grid grid-cols-2 gap-px bg-[#00ffff]/10">
              <div className="bg-[#020813]/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-white font-mono font-black text-xs drop-shadow-md">{shotsFired}</span>
                <span className="text-[#00ffff]/60 text-[5px] uppercase font-bold tracking-widest mt-1">Shots</span>
              </div>
              <div className="bg-[#020813]/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-white font-mono font-black text-xs drop-shadow-md">{accuracy}%</span>
                <span className="text-[#00ffff]/60 text-[5px] uppercase font-bold tracking-widest mt-1">Accur</span>
              </div>
              <div className="bg-[#020813]/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-[#ffcc00] font-mono font-black text-xs drop-shadow-md">{energyConsumed}</span>
                <span className="text-[#ffcc00]/60 text-[5px] uppercase font-bold tracking-widest mt-1">Energy</span>
              </div>
              <div className="bg-linear-to-b from-[#ff0055]/10 to-[#020813]/80 p-2 flex flex-col items-center justify-center aspect-square">
                <span className="text-[#ff0055] font-mono font-black text-xs drop-shadow-md">{dummiesDestroyed}</span>
                <span className="text-[#ff0055]/70 text-[5px] uppercase font-bold tracking-widest mt-1">Kills</span>
              </div>
            </div>

            {/* Damage footer */}
            <div className="bg-[#020813]/90 py-1.5 flex justify-center items-center gap-2 border-t border-[#00ffff]/10">
              <span className="text-[#00ffff]/40 text-[5px] uppercase font-black tracking-[0.2em]">Damage Dealt</span>
              <span className="text-white font-mono font-bold text-[8px]">{damage}</span>
            </div>
          </div>
        ) : (
          // DESKTOP: Sleek Horizontal Panel
          <div className="bg-[#020813]/85 backdrop-blur-md border border-[#00ffff]/25 rounded-xl px-5 py-3 shadow-[0_0_24px_rgba(0,255,255,0.08)]">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#00ffff]/15">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ffff] animate-pulse shadow-[0_0_6px_#00ffff]" />
                <h2 className="text-[#00ffff] font-mono font-bold tracking-[0.2em] m-0 text-[10px]">
                  TRAINING SESSION
                </h2>
              </div>
              <div className="text-white font-mono font-bold tabular-nums text-xs">
                {mins}:{secs}
              </div>
            </div>

            <div className="flex w-full justify-between">
              <StatItem label="SHOTS" value={shotsFired} accent={false} brandColor="#00ffff" />
              <StatItem label="ACCURACY" value={`${accuracy}%`} accent={false} brandColor="#00ffff" />
              <StatItem label="DAMAGE" value={damage} accent={false} brandColor="#00ffff" />
              <StatItem label="ENERGY" value={energyConsumed} accent={false} brandColor="#00ffff" />
              <StatItem label="KILLS" value={dummiesDestroyed} accent brandColor="#ff0055" />
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#00ffff]/15 flex justify-center pointer-events-auto">
              <button
                type="button"
                onClick={handleRespawnDummies}
                title="Revive all dummies"
                className={`group relative flex items-center gap-2 px-4 py-1.5 border font-mono font-black text-[9px] tracking-[0.25em] uppercase transition-all overflow-hidden rounded-sm w-full justify-center ${allDead
                  ? "border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff] shadow-[0_0_16px_rgba(0,255,255,0.3)] animate-pulse"
                  : "border-[#00ffff]/20 bg-[#00ffff]/5 text-[#00ffff]/50 hover:border-[#00ffff]/50 hover:text-[#00ffff]/80"
                  }`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>⟳</span>
                  <span>RESPAWN DUMMIES</span>
                  {dummies.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-black ${allDead ? "bg-[#ff0055]/80 text-white" : "bg-[#00ffff]/10 text-[#00ffff]/60"
                      }`}>
                      {aliveDummies}/{dummies.length}
                    </span>
                  )}
                </span>
                <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-[#00ffff]/20 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Respawn button removed from here, moved to MobileTopRightHUD and inside Desktop panel */}

      {/* ── Kill toast ── */}
      {killToast && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-[fadeInOut_2.5s_ease-in-out_forwards]">
          <div className="bg-[#ff0055]/15 border border-[#ff0055]/80 text-[#ff0055] px-6 py-2 rounded-full font-mono font-black tracking-widest shadow-[0_0_20px_rgba(255,0,85,0.3)] backdrop-blur-sm flex items-center gap-2 whitespace-nowrap">
            <span>🎯</span>
            <span>TARGET ELIMINATED</span>
          </div>
        </div>
      )}

      <StasisWarning isInStasis={isInStasis} />

    </>
  );
};

