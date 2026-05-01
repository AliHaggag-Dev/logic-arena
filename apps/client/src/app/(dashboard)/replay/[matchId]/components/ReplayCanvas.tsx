"use client";

import React, { forwardRef } from "react";
import { CANVAS_W, CANVAS_H } from "./canvasRenderer";

export const ReplayCanvas = forwardRef<HTMLCanvasElement>((props, ref) => {
  return (
    <div className="relative w-full max-w-[800px] rounded-[14px] overflow-hidden border border-accent/20 shadow-[0_0_40px_rgba(var(--accent-rgb),0.06),0_0_0_1px_rgba(var(--accent-rgb),0.05)] bg-[#030712]">
      {/* 
        We render the canvas at a high internal resolution (800x600) 
        and use CSS to scale it responsively to its container.
      */}
      <canvas
        ref={ref}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-auto block"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
      />
      
      {/* Corner accents */}
      {[
        { top: 0, left: 0, borderTop: true, borderLeft: true },
        { top: 0, right: 0, borderTop: true, borderRight: true },
        { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
        { bottom: 0, right: 0, borderBottom: true, borderRight: true },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-4 h-4 pointer-events-none"
          style={{
            top: pos.top !== undefined ? 0 : undefined,
            bottom: pos.bottom !== undefined ? 0 : undefined,
            left: pos.left !== undefined ? 0 : undefined,
            right: pos.right !== undefined ? 0 : undefined,
            borderTop: pos.borderTop ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
            borderBottom: pos.borderBottom ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
            borderLeft: pos.borderLeft ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
            borderRight: pos.borderRight ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
          }}
        />
      ))}
    </div>
  );
});

ReplayCanvas.displayName = "ReplayCanvas";

export { CANVAS_W };
