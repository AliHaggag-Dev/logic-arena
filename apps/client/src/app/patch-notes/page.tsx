import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Patch Notes — Logic Arena",
  description: "Stay up to date with the latest changes to Logic Arena's combat engine, garage, and AliScript compiler.",
};

type Tag = "COMBAT" | "GARAGE" | "ENGINE" | "BUG FIX" | "BALANCE" | "QOL";

const TAG_COLORS: Record<Tag, string> = {
  COMBAT: "rgba(var(--accent-rgb),0.15)",
  GARAGE: "rgba(var(--accent-rgb),0.12)",
  ENGINE: "rgba(var(--accent-rgb),0.10)",
  "BUG FIX": "rgba(239,68,68,0.12)",
  BALANCE: "rgba(var(--accent-rgb),0.08)",
  QOL: "rgba(var(--accent-rgb),0.07)",
};

const TAG_BORDER: Record<Tag, string> = {
  COMBAT: "rgba(var(--accent-rgb),0.5)",
  GARAGE: "rgba(var(--accent-rgb),0.4)",
  ENGINE: "rgba(var(--accent-rgb),0.35)",
  "BUG FIX": "rgba(239,68,68,0.4)",
  BALANCE: "rgba(var(--accent-rgb),0.3)",
  QOL: "rgba(var(--accent-rgb),0.25)",
};

interface Change {
  tag: Tag;
  text: string;
}

interface Release {
  version: string;
  date: string;
  headline: string;
  changes: Change[];
}

const RELEASES: Release[] = [
  {
    version: "v2.0.0",
    date: "2026-04-01",
    headline: "Full Engine Rewrite — Deterministic Bytecode & 3D Arena",
    changes: [
      { tag: "ENGINE", text: "Complete rewrite of the AliScript execution engine using deterministic bytecode — 4× faster tick processing." },
      { tag: "COMBAT", text: "Introduced the 3D Arena viewer with real-time robot state rendering at 60 FPS." },
      { tag: "COMBAT", text: "Added new combat event: EMP_BURST — disables enemy movement for 2 ticks." },
      { tag: "GARAGE", text: "Robot Builder v2 launched with live code editor, stat preview, and version history panel." },
      { tag: "ENGINE", text: "AliScript sandbox now fully isolates network/filesystem — zero attack surface." },
      { tag: "BUG FIX", text: "Fixed race condition where two simultaneous attacks could result in both robots surviving." },
      { tag: "BALANCE", text: "Reduced base attack damage from 25 to 20; increased shield base HP from 80 to 100." },
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-01-15",
    headline: "Tournament Mode & Replay Theater",
    changes: [
      { tag: "COMBAT", text: "Launched Tournament Hub — bracket-style tournaments with up to 128 participants." },
      { tag: "COMBAT", text: "Replay Theater: view any past match frame-by-frame with annotated event logs." },
      { tag: "ENGINE", text: "AliScript v1.5 — added robot.scan() range queries and directional awareness API." },
      { tag: "GARAGE", text: "Added bulk import/export of robot scripts as .ali files." },
      { tag: "QOL", text: "Leaderboard now shows ELO delta and Win/Loss ratio columns." },
      { tag: "BUG FIX", text: "Fixed infinite loop guard that was incorrectly triggering on tight recursion." },
      { tag: "BALANCE", text: "Shield regeneration rate increased from 1 HP/tick to 2 HP/tick." },
    ],
  },
  {
    version: "v1.0.0",
    date: "2025-10-01",
    headline: "Initial Launch — Logic Arena Goes Live",
    changes: [
      { tag: "ENGINE", text: "First public release of the AliScript language and sandbox execution runtime." },
      { tag: "COMBAT", text: "2D arena mode with turn-based robot combat — up to 4 robots per match." },
      { tag: "GARAGE", text: "Basic robot builder with script editor, stat selection, and one-click deploy." },
      { tag: "COMBAT", text: "Global ELO ranking system with real-time leaderboard updates." },
      { tag: "QOL", text: "Dashboard, profile pages, challenge system, and spectator mode at launch." },
      { tag: "ENGINE", text: "OAuth authentication via Google and GitHub." },
    ],
  },
];

function TagPill({ tag }: { tag: Tag }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-[0.2em] uppercase shrink-0"
      style={{
        background: TAG_COLORS[tag],
        border: `1px solid ${TAG_BORDER[tag]}`,
        color: tag === "BUG FIX" ? "rgb(239,68,68)" : "var(--accent)",
      }}
    >
      {tag}
    </span>
  );
}

export default function PatchNotesPage() {
  return (
    <div className="min-h-screen bg-bg-primary font-mono relative overflow-hidden">
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--accent-rgb),0.012) 3px, rgba(var(--accent-rgb),0.012) 4px)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Back nav */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-accent/70 hover:text-accent uppercase mb-10 transition-all duration-300"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK
        </Link>

        {/* Hero */}
        <div className="mb-14 relative flex items-center bg-accent/5 border border-accent/20 rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.05)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]" />
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
          <div className="px-10 py-12 relative z-10 w-full">
            <p className="text-[10px] font-black tracking-[0.45em] text-accent/60 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" />
              CHANGELOG_FEED
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] mb-4 uppercase">
              Patch Notes
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-5" />
            <p className="text-[13px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em] max-w-2xl drop-shadow-[0_0_1px_rgba(var(--accent-rgb),0.1)]">
              Full changelog for every Logic Arena release. Sorted newest-first.
            </p>
          </div>
        </div>

        {/* Releases */}
        <div className="flex flex-col gap-8">
          {RELEASES.map((release) => (
            <div
              key={release.version}
              className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] group hover:border-accent/40 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] transition-all duration-300 relative"
            >
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent" />
              {/* Version header */}
              <div className="flex items-center justify-between gap-4 px-8 py-5 border-b border-accent/20 bg-accent/[0.03] relative z-10">
                <div className="flex items-center gap-4">
                  <code
                    className="text-2xl font-black tracking-[0.1em] text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"
                    style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                  >
                    {release.version}
                  </code>
                  <span className="text-[11px] font-mono text-accent/50 tracking-[0.2em] border border-accent/20 px-3 py-1 rounded bg-bg-primary/50 shadow-[inset_0_0_8px_rgba(var(--accent-rgb),0.05)]">
                    {release.date}
                  </span>
                </div>
                <div className="text-[9px] text-accent/30 tracking-[0.3em] text-right hidden sm:block font-black">
                  LOGIC_ARENA_CHANGELOG
                </div>
              </div>

              {/* Headline */}
              <div className="px-8 pt-6 pb-2 relative z-10">
                <p className="text-[14px] font-black tracking-[0.15em] text-accent uppercase drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.3)]">
                  {release.headline}
                </p>
              </div>

              {/* Changes */}
              <div className="px-8 pb-8 flex flex-col gap-3 mt-3 relative z-10">
                {release.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-4 py-2 border-b border-accent/10 group-hover:border-accent/20 transition-colors last:border-0 last:pb-0">
                    <div className="mt-0.5">
                      <TagPill tag={change.tag} />
                    </div>
                    <p className="text-[12.5px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em] max-w-2xl">
                      {change.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
