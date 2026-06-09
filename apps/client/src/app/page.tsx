import Image from "next/image";
import Link from "next/link";
import { ImageCard } from "../components/ImageCard";
import {
  Trophy,
  Film,
  Users,
  Eye,
  BookOpen,
  Smartphone,
  Zap,
  Shield,
  ChevronDown,
  Code2,
  Swords,
  TrendingUp,
} from "lucide-react";

// ── Constants ──

const HERO_LINES = ["WRITE CODE.", "BATTLE", "ROBOTS."] as const;

const HERO_BADGES = [
  "60 FPS ENGINE",
  "AliScript v2.4",
  "LIVE ON logicarena.dev",
] as const;

const TRUST_STATS = [
  { value: "6", label: "GAME MODES" },
  { value: "3", label: "ENVIRONMENTS" },
  { value: "60", label: "LEVEL CAMPAIGN" },
  { value: "∞", label: "REAL-TIME BATTLES" },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "WRITE",
    icon: Code2,
    desc: "Script your robot's intelligence using AliScript — our battle language with loops, functions, and swarm APIs.",
  },
  {
    step: "02",
    title: "DEPLOY",
    icon: Swords,
    desc: "Upload your script to the arena. Watch it execute live at 60fps against real opponents.",
  },
  {
    step: "03",
    title: "EVOLVE",
    icon: TrendingUp,
    desc: "Study replays. Climb the ELO leaderboard. Unlock upgrades in the Black Market.",
  },
] as const;

const GAME_MODES = [
  { name: "DEATHMATCH", img: "/thumbnails/mode-combat.png", desc: "Classic 1v1. Eliminate or be eliminated." },
  { name: "SURVIVAL", img: "/thumbnails/mode-survival.png", desc: "Outlast endless enemy waves." },
  { name: "CTF", img: "/thumbnails/mode-ctf.png", desc: "Capture the flag. Return it. Repeat." },
  { name: "KOTH", img: "/thumbnails/mode-koth.png", desc: "Hold the center zone longest to win." },
  { name: "RACING", img: "/thumbnails/mode-racing.png", desc: "First to the finish line. Obstacles included." },
  { name: "TRAINING", img: "/thumbnails/mode-training.png", desc: "Infinite sandbox. Refine your logic." },
] as const;

const ARENAS = [
  { name: "NEO-CYBER", img: "/thumbnails/env-cyber.png", desc: "The original. Neon grid. No mercy." },
  { name: "MAGMA CORE", img: "/thumbnails/env-lava.png", desc: "Lava floors. Damage on contact. High risk, high reward." },
  { name: "GLACIAL TUNDRA", img: "/thumbnails/env-ice.png", desc: "Ice terrain. Reduced traction. Precision required." },
] as const;

const ALISCRIPT_FEATURES = [
  "WHILE Loops",
  "IF / ELSE / AND / OR",
  "Dictionaries",
  "Arrays",
  "BROADCAST / RECEIVE",
  "Math Library",
  "Swarm Intelligence",
  "Big O Education",
] as const;

const ROBOTS = [
  { name: "UNIT-01", img: "/thumbnails/chassis-unit-01.png", desc: "Balanced all-rounder. Excellent starting model." },
  { name: "UNIT-02", img: "/thumbnails/chassis-unit-02.png", desc: "Agile scout. High mobility and rapid targeting." },
  { name: "TITAN", img: "/thumbnails/chassis-titan.png", desc: "Heavy armor. Built for taking massive damage." },
  { name: "SANDMAN", img: "/thumbnails/chassis-sandman.png", desc: "Advanced tactical mech with extreme firepower." },
] as const;

