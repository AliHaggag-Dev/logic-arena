import React from "react";
import { ReplayData, Snapshot } from "../types";

interface ReplayViewerMobileLayoutProps {
  replayData: ReplayData | null;
  snapshots: Snapshot[];
  loading: boolean;
  error: string | null;
  ViewerSection: React.ReactNode;
  router: any;
}

export function ReplayViewerMobileLayout({
  replayData,
  snapshots,
  loading,
  error,
  ViewerSection,
  router,
}: ReplayViewerMobileLayoutProps) {
  return (
    <div className="w-full px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] relative z-10 animate-[fadeIn_0.35s_ease] flex flex-col min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-5 border-b border-accent/20 pb-4">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-max bg-transparent border border-accent/15 rounded px-2.5 py-1 hover:border-accent/40 text-accent/70 cursor-pointer text-[9px] tracking-[0.25em] font-mono flex items-center gap-1.5 transition-all duration-200 uppercase"
          >
            ← HISTORY
          </button>
          <div>
            <p className="text-[8px] tracking-[0.28em] text-accent/70 mb-1 uppercase">
              // REPLAY
            </p>
            <h1
              className="text-2xl font-black tracking-[0.16em] text-accent m-0 leading-none"
              style={{
                textShadow:
                  "0 0 10px rgba(var(--accent-rgb),0.6), 0 0 30px rgba(var(--accent-rgb),0.25)",
              }}
            >
              VIEWER
            </h1>
          </div>
        </div>
        {replayData && (
          <p className="mt-3 text-[9px] text-accent/70 tracking-[0.14em] flex flex-col gap-1 uppercase">
            <span>ID: {replayData.id.slice(0, 8)}…</span>
            <span>
              DUR: {replayData.duration}s |{" "}
              {new Date(replayData.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
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
          {ViewerSection}

          {/* Legend */}
          <div className="w-[calc(100%-1rem)] max-w-[420px] mx-auto bg-black/35 border border-accent/[0.07] rounded-lg p-3 flex flex-col gap-2">
            <div className="flex justify-between">
              <div className="flex items-center gap-2 text-[9px] tracking-[0.14em] text-accent/70">
                <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border-[1.5px] border-accent" />
                ROBOT
              </div>
              <div className="flex items-center gap-2 text-[9px] tracking-[0.14em] text-accent/70">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                PROJECTILE
              </div>
            </div>
            <div className="text-[9px] tracking-[0.12em] text-accent/25 text-center mt-1 border-t border-accent/10 pt-2">
              SPEED:{" "}
              {replayData
                ? (snapshots.length / replayData.duration).toFixed(1)
                : "—"}{" "}
              FRAMES/s
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
