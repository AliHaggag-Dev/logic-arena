/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { CommandConsole } from './CommandConsole';
import { TacticalRadar } from './TacticalRadar';
import { RefreshCw, Eye, EyeOff, Lock, Unlock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { RobotState, ProjectileState, ModeData } from '../types';
import { PhaseBanner } from './Tactical/PhaseBanner';

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
  isClassicMode?: boolean;
  classicTokensLeft?: number;
  classicMaxTokens?: number;
  onClassicEdit?: (script: string, tokensLeft: number) => void;
  initialScript?: string;
  matchPhase?: string;
  phaseEndsAt?: number;
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
  isClassicMode = false,
  classicTokensLeft = 0,
  classicMaxTokens,
  onClassicEdit,
  initialScript,
  matchPhase,
  phaseEndsAt = 0,
}: DesktopHUDProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [lockVision, setLockVision] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

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
      {displayMode === 'TACTICAL' && matchPhase && (
        <PhaseBanner phase={matchPhase} phaseEndsAt={phaseEndsAt} />
      )}
      
      <button
        type="button"
        aria-label={isLeftPanelOpen ? 'Collapse arena HUD panel' : 'Expand arena HUD panel'}
        onClick={() => setIsLeftPanelOpen(prev => !prev)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-40 bg-black/80 backdrop-blur-xl border-y border-r border-cyan-500/50 rounded-r-2xl cursor-pointer group hover:w-16 hover:bg-cyan-950/80 transition-all shadow-[8px_0_30px_rgba(var(--arena-black-rgb),0.8),inset_0_0_15px_rgba(var(--arena-cyan-rgb),0.2)]"
      >
        <div className="flex flex-col items-center justify-center gap-4 h-full w-full">
          <span className="text-cyan-400 font-black tracking-[0.2em] transform -rotate-90 whitespace-nowrap text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
            {isLeftPanelOpen ? 'Zen Mode' : 'Arena HUD'}
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
              v3.1.0 {displayMode === 'RACING' ? '[RACING OVAL]' : displayMode === 'TRAINING_SOLO' ? '[TRAINING SOLO]' : displayMode === 'SURVIVAL' ? '[SURVIVAL]' : '[COMBAT ARENA]'}
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
                  className="group relative flex items-center gap-2 border border-red-500/30 bg-red-950/40 text-red-400 text-[10px] font-black px-4 py-2 rounded-lg transition-all hover:bg-red-500/20 hover:border-red-500 hover:text-red-300 tracking-[0.15em] overflow-hidden shadow-[inset_0_0_10px_rgba(var(--sem-danger-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--sem-danger-rgb),0.4)] cursor-pointer"
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
              className={`group relative flex items-center gap-2 border text-[10px] font-black px-4 py-2 rounded-lg transition-all tracking-[0.15em] overflow-hidden cursor-pointer ${fogEnabled
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
                className={`group relative flex items-center gap-2 border text-[10px] font-black px-4 py-2 rounded-lg transition-all tracking-[0.15em] overflow-hidden cursor-pointer ${lockVision
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
                  <div className="text-xs font-mono text-red-400/70 tracking-widest uppercase mb-1">SURVIVAL PROTOCOL</div>
                  <div className="flex flex-col gap-1 font-mono text-sm">
                    <div className="flex justify-between border-b border-red-500/20 pb-1">
                      <span className="text-white/60">WAVE:</span>
                      <span className="text-white font-bold">{modeData.wave} <span className="text-red-500/50">/ 10</span></span>
                    </div>
                    <div className="flex justify-between border-b border-red-500/20 pb-1">
                      <span className="text-white/60">ENEMIES LEFT:</span>
                      <span className="text-red-400 font-bold">{modeData.enemiesRemaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">TOTAL KILLS:</span>
                      <span className="text-amber-400 font-bold">{modeData.totalKills}</span>
                    </div>
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
            isZenMode={isZenMode}
            setIsZenMode={setIsZenMode}
            isClassicMode={isClassicMode}
            classicTokensLeft={classicTokensLeft}
            classicMaxTokens={classicMaxTokens}
            onClassicEdit={onClassicEdit}
            initialScript={initialScript}
            matchPhase={matchPhase}
            displayMode={displayMode}
          />
        </div>
      </div>

      <div className="absolute top-8 right-8 z-20 w-72 h-56 group">
        <div className="absolute inset-0 bg-cyan-950/10 backdrop-blur-xl border border-cyan-500/20 rounded-sm overflow-hidden transition-all group-hover:border-cyan-400/50 shadow-2xl">
          <div className="bg-cyan-900/20 px-3 py-2 flex justify-between items-center border-b border-cyan-500/20">
            <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em]">RADAR</span>
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

      {modeData?.type === 'SURVIVAL' && (
        <div className="absolute top-[272px] right-8 z-20 w-72">
          <div className="bg-black/60 backdrop-blur-xl border border-red-500/20 rounded-sm overflow-hidden shadow-2xl">
            <div className="bg-red-900/20 px-3 py-2 border-b border-red-500/20">
              <span className="text-red-400 text-[10px] font-black tracking-[0.3em]">SURVIVAL PROTOCOL</span>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/50 font-mono">WAVE</span>
                <span className="text-[13px] font-mono font-bold text-white">{modeData.wave} <span className="text-red-500/50">/ 10</span></span>
              </div>
              <div className="flex justify-between items-center border-t border-red-500/10 pt-1.5">
                <span className="text-[10px] text-white/50 font-mono">ENEMIES LEFT</span>
                <span className="text-[13px] font-mono font-bold text-red-400">{modeData.enemiesRemaining}</span>
              </div>
              <div className="flex justify-between items-center border-t border-red-500/10 pt-1.5">
                <span className="text-[10px] text-white/50 font-mono">TOTAL KILLS</span>
                <span className="text-[13px] font-mono font-bold text-amber-400">{modeData.totalKills}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {modeData?.type === 'CTF' && (
        <div className="absolute top-[272px] right-8 z-20 w-72">
          <div className="bg-black/60 backdrop-blur-xl border border-purple-500/20 rounded-sm overflow-hidden shadow-2xl">
            <div className="bg-purple-900/20 px-3 py-2 border-b border-purple-500/20">
              <span className="text-purple-400 text-[10px] font-black tracking-[0.3em]">CAPTURE THE FLAG</span>
            </div>
            <div className="px-3 py-2 flex flex-col gap-2">
              {modeData.flags.map((flag) => {
                const carrier = robots.find(r => r.id === flag.carrierId);
                const statusText = flag.atBase ? 'AT BASE'
                  : carrier ? `CARRIED BY ${carrier.id === selectedRobotId ? 'YOU' : 'ENEMY'}`
                  : 'DROPPED';
                const isOwn = flag.team === 'A';
                return (
                  <div key={flag.team} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOwn ? 'bg-[#22d3ee]' : 'bg-[#e879f9]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-white/80">
                          FLAG {flag.team}
                        </span>
                        <span className={`text-[9px] font-mono font-bold ${
                          flag.atBase ? 'text-green-400'
                          : carrier ? 'text-amber-400 animate-pulse'
                          : 'text-white/40'
                        }`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between items-center border-t border-purple-500/10 pt-2 mt-1">
                <span className="text-[10px] text-white/50 font-mono">SCORE</span>
                <span className="text-[12px] font-mono font-bold">
                  <span className="text-[#22d3ee]">{modeData.teamScores?.A || 0}</span>
                  <span className="text-white/30 mx-1">-</span>
                  <span className="text-[#e879f9]">{modeData.teamScores?.B || 0}</span>
                  <span className="text-white/40 ml-1">/ {modeData.scoreTarget}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-widest">Connection</span>
          <span className={`text-[11px] font-black tracking-widest ${isConnected ? 'text-cyan-400' : 'text-yellow-500 animate-pulse'}`}>
            {isConnected ? 'ONLINE' : 'RECONNECTING...'}
          </span>
        </div>
        <div className="h-8 w-px bg-cyan-900/50" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-widest">Fog</span>
          <span className={`text-[11px] font-black tracking-widest ${fogEnabled ? 'text-cyan-400' : 'text-white/30'}`}>
            {fogEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>
        <div className="h-8 w-px bg-cyan-900/50" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-widest">Camera Lock</span>
          <span className={`text-[11px] font-black tracking-widest ${lockVision ? 'text-amber-400' : 'text-white/30'}`}>
            {lockVision ? 'LINKED' : 'FREE'}
          </span>
        </div>
      </div>
    </>
  );
}
