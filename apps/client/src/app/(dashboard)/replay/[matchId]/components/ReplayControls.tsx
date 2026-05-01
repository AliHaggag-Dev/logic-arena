"use client";

import React from "react";

interface Props {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onScrub: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ReplayControls({
  currentFrame,
  totalFrames,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onScrub,
}: Props) {
  return (
    <>
      <style>{`
        @keyframes pulse-cyan { 
          0%,100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb),0.4); } 
          50% { box-shadow: 0 0 0 6px rgba(var(--accent-rgb),0); } 
        }
        input[type=range] { 
          -webkit-appearance: none; width: 100%; height: 6px;
          background: rgba(var(--accent-rgb),0.15); border-radius: 6px; outline: none; 
        }
        input[type=range]::-webkit-slider-thumb { 
          -webkit-appearance: none; width: 24px; height: 24px;
          border-radius: 50%; background: var(--accent); cursor: pointer;
          box-shadow: 0 0 10px rgba(var(--accent-rgb),0.7); border: 2px solid rgba(0,0,0,0.8); 
        }
      `}</style>

      {/* Unified Responsive Container */}
      <div className="w-full max-w-[800px] bg-card/80 md:bg-card/60 border border-accent/[0.15] md:border-accent/[0.12] rounded-[14px] md:rounded-[10px] p-4 md:p-[20px_22px] flex flex-col gap-5 md:gap-[18px] drop-shadow-lg md:drop-shadow-none backdrop-blur-lg md:backdrop-blur-md">
        
        {/* Frame counter + Speed */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] tracking-[0.2em] md:tracking-[0.18em] text-accent/60 font-bold">
            FRAME <span className="text-accent">{currentFrame + 1}</span> / {totalFrames}
          </span>
          <div className="flex gap-1 md:gap-1.5  md:bg-transparent p-1 md:p-0 rounded-lg md:rounded-none border border-accent/10 md:border-none">
            {([0.5, 1, 2]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`h-[36px] md:h-auto px-3 md:p-[6px_12px] rounded-md md:rounded font-mono text-[10px] font-bold tracking-[0.1em] cursor-pointer transition-all duration-200 border ${speed === s
                    ? "text-accent border-accent/60 bg-accent/20 md:bg-accent/[0.12] shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)] md:shadow-none"
                    : "text-accent/70 md:text-accent/50 border-transparent md:border-accent/20 bg-transparent md:bg-card/60 md:hover:text-accent md:hover:border-accent/45"
                  }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Scrubber */}
        <input
          type="range"
          title="Scrubber"
          min={0}
          max={Math.max(0, totalFrames - 1)}
          value={currentFrame}
          onChange={onScrub}
          className="w-full h-8 md:h-auto touch-none my-1 md:my-0 cursor-pointer"
        />

        {/* Play / Pause / Reset */}
        <div className="grid grid-cols-[1fr_1fr] md:flex md:justify-center gap-3">
          {isPlaying ? (
            <button
              type="button"
              onClick={onPause}
              className="w-full md:w-auto md:inline-flex justify-center items-center gap-2 md:gap-[6px] h-[44px] md:h-auto md:p-[10px_22px] rounded-xl md:rounded-md text-[11px] font-black tracking-[0.15em] md:tracking-[0.14em] cursor-pointer font-mono transition-all duration-200 active:scale-95 md:active:scale-100 bg-accent/20 md:bg-accent/[0.22] border border-accent text-accent md:animate-[pulse-cyan_1.5s_infinite] shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] md:shadow-none"
            >
              ⏸ PAUSE
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              className="w-full md:w-auto md:inline-flex justify-center items-center gap-2 md:gap-[6px] h-[44px] md:h-auto md:p-[10px_22px] rounded-xl md:rounded-md text-[11px] font-black tracking-[0.15em] md:tracking-[0.14em] cursor-pointer font-mono transition-all duration-200 active:scale-95 md:active:scale-100 bg-accent/10 md:bg-accent/[0.08] border border-accent/40 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.15)] md:shadow-none hover:bg-accent/[0.18] hover:border-accent/70 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
            >
              ▶ PLAY
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="w-full md:w-auto md:inline-flex justify-center items-center gap-2 md:gap-[6px] h-[44px] md:h-auto md:p-[10px_22px] rounded-xl md:rounded-md text-[11px] font-black tracking-[0.15em] md:tracking-[0.14em] cursor-pointer font-mono transition-all duration-200 active:scale-95 md:active:scale-100 bg-accent/5 md:bg-accent/[0.08] border border-accent/20 md:border-accent/40 text-accent/70 md:text-accent hover:bg-accent/[0.18] hover:border-accent/70 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
          >
            ⏮ RESET
          </button>
        </div>

      </div>
    </>
  );
}
