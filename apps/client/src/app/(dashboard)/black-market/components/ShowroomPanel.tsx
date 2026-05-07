import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { MARKET_ITEMS } from "../constants";
import type { ItemCategory, Loadout, MarketItem } from "../types";

import { PreviewInfoCard } from "./PreviewInfoCard";
import { ShowroomSkeleton } from "./ShowroomSkeleton";

const RobotShowroom = dynamic(
  () => import("./RobotShowroom").then((module) => ({ default: module.RobotShowroom })),
  { ssr: false, loading: () => <ShowroomSkeleton /> },
);

interface ShowroomPanelProps {
  actionLoading: boolean;
  equippedIds: Record<ItemCategory, string>;
  isOwned: (itemId: string) => boolean;
  ownedCount: number;
  points: number;
  previewItem: MarketItem;
  previewLoadout: Loadout;
  onPurchase: (item: MarketItem) => void;
}

export function ShowroomPanel({ actionLoading, equippedIds, isOwned, ownedCount, points, previewItem, previewLoadout, onPurchase }: ShowroomPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl border overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(var(--accent-rgb),0.04) 0%, rgba(0,0,0,0) 60%)", borderColor: "rgba(var(--accent-rgb),0.15)", boxShadow: "0 0 40px rgba(var(--accent-rgb),0.06), inset 0 0 40px rgba(var(--accent-rgb),0.02)", animation: "pedestalPulse 4s ease-in-out infinite" }}>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />

        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_rgba(var(--accent-rgb),0.8)]" />
          <span className="text-[9px] tracking-[0.3em] text-accent/50 uppercase font-bold">LIVE PREVIEW</span>
        </div>

        {actionLoading && <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}

        <div className="h-[380px] w-full cursor-grab">
          <Suspense fallback={<ShowroomSkeleton />}>
            <RobotShowroom chassisId={previewLoadout.chassis.id} paintColor={previewLoadout.paint.color} tracerColor={previewLoadout.tracer.color} />
          </Suspense>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30" />
      </div>

      <PreviewInfoCard actionLoading={actionLoading} equippedIds={equippedIds} isOwned={isOwned(previewItem.id)} item={previewItem} points={points} onPurchase={onPurchase} />

      <div className="rounded-lg border px-4 py-3 flex items-center justify-between" style={{ background: "rgba(var(--accent-rgb),0.02)", borderColor: "rgba(var(--accent-rgb),0.08)" }}>
        <span className="text-[9px] tracking-[0.25em] text-accent/30 uppercase font-bold">ITEMS OWNED</span>
        <span className="text-[12px] font-black text-accent/60 tracking-[0.1em]">{ownedCount} / {MARKET_ITEMS.length}</span>
      </div>
    </div>
  );
}
