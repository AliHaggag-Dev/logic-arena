"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AuthModal } from "../../../components/AuthModal";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useAuthState } from "../../../hooks/useAuthState";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { MARKET_ITEMS } from "../black-market/constants";
import { MarketItem } from "../black-market/types";
import { MOBILE_BREAKPOINT, TOAST_DURATION_MS } from "./constants/robots.constants";
import { VaultToast } from "./components/VaultToast";
import { VaultMobileLayout } from "./components/VaultMobileLayout";
import { VaultDesktopLayout } from "./components/VaultDesktopLayout";
import { CategoryKey } from "./components/VaultCategoryTabs";
import "./garage.css";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GaragePage() {
  const { isGuest } = useAuthState();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("chassis");

  // Vault data
  const [unlockedItemIds, setUnlockedItemIds] = useState<Set<string>>(new Set());
  const [equippedChassis, setEquippedChassis] = useState("chassis-unit-01");
  const [equippedPaint, setEquippedPaint] = useState("paint-default");
  const [equippedTracer, setEquippedTracer] = useState("tracer-pulse");

  const [isLoading, setIsLoading] = useState(true);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { clearAllSafeTimeouts, setSafeTimeout } = useSafeTimeout();

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isGuest) { setIsLoading(false); return; }

    let cancelled = false;

    apiClient.get("/users/black-market")
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setUnlockedItemIds(new Set(data.unlockedItems || []));
        if (data.equippedChassis) setEquippedChassis(data.equippedChassis);
        if (data.equippedPaint)   setEquippedPaint(data.equippedPaint);
        if (data.equippedTracer)  setEquippedTracer(data.equippedTracer);
      })
      .catch(() => { /* 401s handled globally by apiClient interceptor */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [isGuest]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const vaultItems = useMemo(
    () => MARKET_ITEMS.filter((i) => unlockedItemIds.has(i.id) || i.price === 0),
    [unlockedItemIds]
  );

  const displayedItems = useMemo(
    () => vaultItems.filter((i) => i.category === activeCategory),
    [vaultItems, activeCategory]
  );

  const activePaintColor = useMemo(
    () => MARKET_ITEMS.find((i) => i.id === equippedPaint)?.color ?? "#ef4444",
    [equippedPaint]
  );

  const activeTracerColor = useMemo(
    () => MARKET_ITEMS.find((i) => i.id === equippedTracer)?.color ?? "#22d3ee",
    [equippedTracer]
  );

  // ── Callbacks ────────────────────────────────────────────────────────────────

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      clearAllSafeTimeouts();
      setToast({ message, type });
      setSafeTimeout(() => setToast(null), TOAST_DURATION_MS);
    },
    [clearAllSafeTimeouts, setSafeTimeout]
  );

  const getEquippedIdForCategory = useCallback(
    (category: string): string => {
      if (category === "chassis") return equippedChassis;
      if (category === "paint")   return equippedPaint;
      if (category === "tracer")  return equippedTracer;
      return "";
    },
    [equippedChassis, equippedPaint, equippedTracer]
  );

  const handleEquip = useCallback(
    async (item: MarketItem) => {
      if (isGuest) return setShowAuthModal(true);
      try {
        setEquippingId(item.id);
        await apiClient.post("/users/black-market/equip", {
          itemId: item.id,
          category: item.category,
        });
        if (item.category === "chassis") setEquippedChassis(item.id);
        if (item.category === "paint")   setEquippedPaint(item.id);
        if (item.category === "tracer")  setEquippedTracer(item.id);
        showToast(`EQUIPPED: ${item.name}`, "success");
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } } };
        showToast(apiErr.response?.data?.message ?? "FAILED TO EQUIP ITEM", "error");
      } finally {
        setEquippingId(null);
      }
    },
    [isGuest, showToast]
  );

  // ── Shared layout props ──────────────────────────────────────────────────────

  const layoutProps = {
    equippedChassis,
    activePaintColor,
    activeTracerColor,
    activeCategory,
    displayedItems,
    isLoading,
    equippingId,
    getEquippedIdForCategory,
    onCategoryChange: setActiveCategory,
    onEquip: handleEquip,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes toastIn {
          0%   { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, 0)    scale(1);    }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isMobile
        ? <VaultMobileLayout  {...layoutProps} />
        : <VaultDesktopLayout {...layoutProps} />
      }

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="VAULT LOCKED"
        message="Your personal hangar is restricted to registered operators. Initialize an account to unlock, manage, and equip your customizations."
      />

      {toast && <VaultToast message={toast.message} type={toast.type} />}
    </>
  );
}
