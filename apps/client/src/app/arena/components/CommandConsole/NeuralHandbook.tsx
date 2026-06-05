"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Crosshair, Eye, Database, Cpu, Radio, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import cookbook from "./cookbook.json";

interface NeuralHandbookProps {
    isOpen: boolean;
    onSelect: (command: string) => void;
    fullWidth?: boolean;
    onExpandRecipe?: (recipe: Recipe) => void;
}

type CategoryId = "aiming" | "vision" | "memory" | "state" | "swarm" | "energy";
type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Recipe {
    id: string;
    name: string;
    description: string;
    category: CategoryId;
    difficulty: Difficulty;
    code: string;
}

const CATEGORIES: { id: CategoryId; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; color: string }[] = [
    { id: "aiming",  icon: Crosshair, label: "Aiming",  color: "var(--arena-cyan)"  },
    { id: "vision",  icon: Eye, label: "Vision",  color: "var(--arena-green)" },
    { id: "memory",  icon: Database, label: "Memory",  color: "var(--arena-amber)" },
    { id: "state",   icon: Cpu, label: "States",  color: "rgb(var(--arena-purple-rgb))" },
    { id: "swarm",   icon: Radio, label: "Swarm",   color: "var(--arena-stasis)" },
    { id: "energy",  icon: Zap, label: "Energy",  color: "var(--arena-amber)" },
];

export const DIFFICULTY_STYLES: Record<Difficulty, { label: string; color: string; bg: string }> = {

    beginner:     { label: "BEGINNER",     color: "var(--arena-green)",  bg: "rgba(var(--arena-green-rgb),0.12)"  },
    intermediate: { label: "INTERMEDIATE", color: "var(--arena-amber)",  bg: "rgba(var(--arena-amber-rgb),0.12)"  },
    advanced:     { label: "ADVANCED",     color: "rgb(var(--arena-purple-rgb))", bg: "rgba(var(--arena-purple-rgb),0.12)" },
};

export function CodeLine({ line }: { line: string }) {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith("--")) {
        return (
            <span style={{ display: "block", paddingLeft: `${indent * 7}px` }}>
                <span style={{ color: "rgba(var(--arena-green-rgb),0.55)", fontStyle: "italic" }}>{trimmed}</span>
            </span>
        );
    }

    const keywords = /\b(IF|THEN|ELSE|END|WHILE|DO|FOR|FROM|TO|FUNCTION|CALL|SET|RETURN|BREAK|CONTINUE|AND|OR|NOT|TRUE|FALSE)\b/g;
    const commands = /\b(MOVE|MOVE_FAST|BACKUP|FIRE|BURST_FIRE|SCAN|PATHFIND|STOP|WAIT|SHIELD|CLOAK|DASH|MINE|TELEPORT|TAUNT|BROADCAST|RECEIVE)\b/g;

    const highlighted = trimmed
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(keywords, '<span style="color:rgb(var(--arena-purple-rgb));font-weight:700">$1</span>')
        .replace(commands, '<span style="color:var(--arena-cyan)">$1</span>');

    return (
        <span
            style={{ display: "block", paddingLeft: `${indent * 7}px` }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
        />
    );
}

