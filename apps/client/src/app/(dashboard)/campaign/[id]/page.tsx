"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";

interface LevelDetail {
  id: number;
  name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ELITE";
  description: string;
  rewardRank: number;
  enemyScript: string;
  unlocked: boolean;
}

const DIFF_CONFIG = {
  EASY: { color: "var(--color-emerald-500)", label: "EASY" },
  MEDIUM: { color: "#eab308", label: "MEDIUM" },
  HARD: { color: "var(--color-orange-500)", label: "HARD" },
  ELITE: { color: "var(--color-red-500)", label: "ELITE" },
} as const;

type ModalState = "idle" | "loading" | "victory" | "defeat";

export default function CampaignLevelPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const levelId = parseInt(id, 10);

  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [script, setScript] = useState("");
  const [modal, setModal] = useState<ModalState>("idle");
  const [reward, setReward] = useState<number>(0);

  useEffect(() => {
    apiClient
      .get(`/campaign/levels/${levelId}`)
      .then((r) => { setLevel(r.data); })
      .catch(() => router.push("/campaign"))
      .finally(() => setFetching(false));
  }, [levelId, router]);

  const handleFight = useCallback(async () => {
    if (!script.trim()) return;
    setModal("loading");

    try {
      const fightRes = await apiClient.post("/matches/campaign", {
        levelId,
        userScript: script,
      });

      if (fightRes.data.won) {
        // Complete the level — reward rank
        try {
          await apiClient.post(`/campaign/levels/${levelId}/complete`);
        } catch {
          // might already be completed if replayed — ignore
        }
        setReward(level?.rewardRank ?? 0);
        setModal("victory");
      } else {
        setModal("defeat");
      }
    } catch {
      setModal("defeat");
    }
  }, [script, levelId, level]);

  if (fetching || !level) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono flex items-center justify-center">
        <div className="text-accent/40 text-[11px] tracking-[0.3em] animate-pulse">
          LOADING LEVEL DATA...
        </div>
      </div>
    );
  }

  const dc = DIFF_CONFIG[level.difficulty];

  const isMobile = useMediaQuery("(max-width: 768px)");

  const DesktopLayout = (
    <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-[120px] relative z-10 animate-[fadeIn_0.35s_ease]">
      <div className="flex flex-row items-end justify-between gap-4 mb-10 pb-6 border-b border-accent/20">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/campaign")}
            className="w-max text-[10px] tracking-[0.25em] text-accent/40 hover:text-accent border border-accent/15 hover:border-accent/40 rounded px-3 py-1 transition-all duration-200 cursor-pointer bg-transparent uppercase"
          >
            ← BACK TO MAP
          </button>
          <div>
            <span className="text-[10px] text-accent/40 tracking-[0.3em] font-bold block mb-1 uppercase">
              LEVEL {String(level.id).padStart(2, "0")}
            </span>
            <h1 className="m-0 text-3xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-none uppercase">
              {level.name}
            </h1>
          </div>
        </div>
        
        <div>
          <span
            className="inline-block text-[10px] font-black tracking-[0.3em] border rounded px-3 py-1.5 shadow-sm"
            style={{ color: dc.color, borderColor: `${dc.color}40`, backgroundColor: `${dc.color}10` }}
          >
            {dc.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-7 items-start">
        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col gap-5">
          <div className="border border-accent/15 rounded-xl p-6 bg-accent/[0.02]">
            <p className="text-[9px] tracking-[0.3em] text-accent/30 mb-3 uppercase">
              // MISSION_BRIEF
            </p>
            <p className="text-[11px] text-accent/70 tracking-[0.08em] leading-relaxed">
              {level.description}
            </p>
          </div>

          <div className="border border-red-500/20 rounded-xl p-6 bg-red-500/[0.03]">
            <p className="text-[9px] tracking-[0.3em] text-red-500/50 mb-4 uppercase">
              // ENEMY_INTEL
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/40 tracking-[0.15em]">DESIGNATION</span>
                <span className="font-bold text-red-500/80 tracking-[0.12em]">{level.name}</span>
              </div>
              <div className="h-[1px] bg-red-500/10" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/40 tracking-[0.15em]">THREAT LEVEL</span>
                <span className="font-bold tracking-[0.12em]" style={{ color: dc.color }}>{level.difficulty}</span>
              </div>
              <div className="h-[1px] bg-red-500/10" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/40 tracking-[0.15em]">REWARD</span>
                <span className="font-bold text-accent/70 tracking-[0.12em]">+{level.rewardRank} RANK</span>
              </div>
            </div>
          </div>

          <div className="border border-accent/10 rounded-xl p-5 bg-transparent">
            <p className="text-[9px] tracking-[0.3em] text-accent/25 mb-3 uppercase">// TACTICS</p>
            <ul className="text-[10px] text-accent/35 tracking-[0.06em] leading-relaxed space-y-1.5 list-none p-0 m-0">
              <li>→ Use SCAN to detect proximity</li>
              <li>→ TIME your FIRE commands carefully</li>
              <li>→ WHILE loops amplify your firepower</li>
              <li>→ Reposition with MOVE to dodge fire</li>
            </ul>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-[9px] tracking-[0.3em] text-accent/35 uppercase m-0">
              // YOUR_ALISCRIPT
            </p>
            <span className="text-[9px] text-accent/20 tracking-[0.12em]">
              {script.split("\n").filter(Boolean).length} LINES
            </span>
          </div>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={"// Write your AliScript here\n// Example:\nSET x = SCAN\nIF x > 0\n  FIRE\nELSE\n  MOVE RIGHT\nEND"}
            className="w-full min-h-[380px] rounded-xl border border-accent/20 bg-bg-primary text-accent/85 p-5 text-[12px] leading-[1.7] resize-y focus:outline-none focus:border-accent/50 placeholder:text-accent/20 font-mono tracking-[0.04em]"
            style={{ boxShadow: "inset 0 0 30px rgba(var(--accent-rgb),0.03)" }}
            spellCheck={false}
          />

          <button
            onClick={handleFight}
            disabled={!script.trim() || modal === "loading"}
            className={`w-full py-4 rounded-xl text-[11px] font-black tracking-[0.3em] font-mono cursor-pointer transition-all duration-200 border ${modal === "loading"
              ? "bg-accent/5 border-accent/20 text-accent/40 cursor-not-allowed"
              : !script.trim()
                ? "bg-accent/5 border-accent/15 text-accent/25 cursor-not-allowed"
                : "bg-accent/10 border-accent/40 text-accent hover:bg-accent/20 hover:border-accent/70 hover:drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]"
              }`}
          >
            {modal === "loading" ? "⟳ INITIALIZING COMBAT..." : "▶ DEPLOY & FIGHT"}
          </button>
        </div>
      </div>
    </div>
  );

  const MobileLayout = (
    <div className="w-full flex flex-col min-h-[calc(100vh-80px-env(safe-area-inset-bottom))] px-4 pt-4 pb-[env(safe-area-inset-bottom)] relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Top Header */}
      <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-accent/20 shrink-0">
        <button
          onClick={() => router.push("/campaign")}
          className="w-max text-[9px] tracking-[0.25em] text-accent/40 hover:text-accent border border-accent/15 rounded px-2.5 py-1 uppercase"
        >
          ← BACK TO MAP
        </button>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <span className="text-[9px] text-accent/40 tracking-[0.3em] font-bold block mb-0.5 uppercase">
              LEVEL {String(level.id).padStart(2, "0")}
            </span>
            <h1 className="m-0 text-xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-[1.1] uppercase max-w-[200px]">
              {level.name}
            </h1>
          </div>
          <span
            className="inline-block text-[9px] font-black tracking-[0.3em] border rounded px-2 py-1 shadow-sm shrink-0"
            style={{ color: dc.color, borderColor: `${dc.color}40`, backgroundColor: `${dc.color}10` }}
          >
            {dc.label}
          </span>
        </div>
      </div>

      {/* Info Stack */}
      <div className="flex flex-col gap-4 shrink-0 mb-4">
        {/* Mission brief */}
        <div className="border border-accent/15 rounded-xl p-4 bg-accent/[0.02]">
          <p className="text-[9px] tracking-[0.3em] text-accent/30 mb-2 uppercase">// MISSION_BRIEF</p>
          <p className="text-[10px] text-accent/70 tracking-[0.08em] leading-relaxed">{level.description}</p>
        </div>

        {/* Enemy Intel */}
        <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/[0.03]">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-accent/40 tracking-[0.15em]">INTEL</span>
              <span className="font-bold text-red-500/80 tracking-[0.12em]">{level.name}</span>
            </div>
            <div className="h-[1px] bg-red-500/10" />
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-accent/40 tracking-[0.15em]">REWARD</span>
              <span className="font-bold text-accent/70 tracking-[0.12em]">+{level.rewardRank} PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor Full Width */}
      <div className="flex flex-col flex-1 gap-3 pb-8">
        <div className="flex justify-between items-center px-1">
          <p className="text-[9px] tracking-[0.3em] text-accent/35 uppercase m-0">// YOUR_ALISCRIPT</p>
          <span className="text-[9px] text-accent/20 tracking-[0.12em]">
            {script.split("\n").filter(Boolean).length} LINES
          </span>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={"// Write your AliScript here\n// Example:\nSET x = SCAN\nIF x > 0\n  FIRE\nELSE\n  MOVE RIGHT\nEND"}
          className="w-full flex-1 min-h-[300px] rounded-xl border border-accent/20 bg-bg-primary text-accent/85 p-4 text-[11px] leading-[1.6] resize-none focus:outline-none focus:border-accent/50 placeholder:text-accent/20 font-mono tracking-[0.04em]"
          style={{ boxShadow: "inset 0 0 20px rgba(var(--accent-rgb),0.03)" }}
          spellCheck={false}
        />
        <button
          onClick={handleFight}
          disabled={!script.trim() || modal === "loading"}
          className={`w-full h-[44px] shrink-0 rounded-xl text-[10px] font-black tracking-[0.2em] font-mono transition-transform duration-150 border active:scale-95 ${
             modal === "loading"
            ? "bg-accent/5 border-accent/20 text-accent/40"
            : !script.trim()
              ? "bg-accent/5 border-accent/15 text-accent/25"
              : "bg-accent/10 border-accent/40 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)]"
            }`}
        >
          {modal === "loading" ? "INITIALIZING..." : "DEPLOY SCRIPT"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "" : "pb-12"}`}>
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {isMobile ? MobileLayout : DesktopLayout}

        {/* ── MODAL OVERLAY ── */}
        {(modal === "victory" || modal === "defeat") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div
              className={`rounded-2xl border p-6 sm:p-10 text-center max-w-[420px] w-full font-mono ${modal === "victory"
                ? "bg-bg-primary border-accent/40 shadow-[0_0_60px_rgba(var(--accent-rgb),0.25)]"
                : "bg-bg-primary border-red-500/30 shadow-[0_0_60px_rgba(var(--color-red-500),0.2)]"
                }`}
              style={{ animation: "modalIn 0.3s ease" }}
            >
              {modal === "victory" ? (
                <>
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">🏆</div>
                  <h2 className="text-[16px] sm:text-[18px] font-black tracking-[0.25em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.8)] mb-2">
                    MISSION COMPLETE
                  </h2>
                  <p className="text-accent/50 text-[9px] sm:text-[10px] tracking-[0.15em] mb-5 sm:mb-6">
                    Enemy unit neutralized.
                  </p>
                  <div className="inline-block border border-accent/20 rounded-lg px-6 py-3 bg-accent/5 mb-6 sm:mb-7">
                    <span className="text-accent/40 text-[9px] sm:text-[10px] tracking-[0.2em] block mb-1">RANK EARNED</span>
                    <span className="text-accent font-black text-[20px] sm:text-[22px] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.7)]">+{reward}</span>
                  </div>
                  <button
                    onClick={() => router.push("/campaign")}
                    className="w-full h-[44px] sm:py-3 sm:h-auto rounded-lg text-[10px] font-black tracking-[0.25em] bg-accent/10 border border-accent/40 text-accent transition-transform active:scale-95 duration-150 uppercase"
                  >
                    CONTINUE
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">💀</div>
                  <h2 className="text-[16px] sm:text-[18px] font-black tracking-[0.25em] text-red-500 drop-shadow-[0_0_10px_rgba(var(--color-red-500),0.8)] mb-2">
                    UNIT DESTROYED
                  </h2>
                  <p className="text-red-500/50 text-[9px] sm:text-[10px] tracking-[0.15em] mb-6 sm:mb-7">
                    Recalibrate your tactics and retry.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setModal("idle")}
                      className="w-full h-[44px] sm:flex-1 sm:py-3 sm:h-auto rounded-lg text-[10px] font-black tracking-[0.2em] bg-accent/10 border border-accent/30 text-accent/70 transition-transform active:scale-95 duration-150 uppercase"
                    >
                      RETRY
                    </button>
                    <button
                      onClick={() => router.push("/campaign")}
                      className="w-full h-[44px] sm:flex-1 sm:py-3 sm:h-auto rounded-lg text-[10px] font-black tracking-[0.2em] bg-red-500/10 border border-red-500/30 text-red-500/70 transition-transform active:scale-95 duration-150 uppercase"
                    >
                      RETREAT
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}