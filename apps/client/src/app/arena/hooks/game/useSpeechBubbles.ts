'use client';

import { useRef, useState, useCallback } from 'react';
import { SpeechBubbleState } from '../../types';

export const useSpeechBubbles = () => {
  const [speechBubble, setSpeechBubble] = useState<SpeechBubbleState | null>(null);
  const robotBubbleTimeoutsRef = useRef<Map<string, number>>(new Map());

  const setRobotBubble = useCallback((robotId: string, message: string, durationMs: number): void => {
    const prevTimeout = robotBubbleTimeoutsRef.current.get(robotId);
    if (prevTimeout !== undefined) {
      window.clearTimeout(prevTimeout);
    }

    setSpeechBubble({ robotId, message });

    const timeoutId = window.setTimeout(() => {
      robotBubbleTimeoutsRef.current.delete(robotId);
      setSpeechBubble(null);
    }, durationMs);
    robotBubbleTimeoutsRef.current.set(robotId, timeoutId);
  }, [setSpeechBubble]);

  const cleanupBubbles = useCallback(() => {
    for (const timeoutId of robotBubbleTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    robotBubbleTimeoutsRef.current.clear();
  }, []);

  return { speechBubble, setRobotBubble, cleanupBubbles, setSpeechBubble };
};
