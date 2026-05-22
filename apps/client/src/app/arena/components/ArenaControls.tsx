'use client';

import React from 'react';
import { TerminalOutput } from './CommandConsole/TerminalOutput';

interface ArenaControlsProps {
  isMobile: boolean;
  commandInput: string;
  setCommandInput: (val: string) => void;
  handleCommandSubmit: (e: React.FormEvent) => void;
  output: string[];
  isLogsOpen: boolean;
  setIsLogsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  isLoading?: boolean;
}

export const ArenaControls: React.FC<ArenaControlsProps> = ({
  isMobile,
  commandInput,
  setCommandInput,
  handleCommandSubmit,
  output,
  isLogsOpen,
  setIsLogsOpen,
  isLoading = false,
}) => {
  return (
    <div className={`flex flex-col gap-4 ${isMobile ? 'w-full' : ''}`}>
      {/* Override Console */}
      <form
        onSubmit={handleCommandSubmit}
        className={`flex items-center gap-2 bg-black/40 border border-cyan-900/50 rounded-lg p-3 focus-within:border-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(var(--arena-black-rgb),0.5)] ${
          isMobile ? 'py-4' : 'p-2'
        }`}
      >
        <span className="text-cyan-500 font-bold ml-1">{'>'}</span>
        <input
          aria-label="Enter command"
          placeholder="Run override command (e.g. FIRE)"
          type="text"
          className="flex-grow bg-transparent outline-none text-cyan-300 text-xs font-mono placeholder-cyan-900"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          disabled={isLoading}
        />
      </form>

      {/* Telemetry Log */}
      <div className="shrink-0 border border-cyan-900/30 rounded-lg overflow-hidden bg-black/20 backdrop-blur-md">
        {/* Header toggle */}
        <button
          type="button"
          onClick={() => setIsLogsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-black/40 hover:bg-cyan-950/40 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_var(--accent)]" />
            <span className="text-[10px] font-black tracking-widest text-cyan-600 uppercase">Activity Log</span>
            {output.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-900/50 text-cyan-400 border border-cyan-700/40">
                {output.length}
              </span>
            )}
          </div>
          <span
            className="text-cyan-700 text-[10px] transition-transform duration-300"
            style={{ transform: isLogsOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
          >
            ▲
          </span>
        </button>

        {/* Collapsible body */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isLogsOpen ? (isMobile ? '140px' : '96px') : '0px' }}
        >
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: isMobile ? '140px' : '96px' }}>
            <TerminalOutput output={output} />
          </div>
        </div>
      </div>
    </div>
  );
};
