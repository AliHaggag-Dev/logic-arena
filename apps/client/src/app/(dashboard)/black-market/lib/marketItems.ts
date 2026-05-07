import { MARKET_ITEMS } from "../constants";
import type { ItemCategory, Loadout, MarketItem } from "../types";

export function findMarketItem(id: string, fallbackCategory: ItemCategory): MarketItem {
  return (
    MARKET_ITEMS.find((item) => item.id === id) ??
    MARKET_ITEMS.find((item) => item.category === fallbackCategory) ??
    MARKET_ITEMS[0]
  );
}

export function createLoadoutFromIds(equippedIds: Record<ItemCategory, string>): Loadout {
  return {
    chassis: findMarketItem(equippedIds.chassis, "chassis"),
    paint: findMarketItem(equippedIds.paint, "paint"),
    tracer: findMarketItem(equippedIds.tracer, "tracer"),
  };
}
