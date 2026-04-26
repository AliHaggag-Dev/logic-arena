"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { CommandConsole } from './CommandConsole';
import { TacticalRadar } from './TacticalRadar';
import { RobotState, ProjectileState } from '../types';

interface DesktopHUDProps {
  displayMode: string;
  scriptTitle?: string;
  socket: Socket | null;
  fogEnabled: boolean;
  setFogEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRobotId: string;
  availableRobots: string[];
  setSelectedRobotId: (id: string) => void;
  isMobile: boolean;
  robots: RobotState[];
  projectiles: ProjectileState[];
  isConnected: boolean;
  isPvP?: boolean;
}

export function DesktopHUD({
  displayMode,
  scriptTitle,
  socket,
  fogEnabled,
  setFogEnabled,
  selectedRobotId,
  availableRobots,
  setSelectedRobotId,
  isMobile,
  robots,
  projectiles,
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
        onClick={() => setIsLeftPanelOpen(prev => !prev)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-40 bg-black/80 backdrop-blur-xl border-y border-r border-cyan-500/50 rounded-r-2xl cursor-pointer group hover:w-16 hover:bg-cyan-950/80 transition-all shadow-[8px_0_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(34,211,238,0.2)]"
      >
        <div className="flex flex-col items-center justify-center gap-4 h-full w-full">
          <span className="text-cyan-400 font-black tracking-[0.2em] transform -rotate-90 whitespace-nowrap text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
            {isLeftPanelOpen ? 'ZEN_MODE' : 'SYS_HUD'}
          </span>
          <span className={`text-cyan-400 font-mono text-2xl font-black transition-transform duration-500 drop-shadow-[0_0_10px_#22d3ee] ${isLeftPanelOpen ? 'rotate-0' : 'rotate-180'}`}>
            {'<'}
          </span>
        </div>
      </button>

      <div className={`absolute inset-0 z-30 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="absolute top-6 left-8 pointer-events-none">
          <h1 className="text-4xl font-black tracking-tighter text-cyan-400 italic leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
            LOGIC ARENA
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full animate-pulse ${displayMode === 'RACING' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' :
              displayMode === 'TRAINING_SOLO' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
                'bg-red-500 shadow-[0_0_8px_#ef4444]'
              }`} />
            <p className={`text-[10px] tracking-[0.2em] font-bold ${displayMode === 'RACING' ? 'text-yellow-700' :
              displayMode === 'TRAINING_SOLO' ? 'text-green-700' : 'text-red-700'
              }`}>
              v2.0.0 {displayMode === 'RACING' ? '[RACING OVAL]' : displayMode === 'TRAINING_SOLO' ? '[TRAINING SOLO]' : '[COMBAT ARENA]'}
            </p>
          </div>
        </div>

        <div className="absolute top-6 left-112.5 pointer-events-none flex opacity-40">
          <h2 className="text-xl font-bold text-red-500/80 tracking-[0.5em] uppercase italic">
            Arena: {scriptTitle}
          </h2>
        </div>

        <div className="absolute top-28 left-8 pointer-events-auto flex items-center gap-3 bg-black/80 backdrop-blur-xl border-l-4 border-cyan-500 p-4 rounded-r shadow-[10px_10px_30px_rgba(0,0,0,0.9)]">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-cyan-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-cyan-500/50 to-transparent" />
          {!isPvP && (
            <button
              type="button"
              onClick={handleResetGame}
              className="group relative border border-red-900 bg-red-950/30 text-red-500 text-[10px] font-black px-6 py-2.5 transition-all hover:bg-red-900/50 hover:border-red-500 hover:text-white tracking-[0.2em] overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <span className="relative z-10">[ EXECUTE RESPAWN ]</span>
              <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-red-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setFogEnabled((prev: boolean) => !prev)}
            className={`group relative border text-[10px] font-black px-6 py-2.5 transition-all tracking-[0.2em] overflow-hidden ${fogEnabled
              ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300 hover:bg-cyan-500/40 hover:text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]'
              : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/40'
              }`}
          >
            <span className="relative z-10">[ FOG_SYSTEM: {fogEnabled ? 'ONLINE' : 'OFFLINE'} ]</span>
            {fogEnabled && (
              <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-cyan-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
            )}
          </button>
          <button
            type="button"
            onClick={handleToggleLockVision}
            className={`group relative border text-[10px] font-black px-6 py-2.5 transition-all tracking-[0.2em] overflow-hidden ${lockVision
              ? 'border-amber-500 bg-amber-900/40 text-amber-300 hover:bg-amber-500/40 hover:text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)]'
              : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/40'
              }`}
            title="Link scanner (FOV) to body rotation. When ON, the scanner follows the robot body."
          >
            <span className="relative z-10">[ LOCK_VISION: {lockVision ? 'LINKED' : 'FREE'} ]</span>
            {lockVision && (
              <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-amber-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
            )}
          </button>
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
            <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em]">TACTICAL_VIEW</span>
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-cyan-500/40 animate-pulse" />
              <span className="w-1 h-1 bg-cyan-500/40 animate-pulse [animation-delay:200ms]" />
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
            {isConnected ? 'UPLINK_STABLE' : 'REESTABLISHING_LINK...'}
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
