"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { ReplayData, Snapshot } from "./types";
import { ReplayCanvas } from "./components/ReplayCanvas";
import { ReplayControls } from "./components/ReplayControls";
import { useReplayPlayback } from "./hooks/useReplayPlayback";

export default function ReplayPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.matchId as string;

  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    currentFrame,
    isPlaying,
    speed,
    setSpeed,
    handlePlay,
    handlePause,
    handleReset,
    handleScrub,
  } = useReplayPlayback(snapshots, canvasRef);

  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const res = await apiClient.get(`/users/matches/${matchId}/replay`);
        const data: ReplayData = res.data;
        setReplayData(data);
        const snaps = Array.isArray(data.replayData) 
          ? data.replayData 
          : ((data.replayData as any)?.snapshots ? (data.replayData as any).snapshots : []);
        setSnapshots(snaps);
      } catch (e: unknown) {
        // Safe typed error handling
        const status = (e as any)?.response?.status;
        const msg = (e as any)?.message;
        
        if (status === 401) {
          router.push("/login");
        } else if (status === 404) {
          setError("Match not found");
        } else {
          setError(msg ?? "Unknown error occurred while fetching replay.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReplay();
  }, [matchId, router]);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-dvh bg-bg-primary font-mono text-accent/90 relative overflow-hidden pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0">
        {/* Cyber Grid Background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="w-full max-w-[860px] mx-auto px-4 md:px-6 pt-4 md:pt-10 relative z-10 animate-[fadeIn_0.35s_ease] flex flex-col min-h-[calc(100vh-80px)] md:min-h-0 md:pb-[120px]">
          
          {/* Header */}
          <div className="mb-5 md:mb-8 border-b border-accent/20 pb-4 md:pb-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-max border rounded-full md:rounded px-5 py-2 min-h-[44px] md:min-h-0 md:px-3 md:py-1 bg-accent/[0.03] md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-accent/20 md:border-accent/15 text-accent/80 md:text-accent/70 hover:border-accent/50 hover:bg-accent/20 hover:text-accent hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] cursor-pointer text-[11px] md:text-[10px] tracking-[0.25em] font-mono flex items-center justify-center gap-2 transition-all duration-300 uppercase active:scale-95"
              >
                ← <span className="md:hidden">HISTORY</span><span className="hidden md:inline">BACK TO HISTORY</span>
              </button>
              <div>
                <p className="text-[8px] md:text-[9px] tracking-[0.28em] text-accent/70 mb-1 md:mb-2 uppercase">
                  // REPLAY
                </p>
                <h1 className="text-2xl md:text-[clamp(20px,3.5vw,30px)] font-black tracking-[0.16em] text-accent m-0 leading-none break-words drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]">
                  <span className="md:hidden">VIEWER</span>
                  <span className="hidden md:inline">REPLAY VIEWER</span>
                </h1>
              </div>
            </div>
            
            {replayData && (
              <div className="mt-4 md:mt-3 flex flex-wrap gap-2 text-[9px] md:text-[10px] text-accent/70 tracking-[0.1em] uppercase">
                <span className="bg-accent/10 border border-accent/20 px-2.5 py-1.5 rounded-md flex items-center shadow-[0_0_8px_rgba(var(--accent-rgb),0.1)]">ID: {replayData.id.slice(0, 8)}…</span>
                <span className="bg-accent/10 border border-accent/20 px-2.5 py-1.5 rounded-md flex items-center shadow-[0_0_8px_rgba(var(--accent-rgb),0.1)]">DUR: {replayData.duration}s</span>
                <span className="bg-accent/10 border border-accent/20 px-2.5 py-1.5 rounded-md flex items-center shadow-[0_0_8px_rgba(var(--accent-rgb),0.1)]">
                  {new Date(replayData.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-[16px] md:p-[20px_24px] text-[#fca5a5] text-[10px] md:text-[11px] tracking-[0.12em] mb-4">
              [ERR] FAILED TO LOAD REPLAY: {error}
            </div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="text-center py-16 md:py-20 text-accent/30 tracking-[0.2em] text-[10px] md:text-[11px] animate-pulse">
              DECRYPTING REPLAY DATA…
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && snapshots.length === 0 && (
            <div className="text-center p-8 md:p-[60px] border border-accent/10 rounded-[10px] bg-card/60 text-accent/25 text-[10px] md:text-[11px] tracking-[0.18em]">
              NO REPLAY DATA AVAILABLE.
              <div className="mt-2.5 text-[10px] text-accent/15 hidden md:block">
                Only matches played after the replay system was enabled are recorded.
              </div>
            </div>
          )}

          {/* Viewer Section */}
          {!loading && !error && snapshots.length > 0 && (
            <div className="flex flex-col gap-4 md:gap-6 w-full items-center">
              
              <ReplayCanvas ref={canvasRef} />
              
              <ReplayControls
                currentFrame={currentFrame}
                totalFrames={snapshots.length}
                isPlaying={isPlaying}
                speed={speed}
                onPlay={handlePlay}
                onPause={handlePause}
                onReset={handleReset}
                onSpeedChange={setSpeed}
                onScrub={handleScrub}
              />

              {/* Legend */}
              <div className="w-[calc(100%-1rem)] md:w-full max-w-[800px] mx-auto bg-card/40 md:bg-card/30 backdrop-blur-md border border-accent/[0.07] rounded-lg p-3 md:p-[12px_18px] flex flex-col md:flex-row md:gap-5 flex-wrap">
                <div className="flex justify-between md:justify-start md:gap-5 w-full md:w-auto">
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] tracking-[0.14em] text-accent/70">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border-[1.5px] border-accent" />
                    ROBOT
                  </div>
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] tracking-[0.14em] text-accent/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                    PROJECTILE
                  </div>
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.12em] text-accent/25 text-center mt-1 pt-2 md:mt-0 md:pt-0 border-t border-accent/10 md:border-none md:ml-auto">
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
