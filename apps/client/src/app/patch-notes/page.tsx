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
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-accent hover:text-accent/70 uppercase mb-10 transition-colors duration-150"
        >
          ← BACK
        </Link>

        {/* Hero */}
        <div className="mb-14 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/50 rounded-tl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/50 rounded-br" />
          <div className="px-6 py-8">
            <p className="text-[10px] font-black tracking-[0.45em] text-accent/60 uppercase mb-3">
              ⌐ CHANGELOG_FEED ¬
            </p>
            <h1 className="text-4xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] mb-4 uppercase">
              Patch Notes
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Full changelog for every Logic Arena release. Sorted newest-first.
            </p>
          </div>
        </div>

        {/* Releases */}
        <div className="flex flex-col gap-8">
          {RELEASES.map((release) => (
            <div
              key={release.version}
              className="bg-card border border-accent/50 rounded-xl overflow-hidden"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              {/* Version header */}
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-accent/50 bg-bg-secondary/40">
                <div className="flex items-center gap-3">
                  <code
                    className="text-lg font-black tracking-[0.1em] text-accent"
                    style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                  >
                    {release.version}
                  </code>
                  <span className="text-[10px] text-text-secondary tracking-[0.2em]">
                    {release.date}
                  </span>
                </div>
                <div className="text-[9px] text-accent/70 tracking-[0.2em] text-right hidden sm:block">
                  LOGIC_ARENA_CHANGELOG
                </div>
              </div>

              {/* Headline */}
              <div className="px-6 pt-4 pb-2">
                <p className="text-[12px] font-black tracking-[0.08em] text-text-primary uppercase">
                  {release.headline}
                </p>
              </div>

              {/* Changes */}
              <div className="px-6 pb-5 flex flex-col gap-2 mt-2">
                {release.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5 border-b border-accent/50/40 last:border-0">
                    <TagPill tag={change.tag} />
                    <p className="text-[11px] text-text-secondary leading-relaxed pt-0.5">
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
