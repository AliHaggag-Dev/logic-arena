"use client";
import React, { useEffect, useState } from "react";
import { RobotState } from "../../types/scene.types";

interface TrainingHUDProps {
  playerRobot?: RobotState;
  shotsFired: number;
  dummiesDestroyed: number;
  startTime: number;
  isMobile?: boolean;
}

export const TrainingHUD = ({ playerRobot, shotsFired, dummiesDestroyed, startTime, isMobile }: TrainingHUDProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [targetToast, setTargetToast] = useState(false);
  const [prevDamage, setPrevDamage] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Toast for damage dealt
  useEffect(() => {
    if (dummiesDestroyed > 0) {
      setTargetToast(true);
      const t = setTimeout(() => setTargetToast(false), 2000);
      return () => clearTimeout(t);
    }
  }, [dummiesDestroyed]);

  const damage = playerRobot?.totalDamageDealt ?? 0;
  const energyConsumed = playerRobot?.totalEnergyConsumed ?? 0;
  
  // Calculate hits (each hit = 10 damage)
  const hits = Math.floor(damage / 10);
  const accuracy = shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 0;
  
  // Format time
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  const isInStasis = playerRobot?.inStasis ?? false;

  return (
    <>
      <div 
        className={`absolute z-50 ${isMobile ? "top-0 left-0 right-0 p-2" : "top-6 left-1/2 -translate-x-1/2 w-[600px]"} pointer-events-none transition-all duration-300`}
      >
        <div className={`bg-[#020813]/80 backdrop-blur-md border border-[#00ffff]/30 ${isMobile ? "rounded-md p-2 flex-row overflow-x-auto" : "rounded-xl p-4 flex-col"} flex items-center justify-between shadow-[0_0_20px_rgba(0,255,255,0.1)]`}>
          
          {/* Header */}
          {!isMobile && (
            <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-[#00ffff]/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ffff] animate-pulse shadow-[0_0_8px_#00ffff]" />
                <h2 className="text-[#00ffff] font-mono font-bold text-xs tracking-widest m-0">TRAINING SESSION</h2>
              </div>
              <div className="text-white font-mono font-bold text-sm tracking-widest">{mins}:{secs}</div>
            </div>
          )}

          {isMobile && (
            <div className="flex items-center gap-2 mr-4 shrink-0">
               <span className="w-1.5 h-1.5 rounded-full bg-[#00ffff] animate-pulse" />
               <span className="text-white font-mono font-bold text-xs">{mins}:{secs}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className={`w-full flex ${isMobile ? "gap-4 shrink-0" : "justify-between"}`}>
            <StatItem label="SHOTS" value={shotsFired} />
            <StatItem label="ACCURACY" value={`${accuracy}%`} />
            <StatItem label="DAMAGE" value={damage} />
            <StatItem label="ENERGY" value={energyConsumed} />
          </div>
        </div>
      </div>

      {/* Target Eliminated Toast */}
      {targetToast && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-[fadeInOut_2s_ease-in-out]">
          <div className="bg-[#ff0055]/20 border border-[#ff0055] text-[#ff0055] px-6 py-2 rounded-full font-mono font-bold tracking-widest shadow-[0_0_15px_rgba(255,0,85,0.4)] backdrop-blur-sm flex items-center gap-2">
            <span>TARGET ELIMINATED</span>
          </div>
        </div>
      )}

      {/* Stasis Warning */}
      {isInStasis && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center">
          <div className="text-[#ffcc00] font-mono font-black text-2xl tracking-[0.3em] drop-shadow-[0_0_10px_#ffcc00] animate-pulse">
            ENERGY DEPLETED
          </div>
          <div className="text-[#ffcc00] font-mono font-bold text-sm tracking-[0.2em] mt-2 opacity-80">
            SYSTEM RECHARGING
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
};

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col items-center">
    <span className="text-[#00ffff]/60 font-mono text-[9px] tracking-widest mb-1">{label}</span>
    <span className="text-white font-mono font-bold text-sm text-shadow-glow">{value}</span>
  </div>
);
