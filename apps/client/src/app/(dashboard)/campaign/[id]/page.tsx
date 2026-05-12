"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { LevelDetail, ModalState } from "./types";
import { LevelDesktopLayout } from "./components/LevelDesktopLayout";
import { LevelMobileLayout } from "./components/LevelMobileLayout";
import { LevelModal } from "./components/LevelModal";
import { useCampaignFight } from '../hooks/useCampaignFight';
import { getSceneForLevel } from './components/arenaScenes';

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
  const [replayFrames, setReplayFrames] = useState<any[]>([]);
  const [pendingWinner, setPendingWinner] = useState<'player' | 'enemy' | 'draw' | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const { fight, status: fightStatus, result: fightResult } = useCampaignFight();

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

  const handleFight = useCallback(() => {
    if (!script.trim()) return;
    setModal("loading");
    const scene = getSceneForLevel(levelId);
    const obstacles = scene?.init().obstacles ?? [];
    fight(levelId, script, obstacles);
  }, [script, levelId, fight]);

  useEffect(() => {
    if (fightStatus === 'done' && fightResult) {
      setReplayFrames(fightResult.replayFrames ?? []);
      setPendingWinner(fightResult.winner);
      setPendingToken(fightResult.completionToken ?? null);
    }
    if (fightStatus === 'error') {
      setModal("defeat");
    }
  }, [fightStatus, fightResult]);

  const handleBattleEnd = useCallback(() => {
    if (!pendingWinner) return;
    if (pendingWinner === 'draw') { setModal("draw"); return; }
    if (pendingWinner === 'enemy') { setModal("defeat"); return; }
    setModal("victory");

    if (pendingToken) {
      apiClient.post(`/campaign/levels/${levelId}/complete`, { completionToken: pendingToken })
        .then((res) => {
          const pts = res.data?.pointsAwarded ?? level?.pointsReward ?? 0;
          setReward(pts);
          window.dispatchEvent(new Event("global-refresh"));
        })
        .catch(() => setReward(level?.pointsReward ?? 0));
    }
  }, [pendingWinner, pendingToken, levelId, level]);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const waitingForReplay = modal === 'loading' && replayFrames.length === 0;

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
          replayFrames={replayFrames}
          waitingForReplay={waitingForReplay}
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
          replayFrames={replayFrames}
          waitingForReplay={waitingForReplay}
          router={router}
        />
      )}

      <LevelModal modal={modal} setModal={setModal} reward={reward} router={router} />
    </div>
  );
}