function RecipeCard({ recipe, onSelect, onExpand }: { recipe: Recipe; onSelect: (code: string) => void; onExpand?: (recipe: Recipe) => void }) {
    const [expanded, setExpanded] = useState(false);
    const diff = DIFFICULTY_STYLES[recipe.difficulty];
    const lines = recipe.code.split("\n");

    return (
        <div
            style={{
                background: "rgba(var(--arena-white-rgb),0.025)",
                border: "1px solid rgba(var(--arena-white-rgb),0.08)",
                borderRadius: "10px",
                overflow: "hidden",
                transition: "border-color 0.2s",
                flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(var(--arena-cyan-rgb),0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(var(--arena-white-rgb),0.08)"; }}
        >
            {/* Card Header */}
            <button
                type="button"
                onClick={() => {
                    if (onExpand) {
                        onExpand(recipe);
                    } else {
                        setExpanded(!expanded);
                    }
                }}
                className="w-full text-left"
                style={{ padding: "10px 12px", background: "transparent" }}
                aria-expanded={expanded}
                aria-label={`${recipe.name} recipe — click to ${expanded ? "collapse" : "expand"}`}
            >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                            <span style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color: "rgba(var(--arena-white-rgb),0.9)",
                                letterSpacing: "0.02em",
                            }}>
                                {recipe.name}
                            </span>
                        </div>
                        <p style={{ fontSize: "9.5px", color: "rgba(var(--arena-white-rgb),0.45)", lineHeight: "1.4", margin: 0 }}>
                            {recipe.description}
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <span style={{
                            fontSize: "7px",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "2px 5px",
                            borderRadius: "4px",
                            color: diff.color,
                            background: diff.bg,
                        }}>
                            {diff.label}
                        </span>
                        <span style={{
                            color: "rgba(var(--arena-white-rgb),0.3)",
                            fontSize: "10px",
                            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            display: "inline-block",
                        }}>
                            ›
                        </span>
                    </div>
                </div>
            </button>

            {/* Expanded Code View */}
            {expanded && (
                <div style={{ borderTop: "1px solid rgba(var(--arena-white-rgb),0.06)" }}>
                    <div
                        style={{
                            padding: "10px 12px",
                            overflowX: "auto",
                            overflowY: "auto",
                            maxHeight: "180px",
                            background: "rgba(var(--arena-black-rgb),0.4)",
                        }}
                        className="custom-scrollbar"
                    >
                        <pre style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: "10.5px",
                            lineHeight: "1.6",
                            color: "rgba(var(--arena-white-rgb),0.75)",
                            whiteSpace: "pre",
                        }}>
                            {lines.map((line, i) => (
                                <CodeLine key={i} line={line} />
                            ))}
                        </pre>
                    </div>
                    <div style={{ padding: "8px 12px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={() => onSelect(recipe.code)}
                            style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "1px solid rgba(var(--arena-cyan-rgb),0.5)",
                                color: "var(--arena-cyan)",
                                background: "rgba(var(--arena-cyan-rgb),0.08)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                textTransform: "uppercase",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(var(--arena-cyan-rgb),0.2)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--arena-cyan)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(var(--arena-cyan-rgb),0.08)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(var(--arena-cyan-rgb),0.5)";
                            }}
                        >
                            Insert into Editor
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const NeuralHandbook: React.FC<NeuralHandbookProps> = ({ isOpen, onSelect, fullWidth = false, onExpandRecipe }) => {
    const [activeCategory, setActiveCategory] = useState<CategoryId>("aiming");
    const tabsRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const typedRecipes = cookbook as Recipe[];

    const filteredRecipes = useMemo(
        () => typedRecipes.filter((r) => r.category === activeCategory),
        [activeCategory, typedRecipes]
    );

    const handleScroll = () => {
        const el = tabsRef.current;
        if (!el) return;
        setShowLeftArrow(el.scrollLeft > 2);
        setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };

    const scrollTabs = (direction: "left" | "right") => {
        const el = tabsRef.current;
        if (!el) return;
        const scrollAmount = 100;
        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        });
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.currentTarget.scrollLeft += e.deltaY;
    };

    useEffect(() => {
        // Run initial check
        handleScroll();
        window.addEventListener("resize", handleScroll);
        return () => window.removeEventListener("resize", handleScroll);
    }, [activeCategory]); // Recheck when category changes or mounts

    const outerClass = fullWidth
        ? "flex flex-col w-full h-full min-h-0"
        : `transition-all duration-300 ease-in-out overflow-hidden flex flex-col min-h-0 ${isOpen ? "w-72 opacity-100 ml-4" : "w-0 opacity-0 ml-0"}`;

    const innerClass = fullWidth
        ? "flex flex-col gap-2.5 h-full min-h-0"
        : "border border-cyan-900/40 bg-black/80 rounded-lg p-3 shadow-[0_0_20px_rgba(var(--arena-cyan-rgb),0.1)] flex flex-col gap-2.5 h-full min-h-0 min-w-[18rem]";

    return (
        <div className={outerClass}>
            <div className={innerClass}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(var(--arena-white-rgb),0.08)", paddingBottom: "8px", flexShrink: 0 }}>
                    <h3 style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--arena-cyan)", margin: 0 }}>
                        Strategy Cookbook
                    </h3>
                    <span style={{ fontSize: "8px", color: "rgba(var(--arena-white-rgb),0.3)", letterSpacing: "0.1em" }}>
                        {filteredRecipes.length} recipes
                    </span>
                </div>

                {/* Category Tabs Wrapper */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%", overflow: "hidden", flexShrink: 0 }}>
                    {/* Left Scroll Button */}
                    {showLeftArrow && (
                        <button
                            type="button"
                            onClick={() => scrollTabs("left")}
                            aria-label="Scroll category tabs left"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                width: "24px",
                                background: "linear-gradient(to right, rgba(0, 0, 0, 0.95), transparent)",
                                color: "var(--arena-cyan)",
                                border: "none",
                                cursor: "pointer",
                                paddingLeft: "2px",
                            }}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Tabs Scroll Area */}
                    <div 
                        ref={tabsRef}
                        onScroll={handleScroll}
                        onWheel={handleWheel}
                        style={{ display: "flex", gap: "4px", flex: 1, overflowX: "auto", paddingBottom: "2px" }} 
                        className="no-scrollbar"
                    >
                        {CATEGORIES.map((cat) => {
                            const active = activeCategory === cat.id;
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setActiveCategory(cat.id)}
                                    title={cat.label}
                                    className={`cursor-pointer ${!active ? 'hover:!bg-white/10 hover:!border-white/20 hover:!text-white/80' : ''}`}
                                    style={{
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "5px 9px",
                                        borderRadius: "6px",
                                        fontSize: "8.5px",
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        transition: "all 0.15s",
                                        border: active ? `1px solid ${cat.color}` : "1px solid rgba(var(--arena-white-rgb),0.07)",
                                        background: active ? `rgba(${cat.color === "var(--arena-cyan)" ? "var(--arena-cyan-rgb)" : cat.color === "var(--arena-green)" ? "var(--arena-green-rgb)" : cat.color === "var(--arena-amber)" ? "var(--arena-amber-rgb)" : "var(--arena-purple-rgb)"},0.15)` : "rgba(var(--arena-white-rgb),0.03)",
                                        color: active ? cat.color : "rgba(var(--arena-white-rgb),0.4)",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Scroll Button */}
                    {showRightArrow && (
                        <button
                            type="button"
                            onClick={() => scrollTabs("right")}
                            aria-label="Scroll category tabs right"
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                bottom: 0,
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                width: "24px",
                                background: "linear-gradient(to left, rgba(0, 0, 0, 0.95), transparent)",
                                color: "var(--arena-cyan)",
                                border: "none",
                                cursor: "pointer",
                                paddingRight: "2px",
                            }}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Recipe List */}
                <div
                    className="custom-scrollbar"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        overflowY: "auto",
                        flex: 1,
                        minHeight: 0,
                        paddingRight: "2px",
                    }}
                >
                    {filteredRecipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onSelect={onSelect}
                            onExpand={onExpandRecipe}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
