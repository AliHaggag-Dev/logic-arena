"use client";

import React from 'react';
import type { DiagnosticMarker } from '../../workers/parser.worker.types';
import { AlertTriangle, XCircle, Keyboard } from 'lucide-react';

interface DiagnosticTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  marker: DiagnosticMarker | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onApplyFix?: (diag: DiagnosticMarker) => void;
}

const TOOLTIP_MAX_WIDTH = 340;
const TOOLTIP_EDGE_PADDING = 12;

export const DiagnosticTooltip: React.FC<DiagnosticTooltipProps> = ({
  visible,
  x,
  y,
  marker,
  onMouseEnter,
  onMouseLeave,
  onApplyFix,
}) => {
  if (!visible || !marker) return null;

  const isError = marker.severity === 'error';
  const borderColor = isError ? 'rgba(var(--sem-danger-rgb), 0.5)' : 'rgba(var(--sem-warning-rgb), 0.5)';
  const glowColor = isError ? 'rgba(var(--sem-danger-rgb), 0.12)' : 'rgba(var(--sem-warning-rgb), 0.12)';
  const iconColor = isError ? 'var(--sem-danger)' : 'var(--sem-warning)';
  const labelColor = isError ? 'color-mix(in srgb, var(--sem-danger) 70%, white)' : 'color-mix(in srgb, var(--sem-warning) 70%, white)';
  const labelText = isError ? 'SYNTAX ERROR' : 'LOGIC WARNING';

  const hasFixAction = marker.suggestion !== undefined || marker.action === 'delete';
  const fixLabel = marker.action === 'delete' ? 'Tab to remove' : 'Tab to fix';

  // Clamp position to stay within viewport
  const clampedX = Math.max(TOOLTIP_EDGE_PADDING, Math.min(x - TOOLTIP_MAX_WIDTH / 2, window.innerWidth - TOOLTIP_MAX_WIDTH - TOOLTIP_EDGE_PADDING));

  return (
    <div
      role="tooltip"
      className="absolute z-50 pointer-events-auto"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: `${clampedX}px`,
        top: `${y}px`,
        maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
        animation: 'diagTooltipIn 150ms ease-out both',
      }}
    >
      <style>{`
        @keyframes diagTooltipIn {
          0% { opacity: 0; transform: translateY(-4px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          background: 'rgba(var(--bg-primary-rgb), 0.95)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${borderColor}`,
          borderRadius: '10px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${glowColor}`,
          padding: '10px 14px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          {isError ? (
            <XCircle size={13} color={iconColor} />
          ) : (
            <AlertTriangle size={13} color={iconColor} />
          )}
          <span
            style={{
              fontSize: '9px',
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: labelColor,
            }}
          >
            {labelText}
          </span>
        </div>

        {/* Message */}
        <p
          style={{
            fontSize: '11px',
            lineHeight: '1.5',
            color: 'var(--text-primary)',
            margin: 0,
            fontFamily: 'monospace',
          }}
        >
          {marker.message}
        </p>

        {/* Fix hint */}
        {hasFixAction && (
          <button
            type="button"
            onClick={() => onApplyFix?.(marker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              padding: '6px 8px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              width: '100%',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isError ? 'rgba(var(--sem-danger-rgb), 0.12)' : 'rgba(var(--sem-warning-rgb), 0.12)';
              e.currentTarget.style.borderColor = isError ? 'var(--sem-danger)' : 'var(--sem-warning)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = borderColor;
            }}
          >
            <Keyboard size={11} color="var(--text-secondary)" />
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
              }}
            >
              {fixLabel} (Click to apply)
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
