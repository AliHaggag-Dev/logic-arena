"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { CommandConsole } from './CommandConsole';
import { TacticalRadar } from './TacticalRadar';
import { RefreshCw, Eye, EyeOff, Lock, Unlock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { RobotState, ProjectileState, ModeData } from '../types';

interface DesktopHUDProps {
  robots: RobotState[];
  projectiles: ProjectileState[];
  modeData?: ModeData;
  displayMode: string;
  scriptTitle?: string;
  socket: Socket | null;
  fogEnabled: boolean;
  setFogEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRobotId: string;
  availableRobots: string[];
  setSelectedRobotId: (id: string) => void;
  isMobile: boolean;
  isConnected: boolean;
  isPvP?: boolean;
}

export function DesktopHUD({
  robots,
  projectiles,
  modeData,
  displayMode,
  scriptTitle,
  socket,
  fogEnabled,
  setFogEnabled,
  selectedRobotId,
  availableRobots,
  setSelectedRobotId,
  isMobile,
  isConnected,
  isPvP = false,
}: DesktopHUDProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [lockVision, setLockVision] = useState(false);

  // Listen for lockVision state changes from the server
  useEffect(() => {
    if (!socket) return;
    const handleLockVisionToggled = (data: { robotId: string; lockVision: boolean | null }) => {
      if (data.lockVision !== null) setLockVision(data.lockVision);
    };
    socket.on('lockVisionToggled', handleLockVisionToggled);
    return () => { socket.off('lockVisionToggled', handleLockVisionToggled); };
  }, [socket]);

  // Reset lockVision when game resets (robots are re-created with lockVision=false)
  const handleResetGame = useCallback(() => {
    socket?.emit('resetGame');
    setLockVision(false);
  }, [socket]);

  const handleToggleLockVision = useCallback(() => {
    socket?.emit('toggleLockVision');
  }, [socket]);

  if (isMobile) return null;

  return (
    <>
      <button
        type="button"
        aria-label={isLeftPanelOpen ? 'Collapse arena HUD panel' : 'Expand arena HUD panel'}
        onClick={() => setIsLeftPanelOpen(prev => !prev)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-40 bg-black/80 backdrop-blur-xl border-y border-r border-cyan-500/50 rounded-r-2xl cursor-pointer group hover:w-16 hover:bg-cyan-950/80 transition-all shadow-[8px_0_30px_rgba(var(--arena-black-rgb),0.8),inset_0_0_15px_rgba(var(--arena-cyan-rgb),0.2)]"
      >
        <div className="flex flex-col items-center justify-center gap-4 h-full w-full">
          <span className="text-cyan-400 font-black tracking-[0.2em] transform -rotate-90 whitespace-nowrap text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
            {isLeftPanelOpen ? 'ZEN_MODE' : 'SYS_HUD'}
          </span>
          <span className={`text-cyan-400 font-mono text-2xl font-black transition-transform duration-500 drop-shadow-[0_0_10px_var(--arena-cyan)] ${isLeftPanelOpen ? 'rotate-0' : 'rotate-180'}`}>
            {'<'}
          </span>
        </div>
      </button>

      <div className={`absolute inset-0 z-30 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="absolute top-6 left-8 pointer-events-none flex flex-col gap-1">
          <div className="flex items-end gap-6">
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard"
                className="pointer-events-auto group flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all"
                title="Abort Session & Return to Dashboard"
              >
                <ChevronLeft size={16} className="text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <h1 className="text-4xl font-black tracking-tighter text-cyan-400 italic leading-none drop-shadow-[0_0_20px_rgba(var(--arena-cyan-rgb),0.6)]">
                LOGIC ARENA
              </h1>
            </div>
            <h2 className="text-sm font-bold text-white/40 tracking-[0.4em] uppercase italic mb-0.5">
              // ARENA: {scriptTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2 ml-1 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${displayMode === 'RACING' ? 'bg-yellow-400 shadow-[0_0_8px_var(--arena-projectile)]' :
              displayMode === 'TRAINING_SOLO' ? 'bg-green-400 shadow-[0_0_8px_var(--arena-green)]' :
                'bg-red-500 shadow-[0_0_8px_var(--sem-danger)]'
              }`} />
            <p className={`text-[10px] tracking-[0.25em] font-bold ${displayMode === 'RACING' ? 'text-yellow-400/80' :
              displayMode === 'TRAINING_SOLO' ? 'text-green-400/80' : 'text-red-400/80'
              }`}>
              v2.0.0 {displayMode === 'RACING' ? '[RACING OVAL]' : displayMode === 'TRAINING_SOLO' ? '[TRAINING SOLO]' : '[COMBAT ARENA]'}
            </p>
          </div>
        </div>

        <div className="absolute top-28 left-8 pointer-events-auto flex flex-col gap-4">
          <div className="flex items-center gap-2 bg-cyan-950/20 backdrop-blur-xl border border-cyan-500/20 p-2 rounded-xl shadow-[0_8px_32px_rgba(var(--arena-black-rgb),0.8),inset_0_0_15px_rgba(var(--arena-cyan-rgb),0.05)]">
            {!isPvP && displayMode !== 'TRAINING_SOLO' && (
              <>
                <button
                  type="button"
                  onClick={handleResetGame}
                  className="group relative flex items-center gap-2 border border-red-500/30 bg-red-950/40 text-red-400 text-[10px] font-black px-4 py-2 rounded-lg transition-all hover:bg-red-500/20 hover:border-red-500 hover:text-red-300 tracking-[0.15em] overflow-hidden shadow-[inset_0_0_10px_rgba(var(--sem-danger-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--sem-danger-rgb),0.4)]"
                >
                  <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="relative z-10 mt-[1px]">RESPAWN</span>
                  <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-red-500/20 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
                </button>
                <div className="h-6 w-px bg-cyan-500/20 mx-1" />
              </>
            )}

            <button
              type="button"
              onClick={() => setFogEnabled((prev: boolean) => !prev)}
              className={`group relative flex items-center gap-2 border text-[10px] font-black px-4 py-2 rounded-lg transition-all tracking-[0.15em] overflow-hidden ${fogEnabled
                ? 'border-cyan-500/50 bg-cyan-900/40 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-400 hover:text-cyan-200 shadow-[inset_0_0_10px_rgba(var(--arena-cyan-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--arena-cyan-rgb),0.4)]'
                : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/30 hover:text-white/70'
                }`}
            >
              {fogEnabled ? <Eye size={13} className="group-hover:scale-110 transition-transform" /> : <EyeOff size={13} className="opacity-50 group-hover:scale-110 transition-transform" />}
              <span className="relative z-10 mt-[1px]">FOG: {fogEnabled ? 'ON' : 'OFF'}</span>
              {fogEnabled && (
                <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-cyan-500/20 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
              )}
            </button>

            {!isPvP && (
              <button
                type="button"
                onClick={handleToggleLockVision}
                className={`group relative flex items-center gap-2 border text-[10px] font-black px-4 py-2 rounded-lg transition-all tracking-[0.15em] overflow-hidden ${lockVision
                  ? 'border-amber-500/50 bg-amber-900/40 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 hover:text-amber-200 shadow-[inset_0_0_10px_rgba(var(--arena-amber-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--arena-amber-rgb),0.4)]'
                  : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/30 hover:text-white/70'
                  }`}
                title="Link scanner (FOV) to body rotation. When ON, the scanner follows the robot body."
              >
                {lockVision ? <Lock size={13} className="group-hover:scale-110 transition-transform" /> : <Unlock size={13} className="opacity-50 group-hover:scale-110 transition-transform" />}
                <span className="relative z-10 mt-[1px]">LOCK: {lockVision ? 'ON' : 'OFF'}</span>
                {lockVision && (
                  <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-amber-500/20 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
                )}
              </button>
            )}
          </div>

          {modeData && (
            <div className="bg-black/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
              {modeData.type === 'KOTH' && (
                <>
                  <div className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-1">ZONE CONTROL</div>
                  <div className="flex flex-col gap-2">
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-[#22d3ee] transition-all duration-300"
                        style={{ width: `${Math.min(100, (modeData.zoneScores?.A || 0) / modeData.scoreTarget * 100)}%` }}
                      />
                    </div>
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-[#e879f9] transition-all duration-300"
                        style={{ width: `${Math.min(100, (modeData.zoneScores?.B || 0) / modeData.scoreTarget * 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
              {modeData.type === 'CTF' && (
                <>
                  <div className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-1">FLAG CAPTURES</div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-[#22d3ee]">TEAM A: {modeData.teamScores?.A || 0}/{modeData.scoreTarget}</span>
                    <span className="text-[#e879f9]">TEAM B: {modeData.teamScores?.B || 0}/{modeData.scoreTarget}</span>
                  </div>
                </>
              )}
              {modeData.type === 'SURVIVAL' && (
                <>
                  <div className="text-xs font-mono text-red-400/70 tracking-widest uppercase mb-1">SURVIVAL</div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-white">WAVE: {modeData.wave}</span>
                    <span className="text-red-400">ENEMIES: {modeData.enemiesRemaining}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="absolute left-8 top-44 bottom-8 pointer-events-auto flex" style={{ minWidth: '400px' }}>
          <CommandConsole
            socket={socket}
            robotId={selectedRobotId}
            availableRobots={availableRobots}
            onRobotChange={setSelectedRobotId}
            isMobile={isMobile}
          />
        </div>
      </div>

      <div className="absolute top-8 right-8 z-20 w-72 h-56 group">
        <div className="absolute inset-0 bg-cyan-950/10 backdrop-blur-xl border border-cyan-500/20 rounded-sm overflow-hidden transition-all group-hover:border-cyan-400/50 shadow-2xl">
          <div className="bg-cyan-900/20 px-3 py-2 flex justify-between items-center border-b border-cyan-500/20">
            <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em]">RADAR VIEW</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/50 rounded-full border border-cyan-500/30">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider">
                {displayMode === 'TRAINING_SOLO' ? '[TRAINING MODE]' : 
                 displayMode === 'RACING' ? '[RACING MODE]' : 
                 displayMode === 'KING_OF_THE_HILL' ? '[KING OF THE HILL]' :
                 displayMode === 'CAPTURE_THE_FLAG' ? '[CAPTURE THE FLAG]' :
                 displayMode === 'SURVIVAL' ? '[SURVIVAL]' :
                 '[COMBAT MODE]'}
              </span>
            </div>
          </div>
          <TacticalRadar
            isMobile={isMobile}
            robots={robots}
            projectiles={projectiles}
            fogEnabled={fogEnabled}
            displayMode={displayMode}
          />
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-widest">Connection_Status</span>
          <span className={`text-[11px] font-black tracking-widest ${isConnected ? 'text-cyan-400' : 'text-yellow-500 animate-pulse'}`}>
            {isConnected ? 'ONLINE' : 'RECONNECTING...'}
          </span>
        </div>
        <div className="h-8 w-px bg-cyan-900/50" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-widest">FOV_SYSTEM</span>
          <span className={`text-[11px] font-black tracking-widest ${fogEnabled ? 'text-cyan-400' : 'text-white/30'}`}>
            {fogEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>
        <div className="h-8 w-px bg-cyan-900/50" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-widest">LOCK_VISION</span>
          <span className={`text-[11px] font-black tracking-widest ${lockVision ? 'text-amber-400' : 'text-white/30'}`}>
            {lockVision ? 'LINKED' : 'FREE'}
          </span>
        </div>
      </div>
    </>
  );
}
