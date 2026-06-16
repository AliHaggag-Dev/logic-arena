'use client';

import React from 'react';
import { RobotState, ProjectileState } from '../types';

interface TacticalRadarProps {
  isMobile: boolean;
  isExpanded?: boolean;
  robots: RobotState[];
  projectiles: ProjectileState[];
  fogEnabled: boolean;
  displayMode: string;
}

const GRID_CELLS = Array.from({ length: 64 }, (_, i) => i);

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  isMobile,
  isExpanded = false,
  robots,
  projectiles,
  fogEnabled,
  displayMode,
}) => {
  const containerClasses = isMobile && isExpanded
    ? "w-full h-full p-4"
    : "relative w-full h-[calc(100%-30px)] p-0 overflow-hidden bg-[radial-gradient(circle,rgba(var(--arena-cyan-rgb),0.05)_1px,transparent_1px)] bg-[size:20px_20px]";

  return (
    <div className={containerClasses}>
      {/* Scan line */}
      <div className="absolute top-0 left-0 w-full h-px bg-arena-radar-scan/30 shadow-[0_0_8px_var(--arena-radar-scan)] animate-scan z-10" />

      {/* Grid */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10 pointer-events-none">
        {GRID_CELLS.map((i) => (
          <div key={i} className="border-[0.5px] border-cyan-500/30" />
        ))}
      </div>

      {robots.map((robot) => {
        const posX = (robot.position.x / 800) * 100;
        const posY = (robot.position.y / 600) * 100;
        const energyPct = Math.round(((robot.energy ?? 1000) / (robot.maxEnergy ?? 1000)) * 100);

        const isVisible = !fogEnabled || robots.some(
          (r) => r.id !== robot.id && (r.visibleRobotIds ?? []).includes(robot.id)
        );

        const dotSize = isMobile && !isExpanded ? 'w-2 h-2' : 'w-2.5 h-2.5';
        const barWidth = isMobile && !isExpanded ? 'w-4' : 'w-6';
        const robotRadarColor = robot.color || 'var(--arena-training-brand)';

        return (
          <div
            key={robot.id}
            className="absolute transition-all duration-300 ease-linear"
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: 'translate(-50%, -50%)',
              opacity: isVisible ? 1 : 0.2,
            }}
          >
            <div className="relative flex items-center justify-center">
              {/* Ping ring */}
              <div
                className="absolute w-4 h-4 rounded-full border border-current opacity-20 animate-ping"
                style={{ color: robotRadarColor }}
              />

              {/* Dot blip instead of triangle */}
              <div
                className={`${dotSize} rounded-full shadow-[0_0_6px_currentColor]`}
                style={{
                  backgroundColor: robotRadarColor,
                  color: robotRadarColor,
                }}
              />

              {/* Health bar */}
              <div className={`absolute -top-3 ${barWidth} h-0.5 bg-gray-900 border border-white/10`}>
                <div className="h-full bg-green-400" style={{ width: `${robot.health || 100}%` }} />
              </div>

              {/* Energy bar */}
              <div className={`absolute -top-1.75 ${barWidth} h-0.5 bg-gray-900/80 border border-cyan-900/30`}>
                <div
                  className={`h-full transition-all ${robot.inStasis ? 'bg-blue-400' :
                    energyPct <= 20 ? 'bg-amber-400 animate-pulse' :
                      'bg-cyan-400'
                    }`}
                  style={{ width: `${energyPct}%` }}
                />
              </div>

              {/* ID label — hidden on compact mobile */}
              {!(isMobile && !isExpanded) && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-1 border border-cyan-500/20">
                  <span className="text-[8px] text-cyan-400 font-mono font-bold whitespace-nowrap tracking-tighter uppercase">
                    {robot.id.slice(0, 4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Projectiles */}
      {displayMode === 'COMBAT' && projectiles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${(p.position.x / 800) * 100}%`,
            top: `${(p.position.y / 600) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-1 h-1 rounded-full bg-arena-projectile shadow-[0_0_4px_var(--arena-projectile)]" />
        </div>
      ))}

      <style jsx>{`
        @keyframes scan {
          from { top: 0%;   opacity: 0; }
          50%  {             opacity: 1; }
          to   { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
};
