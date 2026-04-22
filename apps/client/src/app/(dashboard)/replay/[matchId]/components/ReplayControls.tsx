import React from "react";
import { useMediaQuery } from "../../../../../hooks/useMediaQuery";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  const DesktopControls = (
    <div className="w-full max-w-[420px] bg-card/60 border border-accent/[0.12] rounded-[10px] p-[20px_22px] backdrop-blur-md flex flex-col gap-[18px]">
      {/* Frame counter + Speed */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] tracking-[0.18em] text-accent/60 font-bold">
          FRAME <span className="text-accent">{currentFrame + 1}</span> / {totalFrames}
        </span>
        <div className="flex gap-1.5">
          {([0.5, 1, 2]).map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`p-[6px_12px] rounded font-mono text-[10px] font-bold tracking-[0.1em] cursor-pointer transition-all duration-200 border ${speed === s
                  ? "text-accent border-accent/60 bg-accent/[0.12]"
                  : "text-accent/50 border-accent/20 bg-card/60 hover:text-accent hover:border-accent/45"
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
        min={0}
        max={Math.max(0, totalFrames - 1)}
        value={currentFrame}
        onChange={onScrub}
      />

      {/* Play / Pause / Reset */}
      <div className="flex justify-center gap-3">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="inline-flex items-center gap-[6px] p-[10px_22px] rounded-md text-[11px] font-bold tracking-[0.14em] cursor-pointer font-mono transition-all duration-200 bg-accent/[0.22] border border-accent text-accent animate-[pulse-cyan_1.5s_infinite]"
          >
            ⏸ PAUSE
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="inline-flex items-center gap-[6px] p-[10px_22px] rounded-md text-[11px] font-bold tracking-[0.14em] cursor-pointer font-mono transition-all duration-200 bg-accent/[0.08] border border-accent/40 text-accent hover:bg-accent/[0.18] hover:border-accent/70 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
          >
            ▶ PLAY
          </button>
        )}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-[6px] p-[10px_22px] rounded-md text-[11px] font-bold tracking-[0.14em] cursor-pointer font-mono transition-all duration-200 bg-accent/[0.08] border border-accent/40 text-accent hover:bg-accent/[0.18] hover:border-accent/70 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
        >
          ⏮ RESET
        </button>
      </div>
    </div>
  );

  const MobileControls = (
    <div className="w-full bg-card/80 border border-accent/[0.15] rounded-[14px] p-4 flex flex-col gap-5 drop-shadow-lg backdrop-blur-lg">
      {/* Frame counter */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] tracking-[0.2em] text-accent/60 font-bold">
          FRAME <span className="text-accent">{currentFrame + 1}</span> / {totalFrames}
        </span>
        <div className="flex gap-1 bg-accent/5 p-1 rounded-lg border border-accent/10">
          {([0.5, 1, 2]).map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`h-[36px] px-3 rounded-md font-mono text-[10px] font-bold tracking-[0.1em] transition-transform active:scale-95 border ${speed === s
                  ? "text-accent border-accent/60 bg-accent/20 shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]"
                  : "text-accent/70 border-transparent bg-transparent"
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
        min={0}
        max={Math.max(0, totalFrames - 1)}
        value={currentFrame}
        onChange={onScrub}
        className="w-full h-8 touch-none my-1" // Extra height for touch target on mobile
      />

      {/* Play / Pause / Reset */}
      <div className="grid grid-cols-[1fr_1fr] gap-3">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="w-full h-[44px] flex justify-center items-center gap-2 rounded-xl text-[11px] font-black tracking-[0.15em] font-mono transition-transform active:scale-95 bg-accent/20 border border-accent text-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)]"
          >
            ⏸ PAUSE
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="w-full h-[44px] flex justify-center items-center gap-2 rounded-xl text-[11px] font-black tracking-[0.15em] font-mono transition-transform active:scale-95 bg-accent/10 border border-accent/40 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.15)]"
          >
            ▶ PLAY
          </button>
        )}
        <button
          onClick={onReset}
          className="w-full h-[44px] flex justify-center items-center gap-2 rounded-xl text-[11px] font-black tracking-[0.15em] font-mono transition-transform active:scale-95 bg-accent/5 border border-accent/20 text-accent/70"
        >
          ⏮ RESET
        </button>
      </div>
    </div>
  );

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
          -webkit-appearance: none; width: 20px; height: 20px;
          border-radius: 50%; background: var(--accent); cursor: pointer;
          box-shadow: 0 0 10px rgba(var(--accent-rgb),0.7); border: 2px solid rgba(0,0,0,0.8); 
        }
      `}</style>

      {isMobile ? MobileControls : DesktopControls}
    </>
  );
}
