import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "../../../../lib/api-client";
import { useAuthState } from "../../../../hooks/useAuthState";
import { useSafeTimeout } from "../../../../hooks/useSafeTimeout";
import {
  DEFAULT_LOADOUT,
  GUEST_LOADOUT,
  MARKET_ITEMS,
  STARTER_ITEM_IDS,
  RARITY_ORDER,
} from "../constants";
import { createLoadoutFromIds } from "../lib/marketItems";
import type { BlackMarketApiData, ItemCategory, MarketItem, ToastState } from "../types";

export function useBlackMarket() {
  const { isGuest } = useAuthState();

  // Guests always see 0 points — no fake balance.
  const [points, setPoints] = useState<number>(0);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(
    () => new Set(STARTER_ITEM_IDS),
  );
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("chassis");
  const [previewItem, setPreviewItem] = useState<MarketItem>(MARKET_ITEMS[0]);
  const [previewLoadout, setPreviewLoadout] = useState(() => createLoadoutFromIds(isGuest ? GUEST_LOADOUT : DEFAULT_LOADOUT));
  const [equippedIds, setEquippedIds] = useState<Record<ItemCategory, string>>(isGuest ? GUEST_LOADOUT : DEFAULT_LOADOUT);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { clearAllSafeTimeouts, setSafeTimeout } = useSafeTimeout();

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    apiClient
      .get<BlackMarketApiData>("/users/black-market")
      .then((res) => {
        if (cancelled) return;

        const data = res.data;
        const equipped: Record<ItemCategory, string> = {
          chassis: data.equippedChassis,
          paint: data.equippedPaint,
          tracer: data.equippedTracer,
        };
        const loadout = createLoadoutFromIds(equipped);

        setPoints(data.points);
        setOwnedItemIds(new Set(data.unlockedItems));
        setEquippedIds(equipped);
        setPreviewLoadout(loadout);
        setPreviewItem(loadout.chassis);
      })
      .catch(() => {
        // 401s are handled globally by apiClient interceptor.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    clearAllSafeTimeouts();
    setToast({ message, type });
    setSafeTimeout(() => setToast(null), 2800);
  }, [clearAllSafeTimeouts, setSafeTimeout]);

  const filteredItems = useMemo(
    () => {
      const items = MARKET_ITEMS.filter((item) => item.category === activeCategory);
      return [...items].sort((a, b) => {
        const rarityDiff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
        if (rarityDiff !== 0) return rarityDiff;
        return a.price - b.price;
      });
    },
    [activeCategory],
  );

  const isOwned = useCallback(
    (itemId: string) => ownedItemIds.has(itemId) || STARTER_ITEM_IDS.includes(itemId as typeof STARTER_ITEM_IDS[number]),
    [ownedItemIds],
  );

  const handlePreview = useCallback((item: MarketItem) => {
    setPreviewItem(item);
    setPreviewLoadout((prev) => ({ ...prev, [item.category]: item }));
  }, []);

  const handlePurchase = useCallback(
    async (item: MarketItem) => {
      if (isOwned(item.id)) {
        if (equippedIds[item.category] === item.id) {
          showToast(`${item.name} — ALREADY EQUIPPED`, "success");
          return;
        }

        setActionLoading(true);
        try {
          if (!isGuest) {
            await apiClient.post("/users/black-market/equip", {
              itemId: item.id,
              category: item.category,
            });
          }
          setEquippedIds((prev) => ({ ...prev, [item.category]: item.id }));
          setPreviewLoadout((prev) => ({ ...prev, [item.category]: item }));
          showToast(`${item.name} — EQUIPPED`, "success");
        } catch {
          showToast("EQUIP FAILED — TRY AGAIN", "error");
        } finally {
          setActionLoading(false);
        }
        return;
      }

      if (item.price > points) {
        showToast("INSUFFICIENT FUNDS — EARN MORE POINTS", "error");
        return;
      }

      setActionLoading(true);
      try {
        if (!isGuest) {
          await apiClient.post("/users/black-market/purchase", { itemId: item.id });
        }

        setPoints((prev) => prev - item.price);
        setOwnedItemIds((prev) => new Set([...prev, item.id]));
        setEquippedIds((prev) => ({ ...prev, [item.category]: item.id }));
        setPreviewLoadout((prev) => ({ ...prev, [item.category]: item }));
        setPreviewItem(item);
        showToast(`${item.name} — ACQUIRED`, "success");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "TRANSACTION FAILED — TRY AGAIN";
        showToast(message.toUpperCase(), "error");
      } finally {
        setActionLoading(false);
      }
    },
    [equippedIds, isGuest, isOwned, points, showToast],
  );

  return {
    actionLoading,
    activeCategory,
    equippedIds,
    filteredItems,
    handlePreview,
    handlePurchase,
    isGuest,
    isOwned,
    loading,
    ownedItemIds,
    points,
    previewItem,
    previewLoadout,
    setActiveCategory,
    toast,
  };
}
