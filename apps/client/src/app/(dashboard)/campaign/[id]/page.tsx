"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { LevelDetail, ModalState } from "./types";
import { LevelDesktopLayout } from "./components/layout/LevelDesktopLayout";
import { LevelMobileLayout } from "./components/layout/LevelMobileLayout";
import { LevelModal } from "./components/layout/LevelModal";
import { useCampaignFight } from '../hooks/useCampaignFight';
import { getSceneForLevel } from './components/arena/scenes';

const SIMULATION_TICKS_PER_SECOND = 60;
const DEFAULT_REWARD = 0;
const DEFAULT_STARS = 0;

interface CompleteLevelResponse {
  pointsAwarded?: number;
  stars?: number;
}

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
  const [stars, setStars] = useState<number>(0);
  const [pendingWinner, setPendingWinner] = useState<'player' | 'enemy' | 'draw' | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const { fight, status: fightStatus, result: fightResult, latestFrameRef } = useCampaignFight();
  const fightStartTimeMsRef = useRef<number>(0);
  const fightStartTickRef = useRef<number>(0);
  const fightEndTickRef = useRef<number>(0);

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
    setReward(DEFAULT_REWARD);
    setStars(DEFAULT_STARS);
    fightStartTimeMsRef.current = Date.now();
    fightStartTickRef.current = 0;
    fightEndTickRef.current = 0;
    const scene = getSceneForLevel(levelId);
    const s = scene?.init();
    const obstacles = s?.obstacles ?? [];

    const p = s?.robots.find(r => r.id === 'player');
    const e = s?.robots.find(r => r.id === 'enemy');
    const playerSpawn = p ? { x: p.x * 800, y: p.y * 600, angle: p.angle } : undefined;
    const enemySpawn = e ? { x: e.x * 800, y: e.y * 600, angle: e.angle } : undefined;

    fight(levelId, script, obstacles, playerSpawn, enemySpawn);
  }, [script, levelId, fight]);

  const getFallbackDurationTicks = useCallback((): number => {
    const elapsedMs = Math.max(0, Date.now() - fightStartTimeMsRef.current);
    return Math.ceil((elapsedMs / 1000) * SIMULATION_TICKS_PER_SECOND);
  }, []);

  const getFightDurationTicks = useCallback((): number => {
    const resultTicks = fightResult?.fightDurationTicks ?? fightResult?.tick;
    if (typeof resultTicks === "number") return Math.max(0, resultTicks - fightStartTickRef.current);

    const frameTick = latestFrameRef.current?.tick;
    if (typeof frameTick === "number") return Math.max(0, frameTick - fightStartTickRef.current);

    return getFallbackDurationTicks();
  }, [fightResult, getFallbackDurationTicks, latestFrameRef]);

  useEffect(() => {
    if (fightStatus === 'streaming' && modal === 'loading') {
      const frameTick = latestFrameRef.current?.tick;
      if (fightStartTickRef.current === 0 && typeof frameTick === "number") {
        fightStartTickRef.current = frameTick;
      }
      setModal('fighting');
    }
    if (fightStatus === 'done' && fightResult) {
      setPendingWinner(fightResult.winner);
      setPendingToken(fightResult.completionToken ?? null);
      fightEndTickRef.current = getFightDurationTicks();
    }
    if (fightStatus === 'error') {
      setModal("defeat");
    }
  }, [fightStatus, fightResult, modal, getFightDurationTicks, latestFrameRef]);

  const handleBattleEnd = useCallback(() => {
    if (!pendingWinner) return;
    if (pendingWinner === 'draw') { setModal("draw"); return; }
    if (pendingWinner === 'enemy') { setModal("defeat"); return; }
    setModal("victory");

    if (pendingToken) {
      const fightDurationTicks = fightEndTickRef.current || getFightDurationTicks();
      apiClient.post<CompleteLevelResponse>(`/campaign/levels/${levelId}/complete`, { completionToken: pendingToken, fightDurationTicks })
        .then((res) => {
          const pts = res.data?.pointsAwarded ?? level?.pointsReward ?? DEFAULT_REWARD;
          const awardedStars = res.data?.stars ?? DEFAULT_STARS;
          setReward(pts);
          setStars(awardedStars);
          window.dispatchEvent(new Event("global-refresh"));
        })
        .catch(() => {
          setReward(level?.pointsReward ?? DEFAULT_REWARD);
          setStars(DEFAULT_STARS);
        });
    }
  }, [pendingWinner, pendingToken, levelId, level, getFightDurationTicks]);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isReplaying = fightStatus === 'streaming' || fightStatus === 'done';
  const waitingForReplay = modal === 'loading' && !isReplaying;

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
        <div className="text-accent/80 text-[14px] font-black tracking-[0.2em] mb-4">
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
          latestFrameRef={latestFrameRef}
          isReplaying={isReplaying}
          fightResult={fightResult}
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
          latestFrameRef={latestFrameRef}
          isReplaying={isReplaying}
          fightResult={fightResult}
          waitingForReplay={waitingForReplay}
          router={router}
        />
      )}

      <LevelModal
        modal={modal}
        setModal={setModal}
        reward={reward}
        stars={stars}
        level={level}
        isMobile={isMobile}
        router={router}
      />
    </div>
  );
}
