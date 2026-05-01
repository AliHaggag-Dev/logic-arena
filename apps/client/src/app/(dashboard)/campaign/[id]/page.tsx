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
  const levelId = parseInt(id, 10);

  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [modal, setModal] = useState<ModalState>("idle");
  const [reward, setReward] = useState<number>(0);

  useEffect(() => {
    if (isNaN(levelId)) {
      setError("Invalid level ID.");
      setFetching(false);
      return;
    }

    apiClient
      .get(`/campaign/levels/${levelId}`)
      .then((r) => { setLevel(r.data); })
      .catch((err) => {
        if (err.response?.status === 403) {
          setError("ACCESS DENIED: Level is locked.");
        } else {
          setError("404: Level not found.");
        }
      })
      .finally(() => setFetching(false));
  }, [levelId]);

  const handleFight = useCallback(async () => {
    if (!script.trim()) return;
    setModal("loading");

    try {
      const fightRes = await apiClient.post("/matches/campaign", {
        levelId,
        userScript: script,
      });

      if (fightRes.data.won) {
        try { 
          await apiClient.post(`/campaign/levels/${levelId}/complete`, { 
            completionToken: fightRes.data.completionToken 
          }); 
        } catch { }
        setReward(level?.rewardRank ?? 0);
        setModal("victory");
      } else if (fightRes.data.draw) {
        setModal("draw");
      } else {
        setModal("defeat");
      }
    } catch {
      setModal("defeat");
    }
  }, [script, levelId, level]);

  const isMobile = useMediaQuery("(max-width: 768px)");

  if (fetching) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono flex items-center justify-center">
        <div className="text-accent/70 text-[11px] tracking-[0.3em] animate-pulse">
          LOADING LEVEL DATA...
        </div>
      </div>
    );
  }

  if (error || !level) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono flex flex-col items-center justify-center p-4 text-center">
        <div className="text-red-500 text-[14px] font-black tracking-[0.2em] mb-4">
          {error || "An unknown error occurred."}
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
          router={router}
        />
      ) : (
        <LevelDesktopLayout
          level={level}
          script={script}
          setScript={setScript}
          modal={modal}
          handleFight={handleFight}
          router={router}
        />
      )}

      <LevelModal modal={modal} setModal={setModal} reward={reward} router={router} />
    </div>
  );
}