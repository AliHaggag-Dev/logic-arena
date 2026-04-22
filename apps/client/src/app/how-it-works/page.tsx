import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — Logic Arena",
  description: "Discover how Logic Arena works: write your AliScript, deploy your robot, enter the arena, and climb the ranks.",
};

const STEPS = [
  {
    number: "01",
    title: "Write Your Script",
    tag: "[WRITE_SCRIPT]",
    description:
      "Use AliScript — our purpose-built combat scripting language — to define your robot's movement, attack patterns, and decision logic. The editor gives you full autocomplete, real-time syntax checking, and instant simulation previews.",
  },
  {
    number: "02",
    title: "Deploy Your Robot",
    tag: "[DEPLOY_ROBOT]",
    description:
      "Compile your code against the AliScript engine and deploy your bot to the Logic Arena cloud. Each version is versioned, logged, and battle-tested in a sandboxed environment before it hits the live arena.",
  },
  {
    number: "03",
    title: "Enter the Arena",
    tag: "[ENTER_ARENA]",
    description:
      "Match against other operators in real-time or asynchronous combat. Watch your algorithm execute faithfully under pressure — every decision your code makes is rendered live in the 3D arena viewer.",
  },
  {
    number: "04",
    title: "Climb the Ranks",
    tag: "[CLIMB_RANKS]",
    description:
      "Wins earn ELO rating points and unlock new arena tiers. Study replays to find weaknesses, iterate on your script, and ascend the global leaderboard to claim the title of Arena Champion.",
  },
];

const ALISCRIPT_FEATURES = [
  { icon: "◈", label: "Imperative syntax", desc: "Familiar C-style control flow with if/else, while, for" },
  { icon: "⬡", label: "Robot API built-in", desc: "robot.move(), robot.attack(), robot.scan() — native to the language" },
  { icon: "⚡", label: "Real-time execution", desc: "Runs at 60 ticks/second inside the engine with deterministic output" },
  { icon: "⚙", label: "Sandboxed & safe", desc: "No filesystem or network access — pure battle logic only" },
  { icon: "◉", label: "Instant replay", desc: "Every match is recorded and replayable frame-by-frame" },
  { icon: "▶", label: "Version history", desc: "Roll back to any previous version of your script at any time" },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-bg-primary font-mono relative overflow-hidden">
      {/* Background scanlines */}
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
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
              SYSTEM_OVERVIEW
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] mb-4 uppercase">
              How It Works
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-5" />
            <p className="text-[13px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em] max-w-2xl drop-shadow-[0_0_1px_rgba(var(--accent-rgb),0.1)]">
              Logic Arena transforms your code into a living, fighting robot. Four steps stand between
              you and combat glory. Master each one to rise through the ranks.
            </p>
          </div>
        </div>

        {/* 4-Step Visual Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl p-8 overflow-hidden group hover:border-accent/40 hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.1)] transition-all duration-300 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)]"
            >
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent" />
              <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)] transition-all duration-500" />
              <div
                className="text-[64px] font-black leading-none text-accent/5 select-none mb-4 tracking-tighter group-hover:text-accent/15 transition-all duration-500 drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.1)]"
              >
                {step.number}
              </div>
              <p className="text-[9px] font-black tracking-[0.35em] text-accent/50 uppercase mb-3 drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.2)]">
                {step.tag}
              </p>
              <h2 className="text-lg font-black tracking-[0.15em] text-accent uppercase mb-4 group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)] transition-all">
                {step.title}
              </h2>
              <p className="text-[12.5px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* AliScript Overview */}
        <div className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl p-8 lg:p-10 mb-10 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]" />
              <h2 className="text-[14px] font-black tracking-[0.25em] uppercase text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]">
                AliScript Language
              </h2>
            </div>
            <p className="text-[13px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em] mb-8 max-w-3xl drop-shadow-[0_0_1px_rgba(var(--accent-rgb),0.1)]">
              AliScript is a purpose-built combat scripting language designed from the ground up for the Logic Arena engine.
              It compiles to a deterministic bytecode that runs inside each robot's execution sandbox at 60 ticks per second.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {ALISCRIPT_FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-accent/30 bg-accent/[0.02] hover:bg-accent/5 hover:shadow-[inset_0_0_15px_rgba(var(--accent-rgb),0.05)] transition-all duration-300"
                >
                  <span className="text-accent text-lg mt-0.5 drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.4)] group-hover:drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.8)]">{f.icon}</span>
                  <div>
                    <p className="text-[11px] font-black tracking-[0.1em] text-accent mb-1.5 uppercase group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] transition-all">
                      {f.label}
                    </p>
                    <p className="text-[11px] font-mono text-accent/60 leading-relaxed group-hover:text-accent/80 transition-all">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/docs#aliscript"
                className="group flex items-center justify-center min-w-[200px] h-12 bg-accent/10 border border-accent/40 rounded-lg text-accent text-[11px] font-black tracking-[0.3em] uppercase hover:bg-accent/20 hover:border-accent/80 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] transition-all duration-300"
              >
                READ FULL DOCS <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/arena"
                className="flex items-center justify-center min-w-[200px] h-12 bg-bg-secondary/50 border border-accent/20 rounded-lg text-accent/60 text-[11px] font-black tracking-[0.3em] uppercase hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all duration-300"
              >
                TRY PRACTICE MODE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
