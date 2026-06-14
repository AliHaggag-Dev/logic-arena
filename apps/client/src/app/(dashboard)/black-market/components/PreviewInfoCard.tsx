import { CheckCircle, Loader2, Lock, ShoppingCart, Zap } from "lucide-react";

import type { ItemCategory, MarketItem } from "../types";

const GUEST_LOCK_TOOLTIP = "Create an account to equip and customise your robot.";

interface PreviewInfoCardProps {
  actionLoading: boolean;
  equippedIds: Record<ItemCategory, string>;
  isGuest: boolean;
  isOwned: boolean;
  item: MarketItem;
  points: number;
  onPurchase: (item: MarketItem) => void;
}

export function PreviewInfoCard({ actionLoading, equippedIds, isGuest, isOwned, item, points, onPurchase }: PreviewInfoCardProps) {
  const isEquipped = equippedIds[item.category] === item.id;
  const cannotAfford = item.price > points && !isOwned && item.price > 0;

  const handleAction = () => {
    if (isGuest) return;
    onPurchase(item);
  };

  const isActionDisabled = actionLoading || isGuest || isEquipped || cannotAfford;

  const buttonClass = actionLoading
    ? "opacity-50 cursor-not-allowed bg-accent/5 border-accent/20 text-accent/50"
    : isGuest
      ? "opacity-50 cursor-not-allowed bg-accent/[0.03] border-accent/10 text-accent/25"
      : isEquipped
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
        : cannotAfford
          ? "bg-red-500/5 border-red-500/15 text-red-500/35 cursor-not-allowed opacity-50"
          : "bg-accent/10 border-accent/40 text-accent hover:bg-accent/20 hover:border-accent/70 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] cursor-pointer";

  return (
    <div className="rounded-xl border p-5" style={{ background: "rgba(var(--accent-rgb),0.03)", borderColor: "rgba(var(--accent-rgb),0.12)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded-sm flex-shrink-0"
            style={{
              background:
                item.color === "DEFAULT" || !item.color
                  ? "var(--color-surface, #1a1a1a)"
                  : item.color,
              boxShadow: `0 0 8px ${item.glowColor}80`,
            }}
          />
          <h2 className="text-[13px] font-black tracking-[0.15em] text-accent/90">{item.name}</h2>
        </div>
        <span className={`text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded border ${item.rarity === "LEGENDARY" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : item.rarity === "RARE" ? "text-purple-400 bg-purple-500/10 border-purple-500/30" : "text-accent/70 bg-accent/10 border-accent/20"}`}>{item.rarity}</span>
      </div>

      <p className="text-[10px] text-accent/40 tracking-[0.08em] leading-relaxed mb-4">{item.description}</p>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[8px] text-accent/30 tracking-[0.25em] uppercase mb-0.5">COST</div>
          <div className="text-[16px] font-black tracking-[0.1em]" style={{ color: item.glowColor, textShadow: `0 0 10px ${item.glowColor}80` }}>
            {item.price === 0 ? "FREE" : `${item.price.toLocaleString()} PTS`}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAction}
          disabled={isActionDisabled}
          title={isGuest ? GUEST_LOCK_TOOLTIP : undefined}
          aria-label={
            isGuest
              ? GUEST_LOCK_TOOLTIP
              : isEquipped
                ? `${item.name} is currently equipped`
                : isOwned
                  ? `Equip ${item.name}`
                  : `Purchase ${item.name} for ${item.price} points`
          }
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] font-mono border transition-all duration-200 ${buttonClass}`}
        >
          {actionLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />PROCESSING…</>
          ) : isGuest ? (
            <><Lock className="w-3.5 h-3.5" />LOGIN TO PURCHASE</>
          ) : isEquipped ? (
            <><CheckCircle className="w-3.5 h-3.5" />EQUIPPED</>
          ) : isOwned ? (
            <><Zap className="w-3.5 h-3.5" />EQUIP NOW</>
          ) : (
            <><ShoppingCart className="w-3.5 h-3.5" />{item.price === 0 ? "EQUIP NOW" : "PURCHASE NOW"}</>
          )}
        </button>
      </div>
    </div>
  );
}

