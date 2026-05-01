import { useCallback, useEffect, useRef, useState } from "react";
import { Snapshot } from "../types";
import { drawFrame } from "../components/canvasRenderer";

const BASE_FRAME_MS = 500;

export function useReplayPlayback(
  snapshots: Snapshot[],
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Mutable playback state completely decoupled from React render cycle
  const playbackRef = useRef({
    frame: 0,
    speed: 1,
    isPlaying: false,
    snapshots: [] as Snapshot[],
    frameStartTime: 0,
    smoothedHealth: new Map<string, number>(),
  });

  // Sync React state down to the mutable ref
  useEffect(() => { playbackRef.current.snapshots = snapshots; }, [snapshots]);
  useEffect(() => { playbackRef.current.speed = speed; }, [speed]);
  useEffect(() => { playbackRef.current.isPlaying = isPlaying; }, [isPlaying]);
  useEffect(() => {
    playbackRef.current.frame = currentFrame;
    playbackRef.current.frameStartTime = performance.now(); // Reset interpolation on manual seek
  }, [currentFrame]);

  // Decoupled RAF Engine
  useEffect(() => {
    let rafId: number;

    const tick = (timestamp: number) => {
      const state = playbackRef.current;
      const ctx = canvasRef.current?.getContext("2d");

      if (!state.snapshots.length || !ctx) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const frameDuration = BASE_FRAME_MS / state.speed;
      let t = 0;

      if (state.isPlaying) {
        const elapsed = timestamp - state.frameStartTime;
        t = Math.min(1, elapsed / frameDuration);

        // Frame progression
        if (t >= 1) {
          if (state.frame >= state.snapshots.length - 1) {
            setIsPlaying(false); // React state update for UI
            state.isPlaying = false;
            t = 0;
          } else {
            const nextFrame = state.frame + 1;
            state.frame = nextFrame;
            state.frameStartTime = timestamp;
            t = 0;
            // Update React state (throttle to integer boundaries, avoiding 60fps churn)
            setCurrentFrame(nextFrame);
          }
        }
      }

      // Draw immediately using the uncoupled interpolation (t)
      const prev = state.frame > 0 ? state.snapshots[state.frame - 1] : undefined;
      const curr = state.snapshots[state.frame];
      drawFrame(ctx, prev, curr, t, state.smoothedHealth);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [canvasRef]);

  // Controls
  const handlePlay = useCallback(() => {
    if (snapshots.length === 0) return;
    if (playbackRef.current.frame >= snapshots.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(true);
  }, [snapshots.length]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrame(Number(e.target.value));
  }, []);

  return {
    currentFrame,
    isPlaying,
    speed,
    setSpeed,
    handlePlay,
    handlePause,
    handleReset,
    handleScrub,
  };
}
