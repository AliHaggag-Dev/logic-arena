import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Code2, Crown, Layers, RefreshCw, Shield, Swords, Trophy, Zap,
} from "lucide-react";

import PublicPageLayout, {
  PublicBody, PublicFooterCTA, PublicSectionCard, type PublicSection,
} from "@/components/PublicPageLayout";

export const metadata: Metadata = {
  title: "How It Works — Logic Arena",
  description: "Logic Arena transforms your code into a living, fighting robot. Four steps stand between you and combat glory.",
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
  { icon: <Code2 size={15} />, label: "Imperative Syntax", desc: "Familiar C-style control flow: if / else / while / for — zero learning curve if you know any language." },
  { icon: <Zap size={15} />, label: "Robot API Built-In", desc: "robot.move(), robot.attack(), robot.scan() — native language primitives, not a library." },
  { icon: <RefreshCw size={15} />, label: "Deterministic Execution", desc: "Runs inside the engine at 20 ticks/second (50ms) with a fixed instruction quota ensuring hardware-independent outcomes." },
  { icon: <Shield size={15} />, label: "Sandboxed & Safe", desc: "No filesystem or network access. Pure battle logic — no side-channel attacks, no infinite loops escaping the quota." },
  { icon: <Layers size={15} />, label: "Version History", desc: "Every script submission is versioned. Roll back to any prior version from your Garage at any time." },
  { icon: <Trophy size={15} />, label: "Instant Replay", desc: "Every match is recorded and replayable frame-by-frame in the 3D Arena viewer, complete with event annotations." },
];

const ENGINE_FACTS = [
  ["Deterministic Bytecode", "AliScript programs are compiled to a deterministic bytecode that produces identical outcomes regardless of server hardware or load."],
  ["Instruction Quota System", "Each robot is allocated a fixed ops budget per tick. Scripts that exceed the budget receive a TLE (Time Limit Exceeded) result — not an unfair hardware advantage."],
  ["WebSocket Real-Time Sync", "Live matches stream compressed state deltas over WSS to all connected clients and spectators at 20 ticks/sec. The 3D renderer smoothly interpolates intermediate frames for 60+ FPS visuals."],
  ["Replay Ledger", "Every match outcome is committed to an append-only ledger on the server. Replays are lossless — they re-execute the original bytecode against the recorded input, not a saved video."],
];

export default function HowItWorksPage() {
  const steps = [
    {
      id: "write-your-script",
      number: "01",
      title: "Write Your Script",
      icon: <Code2 size={16} />,
      body: "Use AliScript — our purpose-built combat scripting language — to define your robot's movement, attack patterns, and decision logic. The editor provides full autocomplete, real-time syntax checking, inline documentation, and an instruction-count profiler. You see performance impact before you ever deploy.",
      detail: "AliScript runs in a sandboxed execution environment. Every script you write is fully isolated — it can read sensor data and issue commands, but it cannot access the network, filesystem, or any resources outside the engine.",
    },
    {
      id: "deploy-your-robot",
      number: "02",
      title: "Deploy Your Robot",
      icon: <Layers size={16} />,
      body: "When your script is ready, deploy it to the Logic Arena cloud with a single click. The engine compiles your code to deterministic bytecode and runs it through a verification suite — checking for sandbox violations, quota breaches, and syntax errors — before it ever touches a live match.",
      detail: "Every successful deployment creates a numbered version in your Garage. You can maintain multiple robot configurations simultaneously and switch between them freely. Deployments take effect immediately for asynchronous matches and at the next queue entry for live matches.",
    },
    {
      id: "enter-the-arena",
      number: "03",
      title: "Enter the Arena",
      icon: <Swords size={16} />,
      body: "Queue for a ranked match, challenge a friend in the Lobby, or tackle algorithmic boss fights in the Campaign. The matchmaking engine pairs you fairly. Once confirmed, the battle engine executes your scripts deterministically on the server — and the result streams live to the 3D Arena viewer in your browser.",
      detail: "Matches are fully observable in real-time. Every robot action, health delta, and AI decision is rendered faithfully in the 3D viewer. Spectator Mode is always on — anyone can watch top players battle live directly from the Global Leaderboard.",
    },
    {
      id: "climb-the-ranks",
      number: "04",
      title: "Climb the Ranks",
      icon: <Crown size={16} />,
      body: "Wins earn ELO rating points; losses reduce them. The ELO delta per match is determined by the skill gap between you and your opponent — defeating a higher-ranked player earns significantly more. Study your match replays to identify strategic weaknesses, iterate your script, and ascend the global leaderboard.",
      detail: "The leaderboard is global, real-time, and backed by Redis for instant updates. Earn points through victories to unlock premium AAA chassis models, custom tracer colors, and exclusive paints in the Black Market.",
    },
  ];

  return (
    <PublicPageLayout
      badge="Platform Guide"
      title="How It Works"
      subtitle="Logic Arena transforms your code into a living, fighting robot. Four steps stand between you and combat glory. Master each one to rise through the ranks."
      lastUpdated="May 2026"
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
            AliScript is a purpose-built combat scripting language designed from the ground up for the Logic Arena engine. It executes inside each robot&apos;s sandboxed runtime at 20 ticks per second, with a deterministic Time Limit Exceeded (TLE) instruction quota that guarantees fair outcomes on any server hardware.
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
            The Logic Arena combat engine is built on four non-negotiable principles: determinism, fairness, transparency, and integrity. Here is exactly how it works under the hood.
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
