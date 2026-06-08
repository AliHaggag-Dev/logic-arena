import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Cpu, Layers, Package, Swords, Tag, Trophy, Wrench } from "lucide-react";

import PublicPageLayout, {
  PublicBody, PublicFooterCTA, PublicSectionCard, type PublicSection,
} from "@/components/PublicPageLayout";

export const metadata = {
  title: "Patch Notes | Logic Arena",
  description: "Latest updates, bug fixes, and new features in Logic Arena. See what changed in each version.",
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
    version: "v3.3.0",
    date: "2026-06-05",
    headline: "The Intelligent Editor — AI Script Generation & Inline Diagnostics",
    summary: "Brought the AliScript editor to life with an inline diagnostics system that catches syntax and logic errors in real time with red underlines and Tab-to-fix suggestions. Launched an AI Script Generator that converts plain English into working AliScript via SSE streaming, plus a 22-recipe Strategy Cookbook. Added a full Achievements & Badges system with tiered progression, a dedicated Arena Guide page, smart viewport-aware autocomplete, and major mobile performance optimizations.",
    changes: [
      { tag: "ENGINE", text: "AliScript Inline Diagnostics: Worker-thread parser detects syntax errors (e.g. MOVS → MOVE) via Levenshtein distance and surfaces logic warnings (loop nesting, read-only shadowing, STASIS violations, action dedup). Red wavy underlines in the editor; Tab or hover+click applies the closest fix instantly." },
      { tag: "QOL", text: "AI Script Generator & Strategy Cookbook: Describe robot behavior in plain English or Arabic — receive working AliScript streamed via SSE directly into the editor. Backed by 22 structured prebuilt recipes across 3 difficulty tiers covering patrol, combat, and evasion strategies." },
      { tag: "QOL", text: "Achievements & Badges System: Full progression with 4 tiers (Alpha, Beta, Gamma, Delta). Self-healing checkAll logic triggers on match persistence, campaign completion, and cache events. Neon-glowing progress bars, theme-aware tooltips, and inline badge stacks on the leaderboard." },
      { tag: "QOL", text: "Arena Guide Page & Smart Autocomplete: New dedicated guide page with hover chat triggers. Viewport-aware autocomplete dropdown that renders below when near the top and above when near the bottom — zero clipped suggestions." },
      { tag: "BUG FIX", text: "Mobile Performance: Replaced backdrop-blur with hardware-accelerated opacity transitions in MobileNav system menu. Optimized useRobotColorTint to update materials directly, preventing WebGL shader recompilations. CSS-based portrait orientation lock for non-arena pages." },
      { tag: "BUG FIX", text: "Pathfinder Oscillation Fix: Resolved robot corner oscillation with stuck detection and start cell snapping, preventing robots from bouncing indefinitely near wall boundaries." },
      { tag: "QOL", text: "UX Polish: Dashboard card overflow clipping fixed with scroll arrow visibility. Leaderboard action buttons aligned right to avoid badge overlap. Profile username decoding with enlarged mobile achievement badges. One-click copy buttons on all docs code examples." },
      { tag: "QOL", text: "New User Experience: Auto-create a default empty script on registration. Persist selected script ID across sessions. Cleaned up arena command console by removing the run override input and closing the Activity Log by default." },
    ],
  },
  {
    version: "v3.2.0",
    date: "2026-05-26",
    headline: "The Production-Grade Polish — SEO, Performance & Arena Environment Overhaul",
    summary: "A massive quality-of-life and infrastructure release. Complete landing page and SEO overhaul, full PWA immersion with arena landscape lock, campaign AliScript v2 security migration, dashboard redesign with gaming cards, King of the Hill mode, AI Tutor upgrades, critical arena theme fixes for LAVA and ICE double-damage stacking, and major mobile performance optimization eliminating scroll lag.",
    changes: [
      { tag: "QOL", text: "Landing Page & SEO: Server Component migration for maximum initial load speed, OG image for social sharing, Google Analytics (G-1QN8VTS98H), Google Search Console verification, sitemap.xml, 404 page fix, and full SEO metadata across all public pages." },
      { tag: "QOL", text: "Dashboard Redesign: Complete above-the-fold optimization with premium gaming cards, legendary script cards, redesigned mobile layout with tab strip scrolling fixes, and light mode background correction." },
      { tag: "ENGINE", text: "Campaign & Parser Security: All 60 campaign levels migrated to AliScript v2 syntax (AND/OR/NOT replacing &&/||/!). Replaced unsafe eval with a secure custom logic parser used in both client and server. Revamped CampaignScriptEditor with visual line numbers, placeholder styling, and smart autocomplete positioning." },
      { tag: "COMBAT", text: "King of the Hill & Survival Modes: New KOTH mode with zone control (radius 80, 300 tick score target), glowing amber cylinder render with rotating ring boundary, and 4 fortress walls for cover. Survival mode overhaul — dummy robots no longer target same-team entities, dynamic enemy spawning from match engine, and wave/enemy stats in HUD." },
      { tag: "BUG FIX", text: "Arena Environment Theme Fixes: NEO-CYBER obstacles were leaking into LAVA and ICE themes causing thematic inconsistency and double lava damage stacking (static 5 HP/sec + dynamic 10 HP/sec). Removed CYBER-only filter to properly render TRAP/LAVA on all themes. Replaced AABB with OBB collision detection for accurate rotated obstacle hitboxes. Fixed ice patch state reset per tick and moved FOV aiming before ice early return so turrets track targets while sliding." },
      { tag: "BUG FIX", text: "Mobile Performance Optimization: Eliminated scroll lag by optimizing 3D canvas with IntersectionObserver (pauses when off-screen). Removed blur filter causing repaint storms. Memoized GridHelper and Floor to prevent 60fps GPU memory leaks. Disabled CSS transitions during theme changes to prevent frame drops. Extracted ImageCard into Client Component allowing the landing page to be a pure Server Component." },
      { tag: "QOL", text: "PWA & Mobile Experience: Arena auto-rotates to landscape on mount with global portrait guard. iOS-specific install prompt added. Android status and navigation bars synced to app theme colors. Splash screen background set to pure black for seamless logo blend. App name separated into two words in manifest. Global nav hidden on arena with immersive fullscreen on touch." },
      { tag: "QOL", text: "AI Tutor, UX & Polish: AI Tutor supports image uploads, rich markdown styling, and smart auto-scroll via React Portals. Script editor with autocomplete and syntax highlighting ported to dashboard modal. Consistent back buttons on all dynamic child pages. Platform terminology overhauled from sci-fi jargon to intuitive English across 60 levels and all UI components." },
    ],
  },
  {
    version: "v3.1.0",
    date: "2026-05-22",
    headline: "The Living Arena & Mobile Revolution",
    summary: "Shipped the most visually ambitious update in Logic Arena's history — a complete resurrection of the 3D arena into a living cinematic experience, five new game modes, and a mobile block editor.",
    changes: [
      { tag: "ENGINE", text: "Phase 0 — Critical Arena Bug Fixes: Plugged massive memory leaks, eliminated 20/sec React re-renders, and memoized geometry to stabilize the 3D arena." },
      { tag: "COMBAT", text: "Phase 3 — Dynamic Robot Animations: Robots now use GLTF skeletal animations that cross-fade automatically based on velocity and idle states." },
      { tag: "COMBAT", text: "Phase 4 — Dynamic Environment Themes: ICE and LAVA themes introduced with gameplay consequences. Materials, lighting, and particle effects adapt globally." },
      { tag: "QOL", text: "Phase 7 — Mobile Block Editor: Eliminated the mobile keyboard entirely. Players now compose AliScript using a drag-and-drop visual programming system via @dnd-kit." },
      { tag: "COMBAT", text: "Phase 8 — Three New Game Modes: Launched SURVIVAL (waves), KOTH (control points), and CTF (capture the flag), expanding combat beyond basic deathmatch." },
      { tag: "ENGINE", text: "Phase 9 — AliScript Super Powers: Added 6 new tactical commands (TELEPORT, SHIELD, CLOAK, DASH, MINE, TAUNT) with strict energy and cooldown mechanics." },
      { tag: "QOL", text: "Phase 5 & Garage Polish: Cinematic Winner Screen with 3-star ratings, plus a Garage preview system allowing inspection without changing active loadouts." },
      { tag: "BUG FIX", text: "Admin & Auth Hardening: Resolved cascading 429 errors on the Admin dashboard and fixed the SMTP timeout bug freezing the registration flow." },
    ],
  },
  {
    version: "v3.0.0",
    date: "2026-05-19",
    headline: "The Architecture Mastery Update & Full Campaign Mode",
    summary: "A colossal milestone encompassing five major updates (v2.6.0 - v3.0.0). Introduced a live 2D streaming campaign battle system, Swarm Intelligence APIs, the Black Market economy, and a massive architectural refactor that transformed Logic Arena into an enterprise-grade platform.",
    changes: [
      { tag: "COMBAT", text: "Live 2D Campaign Battle System — Watch your AliScript fight enemy AI in real-time with 20fps frame-by-frame streaming directly from the server." },
      { tag: "ENGINE", text: "Deterministic Execution (AliScript v2.4) — Replaced hardware-dependent timing with a strict 2,000 operations/tick quota, enforcing O(1) Big O optimizations." },
      { tag: "ENGINE", text: "Swarm Intelligence API — Added BROADCAST() and RECEIVE() for secure, deep-copied inter-robot communication and coordination." },
      { tag: "GARAGE", text: "Black Market Economy & AAA Models — Earn points to purchase custom robot models, Neon Paints, and Tracer Rounds, featuring premium .glb models." },
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
