import { useState, useCallback, useRef } from 'react';
import type { DiagnosticMarker } from '../../workers/parser.worker.types';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  marker: DiagnosticMarker | null;
}

const INITIAL_STATE: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  marker: null,
};

const TOOLTIP_HIDE_DELAY_MS = 120;

export interface DiagnosticTooltipHook {
  tooltipState: TooltipState;
  onHighlightMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  onHighlightMouseLeave: () => void;
  onTooltipMouseEnter: () => void;
  onTooltipMouseLeave: () => void;
  hideTooltip: () => void;
}

/**
 * Hook that manages hover tooltip state for inline diagnostics.
 * Works by checking if the mouse is over a `[data-diag-idx]` element
 * in the highlight overlay and showing the corresponding marker's message.
 */
export function useDiagnosticTooltip(diagnostics: DiagnosticMarker[]): DiagnosticTooltipHook {
  const [tooltipState, setTooltipState] = useState<TooltipState>(INITIAL_STATE);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const onHighlightMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const ta = e.currentTarget as HTMLElement;
    const originalPointerEvents = ta.style.pointerEvents;

    // Temporarily bypass this element to find the underlying highlighted span
    ta.style.pointerEvents = 'none';
    const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
    ta.style.pointerEvents = originalPointerEvents;

    const diagSpan = elementUnderMouse?.closest('[data-diag-idx]') as HTMLElement | null;

    if (!diagSpan) {
      // Not hovering over a diagnostic — start hide timer
      if (tooltipState.visible && hideTimerRef.current === null) {
        hideTimerRef.current = window.setTimeout(() => {
          setTooltipState(INITIAL_STATE);
          hideTimerRef.current = null;
        }, TOOLTIP_HIDE_DELAY_MS);
      }
      return;
    }

    // Hovering over a diagnostic span — cancel any pending hide
    clearHideTimer();

    const idx = parseInt(diagSpan.dataset.diagIdx ?? '-1', 10);
    const marker = diagnostics[idx];
    if (!marker) return;

    // Position relative to the common parent container
    const container = ta.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const spanRect = diagSpan.getBoundingClientRect();

    const x = spanRect.left - containerRect.left + spanRect.width / 2;
    const y = spanRect.bottom - containerRect.top + 4;

    setTooltipState({ visible: true, x, y, marker });
  }, [diagnostics, clearHideTimer, tooltipState.visible]);

  const onHighlightMouseLeave = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setTooltipState(INITIAL_STATE);
      hideTimerRef.current = null;
    }, TOOLTIP_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const onTooltipMouseEnter = useCallback(() => {
    clearHideTimer();
  }, [clearHideTimer]);

  const onTooltipMouseLeave = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setTooltipState(INITIAL_STATE);
      hideTimerRef.current = null;
    }, TOOLTIP_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const hideTooltip = useCallback(() => {
    clearHideTimer();
    setTooltipState(INITIAL_STATE);
  }, [clearHideTimer]);

  return {
    tooltipState,
    onHighlightMouseMove,
    onHighlightMouseLeave,
    onTooltipMouseEnter,
    onTooltipMouseLeave,
    hideTooltip,
  };
}
