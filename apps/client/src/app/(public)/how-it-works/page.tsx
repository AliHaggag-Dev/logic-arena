import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Code2, Crown, Layers, RefreshCw, Shield, Swords, Trophy, Zap,
} from "lucide-react";

import PublicPageLayout, {
  PublicBody, PublicFooterCTA, PublicSectionCard, type PublicSection,
} from "@/components/PublicPageLayout";

export const metadata = {
  title: "How It Works | Logic Arena",
  description: "Learn how Logic Arena works: write AliScript, deploy your robot, clear campaign fights, and battle in the real-time Arena.",
};

const SECTIONS: PublicSection[] = [
  { id: "write-your-script", title: "Write Your Script", label: "Step 01: Write" },
  { id: "deploy-your-robot", title: "Deploy Your Robot", label: "Step 02: Deploy" },
  { id: "enter-the-arena", title: "Enter the Arena", label: "Step 03: Enter" },
  { id: "climb-the-ranks", title: "Climb the Ranks", label: "Step 04: Climb" },
  { id: "aliscript-language", title: "The AliScript Language", label: "AliScript" },
  { id: "competitive-engine", title: "The Competitive Engine", label: "Engine" },
];

const ALISCRIPT_FEATURES = [
  { icon: <Code2 size={15} />, label: "Imperative Syntax", desc: "Familiar control flow: IF / ELSE / WHILE — zero learning curve." },
  { icon: <Zap size={15} />, label: "Robot API Built-In", desc: "Native uppercase commands like MOVE, FIRE, and SCAN." },
  { icon: <RefreshCw size={15} />, label: "Deterministic Execution", desc: "Runs under a fixed instruction quota, not hardware-dependent timers." },
  { icon: <Shield size={15} />, label: "Sandboxed & Safe", desc: "Pure battle logic. No external network or filesystem access." },
  { icon: <Layers size={15} />, label: "Persistent Loadouts", desc: "Scripts, match mode preference, chassis, paint, and tracer choices are saved to your profile." },
  { icon: <Trophy size={15} />, label: "Replay Review", desc: "Arena matches persist replay data; campaign fights use temporary review frames." },
];

const ENGINE_FACTS = [
  ["AST Sandbox", "AliScript is tokenized, parsed, and interpreted through a whitelisted AST evaluator. It has no access to browser storage, Node APIs, the filesystem, or external networks."],
  ["Instruction Quota System", "Each robot is allocated a fixed operations budget per logic tick. Scripts that exceed the budget receive a TLE result, so hardware speed never decides a match."],
  ["WebSocket Real-Time Sync", "Arena matches stream compressed state deltas over WSS to players and spectators. The 3D renderer interpolates between server snapshots for smooth high-refresh visuals."],
  ["Campaign Fixed-Step Runner", "Campaign fights use a server-side CampaignSession that advances fixed 60 FPS simulation steps and shares the same CAMPAIGN_MATCH_MAX_STEPS timer with the client."],
  ["Replay Model", "Arena match replays are persisted as snapshots for later viewing. Campaign replay controls are temporary in-memory review tools for the active level attempt."],
];

