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
              ⌐ SYSTEM_OVERVIEW ¬
            </p>
            <h1 className="text-4xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] mb-4 uppercase">
              How It Works
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
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
              className="relative bg-card border border-accent/50 rounded-xl p-6 overflow-hidden group"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent/40 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent/20 rounded-br-xl" />

              <div
                className="text-[56px] font-black leading-none text-accent/10 select-none mb-3 tracking-tight group-hover:text-accent/20 transition-colors duration-300"
              >
                {step.number}
              </div>
              <p className="text-[9px] font-black tracking-[0.35em] text-accent/50 uppercase mb-2">
                {step.tag}
              </p>
              <h2 className="text-lg font-black tracking-[0.12em] text-text-primary uppercase mb-3">
                {step.title}
              </h2>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* AliScript Overview */}
        <div className="bg-card border border-accent/50 rounded-xl p-6 mb-10" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-accent/70 font-mono">⌐</span>
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-accent">
              AliScript Language
            </h2>
            <span className="text-accent/70 font-mono">¬</span>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-6 max-w-3xl">
            AliScript is a purpose-built combat scripting language designed from the ground up for the Logic Arena engine.
            It compiles to a deterministic bytecode that runs inside each robot's execution sandbox at 60 ticks per second.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ALISCRIPT_FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 p-3 rounded-lg border border-accent/50/60 bg-bg-primary/60"
              >
                <span className="text-accent shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-[11px] font-black tracking-[0.1em] text-text-primary mb-1 uppercase">
                    {f.label}
                  </p>
                  <p className="text-[10px] text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/docs#aliscript"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent text-[10px] tracking-[0.3em] font-black uppercase hover:bg-accent/20 hover:border-accent/60 transition-all duration-150"
            >
              READ FULL DOCS →
            </Link>
            <Link
              href="/arena"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 text-text-secondary text-[10px] tracking-[0.3em] font-black uppercase hover:border-accent/40 hover:text-accent transition-all duration-150"
            >
              TRY PRACTICE MODE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
