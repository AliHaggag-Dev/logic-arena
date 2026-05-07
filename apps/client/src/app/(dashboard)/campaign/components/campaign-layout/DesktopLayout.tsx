import { memo, useMemo } from "react";
import { Check, Cpu, GitBranch, Lock, Zap } from "lucide-react";

import { DIFFICULTY_CONFIG } from "../../constants/difficulty.constants";
import { TAB_ICONS } from "./tabMeta";
import type { CampaignViewProps } from "./types";

export const DesktopLayout = memo(function DesktopLayout({
  tabs,
  activeTabId,
  setActiveTabId,
  setSelectedLevel,
}: CampaignViewProps) {
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );

  return (
    <div className="max-w-[1280px] mx-auto px-8 pt-16 pb-[120px] relative z-10 animate-[fadeIn_0.4s_ease]">
      <div className="flex gap-10">
        {/* ── Left sidebar ── */}
        <aside className="w-[240px] shrink-0">
          <div className="mb-8">
            <h1 className="text-[28px] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.8)] leading-none uppercase mb-1">
              Proving Grounds
            </h1>
            <p className="text-[9px] text-accent/40 tracking-[0.2em] uppercase">
              Phase 6: Algorithmic Warfare
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] ?? GitBranch;
              const isActive = tab.id === activeTabId;
              const done = tab.levels.filter((l) => l.completed).length;
              const total = tab.levels.length;
              const prog = total > 0 ? (done / total) * 100 : 0;
              const allDone = done === total && total > 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer overflow-hidden group ${isActive
                    ? "bg-accent/10 border-accent/50"
                    : "bg-bg-primary border-accent/10 hover:bg-accent/5 hover:border-accent/30"
                    }`}
                  style={isActive ? { boxShadow: "0 0 20px rgba(var(--accent-rgb),0.12)" } : {}}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.9)]" />
                  )}

                  <div className="flex items-center justify-between w-full mb-2.5 relative z-10">
                    <span className={`flex items-center gap-2 text-[12px] font-black tracking-[0.18em] uppercase ${isActive ? "text-accent" : "text-accent/60"}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {tab.label}
                    </span>
                    {allDone && <Check className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]" />}
                  </div>

                  <p className="text-[9px] text-accent/35 tracking-[0.04em] leading-relaxed mb-3 relative z-10">
                    {tab.description}
                  </p>

                  <div className="w-full relative z-10">
                    <div className="flex justify-between text-[7px] font-black tracking-[0.25em] text-accent/40 uppercase mb-1">
                      <span>Progress</span>
                      <span>{done}/{total}</span>
                    </div>
                    <div className="h-[2px] bg-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${prog}%`, boxShadow: "0 0 6px rgba(var(--accent-rgb),0.7)" }}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Right content grid ── */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-4 h-4 text-accent/40" />
            <h2 className="text-[14px] font-black tracking-[0.3em] text-accent/70 uppercase">
              {activeTab.label} Sequence
            </h2>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {activeTab.levels.map((level) => {
              const dc = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.EASY;

              if (!level.unlocked) {
                return (
                  <div
                    key={level.id}
                    className="relative p-5 rounded-xl border border-accent/10 bg-bg-primary overflow-hidden min-h-[190px] flex flex-col justify-between opacity-50"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-[9px] tracking-[0.35em] text-accent/30 font-black uppercase">
                        ORDER {String(level.order).padStart(2, "0")}
                      </span>
                      <Lock className="w-4 h-4 text-accent/25" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-[13px] font-black tracking-[0.15em] uppercase leading-tight mb-2 text-accent/30">
                        {level.title}
                      </h3>
                      <p className="text-[10px] text-accent/20 leading-relaxed line-clamp-3 tracking-[0.04em]">
                        {level.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-accent/8 pt-3">
                      <span className={`text-[8px] font-black tracking-[0.25em] border rounded px-1.5 py-0.5 opacity-40 ${dc.text} ${dc.border} ${dc.bg}`}>
                        {level.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/20">
                        <Zap className="w-3 h-3" /> +{level.pointsReward}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`group text-left relative p-5 rounded-xl border transition-all min-h-[190px] flex flex-col justify-between overflow-hidden cursor-pointer ${level.completed
                    ? "bg-accent/[0.025] border-accent/15 hover:border-accent/35"
                    : "bg-bg-primary border-accent/25 hover:border-accent/55 hover:bg-accent/[0.03]"
                    }`}
                  style={!level.completed ? { boxShadow: "inset 0 0 30px rgba(var(--accent-rgb),0.015)" } : {}}
                >
                  <div className="flex justify-between items-start mb-2.5 relative z-10">
                    <span className="text-[9px] tracking-[0.35em] text-accent/50 font-black uppercase">
                      ORDER {String(level.order).padStart(2, "0")}
                    </span>
                    {level.completed && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> CLEAR
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 flex-1">
                    <h3 className={`text-[13px] font-black tracking-[0.15em] uppercase leading-tight mb-2 ${level.completed ? "text-accent/45" : "text-accent"}`}>
                      {level.title}
                    </h3>
                    <p className="text-[10px] text-accent/35 leading-relaxed line-clamp-3 tracking-[0.04em]">
                      {level.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-4 flex items-center justify-between border-t border-accent/8 pt-3">
                    <span className={`text-[8px] font-black tracking-[0.25em] border rounded px-1.5 py-0.5 ${dc.text} ${dc.border} ${dc.bg}`}>
                      {level.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/45">
                      <Zap className="w-3 h-3 text-yellow-400/70" />
                      +{level.pointsReward}
                    </span>
                  </div>

                  {!level.completed && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/[0.04] to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
});
