'use client';

import { useRef, useCallback } from 'react';
import { SpeechBubbleState } from '../../types';

export const useSpeechBubbles = () => {
  const speechBubbleRef = useRef<SpeechBubbleState | null>(null);
  const robotBubbleTimeoutsRef = useRef<Map<string, number>>(new Map());

  const setRobotBubble = useCallback((robotId: string, message: string, durationMs: number): void => {
    const prevTimeout = robotBubbleTimeoutsRef.current.get(robotId);
    if (prevTimeout !== undefined) {
      window.clearTimeout(prevTimeout);
    }

    speechBubbleRef.current = { robotId, message };

    const timeoutId = window.setTimeout(() => {
      robotBubbleTimeoutsRef.current.delete(robotId);
      speechBubbleRef.current = null;
    }, durationMs);
    robotBubbleTimeoutsRef.current.set(robotId, timeoutId);
  }, []);

  const cleanupBubbles = useCallback(() => {
    for (const timeoutId of robotBubbleTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    robotBubbleTimeoutsRef.current.clear();
    speechBubbleRef.current = null;
  }, []);

  return { speechBubble: speechBubbleRef, setRobotBubble, cleanupBubbles };
};
