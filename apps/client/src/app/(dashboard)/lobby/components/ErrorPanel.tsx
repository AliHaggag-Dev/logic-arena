import React from "react";

interface Props {
  onRetry: () => void;
}

export function ErrorPanel({ onRetry }: Props) {
  return (
    <div className="text-center p-[60px_24px] border border-dashed border-red-500/20 rounded-xl bg-red-500/5 backdrop-blur-md flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
        <p className="text-[11px] tracking-[0.22em] text-red-500/80 uppercase font-bold">
          NETWORK_ERROR — BATTLEFIELD SCANNER OFFLINE
        </p>
        <p className="text-[10px] tracking-[0.14em] text-red-500/40 uppercase">
          Unable to reach the lobby server. Check your connection.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-2.5 rounded-md text-[10px] font-black tracking-[0.25em] font-mono cursor-pointer transition-all duration-200 bg-red-500/10 border border-red-500/30 text-red-500/80 hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      >
        [ RETRY CONNECTION ]
      </button>
    </div>
  );
}
