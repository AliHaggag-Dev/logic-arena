"use client";

import React from 'react';

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

export function OrientationLock() {
  const [lockError, setLockError] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(var(--arena-cyan-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--arena-cyan-rgb),0.2) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay opacity-20">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-[scanline_3s_linear_infinite]" />
      </div>
      <div className="relative mb-12">
        <div className="w-32 h-32 border-2 border-cyan-500/20 rounded-full animate-ping opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative animate-[rotate-phone_3s_ease-in-out_infinite]">
          <div className="w-16 h-28 border-4 border-cyan-500 rounded-2xl relative shadow-[0_0_30px_rgba(var(--arena-cyan-rgb),0.3)]">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-700 rounded-full" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-cyan-700 rounded-full" />
            <div className="absolute inset-2 bg-cyan-500/10 rounded-sm overflow-hidden">
              <div className="w-full h-1 bg-cyan-500/40 animate-scan" />
            </div>
          </div>
        </div>
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-cyan-400 text-4xl font-black animate-pulse">↻</div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(var(--sem-danger-rgb),0.8)]" />
          <h2 className="text-cyan-400 text-xl font-black tracking-[0.2em] uppercase italic">Orientation_Lock</h2>
        </div>
        <p className="text-cyan-500/60 text-xs tracking-[0.3em] font-bold max-w-[240px] uppercase leading-relaxed">
          Combat systems optimized for horizontal field of view.
        </p>
        <div className="relative mt-8">
          {/* Floating Arrow Pointing Down */}
          {!lockError && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center">
              <span className="text-cyan-400 text-[9px] font-black tracking-[0.2em] uppercase mb-1">PRESS HERE</span>
              <svg className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}

          <button
            type="button"
            onClick={async () => {
              setLockError(false);
              try {
                if (document.documentElement.requestFullscreen) {
                  try {
                    await document.documentElement.requestFullscreen();
                  } catch (fullscreenError) {
                    console.warn("Fullscreen request skipped or failed (might be PWA):", fullscreenError);
                  }
                }
  
                const orientation = screen?.orientation as LockableScreenOrientation | undefined;
                if (typeof orientation?.lock === 'function') {
                  await orientation.lock('landscape');
                } else {
                  setLockError(true);
                }
              } catch (err) {
                console.warn("Orientation lock failed:", err);
                setLockError(true);
              }
            }}
            className="group relative flex w-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl p-[2px] transition-transform duration-300 active:scale-95"
            style={{ boxShadow: "0 0 40px rgba(var(--arena-cyan-rgb), 0.2)" }}
          >
            {/* Animated border gradient */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--arena-cyan),var(--arena-purple),var(--arena-cyan))] animate-[sweep_3s_linear_infinite] bg-[length:200%_auto]" />
            
            <div className="relative flex w-full flex-col items-center rounded-[14px] bg-black/90 px-8 py-5 backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/80">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(var(--arena-cyan-rgb),0.5)]">
                  <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-30" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </div>
                <span className="text-cyan-400 text-sm font-black tracking-[0.3em] uppercase group-hover:text-white transition-colors duration-300">
                  TAP TO ENTER
                </span>
              </div>
              
              <span className="mt-3 text-cyan-500/60 text-[9px] tracking-[0.15em] font-bold leading-relaxed group-hover:text-cyan-400/80 transition-colors duration-300 uppercase">
                Force Fullscreen & Auto-Rotate
              </span>
            </div>
          </button>
        </div>

        {lockError && (
          <div className="mt-6 flex flex-col items-center animate-[modalIn_0.3s_ease-out] text-center max-w-[280px]">
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <p className="text-[11px] font-black tracking-widest uppercase mb-1.5 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Auto-Rotate Failed
              </p>
              <p className="text-[9.5px] font-bold leading-relaxed opacity-80 uppercase tracking-[0.1em]">
                Please disable rotation lock on your device and rotate it manually to enter the arena.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
