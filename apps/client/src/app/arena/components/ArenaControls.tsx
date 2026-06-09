'use client';

import React from 'react';
import { TerminalOutput } from './CommandConsole/TerminalOutput';

interface ArenaControlsProps {
  isMobile: boolean;
  commandInput?: string;
  setCommandInput?: (val: string) => void;
  handleCommandSubmit?: (e: React.FormEvent) => void;
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
    <div className={`flex flex-col gap-4 ${isMobile ? 'w-full h-full' : ''}`}>
      {/* Telemetry Log */}
      <div className={`shrink-0 border border-cyan-900/30 rounded-lg overflow-hidden bg-black/20 backdrop-blur-md ${isMobile ? 'flex flex-col h-full' : ''}`}>
        {/* Header toggle */}
        <button
          type="button"
          onClick={() => setIsLogsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-black/40 hover:bg-cyan-950/40 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_var(--accent)]" />
            <span className="text-[10px] font-black tracking-widest text-cyan-600 uppercase">Logs</span>
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
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobile && isLogsOpen ? 'flex-1 min-h-0' : ''}`}
          style={{ maxHeight: isLogsOpen ? (isMobile ? '100%' : '96px') : '0px' }}
        >
          <div className={`overflow-y-auto custom-scrollbar ${isMobile ? 'h-full' : ''}`} style={{ maxHeight: isMobile ? 'none' : '96px' }}>
            <TerminalOutput output={output} />
          </div>
        </div>
      </div>
    </div>
  );
};
