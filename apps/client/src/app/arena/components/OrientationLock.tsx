"use client";

import React from 'react';

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

export function OrientationLock() {
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
        <button
          type="button"
          onClick={async () => {
            try {
              // In PWA/standalone mode, requestFullscreen might fail, but orientation.lock can still work.
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
                alert("للأسف تليفونك أو متصفحك مابيدعمش لف الشاشة التلقائي.\n\nمن فضلك اقفل الـ Rotation Lock من إعدادات موبايلك ولف الموبايل بإيدك عشان تخش الحلبة.");
              }
            } catch (err) {
              console.warn("Orientation lock failed:", err);
              alert("مش قادرين نلف الشاشة تلقائياً. اتأكد إنك قافل الـ Rotation Lock في موبايلك ولفه بإيدك عشان تدخل الحلبة.");
            }
          }}
          className="mt-8 flex flex-col items-center px-6 py-4 border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-all rounded-lg cursor-pointer"
        >
          <span className="text-cyan-400 text-sm font-black tracking-[0.4em] uppercase animate-pulse">Rotate Device to Enter</span>
          <span className="text-cyan-500/50 text-[9px] tracking-[0.2em] font-bold mt-3 max-w-[200px] leading-relaxed">
            TAP TO FORCE FULLSCREEN, OR DISABLE YOUR PHONE'S ROTATION LOCK.
          </span>
        </button>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10 text-[10px] tracking-[1em] text-cyan-500 font-bold whitespace-nowrap">
        v4.2
      </div>
    </div>
  );
}
