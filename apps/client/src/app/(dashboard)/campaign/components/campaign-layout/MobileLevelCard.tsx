/**
 * MobileLevelCard — thin wrapper kept for backward-compat imports.
 * Actual rendering is delegated to the shared LevelCard component.
 */
import { memo } from "react";

import type { ApiLevelInfo } from "../../types/campaign.types";
import { LevelCard } from "./LevelCard";

interface MobileLevelCardProps {
  level: ApiLevelInfo;
  onSelect: (level: ApiLevelInfo) => void;
}

export const MobileLevelCard = memo(function MobileLevelCard({
  level,
  onSelect,
}: MobileLevelCardProps) {
  return <LevelCard level={level} isMobile={true} onInfoClick={onSelect} />;
});