export default function HowItWorksPage() {
  const steps = [
    {
      id: "write-your-script",
      number: "01",
      title: "Write Your Script",
      icon: <Code2 size={16} />,
      body: "Write your robot's logic using AliScript. The editor checks syntax and tracks instruction limits in real-time.",
      detail: "AliScript supports conditionals, loops, dictionaries, arrays, sensors, math helpers, and Swarm communication while staying inside the AST sandbox.",
    },
    {
      id: "deploy-your-robot",
      number: "02",
      title: "Deploy Your Robot",
      icon: <Layers size={16} />,
      body: "Deploy your script with a single click. The server parses it, validates it against sandbox limits, and binds it to your selected robot loadout.",
      detail: "Your profile stores scripts, match mode preference, chassis, paint, tracer, arena preferences, and notification settings.",
    },
    {
      id: "enter-the-arena",
      number: "03",
      title: "Enter the Arena",
      icon: <Swords size={16} />,
      body: "Choose PvP Arena matches, friend challenges, tournaments, practice modes, or PvE Campaign levels. Matches stream live to the 3D Arena viewer.",
      detail: "Campaign fights support server-side pause/resume and temporary replay controls. Multiplayer arena matches do not pause; they run as live competitive sessions.",
    },
    {
      id: "climb-the-ranks",
      number: "04",
      title: "Climb the Ranks",
      icon: <Crown size={16} />,
      body: "Earn rating points by winning arena matches and campaign points by clearing levels. Study replays, improve your logic, and climb the global leaderboard.",
      detail: "Victory modals count campaign points and stars immediately while preserving your best-star record for each level.",
    },
  ];

  return (
    <PublicPageLayout
      badge="Platform Guide"
      title="How It Works"
      subtitle="Logic Arena transforms your code into a living, fighting robot. Four steps stand between you and combat glory. Master each one to rise through the ranks."
      lastUpdated="June 2026"
      sections={SECTIONS}
    >

      {/* Steps 01–04 */}
      {steps.map((step, i) => (
        <PublicSectionCard key={step.id} id={step.id} index={i + 1} title={step.title} icon={step.icon}>
          <div className="flex flex-col gap-5">
            {/* Big number watermark */}
            <div className="flex gap-5 items-start">
              <div
                className="hidden sm:flex shrink-0 items-center justify-center w-16 h-16 rounded-xl text-[28px] font-black"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "rgba(var(--accent-rgb),0.12)",
                  background: "rgba(var(--accent-rgb),0.04)",
                  border: "1px solid rgba(var(--accent-rgb),0.08)",
                  letterSpacing: "-0.05em",
                }}
              >
                {step.number}
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <PublicBody>{step.body}</PublicBody>
              </div>
            </div>

            {/* Detail block */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(var(--accent-rgb),0.03)",
                border: "1px solid rgba(var(--accent-rgb),0.1)",
                borderLeft: "3px solid rgba(var(--accent-rgb),0.4)",
              }}
            >
              <p
                className="text-[12px] sm:text-[13px] leading-[1.9]"
                style={{ color: "rgba(var(--accent-rgb),0.6)", fontFamily: "var(--font-mono)" }}
              >
                {step.detail}
              </p>
            </div>
          </div>
        </PublicSectionCard>
      ))}

      {/* AliScript language section */}
      <PublicSectionCard id="aliscript-language" index={5} title="The AliScript Language" icon={<BookOpen size={16} />}>
        <div className="flex flex-col gap-6">
          <PublicBody>
            AliScript is a purpose-built combat scripting language designed from the ground up for the Logic Arena engine. It executes inside each robot&apos;s sandboxed runtime with a deterministic Time Limit Exceeded (TLE) instruction quota that guarantees fair outcomes on any server hardware.
          </PublicBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALISCRIPT_FEATURES.map(f => (
              <div
                key={f.label}
                className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-300"
                style={{
                  background: "rgba(var(--accent-rgb),0.03)",
                  border: "1px solid rgba(var(--accent-rgb),0.08)",
                }}
              >
                <div className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>{f.icon}</div>
                <div>
                  <p className="text-[11px] font-black tracking-[0.12em] uppercase mb-1.5" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{f.label}</p>
                  <p className="text-[12px] leading-[1.75]" style={{ color: "rgba(var(--accent-rgb),0.6)", fontFamily: "var(--font-mono)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/docs#aliscript" className="group flex items-center justify-center gap-2 px-6 h-11 rounded-xl text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(var(--accent-rgb),0.15)] hover:bg-accent/15 hover:border-accent/50" style={{ background: "rgba(var(--accent-rgb),0.1)", border: "1px solid rgba(var(--accent-rgb),0.35)", color: "var(--accent)" }}>
              Full Documentation <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/arena" className="flex items-center justify-center gap-2 px-6 h-11 rounded-xl text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(var(--accent-rgb),0.15)] hover:bg-accent/10 hover:border-accent/30 hover:text-accent" style={{ background: "rgba(var(--accent-rgb),0.04)", border: "1px solid rgba(var(--accent-rgb),0.15)", color: "rgba(var(--accent-rgb),0.6)" }}>
              Try Practice Mode
            </Link>
          </div>
        </div>
      </PublicSectionCard>

      {/* Engine section */}
      <PublicSectionCard id="competitive-engine" index={6} title="The Competitive Engine" icon={<Zap size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>
            The Logic Arena combat engine is built on determinism, fairness, transparency, and integrity. Arena PvP, campaign PvE, replay review, and spectator views all derive from server-owned state rather than client-side trust.
          </PublicBody>
          {ENGINE_FACTS.map(([heading, body]) => (
            <div key={heading} className="flex gap-4 items-start py-3 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb),0.08)" }}>
              <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{heading}</p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      <PublicFooterCTA>
        Ready to compete?{" "}
        <Link href="/register" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.35)" }}>Create your account</Link>
        {" "}·{" "}
        <Link href="/docs" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.35)" }}>Read the docs</Link>
      </PublicFooterCTA>
    </PublicPageLayout>
  );
}
