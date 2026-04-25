"use client";

import React, { useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { BottomSheet } from './BottomSheet';
import { CommandConsole } from './CommandConsole';

interface MobileControlsProps {
  socket: Socket | null;
  selectedRobotId: string;
  availableRobots: string[];
  setSelectedRobotId: (id: string) => void;
  isMobile: boolean;
}

export function MobileControls({
  socket,
  selectedRobotId,
  availableRobots,
  setSelectedRobotId,
  isMobile,
}: MobileControlsProps) {
  const [activeSheet, setActiveSheet] = useState<'controls' | 'script' | null>(null);
  // Snippet bridge: HUB inserts code → stored here → ZEN_CORE picks it up
  const pendingSnippetRef = useRef<string | null>(null);
  const [snippetVersion, setSnippetVersion] = useState(0);

  const handleInsertAndSwitch = (snippet: string) => {
    pendingSnippetRef.current = snippet;
    setSnippetVersion((v) => v + 1);
    setActiveSheet('script');
  };

  const consumeSnippet = (): string | null => {
    const snippet = pendingSnippetRef.current;
    pendingSnippetRef.current = null;
    return snippet;
  };

  if (!isMobile) return null;

  return (
    <>
      {/* ── Floating Dock ─────────────────────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-row items-end gap-4 pointer-events-auto">
        {/* ⚡ ZEN EDITOR — pure code */}
        <button
          type='button'
          onClick={() => setActiveSheet(activeSheet === 'script' ? null : 'script')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeSheet === 'script' ? 'scale-105' : ''}`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeSheet === 'script'
            ? 'bg-purple-500/90 shadow-[0_0_20px_rgba(168,85,247,0.6),0_0_40px_rgba(168,85,247,0.2)] border border-purple-400/50'
            : 'bg-black/80 border border-purple-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
            }`}>
            <span className="text-lg">⚡</span>
          </div>
          <span className={`text-[7px] font-black tracking-[0.25em] uppercase ${activeSheet === 'script' ? 'text-purple-300' : 'text-white/40'}`}>
            CODE
          </span>
        </button>

        {/* 📟 COMMAND HUB — controls, bots, handbook */}
        <button
          type='button'
          onClick={() => setActiveSheet(activeSheet === 'controls' ? null : 'controls')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeSheet === 'controls' ? 'scale-105' : ''}`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeSheet === 'controls'
            ? 'bg-cyan-500/90 shadow-[0_0_20px_rgba(34,211,238,0.6),0_0_40px_rgba(34,211,238,0.2)] border border-cyan-400/50'
            : 'bg-black/80 border border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
            }`}>
            <span className="text-lg">📟</span>
          </div>
          <span className={`text-[7px] font-black tracking-[0.25em] uppercase ${activeSheet === 'controls' ? 'text-cyan-300' : 'text-white/40'}`}>
            HUB
          </span>
        </button>
      </div>

      {/* ── ⚡ ZEN EDITOR Sheet ─────────────────────────────────── */}
      <BottomSheet
        isMobile={isMobile}
        isOpen={activeSheet === 'script'}
        onClose={() => setActiveSheet(null)}
        title="ZEN_CORE"
      >
        <CommandConsole
          socket={socket}
          robotId={selectedRobotId}
          availableRobots={availableRobots}
          onRobotChange={setSelectedRobotId}
          isMobile={isMobile}
          mobileSheet="script"
          onDeployDone={() => setActiveSheet(null)}
          consumeSnippet={consumeSnippet}
          snippetVersion={snippetVersion}
        />
      </BottomSheet>

      {/* ── 📟 COMMAND HUB Sheet ────────────────────────────────── */}
      <BottomSheet
        isMobile={isMobile}
        isOpen={activeSheet === 'controls'}
        onClose={() => setActiveSheet(null)}
        title="COMMAND_HUB"
      >
        <CommandConsole
          socket={socket}
          robotId={selectedRobotId}
          availableRobots={availableRobots}
          onRobotChange={setSelectedRobotId}
          onInsertAndSwitch={handleInsertAndSwitch}
          isMobile={isMobile}
          mobileSheet="controls"
        />
      </BottomSheet>
    </>
  );
}
