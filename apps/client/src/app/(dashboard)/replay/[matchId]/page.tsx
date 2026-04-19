"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { ReplayData, Snapshot } from "./types";
import { ReplayCanvas, CANVAS_W } from "./components/ReplayCanvas";
import { ReplayControls } from "./components/ReplayControls";

export default function ReplayPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.matchId as string;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5 | 1 | 2

  const totalFrames = snapshots.length;

  /* Fetch replay */
  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const res = await apiClient.get(`/users/matches/${matchId}/replay`);
        const data: ReplayData = res.data;
        setReplayData(data);
        const snaps = Array.isArray(data.replayData) ? data.replayData : [];
        setSnapshots(snaps);
      } catch (e: any) {
        if (e.response?.status === 401) {
          router.push("/login");
        } else if (e.response?.status === 404) {
          setError("Match not found");
        } else {
          setError(e.message ?? "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReplay();
  }, [matchId, router]);

  // Playback loop
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPlaying || snapshots.length === 0) return;

    const ms = Math.round(500 / speed);
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= snapshots.length - 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, snapshots.length]);

  const handlePlay = () => {
    if (snapshots.length === 0) return;
    if (currentFrame >= snapshots.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentFrame(Number(e.target.value));
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        {/* Grid BG */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-[860px] mx-auto px-6 pt-10 pb-20 relative z-10 animate-[fadeIn_0.35s_ease]">
          {/* Header */}
          <div className="mb-8 border-b border-accent/10 pb-6">
            <button
              onClick={() => router.back()}
              className="bg-transparent border-none text-accent/40 cursor-pointer text-[10px] tracking-[0.2em] font-mono mb-4 p-0 flex items-center gap-1.5 hover:text-accent/80 transition-colors"
            >
              ← BACK
            </button>
            <p className="text-[9px] tracking-[0.28em] text-accent/30 mb-1.5 uppercase">
              // MATCH_REPLAY
            </p>
            <h1
              className="text-[clamp(20px,3.5vw,30px)] font-black tracking-[0.16em] text-accent m-0"
              style={{ textShadow: "0 0 10px rgba(var(--accent-rgb),0.6), 0 0 30px rgba(var(--accent-rgb),0.25)" }}
            >
              REPLAY VIEWER
            </h1>
            {replayData && (
              <p className="mt-2 text-[10px] text-accent/30 tracking-[0.14em]">
                ID: {replayData.id.slice(0, 8)}… &nbsp;·&nbsp;
                DURATION: {replayData.duration}s &nbsp;·&nbsp;
                {new Date(replayData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-[20px_24px] text-[#fca5a5] text-[11px] tracking-[0.12em]">
              [ERR] REPLAY UPLINK FAILURE: {error}
            </div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div className="text-center py-20 text-accent/30 tracking-[0.2em] text-[11px] animate-pulse">
              DECRYPTING REPLAY DATA…
            </div>
          )}

          {/* No replay data */}
          {!loading && !error && snapshots.length === 0 && (
            <div className="text-center p-[60px] border border-accent/10 rounded-[10px] bg-card/60 text-accent/25 text-[11px] tracking-[0.18em]">
              NO REPLAY DATA AVAILABLE FOR THIS MATCH.
              <div className="mt-2.5 text-[10px] text-accent/15">
                Only matches played after the replay system was enabled are recorded.
              </div>
            </div>
          )}

          {/* Viewer */}
          {!loading && !error && snapshots.length > 0 && (
            <div className="flex flex-col items-center gap-6">
              <ReplayCanvas snapshot={snapshots[currentFrame]} />

              <ReplayControls
                currentFrame={currentFrame}
                totalFrames={totalFrames}
                isPlaying={isPlaying}
                speed={speed}
                onPlay={handlePlay}
                onPause={handlePause}
                onReset={handleReset}
                onSpeedChange={setSpeed}
                onScrub={handleScrub}
              />

              {/* Legend */}
              <div
                className="w-full bg-black/35 border border-accent/[0.07] rounded-lg p-[12px_18px] flex gap-5 flex-wrap"
                style={{ maxWidth: CANVAS_W }}
              >
                <div className="flex items-center gap-2 text-[10px] tracking-[0.14em] text-accent/40">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border-[1.5px] border-accent" />
                  ROBOT
                </div>
                <div className="flex items-center gap-2 text-[10px] tracking-[0.14em] text-accent/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                  PROJECTILE
                </div>
                <div className="ml-auto text-[10px] tracking-[0.12em] text-accent/25">
                  SPEED: {replayData ? (snapshots.length / replayData.duration).toFixed(1) : "—"} FRAMES/s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
