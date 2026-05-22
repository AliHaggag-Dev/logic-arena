import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Cpu, Layers, Package, Swords, Tag, Trophy, Wrench } from "lucide-react";

import PublicPageLayout, {
  PublicBody, PublicFooterCTA, PublicSectionCard, type PublicSection,
} from "@/components/PublicPageLayout";

export const metadata: Metadata = {
  title: "Updates — Logic Arena",
  description: "Full changelog for every Logic Arena release. Follow the evolution of the combat engine, AliScript, the Garage, and everything in between.",
};

/* ─── Types ─────────────────────────────────────────────── */

type Tag = "COMBAT" | "GARAGE" | "ENGINE" | "BUG FIX" | "BALANCE" | "QOL";

interface Change { tag: Tag; text: string; }
interface Release { version: string; date: string; headline: string; summary: string; changes: Change[]; }

/* ─── Tag config ─────────────────────────────────────────── */

const TAG_CONFIG: Record<Tag, { bg: string; border: string; color: string }> = {
  COMBAT:    { bg: "rgba(var(--accent-rgb),0.12)",        border: "rgba(var(--accent-rgb),0.4)",        color: "var(--accent)" },
  GARAGE:    { bg: "rgba(var(--accent-rgb),0.08)",        border: "rgba(var(--accent-rgb),0.3)",        color: "var(--accent)" },
  ENGINE:    { bg: "rgba(var(--accent-rgb),0.06)",        border: "rgba(var(--accent-rgb),0.25)",       color: "var(--accent)" },
  "BUG FIX": { bg: "rgba(var(--sem-danger-rgb,239,68,68),0.10)", border: "rgba(var(--sem-danger-rgb,239,68,68),0.35)", color: "var(--sem-danger,#ef4444)" },
  BALANCE:   { bg: "rgba(var(--sem-warning-rgb,245,158,11),0.08)", border: "rgba(var(--sem-warning-rgb,245,158,11),0.3)", color: "var(--sem-warning,#f59e0b)" },
  QOL:       { bg: "rgba(var(--sem-success-rgb,34,197,94),0.08)", border: "rgba(var(--sem-success-rgb,34,197,94),0.25)", color: "var(--sem-success,#22c55e)" },
};

const TAG_ICONS: Record<Tag, React.ReactNode> = {
  COMBAT:    <Swords size={10} />,
  GARAGE:    <Wrench size={10} />,
  ENGINE:    <Cpu size={10} />,
  "BUG FIX": <Code2 size={10} />,
  BALANCE:   <Layers size={10} />,
  QOL:       <Package size={10} />,
};

/* ─── Release data ───────────────────────────────────────── */

