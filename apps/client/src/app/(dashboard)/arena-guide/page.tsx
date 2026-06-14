/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React, { useState } from "react";
import { 
  Swords, Shield, Flag, Trophy, Zap, Cpu, 
  Flame, Snowflake, Compass, MessageSquareText,
  FileCode2, TerminalSquare, Activity
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

interface GuideItemSpec {
  label: string;
  value: string;
}

interface GuideItem {
  id: string;
  title: string;
  category: "mode" | "map";
  image: string;
  icon: React.ReactNode;
  colorClass: string;
  bgGlow: string;
  borderClass: string;
  description: string;
  simpleRules: string[];
  ariaPrompt: string;
  specs: GuideItemSpec[];
}

const GAME_MODES: GuideItem[] = [
  {
    id: "deathmatch",
    title: "DEATHMATCH",
    category: "mode",
    image: "/thumbnails/mode-combat.png",
    icon: <Swords className="w-6 h-6" />,
    colorClass: "text-[var(--accent)]",
    bgGlow: "shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]",
    borderClass: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    description: "Classic 1v1 combat. Defeat the enemy robot.",
    simpleRules: [
      "Find the enemy.",
      "Shoot them.",
      "Watch your energy."
    ],
    ariaPrompt: "How do I program my robot for Deathmatch?",
    specs: [
      { label: "TIME LIMIT", value: "5:00 Minutes" },
      { label: "GOAL", value: "Destroy Enemy" },
      { label: "ENERGY", value: "Normal" },
      { label: "PRO TIP", value: "Lock and fire" }
    ]
  },
  {
    id: "survival",
    title: "SURVIVAL",
    category: "mode",
    image: "/thumbnails/mode-survival.png",
    icon: <Shield className="w-6 h-6" />,
    colorClass: "text-emerald-400",
    bgGlow: "shadow-[0_0_25px_rgba(52,211,153,0.15)]",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/50",
    description: "Survive endless waves of bots.",
    simpleRules: [
      "Keep moving.",
      "Save energy.",
      "Dodge bullets."
    ],
    ariaPrompt: "What is the best logic pattern for Survival Mode?",
    specs: [
      { label: "TIME LIMIT", value: "Infinite" },
      { label: "GOAL", value: "Survive Waves" },
      { label: "ENEMIES", value: "Multiple Bots" },
      { label: "PRO TIP", value: "Keep moving" }
    ]
  },
  {
    id: "ctf",
    title: "CAPTURE THE FLAG",
    category: "mode",
    image: "/thumbnails/mode-ctf.png",
    icon: <Flag className="w-6 h-6" />,
    colorClass: "text-purple-400",
    bgGlow: "shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    borderClass: "border-purple-500/20 hover:border-purple-500/50",
    description: "Steal the enemy flag and bring it home.",
    simpleRules: [
      "Find the flag.",
      "Grab it.",
      "Run back."
    ],
    ariaPrompt: "How do I code pathfinding for Capture the Flag?",
    specs: [
      { label: "TIME LIMIT", value: "8:00 Minutes" },
      { label: "GOAL", value: "Capture 3 Flags" },
      { label: "MAP", value: "2 Bases" },
      { label: "PRO TIP", value: "Use pathfinding" }
    ]
  },
  {
    id: "koth",
    title: "KING OF THE HILL",
    category: "mode",
    image: "/thumbnails/mode-koth.png",
    icon: <Trophy className="w-6 h-6" />,
    colorClass: "text-amber-400",
    bgGlow: "shadow-[0_0_25px_rgba(251,191,36,0.15)]",
    borderClass: "border-amber-500/20 hover:border-amber-500/50",
    description: "Control the center zone to score points.",
    simpleRules: [
      "Go to the center.",
      "Stay inside.",
      "Push enemies out."
    ],
    ariaPrompt: "How do I code my robot to hold the center zone?",
    specs: [
      { label: "TIME LIMIT", value: "6:00 Minutes" },
      { label: "GOAL", value: "Hold Center" },
      { label: "POINTS", value: "1 pt/Tick" },
      { label: "PRO TIP", value: "Stay close" }
    ]
  },
  {
    id: "racing",
    title: "RACING",
    category: "mode",
    image: "/thumbnails/mode-racing.png",
    icon: <Zap className="w-6 h-6" />,
    colorClass: "text-blue-400",
    bgGlow: "shadow-[0_0_25px_rgba(96,165,250,0.15)]",
    borderClass: "border-blue-500/20 hover:border-blue-500/50",
    description: "Pass through all checkpoints as fast as possible.",
    simpleRules: [
      "Find the next point.",
      "Go fast.",
      "Don't hit walls."
    ],
    ariaPrompt: "How do I write a script for racing?",
    specs: [
      { label: "TIME LIMIT", value: "Fastest Wins" },
      { label: "GOAL", value: "Finish Track" },
      { label: "MAP", value: "Varying" },
      { label: "PRO TIP", value: "Control turns" }
    ]
  },
  {
    id: "training",
    title: "TRAINING",
    category: "mode",
    image: "/thumbnails/mode-training.png",
    icon: <Cpu className="w-6 h-6" />,
    colorClass: "text-cyan-400",
    bgGlow: "shadow-[0_0_25px_rgba(34,211,238,0.15)]",
    borderClass: "border-cyan-500/20 hover:border-cyan-500/50",
    description: "Practice your code with no pressure.",
    simpleRules: [
      "No damage.",
      "No scoring.",
      "Just testing."
    ],
    ariaPrompt: "Can you give me a simple script template to start training?",
    specs: [
      { label: "TIME LIMIT", value: "None" },
      { label: "GOAL", value: "Practice" },
      { label: "TARGETS", value: "Passive" },
      { label: "PRO TIP", value: "Test freely" }
    ]
  }
];

const ARENA_MAPS: GuideItem[] = [
  {
    id: "cyber",
    title: "CYBER GRID",
    category: "map",
    image: "/thumbnails/env-cyber.png",
    icon: <Compass className="w-6 h-6" />,
    colorClass: "text-[var(--accent)]",
    bgGlow: "shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]",
    borderClass: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    description: "A clean, safe arena. Good for testing.",
    simpleRules: [
      "Standard layout.",
      "Normal physics.",
      "No hazards."
    ],
    ariaPrompt: "What are some coding tips for the Cyber Grid map?",
    specs: [
      { label: "DANGER", value: "None" },
      { label: "FRICTION", value: "Normal" },
      { label: "LAYOUT", value: "Simple" },
      { label: "BEST FOR", value: "Combat Tests" }
    ]
  },
  {
    id: "lava",
    title: "LAVA ZONE",
    category: "map",
    image: "/thumbnails/env-lava.png",
    icon: <Flame className="w-6 h-6" />,
    colorClass: "text-orange-500",
    bgGlow: "shadow-[0_0_25px_rgba(249,115,22,0.15)]",
    borderClass: "border-orange-500/20 hover:border-orange-500/50",
    description: "Hot magma deals damage. Avoid the red zones.",
    simpleRules: [
      "Don't step in lava.",
      "Push enemies in.",
      "Watch your path."
    ],
    ariaPrompt: "How can I program my robot to avoid hot zones?",
    specs: [
      { label: "DANGER", value: "High" },
      { label: "FRICTION", value: "Normal" },
      { label: "EFFECT", value: "Damage over time" },
      { label: "BEST FOR", value: "Pathfinding" }
    ]
  },
  {
    id: "ice",
    title: "ICE RINK",
    category: "map",
    image: "/thumbnails/env-ice.png",
    icon: <Snowflake className="w-6 h-6" />,
    colorClass: "text-cyan-300",
    bgGlow: "shadow-[0_0_25px_rgba(103,232,249,0.15)]",
    borderClass: "border-cyan-300/20 hover:border-cyan-300/50",
    description: "Slippery floor. Your robot will drift and slide.",
    simpleRules: [
      "Expect sliding.",
      "Turn early.",
      "Hard to stop."
    ],
    ariaPrompt: "How do I handle the low-friction physics?",
    specs: [
      { label: "DANGER", value: "Low" },
      { label: "FRICTION", value: "Very Low" },
      { label: "EFFECT", value: "Sliding" },
      { label: "BEST FOR", value: "Movement Tech" }
    ]
  }
];

const SCRIPT_MODES: GuideItem[] = [
  {
    id: "classic",
    title: "CLASSIC",
    category: "mode",
    image: "/thumbnails/classic-arena-mode.png",
    icon: <FileCode2 className="w-6 h-6" />,
    colorClass: "text-[var(--accent)]",
    bgGlow: "shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]",
    borderClass: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    description: "Write one script before the match starts.",
    simpleRules: [
      "One script only.",
      "No editing mid-match.",
      "Fully auto."
    ],
    ariaPrompt: "What is Classic Mode and how do I prepare for it?",
    specs: [
      { label: "INPUT", value: "None" },
      { label: "SCRIPT", value: "Full AI" },
      { label: "DIFFICULTY", value: "Hard" },
      { label: "PRO TIP", value: "Plan for everything" }
    ]
  },
  {
    id: "tactical",
    title: "TACTICAL",
    category: "mode",
    image: "/thumbnails/tactical-arena-mode.png",
    icon: <TerminalSquare className="w-6 h-6" />,
    colorClass: "text-emerald-400",
    bgGlow: "shadow-[0_0_25px_rgba(52,211,153,0.15)]",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/50",
    description: "Match pauses between rounds so you can edit code.",
    simpleRules: [
      "Pauses between rounds.",
      "Edit your code.",
      "Adapt and win."
    ],
    ariaPrompt: "How do I take advantage of the breaks in Tactical Mode?",
    specs: [
      { label: "INPUT", value: "Between Rounds" },
      { label: "SCRIPT", value: "Adaptive" },
      { label: "DIFFICULTY", value: "Medium" },
      { label: "PRO TIP", value: "Watch the enemy" }
    ]
  },
  {
    id: "hybrid",
    title: "HYBRID",
    category: "mode",
    image: "/thumbnails/hybrid-arena-mode.png",
    icon: <Activity className="w-6 h-6" />,
    colorClass: "text-purple-400",
    bgGlow: "shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    borderClass: "border-purple-500/20 hover:border-purple-500/50",
    description: "Edit your code live while the match is running.",
    simpleRules: [
      "Live coding.",
      "Fast typing required.",
      "Total control."
    ],
    ariaPrompt: "Give me some quick real-time scripts for Hybrid Mode.",
    specs: [
      { label: "INPUT", value: "Real-time" },
      { label: "SCRIPT", value: "Live Overrides" },
      { label: "DIFFICULTY", value: "Extreme" },
      { label: "PRO TIP", value: "Keep it short" }
    ]
  }
];

export default function ArenaGuidePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"modes" | "maps" | "scripts">("modes");

  const triggerAriaHelp = (prompt: string) => {
    const event = new CustomEvent("aria:ask", { detail: { prompt } });
    window.dispatchEvent(event);
  };

  const renderCard = (item: GuideItem) => (
    <div 
      key={item.id}
      className={`group relative flex flex-col bg-bg-secondary/90 rounded-3xl border transition-all duration-300 ${item.borderClass} hover:shadow-lg overflow-hidden`}
    >
      {/* Corner Bracket Elements */}
      <span className="absolute top-[12px] left-[12px] w-2.5 h-2.5 border-t border-l border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />
      <span className="absolute top-[12px] right-[12px] w-2.5 h-2.5 border-t border-r border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />
      <span className="absolute bottom-[12px] left-[12px] w-2.5 h-2.5 border-b border-l border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />
      <span className="absolute bottom-[12px] right-[12px] w-2.5 h-2.5 border-b border-r border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />

      {/* Card Visual Header (Thumbnail Image) */}
      <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0">
        <Image 
          src={item.image} 
          alt={item.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{
            WebkitMaskImage: theme !== "light" ? "linear-gradient(to top, transparent, black 40%)" : "none",
            maskImage: theme !== "light" ? "linear-gradient(to top, transparent, black 40%)" : "none"
          }}
        />
        
        {/* Floating icon overlapping the image bottom edge */}
        <div className={`absolute bottom-3 left-4 p-3 bg-bg-primary rounded-2xl border border-accent/15 ${item.colorClass} shadow-[0_4px_12px_rgba(0,0,0,0.4)]`}>
          {item.icon}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex-1 p-5 md:p-6 flex flex-col gap-4">
        {/* Title */}
        <h3 className="text-sm md:text-base font-black tracking-widest uppercase text-text-primary group-hover:text-accent transition-colors duration-300 mt-1">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-[11px] md:text-xs text-text-secondary/80 tracking-wide leading-relaxed font-sans font-medium uppercase">
          {item.description}
        </p>

        {/* System Specs block */}
        <div className="grid grid-cols-2 gap-2.5 bg-card/40 border border-accent/10 rounded-xl p-3 md:p-4">
          {item.specs.map((spec, sIdx) => (
            <div key={sIdx} className="flex flex-col min-w-0">
              <span className="text-[8px] font-black text-accent/40 tracking-wider uppercase truncate">{spec.label}</span>
              <span className="text-[10px] font-bold text-text-primary uppercase truncate mt-0.5">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="flex flex-col gap-2 mt-1">
          <h4 className="text-[8px] font-black text-accent/50 tracking-widest uppercase">Quick Operations:</h4>
          <ul className="flex flex-col gap-1.5 list-none pl-0">
            {item.simpleRules.map((rule, idx) => (
              <li key={idx} className="text-[10px] text-text-primary/70 tracking-wide font-sans flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full bg-current shrink-0 mt-1.5 ${item.colorClass}`} />
                <span className="uppercase leading-normal">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ask ARIA hover button */}
        <div className="mt-auto pt-4 border-t border-accent/10 flex justify-end">
          <button
            type="button"
            onClick={() => triggerAriaHelp(item.ariaPrompt)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[9px] font-black tracking-widest uppercase border bg-accent/5 text-accent border-accent/25 hover:bg-accent/15 hover:border-accent/60 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] active:scale-95 transition-all cursor-pointer w-full justify-center"
          >
            <MessageSquareText size={12} />
            ASK ARIA HOW TO CODE THIS
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg-primary font-mono text-accent/90 relative overflow-hidden pb-12">
      {/* Background Cyber Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className={`max-w-[1100px] mx-auto ${isMobile ? "px-4 pt-6" : "px-6 pt-12"} relative z-10 animate-[fadeIn_0.35s_ease]`}>
        
        {/* Title Block */}
        <header className="border-b border-accent/10 pb-6 mb-8 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.6)] uppercase">
            ARENA GUIDE
          </h1>
          <p className="text-[10px] text-text-secondary tracking-widest uppercase leading-relaxed max-w-2xl font-bold font-sans">
            Learn the rules of the different game modes and map features.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-accent/10 pb-4 overflow-x-auto snap-x no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("modes")}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border transition-all cursor-pointer whitespace-nowrap snap-start ${
              activeTab === "modes"
                ? "bg-accent/15 text-accent border-accent/50 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
                : "border-transparent text-text-secondary hover:bg-accent/5 hover:border-accent/20 hover:text-accent/80"
            }`}
          >
            GAME MODES
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maps")}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border transition-all cursor-pointer whitespace-nowrap snap-start ${
              activeTab === "maps"
                ? "bg-accent/15 text-accent border-accent/50 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
                : "border-transparent text-text-secondary hover:bg-accent/5 hover:border-accent/20 hover:text-accent/80"
            }`}
          >
            MAPS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scripts")}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border transition-all cursor-pointer whitespace-nowrap snap-start ${
              activeTab === "scripts"
                ? "bg-accent/15 text-accent border-accent/50 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
                : "border-transparent text-text-secondary hover:bg-accent/5 hover:border-accent/20 hover:text-accent/80"
            }`}
          >
            SCRIPTING
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "modes"
            ? GAME_MODES.map(renderCard)
            : activeTab === "maps"
            ? ARENA_MAPS.map(renderCard)
            : SCRIPT_MODES.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
