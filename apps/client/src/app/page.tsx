"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Film,
  Users,
  Eye,
  BookOpen,
  Smartphone,
  Zap,
  Shield,
} from "lucide-react";

// ── AliScript syntax highlighter ──

function highlightAliScript(code: string): { __html: string } {
  const keywordPattern =
    /\b(WHILE|IF|ELSE|DO|END|AND|OR|NOT|TRUE|FALSE|IN_STASIS|MY_ENERGY|CAN_SEE_ENEMY|NEAREST_VISIBLE_X)\b/g;
  const commandPattern = /\b(FIRE|SCAN|PATHFIND|WAIT|BROADCAST)\b/g;

  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
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
    return result;
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

// ── Image card with error fallback ──

function ImageCard({
  src,
  name,
  description,
  className = "h-48",
}: {
  src: string;
  name: string;
  description: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`relative overflow-hidden rounded border border-accent/40 bg-accent/10 flex flex-col items-center justify-center ${className} p-4`}
      >
        <span className="text-accent font-black text-xs sm:text-sm tracking-widest text-center uppercase">
          {name}
        </span>
        <span className="text-text-secondary text-[10px] sm:text-xs mt-2 text-center leading-relaxed">
          {description}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded border border-accent/40 group hover:border-accent/80 hover:scale-[1.02] transition-all duration-300 cursor-default">
      <Image
        src={src}
        alt={name}
        width={400}
        height={300}
        className={`object-cover w-full ${className}`}
        unoptimized
        loading="lazy"
        onError={() => setErrored(true)}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)" }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-accent font-black text-sm tracking-widest uppercase">
          {name}
        </h3>
        <p className="text-xs mt-1" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ── PAGE ──

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary font-mono text-text-primary selection:bg-accent/30">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-word {
          animation: fadeInUp 0.7s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* ══════════════════════════════════
          NAVBAR
         ══════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-accent/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/dashboard-logo.png"
              alt="Logic Arena"
              width={40}
              height={40}
              unoptimized
              priority
              className="shrink-0"
            />
            <span className="text-accent font-black text-lg tracking-[0.15em] hidden sm:block">
              LOGIC ARENA
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-accent text-bg-primary px-4 sm:px-6 h-10 sm:h-12 flex items-center rounded font-black text-xs sm:text-sm tracking-widest hover:opacity-90 transition-all"
            >
              JOIN AS GUEST
            </Link>
            <Link
              href="/login"
              className="border border-accent text-accent px-4 sm:px-6 h-10 sm:h-12 flex items-center rounded text-xs sm:text-sm tracking-widest hover:bg-accent/10 transition-all"
            >
              SIGN IN
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO
         ══════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(var(--accent-rgb),0.015) 2px, rgba(var(--accent-rgb),0.015) 4px)",
            backgroundSize: "100% 4px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="mb-6">
            {["WRITE CODE.", "BATTLE ROBOTS."].map((line, i) => (
              <span
                key={line}
                className="block hero-word text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.02em] leading-[1.1] text-text-primary drop-shadow-[0_0_25px_rgba(var(--accent-rgb),0.4)]"
                style={{ animationDelay: `${0.1 + i * 0.15}s` }}
              >
                {line}
              </span>
            ))}
          </div>

          <p className="text-text-secondary text-base sm:text-lg md:text-xl tracking-[0.15em] uppercase mb-8 max-w-2xl font-mono">
            The only arena where your{" "}
            <span className="relative inline-block">
              algorithms
              <span
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-accent rounded-full animate-pulse"
                style={{ boxShadow: "0 0 8px rgba(var(--accent-rgb),0.6)" }}
              />
            </span>{" "}
            fight for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/dashboard"
              className="bg-accent text-bg-primary px-8 sm:px-10 h-12 sm:h-14 flex items-center rounded font-black text-sm sm:text-base tracking-widest hover:opacity-90 transition-all"
            >
              ENTER THE ARENA
            </Link>
            <Link
              href="/replay"
              className="border border-accent text-accent px-8 sm:px-10 h-12 sm:h-14 flex items-center rounded text-sm sm:text-base tracking-widest hover:bg-accent/10 transition-all"
            >
              WATCH A BATTLE
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {["60 FPS ENGINE", "AliScript v2.4", "LIVE ON logicarena.dev"].map(
              (pill) => (
                <span
                  key={pill}
                  className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-text-secondary border border-accent/20 px-3 py-1.5 rounded"
                >
                  {pill}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAR
         ══════════════════════════════════ */}
      <section className="bg-bg-secondary border-y border-accent/10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex items-center justify-center">
          {["6 GAME MODES", "3 ENVIRONMENTS", "60-LEVEL CAMPAIGN", "REAL-TIME BATTLES"].map(
            (stat, i) => (
              <div key={stat} className="flex-1 flex items-center justify-center">
                {i > 0 && <div className="h-6 sm:h-8 w-px bg-accent/30 shrink-0" />}
                <p className="text-accent font-black text-[10px] sm:text-xs md:text-sm tracking-[0.2em] text-center px-2 sm:px-4">
                  {stat}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-accent text-3xl sm:text-4xl font-black tracking-[0.15em] text-center uppercase mb-16 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
          HOW IT WORKS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "WRITE",
              desc: "Script your robot's intelligence using AliScript — our Turing-complete battle language with loops, functions, swarm APIs, and 9 tactical super powers",
            },
            {
              step: "02",
              title: "DEPLOY",
              desc: "Upload your script to the arena. Watch it execute live at 60fps against real opponents or AI-driven campaign enemies",
            },
            {
              step: "03",
              title: "EVOLVE",
              desc: "Study replays frame by frame. Climb the ELO leaderboard. Unlock chassis in the Black Market. Compete in tournaments",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="relative border border-accent/30 bg-accent/5 p-6 rounded overflow-hidden"
            >
              <span
                className="absolute -top-2 -right-2 text-[5rem] sm:text-[7rem] font-black text-accent/10 leading-none select-none pointer-events-none"
                aria-hidden="true"
              >
                {step}
              </span>
              <div className="relative z-10">
                <h3 className="text-accent font-black text-xl tracking-[0.15em] uppercase mb-3">
                  {title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          GAME MODES
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-bg-secondary">
        <h2 className="text-accent text-3xl sm:text-4xl font-black tracking-[0.15em] text-center uppercase mb-16 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
          CHOOSE YOUR GAME MODE
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { name: "DEATHMATCH", img: "/thumbnails/mode-combat.png", desc: "Classic 1v1. Eliminate or be eliminated." },
            { name: "SURVIVAL", img: "/thumbnails/mode-survival.png", desc: "Outlast endless enemy waves. Each wave harder." },
            { name: "CTF", img: "/thumbnails/mode-ctf.png", desc: "Capture the flag. Return it. Repeat." },
            { name: "KOTH", img: "/thumbnails/mode-koth.png", desc: "Hold the center zone longest to win." },
            { name: "RACING", img: "/thumbnails/mode-racing.png", desc: "First to the finish line. Obstacles included." },
            { name: "TRAINING", img: "/thumbnails/mode-training.png", desc: "Infinite sandbox. Refine your logic safely." },
          ].map((mode) => (
            <ImageCard key={mode.name} src={mode.img} name={mode.name} description={mode.desc} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          ENVIRONMENTS
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-accent text-3xl sm:text-4xl font-black tracking-[0.15em] text-center uppercase mb-16 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
          SELECT YOUR ARENA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "NEO-CYBER", img: "/thumbnails/env-cyber.png", desc: "The original. Neon grid. No mercy." },
            { name: "MAGMA CORE", img: "/thumbnails/env-lava.png", desc: "Lava floors. Damage on contact. High risk, high reward." },
            { name: "GLACIAL TUNDRA", img: "/thumbnails/env-ice.png", desc: "Ice terrain. Reduced traction. Precision required." },
          ].map((env) => (
            <ImageCard
              key={env.name}
              src={env.img}
              name={env.name}
              description={env.desc}
              className="h-56"
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          ALISCRIPT SHOWCASE
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-bg-secondary">
        <h2 className="text-accent text-3xl sm:text-4xl font-black tracking-[0.15em] text-center uppercase mb-4 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
          POWERED BY ALISCRIPT v2.4
        </h2>
        <p className="text-text-secondary text-center text-sm tracking-[0.2em] uppercase mb-14">
          A Turing-complete scripting language built for robot combat
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              "WHILE Loops",
              "IF/ELSE/AND/OR",
              "Dictionaries",
              "Arrays",
              "BROADCAST/RECEIVE",
              "Math Library",
              "Swarm Intelligence",
              "Big O Education",
            ].map((feature) => (
              <div
                key={feature}
                className="border border-accent/20 bg-accent/5 px-4 py-3 rounded text-accent font-black text-xs sm:text-sm tracking-widest"
              >
                {feature}
              </div>
            ))}
          </div>

          <div className="bg-bg-secondary border border-accent/40 rounded p-4 sm:p-5 overflow-x-auto shadow-[0_0_20px_rgba(var(--accent-rgb),0.08)]">
            <pre className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              <code dangerouslySetInnerHTML={highlightAliScript(aliScriptExample)} />
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {["v2.4", "2,000 ops/tick quota", "Big O enforced"].map((badge) => (
            <span
              key={badge}
              className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-text-secondary border border-accent/20 px-3 py-1.5 rounded"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          ROBOT ROSTER
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-accent text-3xl sm:text-4xl font-black tracking-[0.15em] text-center uppercase mb-4 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
          BUILD YOUR OPERATOR
        </h2>
        <p className="text-text-secondary text-center text-sm tracking-[0.2em] uppercase mb-14">
          Choose your robot model. Paint it. Equip tracer rounds. Fight.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { name: "UNIT-01", img: "/thumbnails/chassis-unit-01.png", desc: "Standard issue. Balanced stats." },
            { name: "UNIT-02", img: "/thumbnails/chassis-unit-02.png", desc: "Heavy armor. Slower. Hits harder." },
            { name: "SANDMAN", img: "/thumbnails/chassis-sandman.png", desc: "Desert robot. Agile." },
            { name: "WRAITH", img: "/thumbnails/chassis-wraith.png", desc: "Stealth robot. Reduced radar signature." },
          ].map((chassis) => (
            <ImageCard
              key={chassis.name}
              src={chassis.img}
              name={chassis.name}
              description={chassis.desc}
              className="aspect-square"
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-accent font-black text-sm tracking-widest hover:opacity-80 transition-all uppercase"
          >
            Unlock in Black Market →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════
          PLATFORM FEATURES
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-bg-secondary">
        <h2 className="text-accent text-3xl sm:text-4xl font-black tracking-[0.15em] text-center uppercase mb-16 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
          EVERYTHING A COMPETITIVE PLATFORM NEEDS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Trophy, title: "ELO RANKING", desc: "Climb the global leaderboard with every win" },
            { icon: Film, title: "MATCH REPLAYS", desc: "Replay any battle frame by frame" },
            { icon: Users, title: "TOURNAMENT MODE", desc: "Structured 2/4/8-player brackets" },
            { icon: Eye, title: "LIVE SPECTATOR", desc: "Watch any live match in real time" },
            { icon: BookOpen, title: "60-LEVEL CAMPAIGN", desc: "LeetCode-style algorithmic challenges" },
            { icon: Smartphone, title: "PWA SUPPORT", desc: "Install as a native app on any device" },
            { icon: Zap, title: "REAL-TIME ENGINE", desc: "60fps physics. Zero lag. Always live." },
            { icon: Shield, title: "SECURE PLATFORM", desc: "JWT auth, rate limiting, enterprise security" },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="border border-accent/20 bg-bg-secondary/50 p-5 rounded hover:border-accent/50 transition-all"
            >
              <Icon className="text-accent mb-3" size={24} />
              <h3 className="text-text-primary font-black text-xs sm:text-sm tracking-widest uppercase mb-1">
                {title}
              </h3>
              <p className="text-text-secondary text-[10px] sm:text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          FINAL CTA
         ══════════════════════════════════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto text-center">
        <h2 className="text-accent text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.08em] uppercase mb-6 drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]">
          YOUR LOGIC IS A WEAPON.
        </h2>
        <p className="text-text-secondary text-sm sm:text-base tracking-[0.2em] uppercase mb-10 max-w-2xl mx-auto">
          Join as a guest — no account required. Or sign in to save your rank.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="bg-accent text-bg-primary px-8 sm:px-10 h-12 sm:h-14 flex items-center rounded font-black text-sm sm:text-base tracking-widest hover:opacity-90 transition-all"
          >
            ENTER THE ARENA
          </Link>
          <Link
            href="/register"
            className="border border-accent text-accent px-8 sm:px-10 h-12 sm:h-14 flex items-center rounded text-sm sm:text-base tracking-widest hover:bg-accent/10 transition-all"
          >
            CREATE ACCOUNT
          </Link>
        </div>
        <p className="text-text-secondary/60 text-xs tracking-widest">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in →
          </Link>
        </p>
      </section>
    </div>
  );
}
