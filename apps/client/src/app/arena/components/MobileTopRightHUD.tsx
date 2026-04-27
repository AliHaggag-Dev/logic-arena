"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { TacticalRadar } from './TacticalRadar';
import { RobotState, ProjectileState } from '../types';

interface MobileHUDProps {
  fps: number;
  fogEnabled: boolean;
  setFogEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  socket: Socket | null;
  isConnected: boolean;
  robots: RobotState[];
  projectiles: ProjectileState[];
  displayMode: string;
}

export const MobileTopRightHUD: React.FC<MobileHUDProps> = ({
  fps, fogEnabled, setFogEnabled, socket, isConnected,
  robots, projectiles, displayMode,
}) => {
  const fpsColor = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';
  const [lockVision, setLockVision] = useState(false);

  const dummies = robots.filter(r => r.id.startsWith('dummy-'));
  const aliveDummies = dummies.filter(d => d.health > 0).length;
  const allDead = aliveDummies === 0 && dummies.length > 0;

  useEffect(() => {
    if (!socket) return;
    const handleLockVisionToggled = (data: { robotId: string; lockVision: boolean | null }) => {
      if (data.lockVision !== null) setLockVision(data.lockVision);
    };
    socket.on('lockVisionToggled', handleLockVisionToggled);
    return () => { socket.off('lockVisionToggled', handleLockVisionToggled); };
  }, [socket]);

  const handleResetGame = useCallback(() => {
    socket?.emit('resetGame');
    setLockVision(false);
  }, [socket]);

  const handleToggleLockVision = useCallback(() => {
    socket?.emit('toggleLockVision');
  }, [socket]);

  return (
    <>
      <div className="fixed top-3 right-3 z-40 flex flex-row-reverse items-start gap-2">
        <div className="w-28 bg-black/50 backdrop-blur-md border border-cyan-500/15 rounded-xl overflow-hidden shadow-xl">
          <div className="px-2 py-0.5 border-b border-cyan-500/10 flex justify-between items-center">
            <span className="text-[6px] text-cyan-700 font-black tracking-widest uppercase">Tactical</span>
            <span className="w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse" />
          </div>
          <div className="aspect-square w-full">
            <TacticalRadar
              isMobile={true}
              isExpanded={false}
              robots={robots}
              projectiles={projectiles}
              fogEnabled={fogEnabled}
              displayMode={displayMode}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {displayMode !== 'TRAINING_SOLO' ? (
            <button
              type="button"
              onClick={handleResetGame}
              className="group flex items-center gap-1.5 px-2 py-1.5 bg-black/50 backdrop-blur-md border border-red-500/30 rounded-lg hover:border-red-400/60 hover:bg-red-950/30 active:scale-95 transition-all shadow-[0_0_8px_rgba(239,68,68,0.1)] hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
            >
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute w-2 h-2 rounded-full bg-red-500/30 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
              </span>
              <span className="text-[7px] text-red-400/70 font-black tracking-widest uppercase">Respawn</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => socket?.emit('respawnDummies')}
              className={`group flex items-center gap-1.5 px-2 py-1.5 backdrop-blur-md border rounded-lg active:scale-95 transition-all ${
                allDead
                  ? 'bg-[#00ffff]/20 border-[#00ffff]/60 shadow-[0_0_12px_rgba(0,255,255,0.4)] animate-pulse'
                  : 'bg-[#00ffff]/5 border-[#00ffff]/20 hover:border-[#00ffff]/50'
              }`}
            >
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className={`w-1.5 h-1.5 rounded-full bg-[#00ffff] shadow-[0_0_4px_rgba(0,255,255,0.8)]`} />
              </span>
              <span className="text-[7px] text-[#00ffff]/80 font-black tracking-widest uppercase flex items-center gap-1">
                RESPAWN DUMMIES
                {dummies.length > 0 && (
                  <span className={`px-1 py-0.5 rounded text-[6px] ${allDead ? 'bg-[#ff0055] text-white' : 'bg-[#00ffff]/20 text-[#00ffff]'}`}>
                    {aliveDummies}/{dummies.length}
                  </span>
                )}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setFogEnabled((prev: boolean) => !prev)}
            className={`group flex items-center gap-1.5 px-2 py-1.5 backdrop-blur-md border rounded-lg active:scale-95 transition-all ${fogEnabled
              ? 'bg-cyan-950/40 border-cyan-500/40 hover:border-cyan-400/70 hover:bg-cyan-900/30 shadow-[0_0_8px_rgba(34,211,238,0.15)] hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]'
              : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5'
              }`}
          >
            <span className="relative flex items-center justify-center w-2 h-2">
              {fogEnabled && <span className="absolute w-2 h-2 rounded-full bg-cyan-500/30 animate-ping" />}
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${fogEnabled
                ? 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]'
                : 'bg-white/25'
                }`} />
            </span>
            <span className={`text-[7px] font-black tracking-widest uppercase transition-colors ${fogEnabled ? 'text-cyan-400/70' : 'text-white/25'
              }`}>
              {fogEnabled ? 'Fog On' : 'Fog Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleLockVision}
            className={`group flex items-center gap-1.5 px-2 py-1.5 backdrop-blur-md border rounded-lg active:scale-95 transition-all ${lockVision
              ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400/70 hover:bg-amber-900/30 shadow-[0_0_8px_rgba(245,158,11,0.15)] hover:shadow-[0_0_12px_rgba(245,158,11,0.35)]'
              : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5'
              }`}
          >
            <span className="relative flex items-center justify-center w-2 h-2">
              {lockVision && <span className="absolute w-2 h-2 rounded-full bg-amber-500/30 animate-ping" />}
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${lockVision
                ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.8)]'
                : 'bg-white/25'
                }`} />
            </span>
            <span className={`text-[7px] font-black tracking-widest uppercase transition-colors ${lockVision ? 'text-amber-400/70' : 'text-white/25'
              }`}>
              {lockVision ? 'Vision: Linked' : 'Vision: Free'}
            </span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full">
          <span className="text-[7px] text-white/20 font-mono uppercase tracking-widest">fps</span>
          <span
            className="text-[10px] font-black font-mono tabular-nums transition-colors duration-300"
            style={{ color: fpsColor }}
          >
            {fps}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full">
          <span className={`w-1 h-1 rounded-full ${isConnected
            ? 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]'
            : 'bg-yellow-400 animate-pulse'
            }`} />
          <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">
            {isConnected ? 'uplink' : 'linking'}
          </span>
        </div>
      </div>
    </>
  );
};
