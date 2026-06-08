/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React, { useState } from "react";
import { 
  Swords, Shield, Flag, Trophy, Zap, Cpu, 
  Flame, Snowflake, Compass, MessageSquareText,
  FileCode2, TerminalSquare, Activity
} from "lucide-react";
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
    title: "DEATHMATCH (COMBAT)",
    category: "mode",
    image: "/thumbnails/mode-combat.png",
    icon: <Swords className="w-6 h-6" />,
    colorClass: "text-[var(--accent)]",
    bgGlow: "shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]",
    borderClass: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    description: "Classic head-to-head combat. Your goal is simply to defeat the enemy robot using your weapons while managing your energy levels.",
    simpleRules: [
      "Find the enemy using SCAN or your radar.",
      "Fire weapons (FIRE / BURST_FIRE) when they are in your sight.",
      "Manage your energy to avoid entering stasis (losing power)."
    ],
    ariaPrompt: "How do I program my robot for a basic Deathmatch combat?",
    specs: [
      { label: "PROTOCOL TIMEOUT", value: "5:00 Minutes" },
      { label: "PRIMARY OBJECTIVE", value: "Eliminate Enemy" },
      { label: "ENERGY REGEN RATE", value: "Normal (+3/tick)" },
      { label: "TACTICAL ADVICE", value: "Lock targets & fire bursts" }
    ]
  },
  {
    id: "survival",
    title: "SURVIVAL MODE",
    category: "mode",
    image: "/thumbnails/mode-survival.png",
    icon: <Shield className="w-6 h-6" />,
    colorClass: "text-emerald-400",
    bgGlow: "shadow-[0_0_25px_rgba(52,211,153,0.15)]",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/50",
    description: "Test your endurance! Survive against endless waves of aggressive dummy bots that target you from all directions.",
    simpleRules: [
      "Keep moving to avoid getting surrounded.",
      "Conserve energy by firing only when targets are visible.",
      "Utilize defensive patterns or moving loops to dodge bullets."
    ],
    ariaPrompt: "What is the best logic pattern for surviving in Survival Mode?",
    specs: [
      { label: "PROTOCOL TIMEOUT", value: "Infinite (Outlast)" },
      { label: "PRIMARY OBJECTIVE", value: "Outlast Enemy Waves" },
      { label: "ENEMY COMPOSITION", value: "Multiple Aggressive Bots" },
      { label: "TACTICAL ADVICE", value: "Circle strafe to avoid hits" }
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
    description: "A strategic game of infiltration. Navigate the arena to find the enemy's flag, secure it, and carry it back to your home base.",
    simpleRules: [
      "Search the map to locate the enemy flag position.",
      "Grab the flag and plan a fast path back to your base.",
      "Fend off defenders while carrying the flag."
    ],
    ariaPrompt: "How do I code navigation and pathfinding for Capture the Flag?",
    specs: [
      { label: "PROTOCOL TIMEOUT", value: "8:00 Minutes" },
      { label: "PRIMARY OBJECTIVE", value: "Capture 3 Flags" },
      { label: "BASE LAYOUT", value: "Opposite Corners" },
      { label: "TACTICAL ADVICE", value: "Use A* pathfinding directly" }
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
    description: "Control the center! Locate the designated control zone at the center of the arena and defend it from opponents to score points.",
    simpleRules: [
      "Move directly to the center zone as fast as possible.",
      "Stand inside the zone boundaries to start scoring points.",
      "Fend off attackers and push them out of the control area."
    ],
    ariaPrompt: "How do I code my robot to hold the center zone in King of the Hill?",
    specs: [
      { label: "PROTOCOL TIMEOUT", value: "6:00 Minutes" },
      { label: "PRIMARY OBJECTIVE", value: "Hold Center Zone" },
      { label: "SCORE THRESHOLD", value: "1 pt / Tick inside Zone" },
      { label: "TACTICAL ADVICE", value: "Switch to close-range logic" }
    ]
  },
  {
    id: "racing",
    title: "CHECKPOINT RACING",
    category: "mode",
    image: "/thumbnails/mode-racing.png",
    icon: <Zap className="w-6 h-6" />,
    colorClass: "text-blue-400",
    bgGlow: "shadow-[0_0_25px_rgba(96,165,250,0.15)]",
    borderClass: "border-blue-500/20 hover:border-blue-500/50",
    description: "High speed maneuvering. Navigate the racing track, follow the path, and pass through all checkpoints in order as quickly as you can.",
    simpleRules: [
      "Detect the position of the next checkpoint.",
      "Maximize speed using MOVE_FAST while aligning your heading.",
      "Navigate around walls and boundaries to stay on course."
    ],
    ariaPrompt: "How do I write a script for racing checkpoints quickly?",
    specs: [
      { label: "PROTOCOL TIMEOUT", value: "Fastest Run Wins" },
      { label: "PRIMARY OBJECTIVE", value: "Pass All Checkpoints" },
      { label: "COURSE COMPLEXITY", value: "Varying track paths" },
      { label: "TACTICAL ADVICE", value: "Use full thrust & slide control" }
    ]
  },
  {
    id: "training",
    title: "SANDBOX TRAINING",
    category: "mode",
    image: "/thumbnails/mode-training.png",
    icon: <Cpu className="w-6 h-6" />,
    colorClass: "text-cyan-400",
    bgGlow: "shadow-[0_0_25px_rgba(34,211,238,0.15)]",
    borderClass: "border-cyan-500/20 hover:border-cyan-500/50",
    description: "A stress-free environment designed for experimenting. Write custom code, test strategies, and practice commands without scoring pressure.",
    simpleRules: [
      "No health loss or scoring - pure sandbox mode.",
      "Perfect for testing complex state loops or custom variables.",
      "Safely evaluate energy consumption and cooldowns."
    ],
    ariaPrompt: "Can you give me a simple script template to start training?",
    specs: [
      { label: "PROTOCOL TIMEOUT", value: "No Limit (Indefinite)" },
      { label: "PRIMARY OBJECTIVE", value: "Test and Debug Scripts" },
      { label: "COMBAT PROTOCOL", value: "Passive Target Available" },
      { label: "TACTICAL ADVICE", value: "Great for step-by-step tests" }
    ]
  }
];

const ARENA_MAPS: GuideItem[] = [
  {
    id: "cyber",
    title: "NEO-CYBER GRID",
    category: "map",
    image: "/thumbnails/env-cyber.png",
    icon: <Compass className="w-6 h-6" />,
    colorClass: "text-[var(--accent)]",
    bgGlow: "shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]",
    borderClass: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    description: "A clean, neon-lit digital grid arena. Features standard geometric obstacles with simple lines of sight, making it ideal for testing basic logic.",
    simpleRules: [
      "Standard layout with predictable block placements.",
      "Ideal for direct targeting and testing radar sweeps.",
      "No environmental damage or physics modifiers."
    ],
    ariaPrompt: "What are some coding tips for the Neo-Cyber grid map?",
    specs: [
      { label: "HAZARD INDEX", value: "None (Safe Environment)" },
      { label: "SURFACE FRICTION", value: "Standard (1.0)" },
      { label: "OBSTACLE LAYOUT", value: "Symmetric Obstacles" },
      { label: "最佳 MATCH TYPE", value: "Direct Aim / Combat Testing" }
    ]
  },
  {
    id: "lava",
    title: "MAGMA CORE",
    category: "map",
    image: "/thumbnails/env-lava.png",
    icon: <Flame className="w-6 h-6" />,
    colorClass: "text-orange-500",
    bgGlow: "shadow-[0_0_25px_rgba(249,115,22,0.15)]",
    borderClass: "border-orange-500/20 hover:border-orange-500/50",
    description: "A volcanic hazard zone. Hot molten streams run through the arena. Stepping into the red lava zones will drain your robot's health over time.",
    simpleRules: [
      "Avoid lava channels to protect your health.",
      "Force enemies into hot zones using tactical positioning.",
      "Plan paths carefully around magma obstacles."
    ],
    ariaPrompt: "How can I program my robot to avoid hot zones in Magma Core?",
    specs: [
      { label: "HAZARD INDEX", value: "High (Volcanic Magma)" },
      { label: "SURFACE FRICTION", value: "Standard (1.0)" },
      { label: "ENVIRONMENT EFFECT", value: "-10 HP / sec inside Lava" },
      { label: "TACTICAL ADVICE", value: "Compute coordinates before moving" }
    ]
  },
  {
    id: "ice",
    title: "GLACIAL TUNDRA",
    category: "map",
    image: "/thumbnails/env-ice.png",
    icon: <Snowflake className="w-6 h-6" />,
    colorClass: "text-cyan-300",
    bgGlow: "shadow-[0_0_25px_rgba(103,232,249,0.15)]",
    borderClass: "border-cyan-300/20 hover:border-cyan-300/50",
    description: "A frozen battleground. The floor is covered in thick ice sheets that drastically reduce friction, causing your robot to slide when turning or stopping.",
    simpleRules: [
      "Expect inertia - your robot will slide past stop points.",
      "Begin turns earlier to compensate for sliding.",
      "Leverage the slide to drift around corners during races."
    ],
    ariaPrompt: "How do I handle the low-friction sliding physics on the Glacial Tundra map?",
    specs: [
      { label: "HAZARD INDEX", value: "Low (Slippery Ice Surface)" },
      { label: "SURFACE FRICTION", value: "Extremely Low (0.25)" },
      { label: "PHYSICS FACTOR", value: "Adds inertia to slide" },
      { label: "TACTICAL ADVICE", value: "Initiate steering early" }
    ]
  }
];

const SCRIPT_MODES: GuideItem[] = [
  {
    id: "classic",
    title: "CLASSIC MODE",
    category: "mode",
    image: "/thumbnails/classic-arena-mode.png",
    icon: <FileCode2 className="w-6 h-6" />,
    colorClass: "text-[var(--accent)]",
    bgGlow: "shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]",
    borderClass: "border-[var(--accent)]/20 hover:border-[var(--accent)]/50",
    description: "The original Logic Arena experience. Scripts are locked before the match. Write a single comprehensive script that handles all situations without human intervention.",
    simpleRules: [
      "Write one script before the match.",
      "No manual overrides allowed.",
      "Test thoroughly before joining a match."
    ],
    ariaPrompt: "What is Classic Mode and how do I prepare for it?",
    specs: [
      { label: "INTERVENTION", value: "None (Fully Auto)" },
      { label: "SCRIPT TYPE", value: "Comprehensive AI" },
      { label: "DIFFICULTY", value: "Hard" },
      { label: "TACTICAL ADVICE", value: "Plan for every edge case" }
    ]
  },
  {
    id: "tactical",
    title: "TACTICAL MODE",
    category: "mode",
    image: "/thumbnails/tactical-arena-mode.png",
    icon: <TerminalSquare className="w-6 h-6" />,
    colorClass: "text-emerald-400",
    bgGlow: "shadow-[0_0_25px_rgba(52,211,153,0.15)]",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/50",
    description: "Take control of the battle. The match runs in rounds, allowing you to rewrite or tweak your robot's logic during the break between rounds.",
    simpleRules: [
      "Match pauses between rounds.",
      "Update your script to counter the enemy.",
      "Adaptability is key."
    ],
    ariaPrompt: "How do I take advantage of the breaks in Tactical Mode?",
    specs: [
      { label: "INTERVENTION", value: "Between Rounds" },
      { label: "SCRIPT TYPE", value: "Adaptive & Iterative" },
      { label: "DIFFICULTY", value: "Medium" },
      { label: "TACTICAL ADVICE", value: "Analyze opponent habits" }
    ]
  },
  {
    id: "hybrid",
    title: "HYBRID MODE",
    category: "mode",
    image: "/thumbnails/hybrid-arena-mode.png",
    icon: <Activity className="w-6 h-6" />,
    colorClass: "text-purple-400",
    bgGlow: "shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    borderClass: "border-purple-500/20 hover:border-purple-500/50",
    description: "The ultimate test of speed and coding. Edit your robot's logic in real-time while the match is running. React instantly to changing battlefield conditions.",
    simpleRules: [
      "Live code editing.",
      "Write small tactical overrides.",
      "Requires high APM (Actions Per Minute)."
    ],
    ariaPrompt: "Give me some quick real-time scripts for Hybrid Mode.",
    specs: [
      { label: "INTERVENTION", value: "Real-time Live" },
      { label: "SCRIPT TYPE", value: "Quick Overrides" },
      { label: "DIFFICULTY", value: "Extreme" },
      { label: "TACTICAL ADVICE", value: "Use short conditional blocks" }
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
      className={`group relative flex flex-col bg-card/25 backdrop-blur-xl rounded-3xl border transition-all duration-500 ${item.borderClass} ${item.bgGlow} overflow-hidden`}
    >
      {/* Corner Bracket Elements */}
      <span className="absolute top-[12px] left-[12px] w-2.5 h-2.5 border-t border-l border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />
      <span className="absolute top-[12px] right-[12px] w-2.5 h-2.5 border-t border-r border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />
      <span className="absolute bottom-[12px] left-[12px] w-2.5 h-2.5 border-b border-l border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />
      <span className="absolute bottom-[12px] right-[12px] w-2.5 h-2.5 border-b border-r border-accent/20 pointer-events-none group-hover:border-accent/50 transition-colors z-20" />

      {/* Card Visual Header (Thumbnail Image) */}
      <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0">
        <img 
          src={item.image} 
          alt={item.title} 
          className="absolute inset-0 w-full h-full object-cover filter brightness-[1.1] saturate-[1.1] transition-transform duration-700 group-hover:scale-105"
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
    <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden pb-12">
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
          <p className="text-[9px] tracking-[0.35em] text-accent/40 font-bold uppercase">
            // TERMINAL_DATABASE_ACCESS
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.6)] uppercase">
            ARENA GUIDE
          </h1>
          <p className="text-[10px] text-text-secondary tracking-widest uppercase leading-relaxed max-w-2xl font-bold font-sans">
            Learn the rules of the different game modes and map features to write better, smarter robot scripts.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-accent/10 pb-4 overflow-x-auto snap-x hide-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("modes")}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border transition-all cursor-pointer whitespace-nowrap snap-start ${
              activeTab === "modes"
                ? "bg-accent/15 text-accent border-accent/50 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
                : "border-transparent text-text-secondary hover:bg-accent/5 hover:border-accent/20 hover:text-accent/80"
            }`}
          >
            COMBAT PROTOCOLS
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
            ARENA MAPS
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
            SCRIPT MODES
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