const PLATFORM_FEATURES = [
  { icon: Trophy, title: "ELO RANKING", desc: "Climb the global leaderboard with every win" },
  { icon: Film, title: "MATCH REPLAYS", desc: "Replay any battle frame by frame" },
  { icon: Users, title: "TOURNAMENT MODE", desc: "Structured 2/4/8-player brackets" },
  { icon: Eye, title: "LIVE SPECTATOR", desc: "Watch any live match in real time" },
  { icon: BookOpen, title: "60-LEVEL CAMPAIGN", desc: "LeetCode-style algorithmic challenges" },
  { icon: Smartphone, title: "PWA SUPPORT", desc: "Install as a native app on any device" },
  { icon: Zap, title: "REAL-TIME ENGINE", desc: "60fps physics. Zero lag. Always live." },
  { icon: Shield, title: "SECURE PLATFORM", desc: "JWT auth, rate limiting, enterprise security" },
] as const;

const TECH_STACK = [
  { name: "TypeScript", icon: "/tech-icons/typescript.svg", color: "#3178C6" },
  { name: "Next.js", icon: "/tech-icons/nextjs.svg", color: "#FFFFFF" },
  { name: "React", icon: "/tech-icons/react.svg", color: "#61DAFB" },
  { name: "Three.js", icon: "/tech-icons/threejs.svg", color: "#049EF4" },
  { name: "TailwindCSS", icon: "/tech-icons/tailwindcss.svg", color: "#06B6D4" },
  { name: "Framer Motion", icon: "/tech-icons/framermotion.svg", color: "#FFFFFF" },
  { name: "NestJS", icon: "/tech-icons/nestjs.svg", color: "#E0234E" },
  { name: "Socket.IO", icon: "/tech-icons/socketio.svg", color: "#25c2a0" },
  { name: "PostgreSQL", icon: "/tech-icons/postgresql.svg", color: "#4169E1" },
  { name: "Prisma", icon: "/tech-icons/prisma.svg", color: "#FFFFFF" },
  { name: "Redis", icon: "/tech-icons/redis.svg", color: "#DC382D" },
  { name: "Docker", icon: "/tech-icons/docker.svg", color: "#2496ED" },
] as const;

const PARTICLE_COUNT = 12;

// ── AliScript syntax highlighter ──

function highlightAliScript(code: string): { __html: string } {
  const keywordPattern =
    /\b(WHILE|IF|ELSE|DO|END|AND|OR|NOT|TRUE|FALSE|IN_STASIS|MY_ENERGY|CAN_SEE_ENEMY|NEAREST_VISIBLE_X)\b/g;
  const commandPattern = /\b(FIRE|SCAN|PATHFIND|WAIT|BROADCAST)\b/g;

  const lines = code.split("\n");
  const highlighted = lines.map((line, lineIdx) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//")) {
      return `<span class="text-text-secondary/60">${line}</span>`;
    }
    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    let result = escaped;
    result = result.replace(commandPattern, '<span class="text-text-primary font-semibold">$1</span>');
    result = result.replace(keywordPattern, '<span class="text-accent font-bold">$1</span>');

    const lineNum = String(lineIdx + 1).padStart(2, " ");
    return `<span class="text-text-secondary/30 select-none">${lineNum}</span>  ${result}`;
  });

  return { __html: highlighted.join("\n") };
}

const aliScriptExample = `// Swarm intelligence example
WHILE TRUE DO
  IF CAN_SEE_ENEMY AND MY_ENERGY > 30 DO
    BROADCAST(NEAREST_VISIBLE_X)
    FIRE
  ELSE IF IN_STASIS DO
    WAIT
  ELSE DO
    SCAN
    PATHFIND
  END
END`;

const HIGHLIGHTED_EXAMPLE = highlightAliScript(aliScriptExample);


// ── PAGE ──

