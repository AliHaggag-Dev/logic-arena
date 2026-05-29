"use client";

import React from "react";
import { ProfileData, CombatStats } from "../../types";
import { STAT_LABELS } from "../../constants";
import { fmtDate } from "../../utils";
import { HexAvatar } from "../ui/HexAvatar";
import { OperatorBadge } from "../ui/OperatorBadge";
import { AchievementBadge } from "../ui/AchievementBadge";

interface Props {
  loading:      boolean;
  profile:      ProfileData | null;
  isMobile:     boolean;
  profileColor: string;
  dominantKey:  keyof CombatStats | null;
  username:     string;
}

export function HeroSection({ loading, profile, isMobile, profileColor, dominantKey, username }: Props) {
  return (
    <div
      className={`relative flex ${isMobile ? "flex-col items-center text-center gap-5" : "flex-row items-center gap-7"} pb-7 mb-7`}
      style={{ borderBottom: "1px solid rgba(var(--accent-rgb),0.15)" }}
    >
      {/* Avatar */}
      {loading ? (
        <div
          className="animate-[shimmer_1.5s_infinite] shrink-0"
          style={{
            width:  isMobile ? 80 : 100,
            height: isMobile ? 80 : 100,
            background:     "rgba(var(--accent-rgb),0.07)",
            backgroundSize: "200% 100%",
            border:         "2px solid rgba(var(--accent-rgb),0.45)",
            clipPath:       "polygon(50% 4%, 95% 27.5%, 95% 72.5%, 50% 96%, 5% 72.5%, 5% 27.5%)",
            boxShadow:      "0 0 18px rgba(var(--accent-rgb),0.25)",
          }}
        />
      ) : (
        <HexAvatar
          username={profile?.username ?? "??"}
          avatarUrl={profile?.avatarUrl ?? null}
          color={profileColor}
          size={isMobile ? 80 : 100}
        />
      )}

      <div className={`flex flex-col ${isMobile ? "items-center" : "items-start"} gap-2 flex-1 min-w-0`}>
        <h1
          className="m-0 font-black tracking-[0.18em] leading-none break-words"
          style={{
            fontSize:   isMobile ? "clamp(24px,6vw,32px)" : "clamp(28px,4vw,42px)",
            color:      profileColor,
            textShadow: `0 0 20px ${profileColor}80`,
          }}
        >
          {username}
        </h1>

        {profile && (
          <div className={`flex ${isMobile ? "flex-col items-center" : "flex-row items-center"} gap-3 flex-wrap`}>
            <OperatorBadge rank={profile.rank} />

            {profile.achievements && profile.achievements.length > 0 && (
              <div className="flex items-center gap-1.5">
                {profile.achievements
                  .filter((ach) => ach.unlockedLevel > 0)
                  .map((ach) => (
                    <AchievementBadge
                      key={ach.achievementId}
                      id={ach.achievementId}
                      level={ach.unlockedLevel}
                      size={22}
                    />
                  ))}
              </div>
            )}

            {/* Only shown when the player has real non-zero stats */}
            {dominantKey && (
              <span
                className="text-[9px] font-bold tracking-[0.2em] font-mono px-2 py-1 rounded"
                style={{
                  color:      profileColor,
                  background: `${profileColor}15`,
                  border:     `1px solid ${profileColor}30`,
                }}
              >
                {STAT_LABELS[dominantKey]} PLAYER
              </span>
            )}
          </div>
        )}

        {profile && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-accent/40 tracking-[0.12em] font-mono">
              RANK #{profile.rank}
            </span>
            <span className="text-accent/20 text-[10px]">•</span>
            <span className="text-[10px] text-accent/40 tracking-[0.12em] font-mono">
              SINCE {fmtDate(profile.memberSince).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Scanline corner decoration (desktop only) */}
      {!isMobile && (
        <div
          className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-15"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(var(--accent-rgb),0.3) 0px, rgba(var(--accent-rgb),0.3) 1px, transparent 1px, transparent 8px)",
          }}
        />
      )}
    </div>
  );
}
