import React from 'react';
import type { SemanticWarning } from '../../workers/parser.worker.types';
import { AlertTriangle, X, Zap, RefreshCw, Skull } from 'lucide-react';

interface WarningPanelProps {
  warnings: SemanticWarning[];
  onClose: () => void;
}

const WARNING_ICONS: Record<string, React.ReactNode> = {
  'contradictory-command': <Zap size={14} />,
  'redundant-assignment': <RefreshCw size={14} />,
  'unreachable-code': <Skull size={14} />,
};

export const WarningPanel: React.FC<WarningPanelProps> = ({ warnings, onClose }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[45%] overflow-y-auto rounded-b-lg border-t border-amber-500/30 bg-black/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-amber-900/30 sticky top-0 bg-black/95 backdrop-blur-xl z-10">
        <span className="flex items-center gap-1.5 text-amber-400 text-[9px] font-black tracking-[0.25em] uppercase">
          <AlertTriangle size={12} /> Semantic Warnings ({warnings.length})
        </span>
        <button
          type="button"
          aria-label="Close warnings panel"
          onClick={onClose}
          className="text-amber-500/60 hover:text-amber-300 transition-colors p-1"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col">
        {warnings.map((w, i) => (
          <div
            key={`${w.code}-${i}`}
            className="flex items-start gap-2 px-3 py-2 border-b border-amber-900/15 hover:bg-amber-900/10 transition-colors"
          >
            <span className="text-amber-400/80 shrink-0 mt-0.5">
              {WARNING_ICONS[w.code] ?? <AlertTriangle size={14} />}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-amber-300/90 text-[10px] font-mono leading-tight break-words">
                {w.message}
              </span>
              <span className="text-amber-600/50 text-[8px] font-mono tracking-wider uppercase">
                {w.code}{w.line ? ` · line ${w.line}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
