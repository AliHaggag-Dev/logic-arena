"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";

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

      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        {/* Grid */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-accent/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/campaign")}
                className="text-[10px] tracking-[0.2em] text-accent/40 hover:text-accent border border-accent/15 hover:border-accent/40 rounded px-3 py-1.5 transition-all duration-200 cursor-pointer bg-transparent"
              >
                ← BACK
              </button>
              <span className="text-[10px] text-accent/20 tracking-[0.2em]">
                LEVEL {String(level.id).padStart(2, "0")}
              </span>
              <h1 className="m-0 text-[18px] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]">
                {level.name}
              </h1>
            </div>
            <span
              className="text-[10px] font-bold tracking-[0.25em] border rounded px-3 py-1"
              style={{ color: dc.color, borderColor: `${dc.color}40` }}
            >
              {dc.label}
            </span>
          </div>

          {/* Main layout */}
          <div className="grid grid-cols-[380px_1fr] gap-7 items-start">
            {/* ── LEFT PANEL ── */}
            <div className="flex flex-col gap-5">
              {/* Mission brief */}
              <div className="border border-accent/15 rounded-xl p-6 bg-accent/[0.02]">
                <p className="text-[9px] tracking-[0.3em] text-accent/30 mb-3 uppercase">
                  // MISSION_BRIEF
                </p>
                <p className="text-[11px] text-accent/70 tracking-[0.08em] leading-relaxed">
                  {level.description}
                </p>
              </div>

              {/* Enemy Intel */}
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

              {/* Tips */}
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

              {/* Deploy button */}
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

        {/* ── MODAL OVERLAY ── */}
        {(modal === "victory" || modal === "defeat") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div
              className={`rounded-2xl border p-10 text-center max-w-[420px] w-full mx-4 font-mono ${modal === "victory"
                ? "bg-bg-primary border-accent/40 shadow-[0_0_60px_rgba(var(--accent-rgb),0.25)]"
                : "bg-bg-primary border-red-500/30 shadow-[0_0_60px_rgba(var(--color-red-500),0.2)]"
                }`}
              style={{ animation: "modalIn 0.3s ease" }}
            >
              {modal === "victory" ? (
                <>
                  <div className="text-5xl mb-5">🏆</div>
                  <h2 className="text-[18px] font-black tracking-[0.25em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.8)] mb-2">
                    MISSION COMPLETE
                  </h2>
                  <p className="text-accent/50 text-[10px] tracking-[0.15em] mb-6">
                    Enemy unit neutralized.
                  </p>
                  <div className="inline-block border border-accent/20 rounded-lg px-6 py-3 bg-accent/5 mb-7">
                    <span className="text-accent/40 text-[10px] tracking-[0.2em] block mb-1">RANK EARNED</span>
                    <span className="text-accent font-black text-[22px] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.7)]">+{reward}</span>
                  </div>
                  <button
                    onClick={() => router.push("/campaign")}
                    className="w-full py-3 rounded-lg text-[10px] font-black tracking-[0.25em] bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 hover:border-accent/70 transition-all duration-200 cursor-pointer"
                  >
                    → CONTINUE TO MAP
                  </button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-5">💀</div>
                  <h2 className="text-[18px] font-black tracking-[0.25em] text-red-500 drop-shadow-[0_0_10px_rgba(var(--color-red-500),0.8)] mb-2">
                    UNIT DESTROYED
                  </h2>
                  <p className="text-red-500/50 text-[10px] tracking-[0.15em] mb-7">
                    Recalibrate your tactics and retry.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModal("idle")}
                      className="flex-1 py-3 rounded-lg text-[10px] font-black tracking-[0.2em] bg-accent/10 border border-accent/30 text-accent/70 hover:bg-accent/20 transition-all duration-200 cursor-pointer"
                    >
                      ↺ RETRY
                    </button>
                    <button
                      onClick={() => router.push("/campaign")}
                      className="flex-1 py-3 rounded-lg text-[10px] font-black tracking-[0.2em] bg-red-500/10 border border-red-500/30 text-red-500/70 hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
                    >
                      ← RETREAT
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
