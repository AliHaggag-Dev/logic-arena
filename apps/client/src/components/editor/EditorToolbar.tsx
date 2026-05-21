"use client";

import React from "react";
import { Lightbulb, Play, Wand2 } from "lucide-react";

const PRIMARY_HAPTIC_MS = 50;

interface EditorToolbarProps {
  onRun: () => void;
  onHint?: () => void;
  onFormat?: () => void;
  disabled: boolean;
  isMobile: boolean;
}

export function EditorToolbar({ onRun, onHint, onFormat, disabled, isMobile }: EditorToolbarProps) {
  const buttonHeightClass = isMobile ? "h-12" : "h-9";
  const iconButtonWidthClass = isMobile ? "min-w-[48px]" : "min-w-[44px]";

  const handleRun = (): void => {
    navigator.vibrate?.(PRIMARY_HAPTIC_MS);
    onRun();
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/[0.03] p-2">
      <button
        type="button"
        onClick={handleRun}
        disabled={disabled}
        title="Run script with Ctrl+Enter"
        className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 ${buttonHeightClass} text-[10px] font-black uppercase tracking-[0.24em] transition-all duration-150 ${
          disabled
            ? "cursor-not-allowed border-accent/15 bg-accent/5 text-accent/25"
            : "cursor-pointer border-accent/45 bg-accent/10 text-accent hover:border-accent/70 hover:bg-accent/20"
        }`}
      >
        <Play className="h-3.5 w-3.5" />
        <span>RUN</span>
        {!isMobile && <span className="text-[8px] tracking-[0.16em] text-accent/45">CTRL+ENTER</span>}
      </button>

      {onHint && (
        <button
          type="button"
          onClick={onHint}
          disabled={disabled}
          title="Show hint"
          aria-label="Show hint"
          className={`flex ${buttonHeightClass} ${iconButtonWidthClass} items-center justify-center rounded-md border border-accent/25 bg-accent/5 px-3 text-accent/70 transition-all duration-150 hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Lightbulb className="h-4 w-4" />
        </button>
      )}

      {onFormat && (
        <button
          type="button"
          onClick={onFormat}
          disabled={disabled}
          title="Format script"
          aria-label="Format script"
          className={`flex ${buttonHeightClass} ${iconButtonWidthClass} items-center justify-center rounded-md border border-accent/25 bg-accent/5 px-3 text-accent/70 transition-all duration-150 hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Wand2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
