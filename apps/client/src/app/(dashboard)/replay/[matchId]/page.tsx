"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { ReplayData, Snapshot } from "./types";
import { ReplayCanvas, CANVAS_W } from "./components/ReplayCanvas";
import { ReplayControls } from "./components/ReplayControls";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";

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

  const isMobile = useMediaQuery("(max-width: 768px)");

  const DesktopLayout = (
    <div className="max-w-[860px] mx-auto px-6 pt-10 pb-[120px] relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Header */}
      <div className="mb-8 border-b border-accent/20 pb-6">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.back()}
            className="w-max bg-transparent border border-accent/15 rounded px-3 py-1 hover:border-accent/40 text-accent/40 cursor-pointer text-[10px] tracking-[0.25em] font-mono mb-2 flex items-center gap-1.5 transition-all duration-200 uppercase"
          >
            ← BACK TO HISTORY
          </button>
          <div>
            <p className="text-[9px] tracking-[0.28em] text-accent/40 mb-2 uppercase">
              // MATCH_REPLAY
            </p>
            <h1
              className="text-[clamp(20px,3.5vw,30px)] font-black tracking-[0.16em] text-accent m-0 leading-none break-words"
              style={{ textShadow: "0 0 10px rgba(var(--accent-rgb),0.6), 0 0 30px rgba(var(--accent-rgb),0.25)" }}
            >
              REPLAY VIEWER
            </h1>
          </div>
        </div>
        {replayData && (
          <p className="mt-2 text-[10px] text-accent/40 tracking-[0.14em] flex items-center gap-2 flex-wrap uppercase">
            <span className="shrink-0">ID: {replayData.id.slice(0, 8)}…</span> 
            <span>·</span>
            <span className="shrink-0">DUR: {replayData.duration}s <span>·</span></span>
            <span className="shrink-0">{new Date(replayData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</span>
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
  );

  const MobileLayout = (
    <div className="w-full px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] relative z-10 animate-[fadeIn_0.35s_ease] flex flex-col min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-5 border-b border-accent/20 pb-4">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-max bg-transparent border border-accent/15 rounded px-2.5 py-1 hover:border-accent/40 text-accent/40 cursor-pointer text-[9px] tracking-[0.25em] font-mono flex items-center gap-1.5 transition-all duration-200 uppercase"
          >
            ← HISTORY
          </button>
          <div>
            <p className="text-[8px] tracking-[0.28em] text-accent/40 mb-1 uppercase">
              // MATCH_REPLAY
            </p>
            <h1
              className="text-2xl font-black tracking-[0.16em] text-accent m-0 leading-none"
              style={{ textShadow: "0 0 10px rgba(var(--accent-rgb),0.6), 0 0 30px rgba(var(--accent-rgb),0.25)" }}
            >
              VIEWER
            </h1>
          </div>
        </div>
        {replayData && (
          <p className="mt-3 text-[9px] text-accent/40 tracking-[0.14em] flex flex-col gap-1 uppercase">
            <span>ID: {replayData.id.slice(0, 8)}…</span> 
            <span>DUR: {replayData.duration}s | {new Date(replayData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</span>
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-[16px] text-[#fca5a5] text-[10px] tracking-[0.12em] mb-4">
          [ERR] REPLAY: {error}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="text-center py-16 text-accent/30 tracking-[0.2em] text-[10px] animate-pulse">
          DECRYPTING REPLAY DATA…
        </div>
      )}

      {/* No replay data */}
      {!loading && !error && snapshots.length === 0 && (
        <div className="text-center p-8 border border-accent/10 rounded-[10px] bg-card/60 text-accent/25 text-[10px] tracking-[0.18em]">
          NO REPLAY DATA AVAILABLE.
        </div>
      )}

      {/* Viewer */}
      {!loading && !error && snapshots.length > 0 && (
        <div className="flex flex-col gap-4 w-full items-center">
          <ReplayCanvas snapshot={snapshots[currentFrame]} />

          <div className="w-full">
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
          </div>

          {/* Legend */}
          <div className="w-[calc(100%-1rem)] max-w-[420px] mx-auto bg-black/35 border border-accent/[0.07] rounded-lg p-3 flex flex-col gap-2">
            <div className="flex justify-between">
              <div className="flex items-center gap-2 text-[9px] tracking-[0.14em] text-accent/40">
                <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border-[1.5px] border-accent" />
                ROBOT
              </div>
              <div className="flex items-center gap-2 text-[9px] tracking-[0.14em] text-accent/40">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                PROJECTILE
              </div>
            </div>
            <div className="text-[9px] tracking-[0.12em] text-accent/25 text-center mt-1 border-t border-accent/10 pt-2">
              SPEED: {replayData ? (snapshots.length / replayData.duration).toFixed(1) : "—"} FRAMES/s
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : ""}`}>
        {/* Grid BG */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {isMobile ? MobileLayout : DesktopLayout}
      </div>
    </>
  );
}
