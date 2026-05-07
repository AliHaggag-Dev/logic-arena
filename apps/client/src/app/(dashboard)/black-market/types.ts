export type ItemCategory = "chassis" | "paint" | "tracer";
export type ToastType = "success" | "error";

export interface MarketItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  color: string;
  glowColor: string;
  rarity: "COMMON" | "RARE" | "LEGENDARY";
  description: string;
}

export interface Loadout {
  chassis: MarketItem;
  paint: MarketItem;
  tracer: MarketItem;
}

export interface BlackMarketApiData {
  points: number;
  unlockedItems: string[];
  equippedChassis: string;
  equippedPaint: string;
  equippedTracer: string;
}

export interface ToastState {
  message: string;
  type: ToastType;
}