export default function LandingPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-bg-primary font-mono text-text-primary selection:bg-accent/30">

      {/* ══════════════════════════════════
          NAVBAR — Frosted Glass
         ══════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-accent/10" id="landing-nav">
        <div className="absolute inset-0 bg-bg-primary/70 backdrop-blur-xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/dashboard-logo.png"
              alt="Logic Arena logo"
              width={36}
              height={36}
              priority
              className="shrink-0 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-accent font-black text-base tracking-[0.15em] hidden sm:block">
              LOGIC ARENA
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="landing-cta-primary px-4 sm:px-6 h-9 sm:h-10 flex items-center rounded-md font-black text-[11px] sm:text-xs tracking-widest"
              id="nav-join-btn"
            >
              JOIN AS GUEST
            </Link>
            <Link
              href="/login"
              className="landing-cta-secondary px-4 sm:px-6 h-9 sm:h-10 flex items-center rounded-md text-[11px] sm:text-xs tracking-widest font-bold"
              id="nav-signin-btn"
            >
              SIGN IN
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO — Cinematic Multi-Layer
         ══════════════════════════════════ */}
      <section
        className="relative min-h-[calc(100dvh-64px)] flex items-center justify-center py-16 sm:py-20 px-4 overflow-hidden landing-hero-gradient"
        id="hero-section"
      >
        {/* Background layers */}
        <div className="absolute inset-0 z-0 pointer-events-none landing-hero-grid" aria-hidden="true" />
        <div className="absolute inset-0 z-[1] pointer-events-none landing-hero-scanlines" aria-hidden="true" />
        <div className="absolute inset-0 z-[2] pointer-events-none landing-hero-vignette" aria-hidden="true" />

        {/* Floating particles — decorative, hidden on mobile via CSS */}
        <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
            <div
              key={`particle-${i}`}
              className="landing-particle"
              style={{
                left: `${(i * 8.3) % 100}%`,
                bottom: `-${10 + (i * 7) % 20}px`,
                animationDuration: `${8 + (i * 3) % 12}s`,
                animationDelay: `${(i * 1.7) % 8}s`,
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Main headline */}
          <div className="mb-6 sm:mb-8">
            {HERO_LINES.map((line, i) => (
              <span
                key={line}
                className="block hero-word text-[3.5rem] sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.02em] leading-[1.05] text-text-primary"
                style={{ animationDelay: `${0.1 + i * 0.18}s` }}
              >
                {line}
              </span>
            ))}
          </div>

          {/* Subheadline with glowing keyword */}
          <p className="text-text-secondary text-sm sm:text-base md:text-lg tracking-[0.12em] uppercase mb-8 sm:mb-10 max-w-2xl font-mono leading-relaxed">
            The only arena where your{" "}
            <span className="relative inline-block text-accent font-bold">
              algorithms
              <span
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-accent rounded-full animate-pulse landing-hero-shadow"
                aria-hidden="true"
              />
            </span>{" "}
            fight for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="landing-cta-primary px-8 sm:px-10 h-12 sm:h-14 flex items-center justify-center rounded-lg font-black text-sm sm:text-base tracking-widest w-full sm:w-auto"
              id="hero-cta-primary"
            >
              ENTER THE ARENA
            </Link>
            <Link
              href="/replay"
              className="landing-cta-secondary px-8 sm:px-10 h-12 sm:h-14 flex items-center justify-center rounded-lg text-sm sm:text-base tracking-widest font-bold w-full sm:w-auto"
              id="hero-cta-secondary"
            >
              WATCH A BATTLE
            </Link>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {HERO_BADGES.map((pill) => (
              <span
                key={pill}
                className="glass-card text-[10px] sm:text-xs font-black tracking-widest uppercase text-text-secondary px-3 py-1.5 rounded-md"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 hero-scroll-indicator" aria-hidden="true">
          <ChevronDown className="text-accent/40" size={28} strokeWidth={1.5} />
        </div>
      </section>

      {/* ══════════════════════════════════
          TRUST BAR — Elevated Stats
         ══════════════════════════════════ */}
      <section className="relative border-y border-accent/10 overflow-hidden" id="trust-bar">
        <div className="absolute inset-0 bg-bg-secondary/80 backdrop-blur-sm" />
        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0">
            {TRUST_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center relative"
              >
                {i > 0 && (
                  <div
                    className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-accent/20"
                    aria-hidden="true"
                  />
                )}
                <span className="text-accent font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-none mb-1">
                  {stat.value}
                </span>
                <span className="text-text-secondary font-bold text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS — Cinematic Timeline
         ══════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 max-w-7xl mx-auto" id="how-it-works">
        <div className="section-reveal text-center mb-16 sm:mb-20">
          <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] uppercase mb-4 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
            HOW IT WORKS
          </h2>
          <p className="text-text-secondary text-sm sm:text-base tracking-[0.15em] uppercase">
            Three steps to domination
          </p>
        </div>

        {/* Desktop: Timeline layout / Mobile: Stacked cards */}
        <div className="relative">
          {/* Timeline connector — desktop only */}
          <div className="hidden md:block landing-timeline-line" aria-hidden="true" />

          <div className="flex flex-col gap-8 sm:gap-12 md:gap-16">
            {HOW_IT_WORKS_STEPS.map(({ step, title, icon: Icon, desc }, i) => (
              <div
                key={step}
                className={`section-reveal flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-10 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Step content card */}
                <div className={`flex-1 w-full order-2 md:order-none ${i % 2 === 1 ? "md:text-right" : "md:text-left"}`}>
                  <div className="glass-card-strong rounded-xl p-6 sm:p-8">
                    <div className={`flex items-center gap-3 mb-3 ${i % 2 === 1 ? "md:justify-end" : ""}`}>
                      <Icon className="text-accent" size={20} />
                      <h3 className="text-accent font-black text-lg sm:text-xl tracking-[0.15em] uppercase">
                        {title}
                      </h3>
                    </div>
                    <p className="text-text-secondary text-sm sm:text-base leading-relaxed">{desc}</p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="landing-timeline-dot order-1 md:order-none" aria-hidden="true">
                  {step}
                </div>

                {/* Spacer for opposite side */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          GAME MODES — Premium Cards + Carousel
         ══════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 overflow-hidden" id="game-modes">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-12 sm:mb-16">
            <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] uppercase mb-4 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
              CHOOSE YOUR GAME MODE
            </h2>
            <p className="text-text-secondary text-sm sm:text-base tracking-[0.15em] uppercase">
              Six ways to prove your code is superior
            </p>
          </div>

          {/* Mobile: Horizontal carousel / Desktop: Grid */}
          <div className="block sm:hidden">
            <div className="landing-carousel px-1" role="list">
              {GAME_MODES.map((mode) => (
                <div key={mode.name} className="w-[75vw] min-w-[280px]" role="listitem">
                  <ImageCard src={mode.img} name={mode.name} description={mode.desc} className="h-52" />
                </div>
              ))}
            </div>
            <p className="text-text-secondary/40 text-[10px] tracking-widest text-center mt-4 uppercase" aria-hidden="true">
              ← Swipe to explore →
            </p>
          </div>

          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {GAME_MODES.map((mode) => (
              <div key={mode.name} className="section-reveal-scale">
                <ImageCard src={mode.img} name={mode.name} description={mode.desc} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          ARENAS — Immersive Showcase
         ══════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 overflow-hidden" id="arenas">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-12 sm:mb-16">
            <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] uppercase mb-4 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
              SELECT YOUR ARENA
            </h2>
            <p className="text-text-secondary text-sm sm:text-base tracking-[0.15em] uppercase">
              Each environment changes the rules of engagement
            </p>
          </div>

          {/* Mobile: Horizontal carousel / Desktop: Grid */}
          <div className="block sm:hidden">
            <div className="landing-carousel px-1" role="list">
              {ARENAS.map((env) => (
                <div key={env.name} className="w-[80vw] min-w-[300px]" role="listitem">
                  <ImageCard src={env.img} name={env.name} description={env.desc} className="h-56" />
                </div>
              ))}
            </div>
            <p className="text-text-secondary/40 text-[10px] tracking-widest text-center mt-4 uppercase" aria-hidden="true">
              ← Swipe to explore →
            </p>
          </div>

          <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARENAS.map((env) => (
              <div key={env.name} className="section-reveal-scale">
                <ImageCard
                  src={env.img}
                  name={env.name}
                  description={env.desc}
                  className="h-56"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          ALISCRIPT SHOWCASE — Code Theater
         ══════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 overflow-hidden" id="aliscript">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-4">
            <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] uppercase drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
              POWERED BY ALISCRIPT
            </h2>
          </div>
          <p className="section-reveal text-text-secondary text-center text-sm sm:text-base tracking-[0.15em] uppercase mb-12 sm:mb-16">
            A Turing-complete scripting language built for robot combat
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Features grid */}
            <div className="section-reveal-left">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {ALISCRIPT_FEATURES.map((feature, i) => (
                  <div
                    key={feature}
                    className="glass-card rounded-lg px-4 py-3 sm:py-4 text-accent font-black text-[11px] sm:text-sm tracking-widest flex items-center gap-2"
                  >
                    <span className="text-accent/40 text-[10px] font-mono" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              {/* AliScript badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6">
                {["v2.4", "2,000 ops/tick quota", "Big O enforced"].map((badge) => (
                  <span
                    key={badge}
                    className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-text-secondary border border-accent/20 px-3 py-1.5 rounded-md"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Code terminal */}
            <div className="section-reveal-right">
              <div className="landing-terminal glass-card-strong rounded-xl">
                {/* Terminal header */}
                <div className="landing-terminal-header">
                  <div className="landing-terminal-dot" style={{ background: "#ff5f57" }} aria-hidden="true" />
                  <div className="landing-terminal-dot" style={{ background: "#febc2e" }} aria-hidden="true" />
                  <div className="landing-terminal-dot" style={{ background: "#28c840" }} aria-hidden="true" />
                  <span className="ml-3 text-text-secondary/60 text-xs tracking-widest font-mono">
                    swarm_logic.ali
                  </span>
                </div>

                {/* Code content */}
                <div className="relative p-4 sm:p-5">
                  <div className="landing-terminal-scan" aria-hidden="true" />
                  <pre className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    <code dangerouslySetInnerHTML={HIGHLIGHTED_EXAMPLE} />
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          ROBOT ROSTER — Character Select
         ══════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 overflow-hidden" id="robots">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-4">
            <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] uppercase drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
              BUILD YOUR ROBOT
            </h2>
          </div>
          <p className="section-reveal text-text-secondary text-center text-sm sm:text-base tracking-[0.15em] uppercase mb-12 sm:mb-16">
            Choose a chassis. Paint it. Fight.
          </p>

          {/* Mobile: Horizontal carousel / Desktop: Grid */}
          <div className="block sm:hidden">
            <div className="landing-carousel px-1" role="list">
              {ROBOTS.map((bot) => (
                <div key={bot.name} className="w-[65vw] min-w-[240px]" role="listitem">
                  <ImageCard
                    src={bot.img}
                    name={bot.name}
                    description={bot.desc}
                    className="aspect-square"
                  />
                </div>
              ))}
            </div>
            <p className="text-text-secondary/40 text-[10px] tracking-widest text-center mt-4 uppercase" aria-hidden="true">
              ← Swipe to explore →
            </p>
          </div>

          <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {ROBOTS.map((bot) => (
              <div key={bot.name} className="section-reveal-scale">
                <ImageCard
                  src={bot.img}
                  name={bot.name}
                  description={bot.desc}
                  className="aspect-square"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-10 section-reveal">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-accent font-black text-sm tracking-widest hover:opacity-80 transition-all uppercase group"
              id="black-market-link"
            >
              Unlock in Black Market
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          PLATFORM FEATURES — Bento Grid
         ══════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-12 sm:mb-16">
            <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] uppercase mb-4 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
              EVERYTHING A COMPETITIVE
              <br className="hidden sm:block" />
              {" "}PLATFORM NEEDS
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="landing-feature-card glass-card rounded-xl p-4 sm:p-6 section-reveal-scale"
              >
                <div className="mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Icon className="text-accent" size={20} />
                  </div>
                </div>
                <h3 className="text-text-primary font-black text-xs sm:text-sm tracking-widest uppercase mb-1 sm:mb-2">
                  {title}
                </h3>
                <p className="text-text-secondary text-[10px] sm:text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          BUILT WITH — Tech Stack Trust Bar
         ══════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4" id="tech-stack">
        <div className="max-w-5xl mx-auto">
          <div className="section-reveal text-center mb-10 sm:mb-12">
            <p className="text-text-secondary/60 text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase mb-3">
              ENGINEERED WITH
            </p>
            <h2 className="text-text-primary text-xl sm:text-2xl md:text-3xl font-black tracking-[0.08em] uppercase">
              BATTLE-TESTED TECHNOLOGY
            </h2>
          </div>

          {/* Mobile: Horizontal carousel / Desktop: Grid */}
          <div className="block sm:hidden">
            <div className="landing-carousel px-1 justify-start" role="list">
              {TECH_STACK.map((tech, i) => (
                <div
                  key={tech.name}
                  className="glass-card rounded-xl px-6 py-5 flex flex-col items-center justify-center gap-3 min-w-[120px]"
                  role="listitem"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <div 
                      className="absolute inset-0 opacity-20 blur-md rounded-full" 
                      style={{ background: tech.color }} 
                      aria-hidden="true" 
                    />
                    <Image 
                      src={tech.icon} 
                      alt={tech.name} 
                      width={28} 
                      height={28} 
                      className="object-contain relative z-10 drop-shadow-md" 
                    />
                  </div>
                  <span className="text-text-primary font-black text-[11px] tracking-widest uppercase whitespace-nowrap">
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {TECH_STACK.map((tech, i) => (
              <div
                key={tech.name}
                className="landing-tech-logo glass-card rounded-xl px-4 py-5 sm:py-6 flex flex-col items-center justify-center gap-3 cursor-default outline-none"
                style={{ animationDelay: `${i * 0.5}s` }}
                tabIndex={0}
              >
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 opacity-20 blur-lg rounded-full" 
                    style={{ background: tech.color }} 
                    aria-hidden="true" 
                  />
                  <Image 
                    src={tech.icon} 
                    alt={tech.name} 
                    width={32} 
                    height={32} 
                    className="object-contain relative z-10 drop-shadow-md" 
                  />
                </div>
                <span className="text-text-primary font-black text-[10px] sm:text-[11px] tracking-widest uppercase text-center">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      {/* ══════════════════════════════════
          FINAL CTA — Dramatic Closer
         ══════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 md:py-40 px-4 overflow-hidden" id="final-cta">
        {/* Radial spotlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(var(--accent-rgb), 0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="section-reveal">
            <h2 className="text-accent text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[0.04em] uppercase mb-6 sm:mb-8 leading-[1.1] drop-shadow-[0_0_30px_rgba(var(--accent-rgb),0.4)]">
              YOUR LOGIC IS A WEAPON.
            </h2>
          </div>

          <p className="section-reveal text-text-secondary text-sm sm:text-base md:text-lg tracking-[0.15em] uppercase mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Join as a guest or sign in to climb the leaderboard.
          </p>

          <div className="section-reveal flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="landing-cta-primary px-8 sm:px-10 h-13 sm:h-14 flex items-center justify-center rounded-lg font-black text-sm sm:text-base tracking-widest w-full sm:w-auto"
              id="final-cta-primary"
            >
              ENTER THE ARENA
            </Link>
            <Link
              href="/register"
              className="landing-cta-secondary px-8 sm:px-10 h-13 sm:h-14 flex items-center justify-center rounded-lg text-sm sm:text-base tracking-widest font-bold w-full sm:w-auto"
              id="final-cta-secondary"
            >
              CREATE ACCOUNT
            </Link>
          </div>

          <p className="section-reveal text-text-secondary/50 text-xs tracking-widest">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline transition-colors" id="final-signin-link">
              Sign in →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
