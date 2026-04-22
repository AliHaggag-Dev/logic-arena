import React from "react";
import { ReplayData, Snapshot } from "../types";
import { CANVAS_W } from "./ReplayCanvas";

interface ReplayViewerDesktopLayoutProps {
  replayData: ReplayData | null;
  snapshots: Snapshot[];
  loading: boolean;
  error: string | null;
  ViewerSection: React.ReactNode;
  router: any;
}

export function ReplayViewerDesktopLayout({
  replayData,
  snapshots,
  loading,
  error,
  ViewerSection,
  router,
}: ReplayViewerDesktopLayoutProps) {
  return (
    <div className="max-w-[860px] mx-auto px-6 pt-10 pb-[120px] relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Header */}
      <div className="mb-8 border-b border-accent/20 pb-6">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.back()}
            className="w-max bg-transparent border border-accent/15 rounded px-3 py-1 hover:border-accent/40 text-accent/70 cursor-pointer text-[10px] tracking-[0.25em] font-mono mb-2 flex items-center gap-1.5 transition-all duration-200 uppercase"
          >
            ← BACK TO HISTORY
          </button>
          <div>
            <p className="text-[9px] tracking-[0.28em] text-accent/70 mb-2 uppercase">
              // MATCH_REPLAY
            </p>
            <h1
              className="text-[clamp(20px,3.5vw,30px)] font-black tracking-[0.16em] text-accent m-0 leading-none break-words"
              style={{
                textShadow:
                  "0 0 10px rgba(var(--accent-rgb),0.6), 0 0 30px rgba(var(--accent-rgb),0.25)",
              }}
            >
              REPLAY VIEWER
            </h1>
          </div>
        </div>
        {replayData && (
          <p className="mt-2 text-[10px] text-accent/70 tracking-[0.14em] flex items-center gap-2 flex-wrap uppercase">
            <span className="shrink-0">ID: {replayData.id.slice(0, 8)}…</span>
            <span>·</span>
            <span className="shrink-0">
              DUR: {replayData.duration}s <span>·</span>
            </span>
            <span className="shrink-0">
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
            Only matches played after the replay system was enabled are
            recorded.
          </div>
        </div>
      )}

      {/* Viewer */}
      {!loading && !error && snapshots.length > 0 && (
        <div className="flex flex-col items-center gap-6">
          {ViewerSection}

          {/* Legend */}
          <div
            className="w-full bg-black/35 border border-accent/[0.07] rounded-lg p-[12px_18px] flex gap-5 flex-wrap"
            style={{ maxWidth: CANVAS_W }}
          >
            <div className="flex items-center gap-2 text-[10px] tracking-[0.14em] text-accent/70">
              <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border-[1.5px] border-accent" />
              ROBOT
            </div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.14em] text-accent/70">
              <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
              PROJECTILE
            </div>
            <div className="ml-auto text-[10px] tracking-[0.12em] text-accent/25">
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