const RELEASES: Release[] = [
  {
    version: "v3.0.0",
    date: "2026-05-19",
    headline: "The Architecture Mastery Update & Full Campaign Mode",
    summary: "A colossal milestone encompassing five major updates (v2.6.0 - v3.0.0). Introduced a live 2D streaming campaign battle system, Swarm Intelligence APIs, the Black Market economy, and a massive architectural refactor that transformed Logic Arena into an enterprise-grade platform.",
    changes: [
      { tag: "COMBAT", text: "Live 2D Campaign Battle System — Watch your AliScript fight enemy AI in real-time with 20fps frame-by-frame streaming directly from the server." },
      { tag: "ENGINE", text: "Deterministic Execution (AliScript v2.4) — Replaced hardware-dependent timing with a strict 2,000 operations/tick quota, enforcing O(1) Big O optimizations." },
      { tag: "ENGINE", text: "Swarm Intelligence API — Added BROADCAST() and RECEIVE() for secure, deep-copied inter-robot communication and coordination." },
      { tag: "GARAGE", text: "Black Market Economy & AAA Models — Earn points to purchase custom Chassis, Neon Paints, and Tracer Rounds, featuring premium .glb models." },
      { tag: "QOL", text: "LeetCode-Style Campaign — Expanded the campaign to a 60-level algorithmic proving ground across 6 categories (Conditionals, Loops, Arrays, etc.)." },
      { tag: "ENGINE", text: "AliScript Semantic Warning System — Real-time compile checks for logical contradictions (e.g. PATHFIND then STOP) and dead code." },
      { tag: "QOL", text: "Legendary Identity System — PWA fullscreen support, secure Cloudinary avatar uploads, and a global Live Spectator Mode." },
      { tag: "BUG FIX", text: "Massive Monorepo Refactor & Security Audit — Dismantled all monoliths, hardened JWT security with HttpOnly cookies, and neutralized ReDoS vulnerabilities." },
    ],
  },
  {
    version: "v2.5.0",
    date: "2026-04-27",
    headline: "The Arena Mastery Update — Performance, Modes & Engine Hardening",
    summary: "Shipped a complete performance overhaul eliminating every WebGL bottleneck and memory leak, transformed Training and Racing modes into legendary cyberpunk experiences, and hardened the energy system.",
    changes: [
      { tag: "QOL", text: "Legendary Training Mode overhauled with holographic target dummies, dynamic health rings, float-up damage numbers, and a dedicated glassmorphism HUD." },
      { tag: "COMBAT", text: "Legendary Racing Mode redesigned with strategic obstacle placement (Mud Traps, Lava Corners) and a new neon-green FINISH_LINE entity for time trial circuits." },
      { tag: "ENGINE", text: "Fixed server-melting 'Ghost Match Massacre' exploit where matches continued processing at full CPU speed after all clients disconnected." },
      { tag: "GARAGE", text: "Added combatStats Json to User model to track 5 dimensions of combat: Efficiency, Aggression, Defense, Precision, and Speed with an animated Radar Chart profile UI." },
      { tag: "ENGINE", text: "Added QueryStatement AST node with 8 query functions (GET_HEALTH, GET_DISTANCE, etc.) allowing robots to read live state directly into script variables." },
      { tag: "BUG FIX", text: "Massive performance fixes: Eliminated WebGL draw call explosions via InstancedMesh, removed useFrame saturation from obstacles via GPU shaders, and stopped Replay snapshot OOM crashes." },
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-04-18",
    headline: "Full Engine Rewrite — Deterministic Bytecode & 3D Arena",
    summary: "The most significant update in Logic Arena's history. The AliScript execution engine was rebuilt from the ground up around a deterministic bytecode architecture, delivering 4× faster tick processing and hardware-independent match outcomes.",
    changes: [
      { tag: "ENGINE", text: "Complete rewrite of the AliScript execution engine using deterministic bytecode — 4× faster tick processing with zero hardware variance." },
      { tag: "ENGINE", text: "Replaced time-based execution limits with a fixed instruction quota system (OpsCounter). Matches are now fully deterministic across all server hardware." },
      { tag: "COMBAT", text: "Introduced the 3D Arena viewer with real-time robot state rendering at 60 FPS via WebSocket state deltas." },
      { tag: "COMBAT", text: "Added new combat event: EMP_BURST — disables enemy movement for 2 ticks. High risk, high reward." },
      { tag: "GARAGE", text: "Robot Builder v2 launched with live code editor, stat preview panel, instruction profiler, and full version history." },
      { tag: "ENGINE", text: "AliScript sandbox now fully isolates network and filesystem — zero attack surface. The execution environment cannot make external calls." },
      { tag: "BUG FIX", text: "Fixed critical race condition where two simultaneous attacks on the same tick could result in both robots surviving at 1 HP." },
      { tag: "BALANCE", text: "Reduced base attack damage from 25 to 20; increased shield base HP from 80 to 100 to favour defensive scripting strategies." },
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-04-13",
    headline: "Tournament Mode & Replay Theater",
    summary: "Competitive infrastructure expansion. Tournament brackets, a dedicated replay system, and AliScript v1.5 with advanced sensory APIs.",
    changes: [
      { tag: "COMBAT", text: "Launched Tournament Hub — bracket-style tournaments with up to 128 participants and automated bracket progression." },
      { tag: "COMBAT", text: "Replay Theater: view any past match frame-by-frame with annotated event logs and AI decision overlays." },
      { tag: "ENGINE", text: "AliScript v1.5 — added robot.scan() range queries, GET_ALL_VISIBLE_ENEMIES(), and directional awareness API." },
      { tag: "GARAGE", text: "Added bulk import/export of robot scripts as .ali files for community sharing." },
      { tag: "QOL", text: "Leaderboard now displays ELO delta per match and Win/Loss ratio columns." },
      { tag: "BUG FIX", text: "Fixed infinite loop guard that was incorrectly triggering on legitimate tight recursion patterns." },
      { tag: "BALANCE", text: "Shield regeneration rate increased from 1 HP/tick to 2 HP/tick." },
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-04-10",
    headline: "Initial Launch — Logic Arena Goes Live",
    summary: "The beginning. Public release of the AliScript language, the original 2D arena engine, and the global ELO ranking system.",
    changes: [
      { tag: "ENGINE", text: "First public release of the AliScript language and sandbox execution runtime." },
      { tag: "COMBAT", text: "2D arena mode with real-time robot combat — up to 4 robots per match." },
      { tag: "GARAGE", text: "Basic robot builder with script editor, stat selection, and one-click deploy." },
      { tag: "COMBAT", text: "Global ELO ranking system with real-time leaderboard updates." },
      { tag: "QOL", text: "Dashboard, profile pages, challenge system, and spectator mode available at launch." },
      { tag: "ENGINE", text: "OAuth authentication via Google and GitHub at launch." },
    ],
  },
  {
    version: "v0.5.0",
    date: "2026-04-07",
    headline: "The Birth of AliScript (The Logic Compiler)",
    summary: "Successfully implemented a custom Logic Parser and Execution Engine, allowing players to program robot behavior using a simplified scripting language (AliScript). The Arena now has a Brain.",
    changes: [
      { tag: "ENGINE", text: "Custom Compiler Pipeline created from String Script -> Lexer/Parser -> AST -> Server-side Evaluation -> Real-time Execution." },
      { tag: "QOL", text: "Integrated Visual Debugging Suite featuring neon tracer lines and Live Logic Logs for immediate script performance feedback." },
      { tag: "BUG FIX", text: "Fixed the 'Recursive Firing' bug by implementing an Edge-Triggered Logic Latch that triggers actions only when state changes." },
      { tag: "ENGINE", text: "Overcame monorepo path resolution errors to ensure logic-parser package is correctly built and resolved before server execution." },
    ],
  },
];

/* ─── Components ─────────────────────────────────────────── */

function TagPill({ tag }: { tag: Tag }) {
  const cfg = TAG_CONFIG[tag];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {TAG_ICONS[tag]}
      {tag}
    </span>
  );
}

const SECTIONS: PublicSection[] = RELEASES.map(r => ({
  id: `release-${r.version.replace(".", "-")}`,
  title: r.version,
  label: `${r.version} — ${r.date}`,
}));

/* ─── Page ──────────────────────────────────────────────── */

export default function PatchNotesPage() {
  return (
    <PublicPageLayout
      badge="Updates Feed"
      title="Changelog"
      subtitle="The full, unabridged record of every change shipped to Logic Arena — combat balance, engine upgrades, AliScript improvements, and bug fixes. Newest first."
      lastUpdated="May 2026"
      sections={SECTIONS}
    >

      {RELEASES.map((release, idx) => (
        <PublicSectionCard
          key={release.version}
          id={`release-${release.version.replace(".", "-")}`}
          index={idx + 1}
          title={`${release.version} — ${release.date}`}
          icon={<Trophy size={16} />}
        >
          <div className="flex flex-col gap-5">
            {/* Headline + summary */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(var(--accent-rgb),0.04)",
                border: "1px solid rgba(var(--accent-rgb),0.1)",
                borderLeft: "3px solid rgba(var(--accent-rgb),0.5)",
              }}
            >
              <p className="text-[12px] font-black tracking-[0.15em] uppercase mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                {release.headline}
              </p>
              <p className="text-[12px] sm:text-[13px] leading-[1.8]" style={{ color: "rgba(var(--accent-rgb),0.6)", fontFamily: "var(--font-mono)" }}>
                {release.summary}
              </p>
            </div>

            {/* Change list */}
            <div className="flex flex-col gap-1">
              {release.changes.map((change, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 py-3 border-b last:border-0"
                  style={{ borderColor: "rgba(var(--accent-rgb),0.07)" }}
                >
                  <div className="mt-0.5 shrink-0">
                    <TagPill tag={change.tag} />
                  </div>
                  <p className="text-[12.5px] leading-[1.8]" style={{ color: "rgba(var(--accent-rgb),0.7)", fontFamily: "var(--font-mono)" }}>
                    {change.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Change count */}
            <div className="flex items-center gap-2">
              <Tag size={11} style={{ color: "rgba(var(--accent-rgb),0.3)" }} />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: "rgba(var(--accent-rgb),0.3)", fontFamily: "var(--font-mono)" }}>
                {release.changes.length} changes in this release
              </span>
            </div>
          </div>
        </PublicSectionCard>
      ))}

      <PublicFooterCTA>
        Found a bug in the latest build?{" "}
        <Link href="/bug-report" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.35)" }}>Submit a bug report</Link>
        {" "}·{" "}
        <Link href="/feature-requests" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.35)" }}>Request a feature</Link>
      </PublicFooterCTA>
    </PublicPageLayout>
  );
}
