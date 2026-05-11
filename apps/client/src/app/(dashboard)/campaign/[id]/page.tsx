"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { LevelDetail, ModalState } from "./types";
import { LevelDesktopLayout } from "./components/LevelDesktopLayout";
import { LevelMobileLayout } from "./components/LevelMobileLayout";
import { LevelModal } from "./components/LevelModal";

export default function CampaignLevelPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const levelId = id;
  const invalidLevelId = !levelId;

  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [fetching, setFetching] = useState(!invalidLevelId);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [modal, setModal] = useState<ModalState>("idle");
  const [reward, setReward] = useState<number>(0);

  useEffect(() => {
    if (invalidLevelId) return;

    let cancelled = false;

    apiClient
      .get(`/campaign/levels/${levelId}`)
      .then((r) => {
        if (!cancelled) setLevel(r.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 403) {
          setError("ACCESS DENIED: Level is locked.");
        } else {
          setError("404: Level not found.");
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invalidLevelId, levelId]);

  // ── Step 1: User clicks DEPLOY — just start the canvas simulation ──────────
  const handleFight = useCallback(() => {
    if (!script.trim()) return;
    setModal("loading");
  }, [script]);

  // ── Step 2: Canvas fires this when the battle concludes ────────────────────
  const handleBattleEnd = useCallback(async (winner: 'player' | 'enemy' | 'draw') => {
    if (winner === 'draw') {
      setModal("draw");
      return;
    }

    if (winner === 'enemy') {
      setModal("defeat");
      return;
    }

    // Player won — show victory immediately, then validate with server in bg
    setModal("victory");

    // Fire-and-forget: server validation + point awarding
    try {
      const fightRes = await apiClient.post("/matches/campaign", {
        levelId,
        userScript: script,
      });

      const completionToken = fightRes.data.completionToken;
      if (completionToken) {
        try {
          const completionRes = await apiClient.post(`/campaign/levels/${levelId}/complete`, {
            completionToken,
          });
          const pointsAwarded =
            completionRes.data?.pointsAwarded ??
            level?.pointsReward ??
            0;
          setReward(pointsAwarded);
          window.dispatchEvent(new Event("global-refresh"));
        } catch {
          setReward(level?.pointsReward ?? 0);
        }
      }
    } catch {
      // Server unreachable — victory already shown, points handled on next sync
      setReward(0);
    }
  }, [script, levelId, level]);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const displayError = invalidLevelId ? "Invalid level ID." : error;

  if (fetching) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono flex items-center justify-center">
        <div className="text-accent/70 text-[11px] tracking-[0.3em] animate-pulse">
          LOADING LEVEL DATA...
        </div>
      </div>
    );
  }

  if (displayError || !level) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono flex flex-col items-center justify-center p-4 text-center">
        <div className="text-red-500 text-[14px] font-black tracking-[0.2em] mb-4">
          {displayError || "An unknown error occurred."}
        </div>
        <button
          type="button"
          onClick={() => router.push("/campaign")}
          className="px-6 py-2 border border-accent/30 text-accent/70 hover:text-accent rounded hover:bg-accent/10 transition-colors uppercase text-[10px] tracking-widest font-bold"
        >
          Return to Campaign
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "" : "pb-12"}`}>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {isMobile ? (
        <LevelMobileLayout
          level={level}
          script={script}
          setScript={setScript}
          modal={modal}
          handleFight={handleFight}
          onBattleEnd={handleBattleEnd}
          router={router}
        />
      ) : (
        <LevelDesktopLayout
          level={level}
          script={script}
          setScript={setScript}
          modal={modal}
          handleFight={handleFight}
          onBattleEnd={handleBattleEnd}
          router={router}
        />
      )}

      <LevelModal modal={modal} setModal={setModal} reward={reward} router={router} />
    </div>
  );
}